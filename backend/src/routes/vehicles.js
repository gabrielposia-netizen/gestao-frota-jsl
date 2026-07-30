import { Router } from 'express';
import QRCode from 'qrcode';
import prisma from '../lib/prisma.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { parsePagination } from '../utils/query.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { q, status, type, sector } = req.query;
  const where = {
    AND: [
      q
        ? {
            OR: [
              { plate: { contains: q, mode: 'insensitive' } },
              { model: { contains: q, mode: 'insensitive' } },
              { manufacturer: { contains: q, mode: 'insensitive' } },
              { sector: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
      status ? { status } : {},
      type ? { type } : {},
      sector ? { sector: { contains: sector, mode: 'insensitive' } } : {},
    ],
  };
  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take,
      orderBy: { plate: 'asc' },
      include: {
        documents: { orderBy: { expiryDate: 'asc' }, take: 3 },
        _count: { select: { damages: true, maintenances: true } },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

router.get('/map', async (_req, res) => {
  const items = await prisma.vehicle.findMany({
    where: { currentLat: { not: null }, currentLng: { not: null } },
    select: {
      id: true, plate: true, model: true, type: true, status: true,
      currentLat: true, currentLng: true, locationLabel: true, sector: true,
    },
  });
  res.json(items);
});

router.get('/tv', async (_req, res) => {
  const items = await prisma.vehicle.findMany({
    where: { status: { not: 'INATIVO' } },
    orderBy: [{ status: 'asc' }, { plate: 'asc' }],
    select: {
      id: true, plate: true, model: true, type: true, status: true,
      sector: true, locationLabel: true, updatedAt: true,
    },
  });
  const summary = items.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});
  res.json({ items, summary, updatedAt: new Date() });
});

router.get('/:id', async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      documents: { orderBy: { expiryDate: 'asc' } },
      photos: { orderBy: { createdAt: 'desc' } },
      tires: true,
      movements: {
        take: 20,
        orderBy: { occurredAt: 'desc' },
        include: { driver: true, user: { select: { name: true } } },
      },
      maintenances: { take: 10, orderBy: { scheduledAt: 'desc' } },
      fuelings: { take: 10, orderBy: { fueledAt: 'desc' } },
      damages: { take: 10, orderBy: { reportedAt: 'desc' } },
      checklists: { take: 10, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });
  res.json(vehicle);
});

router.get('/:id/history', async (req, res) => {
  const id = req.params.id;
  const [movements, fuelings, maintenances, checklists, damages] = await Promise.all([
    prisma.movement.findMany({
      where: { vehicleId: id },
      orderBy: { occurredAt: 'desc' },
      include: { driver: true, user: { select: { name: true } } },
    }),
    prisma.fueling.findMany({ where: { vehicleId: id }, orderBy: { fueledAt: 'desc' } }),
    prisma.maintenance.findMany({ where: { vehicleId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.checklist.findMany({ where: { vehicleId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.damage.findMany({ where: { vehicleId: id }, orderBy: { reportedAt: 'desc' } }),
  ]);
  res.json({ movements, fuelings, maintenances, checklists, damages });
});

router.get('/:id/qrcode', async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });
  const payload = vehicle.qrCodeData || JSON.stringify({ vehicleId: vehicle.id, plate: vehicle.plate });
  const dataUrl = await QRCode.toDataURL(payload, { width: 320, margin: 1 });
  res.json({ plate: vehicle.plate, dataUrl, payload });
});

router.post('/', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const data = req.body;
    const vehicle = await prisma.vehicle.create({
      data: {
        plate: data.plate.toUpperCase().replace(/\s/g, ''),
        model: data.model,
        manufacturer: data.manufacturer,
        year: Number(data.year),
        renavam: data.renavam,
        chassis: data.chassis,
        sector: data.sector,
        type: data.type || 'CAMINHAO',
        status: data.status || 'DISPONIVEL',
        odometerKm: Number(data.odometerKm) || 0,
        fuelType: data.fuelType,
        capacityLiters: data.capacityLiters ? Number(data.capacityLiters) : null,
        photoUrl: data.photoUrl,
        currentLat: data.currentLat ? Number(data.currentLat) : null,
        currentLng: data.currentLng ? Number(data.currentLng) : null,
        locationLabel: data.locationLabel,
        notes: data.notes,
      },
    });
    const qrPayload = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/veiculos/${vehicle.id}`;
    const updated = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { qrCodeData: qrPayload },
    });
    res.status(201).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.plate) data.plate = data.plate.toUpperCase().replace(/\s/g, '');
    if (data.year) data.year = Number(data.year);
    if (data.odometerKm != null) data.odometerKm = Number(data.odometerKm);
    if (data.currentLat != null) data.currentLat = Number(data.currentLat);
    if (data.currentLng != null) data.currentLng = Number(data.currentLng);
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data });
    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/photos', requireRoles('ADMIN', 'SUPERVISOR', 'OPERADOR'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório' });
  const photo = await prisma.vehiclePhoto.create({
    data: {
      vehicleId: req.params.id,
      url: `/uploads/${req.file.filename}`,
      caption: req.body.caption,
    },
  });
  res.status(201).json(photo);
});

router.post('/:id/documents', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const doc = await prisma.vehicleDocument.create({
      data: {
        vehicleId: req.params.id,
        type: req.body.type,
        number: req.body.number,
        issuer: req.body.issuer,
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : null,
        expiryDate: new Date(req.body.expiryDate),
        fileUrl: req.body.fileUrl,
        notes: req.body.notes,
      },
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
