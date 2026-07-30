import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { parsePagination } from '../utils/query.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const where = req.query.vehicleId ? { vehicleId: req.query.vehicleId } : {};
  const [items, total] = await Promise.all([
    prisma.fueling.findMany({
      where,
      skip,
      take,
      orderBy: { fueledAt: 'desc' },
      include: {
        vehicle: { select: { plate: true, model: true } },
        driver: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.fueling.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

router.post('/', upload.single('receipt'), async (req, res) => {
  try {
    const body = req.body;
    const l = Number(body.liters);
    const p = Number(body.unitPrice);
    const fueling = await prisma.$transaction(async (tx) => {
      const f = await tx.fueling.create({
        data: {
          vehicleId: body.vehicleId,
          driverId: body.driverId || null,
          userId: req.user.id,
          liters: l,
          unitPrice: p,
          totalCost: l * p,
          odometerKm: body.odometerKm != null && body.odometerKm !== '' ? Number(body.odometerKm) : null,
          station: body.station,
          creditCard: body.creditCard || null,
          receiptUrl: req.file ? `/uploads/${req.file.filename}` : null,
          notes: body.notes,
          fueledAt: body.fueledAt ? new Date(body.fueledAt) : new Date(),
        },
        include: { vehicle: { select: { plate: true } } },
      });
      if (body.odometerKm != null && body.odometerKm !== '') {
        await tx.vehicle.update({
          where: { id: body.vehicleId },
          data: { odometerKm: Number(body.odometerKm) },
        });
      }
      return f;
    });
    res.status(201).json(fueling);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
