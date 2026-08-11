import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const where = {
    active: true,
    ...(req.query.type ? { type: req.query.type } : {}),
  };
  const items = await prisma.stockItem.findMany({
    where,
    orderBy: [{ type: 'asc' }, { brand: 'asc' }, { model: 'asc' }],
  });
  const lowStock = items.filter((i) => i.quantity <= i.minQuantity);
  res.json({ items, lowStock, alerts: lowStock.length });
});

router.post('/', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const b = req.body;
    const item = await prisma.stockItem.create({
      data: {
        type: b.type,
        brand: b.brand,
        model: b.model,
        spec: b.spec,
        quantity: Number(b.quantity) || 0,
        minQuantity: b.minQuantity != null ? Number(b.minQuantity) : 2,
        location: b.location,
        unitCost: b.unitCost != null && b.unitCost !== '' ? Number(b.unitCost) : null,
        notes: b.notes,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.quantity != null) data.quantity = Number(data.quantity);
    if (data.minQuantity != null) data.minQuantity = Number(data.minQuantity);
    if (data.unitCost != null && data.unitCost !== '') data.unitCost = Number(data.unitCost);
    const item = await prisma.stockItem.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/move', requireRoles('ADMIN', 'SUPERVISOR', 'OPERADOR'), async (req, res) => {
  try {
    const b = req.body;
    const qty = Math.abs(Number(b.quantity) || 0);
    if (!qty) return res.status(400).json({ error: 'Quantidade inválida' });
    const type = b.type || 'ENTRADA';

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.stockItem.findUnique({ where: { id: req.params.id } });
      if (!item) throw Object.assign(new Error('Item não encontrado'), { status: 404 });

      let nextQty = item.quantity;
      if (type === 'ENTRADA') nextQty += qty;
      else if (type === 'SAIDA') nextQty -= qty;
      else if (type === 'AJUSTE') nextQty = Number(b.quantity);
      if (nextQty < 0) throw Object.assign(new Error('Estoque insuficiente'), { status: 400 });

      const updated = await tx.stockItem.update({
        where: { id: item.id },
        data: { quantity: nextQty },
      });

      const movement = await tx.stockMovement.create({
        data: {
          stockItemId: item.id,
          type,
          quantity: type === 'AJUSTE' ? Number(b.quantity) : qty,
          vehicleId: b.vehicleId || null,
          userId: req.user.id,
          notes: b.notes,
        },
      });

      return { item: updated, movement };
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

router.get('/:id/movements', async (req, res) => {
  const items = await prisma.stockMovement.findMany({
    where: { stockItemId: req.params.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { vehicle: { select: { plate: true } } },
  });
  res.json(items);
});

export default router;
