import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';
import { checkExpiringDocuments } from '../services/notifications.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const items = await prisma.notification.findMany({
    where: {
      OR: [{ userId: req.user.id }, { userId: null }],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(items);
});

router.get('/unread-count', async (req, res) => {
  const count = await prisma.notification.count({
    where: {
      read: false,
      OR: [{ userId: req.user.id }, { userId: null }],
    },
  });
  res.json({ count });
});

router.patch('/:id/read', async (req, res) => {
  const n = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });
  res.json(n);
});

router.post('/mark-all-read', async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });
  res.json({ ok: true });
});

router.post('/scan-expirations', async (_req, res) => {
  const count = await checkExpiringDocuments();
  res.json({ generated: count });
});

export default router;
