import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';
import { parsePagination } from '../utils/query.js';

const DEFAULT_ITEMS = [
  { key: 'pneus', label: 'Pneus / pressão', ok: true },
  { key: 'luzes', label: 'Luzes e setas', ok: true },
  { key: 'freios', label: 'Freios', ok: true },
  { key: 'oleo', label: 'Nível de óleo', ok: true },
  { key: 'agua', label: 'Água / arrefecimento', ok: true },
  { key: 'extintor', label: 'Extintor', ok: true },
  { key: 'documentos', label: 'Documentos no veículo', ok: true },
  { key: 'limpeza', label: 'Limpeza / aparência', ok: true },
  { key: 'avarias', label: 'Sem avarias aparentes', ok: true },
];

const router = Router();
router.use(authRequired);

router.get('/template', (_req, res) => {
  res.json(DEFAULT_ITEMS);
});

router.get('/', async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const where = {
    AND: [
      req.query.vehicleId ? { vehicleId: req.query.vehicleId } : {},
      req.query.type ? { type: req.query.type } : {},
      req.query.shift ? { shift: req.query.shift } : {},
    ],
  };
  const [items, total] = await Promise.all([
    prisma.checklist.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { plate: true, model: true } },
        driver: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.checklist.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

router.post('/', async (req, res) => {
  try {
    const { vehicleId, driverId, type, shift, items, notes, odometerKm } = req.body;
    const checklistItems = items || DEFAULT_ITEMS;
    const hasFail = checklistItems.some((i) => i.ok === false);
    const checklist = await prisma.checklist.create({
      data: {
        vehicleId,
        driverId: driverId || null,
        userId: req.user.id,
        type,
        shift: shift || null,
        items: checklistItems,
        approved: !hasFail,
        notes,
        odometerKm: odometerKm != null ? Number(odometerKm) : null,
      },
      include: {
        vehicle: { select: { plate: true } },
        driver: { select: { name: true } },
      },
    });
    res.status(201).json(checklist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
