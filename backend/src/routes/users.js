import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { parsePagination, searchFilter } from '../utils/query.js';

const router = Router();

router.use(authRequired);

router.get('/', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const where = searchFilter(req.query.q, ['name', 'email']);
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

router.post('/', requireRoles('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role = 'OPERADOR' } = req.body;
    const passwordHash = await bcrypt.hash(password || '123456', 10);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash, role },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', requireRoles('ADMIN'), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.passwordHash;
    if (req.body.password) {
      data.passwordHash = await bcrypt.hash(req.body.password, 10);
      delete data.password;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
