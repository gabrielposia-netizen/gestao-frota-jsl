import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const where = req.query.vehicleId ? { vehicleId: req.query.vehicleId } : {};
  const items = await prisma.tire.findMany({
    where,
    orderBy: { position: 'asc' },
    include: { vehicle: { select: { plate: true, model: true } } },
  });
  res.json(items);
});

router.post('/', requireRoles('ADMIN', 'SUPERVISOR', 'OPERADOR'), async (req, res) => {
  try {
    const b = req.body;
    const tire = await prisma.tire.create({
      data: {
        vehicleId: b.vehicleId,
        position: b.position,
        brand: b.brand,
        model: b.model,
        serial: b.serial,
        installedAt: b.installedAt ? new Date(b.installedAt) : null,
        treadDepth: b.treadDepth != null ? Number(b.treadDepth) : null,
        pressurePsi: b.pressurePsi != null ? Number(b.pressurePsi) : null,
        status: b.status || 'OK',
        notes: b.notes,
      },
    });
    res.status(201).json(tire);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.installedAt) data.installedAt = new Date(data.installedAt);
    if (data.treadDepth != null) data.treadDepth = Number(data.treadDepth);
    if (data.pressurePsi != null) data.pressurePsi = Number(data.pressurePsi);
    const tire = await prisma.tire.update({ where: { id: req.params.id }, data });
    res.json(tire);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
