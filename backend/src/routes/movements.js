import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';
import { parsePagination } from '../utils/query.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const where = {
    AND: [
      req.query.vehicleId ? { vehicleId: req.query.vehicleId } : {},
      req.query.driverId ? { driverId: req.query.driverId } : {},
      req.query.type ? { type: req.query.type } : {},
    ],
  };
  const [items, total] = await Promise.all([
    prisma.movement.findMany({
      where,
      skip,
      take,
      orderBy: { occurredAt: 'desc' },
      include: {
        vehicle: { select: { id: true, plate: true, model: true, status: true, type: true, fuelType: true, usageMetric: true } },
        driver: { select: { id: true, name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.movement.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

router.post('/', async (req, res) => {
  try {
    const { vehicleId, driverId, type, odometerKm, purpose, notes } = req.body;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });

    const movement = await prisma.$transaction(async (tx) => {
      const mov = await tx.movement.create({
        data: {
          vehicleId,
          driverId: driverId || null,
          userId: req.user.id,
          type,
          odometerKm: odometerKm != null ? Number(odometerKm) : null,
          purpose,
          notes,
        },
        include: {
          vehicle: { select: { plate: true, model: true } },
          driver: { select: { name: true } },
        },
      });

      const newStatus = type === 'SAIDA' ? 'EM_USO' : 'DISPONIVEL';
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: newStatus,
          ...(odometerKm != null ? { odometerKm: Number(odometerKm) } : {}),
        },
      });
      return mov;
    });

    res.status(201).json(movement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
