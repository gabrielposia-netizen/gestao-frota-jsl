import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { parsePagination } from '../utils/query.js';
import { notifyRole } from '../services/notifications.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const where = {
    AND: [
      req.query.vehicleId ? { vehicleId: req.query.vehicleId } : {},
      req.query.resolved === 'true' ? { resolved: true } : {},
      req.query.resolved === 'false' ? { resolved: false } : {},
    ],
  };
  const [items, total] = await Promise.all([
    prisma.damage.findMany({
      where,
      skip,
      take,
      orderBy: { reportedAt: 'desc' },
      include: {
        vehicle: { select: { plate: true, model: true } },
        driver: { select: { name: true } },
        reportedBy: { select: { name: true } },
      },
    }),
    prisma.damage.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

router.post('/', upload.array('photos', 5), async (req, res) => {
  try {
    const photoUrls = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const damage = await prisma.damage.create({
      data: {
        vehicleId: req.body.vehicleId,
        driverId: req.body.driverId || null,
        reportedById: req.user.id,
        description: req.body.description,
        severity: req.body.severity || 'MEDIA',
        photoUrls: photoUrls.length ? photoUrls : (req.body.photoUrls ? JSON.parse(req.body.photoUrls) : []),
      },
      include: { vehicle: { select: { plate: true } } },
    });
    await notifyRole(['ADMIN', 'SUPERVISOR'], {
      type: 'AVARIA',
      title: `Avaria — ${damage.vehicle.plate}`,
      message: damage.description,
      link: `/veiculos/${damage.vehicleId}`,
    });
    res.status(201).json(damage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const damage = await prisma.damage.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(damage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
