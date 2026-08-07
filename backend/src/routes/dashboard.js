import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', async (_req, res) => {
  const now = new Date();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    byStatus,
    fuelingsMonth,
    maintenancesMonth,
    expiringDocs,
    recentMovements,
    downtime,
    kmTotal,
    shifts,
    fuelingsAll,
  ] = await Promise.all([
    prisma.vehicle.groupBy({ by: ['status'], _count: true }),
    prisma.fueling.findMany({
      where: { fueledAt: { gte: monthStart } },
      select: { liters: true, totalCost: true, odometerKm: true, fueledAt: true },
    }),
    prisma.maintenance.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { cost: true, downtimeHours: true, status: true, type: true },
    }),
    prisma.vehicleDocument.findMany({
      where: { expiryDate: { lte: in30 } },
      orderBy: { expiryDate: 'asc' },
      take: 10,
      include: { vehicle: { select: { id: true, plate: true, model: true } } },
    }),
    prisma.movement.findMany({
      take: 8,
      orderBy: { occurredAt: 'desc' },
      include: {
        vehicle: { select: { plate: true } },
        driver: { select: { name: true } },
      },
    }),
    prisma.maintenance.aggregate({
      where: { downtimeHours: { not: null } },
      _sum: { downtimeHours: true },
      _avg: { downtimeHours: true },
    }),
    prisma.vehicle.aggregate({ _sum: { odometerKm: true } }),
    prisma.shiftAvailability.findMany({
      where: { date: new Date(now.toISOString().slice(0, 10)) },
      include: { vehicle: { select: { plate: true, type: true } } },
    }),
    prisma.fueling.findMany({
      where: { odometerKm: { not: null } },
      orderBy: [{ vehicleId: 'asc' }, { fueledAt: 'asc' }],
      select: {
        vehicleId: true,
        liters: true,
        odometerKm: true,
        fueledAt: true,
        vehicle: { select: { id: true, plate: true, model: true, manufacturer: true, type: true } },
      },
    }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
  const fuelCost = fuelingsMonth.reduce((a, f) => a + f.totalCost, 0);
  const fuelLiters = fuelingsMonth.reduce((a, f) => a + f.liters, 0);
  const maintCost = maintenancesMonth.reduce((a, m) => a + (m.cost || 0), 0);

  // Monthly series (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, start: d, end });
  }

  const monthly = await Promise.all(
    months.map(async (m) => {
      const [fuels, maints, movs] = await Promise.all([
        prisma.fueling.aggregate({
          where: { fueledAt: { gte: m.start, lt: m.end } },
          _sum: { totalCost: true, liters: true },
        }),
        prisma.maintenance.aggregate({
          where: { createdAt: { gte: m.start, lt: m.end } },
          _sum: { cost: true, downtimeHours: true },
        }),
        prisma.movement.count({
          where: { occurredAt: { gte: m.start, lt: m.end }, type: 'SAIDA' },
        }),
      ]);
      return {
        month: m.key,
        fuelCost: fuels._sum.totalCost || 0,
        liters: fuels._sum.liters || 0,
        maintCost: maints._sum.cost || 0,
        downtime: maints._sum.downtimeHours || 0,
        exits: movs,
      };
    }),
  );

  const byVehicle = new Map();
  for (const f of fuelingsAll) {
    if (!byVehicle.has(f.vehicleId)) byVehicle.set(f.vehicleId, []);
    byVehicle.get(f.vehicleId).push(f);
  }

  const consumoPorVeiculo = [];
  let fleetKm = 0;
  let fleetLiters = 0;

  for (const [, fills] of byVehicle) {
    let km = 0;
    let liters = 0;
    let segments = 0;
    for (let i = 1; i < fills.length; i++) {
      const prev = fills[i - 1];
      const curr = fills[i];
      const delta = Number(curr.odometerKm) - Number(prev.odometerKm);
      if (delta <= 0 || !curr.liters || curr.liters <= 0) continue;
      km += delta;
      liters += curr.liters;
      segments += 1;
    }
    if (segments === 0 || liters <= 0) continue;
    const v = fills[0].vehicle;
    const kmPorLitro = Number((km / liters).toFixed(2));
    const litrosPor100km = Number(((liters / km) * 100).toFixed(2));
    fleetKm += km;
    fleetLiters += liters;
    consumoPorVeiculo.push({
      vehicleId: v.id,
      plate: v.plate,
      model: `${v.manufacturer || ''} ${v.model || ''}`.trim(),
      type: v.type,
      kmRodados: Number(km.toFixed(0)),
      litros: Number(liters.toFixed(1)),
      kmPorLitro,
      litrosPor100km,
      abastecimentos: segments + 1,
    });
  }

  consumoPorVeiculo.sort((a, b) => b.kmPorLitro - a.kmPorLitro);

  const avgConsumption =
    fleetLiters > 0
      ? Number((fleetKm / fleetLiters).toFixed(2))
      : fuelLiters > 0 && fuelingsMonth.length > 1
        ? Number((fuelLiters / Math.max(fuelingsMonth.length, 1)).toFixed(1))
        : 0;

  res.json({
    kpis: {
      disponiveis: statusMap.DISPONIVEL || 0,
      emUso: statusMap.EM_USO || 0,
      manutencao: statusMap.MANUTENCAO || 0,
      parados: statusMap.PARADO || 0,
      custoFrotaMes: Number((fuelCost + maintCost).toFixed(2)),
      custoCombustivelMes: Number(fuelCost.toFixed(2)),
      custoManutencaoMes: Number(maintCost.toFixed(2)),
      consumoMedioLitros: avgConsumption,
      consumoMedioKmL: fleetLiters > 0 ? avgConsumption : null,
      kmTotal: kmTotal._sum.odometerKm || 0,
      tempoParadoHoras: downtime._sum.downtimeHours || 0,
      tempoParadoMedio: Number((downtime._avg.downtimeHours || 0).toFixed(1)),
    },
    vencimentos: expiringDocs,
    recentMovements,
    monthly,
    shiftsToday: shifts,
    byStatus: statusMap,
    consumoPorVeiculo,
  });
});

export default router;
