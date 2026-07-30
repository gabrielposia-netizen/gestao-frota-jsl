import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@frota.jsl' } });
  if (existing) {
    console.log('Seed já aplicado — pulando.');
    return;
  }

  const [adminHash, superHash, operHash] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('super123', 10),
    bcrypt.hash('oper123', 10),
  ]);

  const admin = await prisma.user.create({
    data: { name: 'Administrador JSL', email: 'admin@frota.jsl', passwordHash: adminHash, role: 'ADMIN' },
  });
  const supervisor = await prisma.user.create({
    data: { name: 'Carlos Supervisor', email: 'supervisor@frota.jsl', passwordHash: superHash, role: 'SUPERVISOR' },
  });
  const operador = await prisma.user.create({
    data: { name: 'Ana Operadora', email: 'operador@frota.jsl', passwordHash: operHash, role: 'OPERADOR' },
  });

  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: 'João Silva', cpf: '11122233344', cnh: '12345678900', cnhCategory: 'E',
        cnhExpiry: new Date('2027-06-15'), phone: '11999990001', sector: 'Entrega',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Maria Souza', cpf: '22233344455', cnh: '22345678900', cnhCategory: 'D',
        cnhExpiry: new Date('2026-11-20'), phone: '11999990002', sector: 'Coleta',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Pedro Lima', cpf: '33344455566', cnh: '32345678900', cnhCategory: 'B',
        cnhExpiry: new Date('2028-01-10'), phone: '11999990003', sector: 'Pátio',
        userId: operador.id,
      },
    }),
  ]);

  // Coordenadas aproximadas de um pátio logístico (São Paulo)
  const baseLat = -23.5505;
  const baseLng = -46.6333;

  const vehiclesData = [
    { plate: 'ABC1D23', model: 'Actros 2651', manufacturer: 'Mercedes-Benz', year: 2022, type: 'CAMINHAO', status: 'DISPONIVEL', sector: 'Entrega', odometerKm: 85420, fuelType: 'Diesel', lat: baseLat + 0.001, lng: baseLng + 0.001, locationLabel: 'Pátio A — Vaga 01' },
    { plate: 'DEF4G56', model: 'FH 460', manufacturer: 'Volvo', year: 2021, type: 'CAMINHAO', status: 'EM_USO', sector: 'Entrega', odometerKm: 120300, fuelType: 'Diesel', lat: baseLat + 0.002, lng: baseLng - 0.001, locationLabel: 'Em rota — SP Zona Sul' },
    { plate: 'GHI7J89', model: 'Constellation 24.280', manufacturer: 'VW', year: 2020, type: 'CAMINHAO', status: 'MANUTENCAO', sector: 'Coleta', odometerKm: 210500, fuelType: 'Diesel', lat: baseLat - 0.001, lng: baseLng + 0.002, locationLabel: 'Oficina Interna' },
    { plate: 'JKL0M12', model: 'Hilux', manufacturer: 'Toyota', year: 2023, type: 'UTILITARIO', status: 'DISPONIVEL', sector: 'Apoio', odometerKm: 32100, fuelType: 'Diesel', lat: baseLat + 0.0005, lng: baseLng + 0.0015, locationLabel: 'Pátio B — Apoio' },
    { plate: 'MNO3P45', model: 'Hyster H80', manufacturer: 'Hyster', year: 2019, type: 'EMPILHADEIRA', status: 'DISPONIVEL', sector: 'Armazém', odometerKm: 5400, fuelType: 'GLP', lat: baseLat - 0.0008, lng: baseLng - 0.0005, locationLabel: 'Armazém 1' },
    { plate: 'PQR6S78', model: 'Toyota 8FGU25', manufacturer: 'Toyota', year: 2021, type: 'EMPILHADEIRA', status: 'PARADO', sector: 'Armazém', odometerKm: 8200, fuelType: 'GLP', lat: baseLat - 0.0012, lng: baseLng - 0.0008, locationLabel: 'Armazém 2 — Parada' },
    { plate: 'STU9V01', model: 'Rebocador Elétrico', manufacturer: 'Jungheinrich', year: 2022, type: 'REBOCADOR', status: 'DISPONIVEL', sector: 'Pátio', odometerKm: 2100, fuelType: 'Elétrico', lat: baseLat + 0.0015, lng: baseLng - 0.0012, locationLabel: 'Doca 3' },
    { plate: 'VWX2Y34', model: 'Sprinter 415', manufacturer: 'Mercedes-Benz', year: 2024, type: 'APOIO', status: 'DISPONIVEL', sector: 'Apoio', odometerKm: 12500, fuelType: 'Diesel', lat: baseLat + 0.0002, lng: baseLng + 0.0008, locationLabel: 'Garagem Apoio' },
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const created = await prisma.vehicle.create({
      data: {
        plate: v.plate,
        model: v.model,
        manufacturer: v.manufacturer,
        year: v.year,
        renavam: `${Math.floor(10000000000 + Math.random() * 89999999999)}`,
        chassis: `9BW${Math.random().toString(36).slice(2, 14).toUpperCase()}`,
        sector: v.sector,
        type: v.type,
        status: v.status,
        odometerKm: v.odometerKm,
        fuelType: v.fuelType,
        currentLat: v.lat,
        currentLng: v.lng,
        locationLabel: v.locationLabel,
        qrCodeData: `http://localhost:5173/veiculos/`,
      },
    });
    await prisma.vehicle.update({
      where: { id: created.id },
      data: { qrCodeData: `http://localhost:5173/veiculos/${created.id}` },
    });
    vehicles.push(created);
  }

  const soon = new Date();
  soon.setDate(soon.getDate() + 12);
  const later = new Date();
  later.setMonth(later.getMonth() + 8);
  const expired = new Date();
  expired.setDate(expired.getDate() - 5);

  for (const v of vehicles.slice(0, 5)) {
    await prisma.vehicleDocument.createMany({
      data: [
        { vehicleId: v.id, type: 'IPVA', expiryDate: soon, number: `IPVA-${v.plate}` },
        { vehicleId: v.id, type: 'SEGURO', expiryDate: later, number: `SEG-${v.plate}` },
        { vehicleId: v.id, type: 'LICENCIAMENTO', expiryDate: v.plate === 'GHI7J89' ? expired : later, number: `LIC-${v.plate}` },
      ],
    });
  }

  await prisma.movement.createMany({
    data: [
      { vehicleId: vehicles[1].id, driverId: drivers[0].id, userId: operador.id, type: 'SAIDA', odometerKm: 120300, purpose: 'Entrega zona sul', occurredAt: new Date() },
      { vehicleId: vehicles[0].id, driverId: drivers[1].id, userId: operador.id, type: 'ENTRADA', odometerKm: 85420, purpose: 'Retorno base', occurredAt: new Date(Date.now() - 86400000) },
      { vehicleId: vehicles[3].id, driverId: drivers[2].id, userId: supervisor.id, type: 'SAIDA', odometerKm: 32000, purpose: 'Apoio operacional', occurredAt: new Date(Date.now() - 2 * 86400000) },
      { vehicleId: vehicles[3].id, driverId: drivers[2].id, userId: supervisor.id, type: 'ENTRADA', odometerKm: 32100, purpose: 'Retorno', occurredAt: new Date(Date.now() - 2 * 86400000 + 3600000) },
    ],
  });

  const checklistItems = [
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

  await prisma.checklist.createMany({
    data: [
      { vehicleId: vehicles[1].id, driverId: drivers[0].id, userId: operador.id, type: 'PRE_USO', items: checklistItems, approved: true, odometerKm: 120300 },
      { vehicleId: vehicles[0].id, driverId: drivers[1].id, userId: operador.id, type: 'INICIO_TURNO', shift: 'MANHA', items: checklistItems, approved: true },
      { vehicleId: vehicles[4].id, driverId: drivers[2].id, userId: operador.id, type: 'FIM_TURNO', shift: 'TARDE', items: checklistItems.map((i, idx) => (idx === 0 ? { ...i, ok: false } : i)), approved: false, notes: 'Pressão baixa no pneu dianteiro' },
    ],
  });

  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 10 + i);
    await prisma.fueling.create({
      data: {
        vehicleId: vehicles[i % 4].id,
        driverId: drivers[i % 3].id,
        userId: operador.id,
        liters: 80 + i * 15,
        unitPrice: 5.8 + i * 0.05,
        totalCost: (80 + i * 15) * (5.8 + i * 0.05),
        odometerKm: 80000 + i * 2000,
        station: i % 2 === 0 ? 'Posto Shell Base' : 'Posto Ipiranga CD',
        fueledAt: d,
      },
    });
  }

  await prisma.maintenance.createMany({
    data: [
      {
        vehicleId: vehicles[2].id, createdById: supervisor.id, type: 'CORRETIVA', status: 'EM_ANDAMENTO',
        title: 'Troca de embreagem', description: 'Patinação reportada pelo motorista', cost: 4500,
        scheduledAt: now, startedAt: now, workshop: 'Oficina Interna', downtimeHours: 18,
      },
      {
        vehicleId: vehicles[0].id, createdById: operador.id, type: 'PREVENTIVA', status: 'AGENDADA',
        title: 'Revisão 90.000 km', description: 'Troca de óleo, filtros e alinhamento', cost: 1200,
        scheduledAt: new Date(now.getTime() + 5 * 86400000), workshop: 'Concessionária MB',
      },
      {
        vehicleId: vehicles[4].id, createdById: operador.id, type: 'CORRETIVA', status: 'AGUARDANDO_APROVACAO',
        title: 'Reparo hidráulico empilhadeira', description: 'Vazamento no cilindro de elevação', cost: 2800,
        scheduledAt: new Date(now.getTime() + 2 * 86400000), workshop: 'Fornecedor Hyster',
      },
      {
        vehicleId: vehicles[1].id, createdById: supervisor.id, approvedById: admin.id, type: 'PREVENTIVA',
        status: 'CONCLUIDA', title: 'Alinhamento e balanceamento', cost: 450,
        scheduledAt: new Date(now.getTime() - 20 * 86400000), startedAt: new Date(now.getTime() - 19 * 86400000),
        completedAt: new Date(now.getTime() - 19 * 86400000 + 4 * 3600000), downtimeHours: 4, workshop: 'Borracharia Parceira',
      },
    ],
  });

  await prisma.tire.createMany({
    data: [
      { vehicleId: vehicles[0].id, position: 'DE', brand: 'Michelin', treadDepth: 7.2, pressurePsi: 110, status: 'OK' },
      { vehicleId: vehicles[0].id, position: 'DD', brand: 'Michelin', treadDepth: 7.0, pressurePsi: 110, status: 'OK' },
      { vehicleId: vehicles[0].id, position: 'TE', brand: 'Michelin', treadDepth: 5.5, pressurePsi: 105, status: 'ATENCAO' },
      { vehicleId: vehicles[0].id, position: 'TD', brand: 'Michelin', treadDepth: 6.1, pressurePsi: 105, status: 'OK' },
      { vehicleId: vehicles[4].id, position: 'DE', brand: 'Continental', treadDepth: 4.0, pressurePsi: 90, status: 'TROCAR' },
    ],
  });

  await prisma.damage.create({
    data: {
      vehicleId: vehicles[2].id,
      driverId: drivers[1].id,
      reportedById: operador.id,
      description: 'Amassado na lateral direita próximo ao tanque',
      severity: 'MEDIA',
      photoUrls: [],
    },
  });

  const day = new Date(now.toISOString().slice(0, 10));
  for (const v of vehicles) {
    for (const shift of ['MANHA', 'TARDE', 'NOITE']) {
      await prisma.shiftAvailability.create({
        data: { vehicleId: v.id, shift, date: day, status: v.status },
      });
    }
  }

  await prisma.notification.createMany({
    data: [
      { userId: admin.id, type: 'VENCIMENTO', title: 'IPVA próximo do vencimento', message: 'ABC1D23 vence em 12 dias', link: `/veiculos/${vehicles[0].id}` },
      { userId: supervisor.id, type: 'MANUTENCAO', title: 'Aprovação pendente', message: 'Reparo hidráulico — MNO3P45', link: '/manutencoes' },
      { userId: null, type: 'SISTEMA', title: 'Bem-vindo ao Gestão de Frota JSL', message: 'Sistema operacional com dados de demonstração.', link: '/' },
    ],
  });

  console.log('Seed concluído com sucesso.');
  console.log('Logins: admin@frota.jsl / admin123 | supervisor@frota.jsl / super123 | operador@frota.jsl / oper123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
