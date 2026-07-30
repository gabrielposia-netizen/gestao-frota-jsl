import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ vehicles: [], drivers: [] });

  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        OR: [
          { plate: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } },
          { manufacturer: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 8,
      select: { id: true, plate: true, model: true, status: true, type: true },
    }),
    prisma.driver.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { cpf: { contains: q.replace(/\D/g, '') } },
        ],
      },
      take: 8,
      select: { id: true, name: true, cpf: true, sector: true },
    }),
  ]);

  res.json({ vehicles, drivers });
});

export default router;
