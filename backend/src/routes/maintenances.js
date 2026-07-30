import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
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
      req.query.status ? { status: req.query.status } : {},
      req.query.type ? { type: req.query.type } : {},
      req.query.agenda === 'true'
        ? { status: { in: ['AGENDADA', 'EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'APROVADA'] } }
        : {},
    ],
  };
  const [items, total] = await Promise.all([
    prisma.maintenance.findMany({
      where,
      skip,
      take,
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      include: {
        vehicle: { select: { id: true, plate: true, model: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
    }),
    prisma.maintenance.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

router.post('/', upload.single('invoice'), async (req, res) => {
  try {
    const b = req.body;
    const needsApproval = b.type === 'CORRETIVA' || Number(b.cost) > 1000;
    const maintenance = await prisma.maintenance.create({
      data: {
        vehicleId: b.vehicleId,
        createdById: req.user.id,
        type: b.type || 'PREVENTIVA',
        status: needsApproval ? 'AGUARDANDO_APROVACAO' : (b.status || 'AGENDADA'),
        title: b.title,
        description: b.description,
        cost: b.cost != null && b.cost !== '' ? Number(b.cost) : null,
        scheduledAt: b.scheduledAt ? new Date(b.scheduledAt) : null,
        workshop: b.workshop,
        invoiceUrl: req.file ? `/uploads/${req.file.filename}` : null,
      },
      include: { vehicle: { select: { plate: true } } },
    });

    if (needsApproval) {
      await notifyRole(['ADMIN', 'SUPERVISOR'], {
        type: 'MANUTENCAO',
        title: 'Aprovação de manutenção',
        message: `${maintenance.title} — ${maintenance.vehicle.plate}`,
        link: '/manutencoes',
      });
    }
    res.status(201).json(maintenance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', upload.single('invoice'), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.invoice;
    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
    if (data.startedAt) data.startedAt = new Date(data.startedAt);
    if (data.completedAt) data.completedAt = new Date(data.completedAt);
    if (data.cost != null && data.cost !== '') data.cost = Number(data.cost);
    if (data.downtimeHours != null && data.downtimeHours !== '') data.downtimeHours = Number(data.downtimeHours);
    if (req.file) data.invoiceUrl = `/uploads/${req.file.filename}`;

    if (data.status === 'EM_ANDAMENTO' && !data.startedAt) {
      data.startedAt = new Date();
      await prisma.vehicle.update({
        where: { id: (await prisma.maintenance.findUnique({ where: { id: req.params.id } })).vehicleId },
        data: { status: 'MANUTENCAO' },
      });
    }
    if (data.status === 'CONCLUIDA') {
      data.completedAt = data.completedAt || new Date();
      const m = await prisma.maintenance.findUnique({ where: { id: req.params.id } });
      if (m?.startedAt && data.downtimeHours == null) {
        data.downtimeHours = Math.round(((new Date(data.completedAt) - new Date(m.startedAt)) / 3600000) * 10) / 10;
      }
      await prisma.vehicle.update({
        where: { id: m.vehicleId },
        data: { status: 'DISPONIVEL' },
      });
    }

    const maintenance = await prisma.maintenance.update({
      where: { id: req.params.id },
      data,
      include: { vehicle: { select: { plate: true } } },
    });
    res.json(maintenance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/approve', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { approved, note } = req.body;
    const maintenance = await prisma.maintenance.update({
      where: { id: req.params.id },
      data: {
        status: approved ? 'APROVADA' : 'REJEITADA',
        approvedById: req.user.id,
        approvalNote: note,
      },
      include: { vehicle: { select: { plate: true } } },
    });
    res.json(maintenance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
