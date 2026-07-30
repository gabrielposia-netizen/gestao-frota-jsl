import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { parsePagination, searchFilter } from '../utils/query.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const where = {
    AND: [
      searchFilter(req.query.q, ['name', 'cpf', 'cnh', 'sector']) || {},
      req.query.active === 'true' ? { active: true } : {},
      req.query.active === 'false' ? { active: false } : {},
    ],
  };
  const [items, total] = await Promise.all([
    prisma.driver.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
    prisma.driver.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

router.get('/:id', async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
    include: {
      movements: {
        take: 20,
        orderBy: { occurredAt: 'desc' },
        include: { vehicle: { select: { plate: true, model: true } } },
      },
    },
  });
  if (!driver) return res.status(404).json({ error: 'Motorista não encontrado' });
  res.json(driver);
});

router.post('/', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const d = req.body;
    const driver = await prisma.driver.create({
      data: {
        name: d.name,
        cpf: d.cpf.replace(/\D/g, ''),
        cnh: d.cnh,
        cnhCategory: d.cnhCategory,
        cnhExpiry: new Date(d.cnhExpiry),
        phone: d.phone,
        sector: d.sector,
        active: d.active !== false,
        userId: d.userId || null,
      },
    });
    res.status(201).json(driver);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.cpf) data.cpf = data.cpf.replace(/\D/g, '');
    if (data.cnhExpiry) data.cnhExpiry = new Date(data.cnhExpiry);
    const driver = await prisma.driver.update({ where: { id: req.params.id }, data });
    res.json(driver);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
