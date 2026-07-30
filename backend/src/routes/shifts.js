import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const day = new Date(date.toISOString().slice(0, 10));
  const items = await prisma.shiftAvailability.findMany({
    where: { date: day, ...(req.query.shift ? { shift: req.query.shift } : {}) },
    include: { vehicle: { select: { id: true, plate: true, model: true, type: true, status: true } } },
  });

  const summary = { MANHA: {}, TARDE: {}, NOITE: {} };
  for (const item of items) {
    summary[item.shift][item.status] = (summary[item.shift][item.status] || 0) + 1;
  }
  res.json({ items, summary, date: day });
});

router.post('/', requireRoles('ADMIN', 'SUPERVISOR', 'OPERADOR'), async (req, res) => {
  try {
    const { vehicleId, shift, date, status, notes } = req.body;
    const day = new Date(new Date(date).toISOString().slice(0, 10));
    const item = await prisma.shiftAvailability.upsert({
      where: { vehicleId_shift_date: { vehicleId, shift, date: day } },
      create: { vehicleId, shift, date: day, status, notes },
      update: { status, notes },
      include: { vehicle: { select: { plate: true } } },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sync-today', requireRoles('ADMIN', 'SUPERVISOR'), async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({ where: { status: { not: 'INATIVO' } } });
  const day = new Date(new Date().toISOString().slice(0, 10));
  const shifts = ['MANHA', 'TARDE', 'NOITE'];
  const created = [];
  for (const v of vehicles) {
    for (const shift of shifts) {
      const item = await prisma.shiftAvailability.upsert({
        where: { vehicleId_shift_date: { vehicleId: v.id, shift, date: day } },
        create: { vehicleId: v.id, shift, date: day, status: v.status },
        update: { status: v.status },
      });
      created.push(item);
    }
  }
  res.json({ synced: created.length });
});

export default router;
