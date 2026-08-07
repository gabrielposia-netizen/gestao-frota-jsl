import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { upsertQlpEmployees } from '../scripts/import-qlp.js';

const prisma = new PrismaClient();

const DEMO_PLATES = ['ABC1D23', 'DEF4G56', 'GHI7J89', 'JKL0M12', 'MNO3P45', 'PQR6S78', 'STU9V01', 'VWX2Y34'];
const DEMO_CPFS = ['11122233344', '22233344455', '33344455566'];
const DEMO_EMAILS = ['admin@frota.jsl', 'supervisor@frota.jsl', 'operador@frota.jsl'];
const DEMO_MATRICULAS = ['ADMIN01', 'SUPER01', 'OPER01'];

async function clearDemoData() {
  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [{ email: { in: DEMO_EMAILS } }, { matricula: { in: DEMO_MATRICULAS } }],
    },
    select: { id: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);

  const demoVehicles = await prisma.vehicle.findMany({
    where: { plate: { in: DEMO_PLATES } },
    select: { id: true },
  });
  const vehicleIds = demoVehicles.map((v) => v.id);

  if (vehicleIds.length) {
    await prisma.shiftAvailability.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
    await prisma.damage.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
    await prisma.tire.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
    await prisma.maintenance.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
    await prisma.fueling.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
    await prisma.checklist.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
    await prisma.movement.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
    await prisma.vehicleDocument.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
    await prisma.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });
  }

  await prisma.driver.deleteMany({ where: { cpf: { in: DEMO_CPFS } } });

  if (demoUserIds.length) {
    await prisma.notification.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: demoUserIds } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } });
  }

  await prisma.notification.deleteMany({
    where: {
      OR: [
        { message: { contains: 'demonstração' } },
        { title: { contains: 'Bem-vindo ao Gestão de Frota' } },
      ],
    },
  });
}

async function ensureBootstrapAdmin() {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@frota.local').toLowerCase();
  const matricula = (process.env.BOOTSTRAP_ADMIN_MATRICULA || 'ADMIN').toUpperCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@Frota1';
  const name = process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador';

  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existingAdmin) {
    console.log(`Admin já existe (${existingAdmin.matricula || existingAdmin.email}).`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, matricula, passwordHash, role: 'ADMIN' },
  });
  console.log(`Admin bootstrap: matrícula ${matricula} | e-mail ${email}`);
  console.log('Troque a senha após o primeiro acesso.');
}

async function main() {
  try {
    const qlpCount = await upsertQlpEmployees(prisma);
    console.log(`QLP importado: ${qlpCount} colaboradores.`);
  } catch (err) {
    console.warn('Aviso: não foi possível importar QLP:', err.message);
  }

  await clearDemoData();
  console.log('Dados fictícios removidos.');

  await ensureBootstrapAdmin();
  console.log('Ambiente pronto para uso (sem frota fictícia).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
