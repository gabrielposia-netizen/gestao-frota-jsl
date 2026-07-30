import prisma from '../lib/prisma.js';

export async function createNotification({ userId = null, type, title, message, link = null }) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

export async function notifyRole(roles, payload) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles }, active: true },
    select: { id: true },
  });
  await Promise.all(users.map((u) => createNotification({ ...payload, userId: u.id })));
}

export async function checkExpiringDocuments() {
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const docs = await prisma.vehicleDocument.findMany({
    where: { expiryDate: { lte: in30 } },
    include: { vehicle: { select: { plate: true, id: true } } },
  });
  for (const doc of docs) {
    const days = Math.ceil((new Date(doc.expiryDate) - new Date()) / 86400000);
    await notifyRole(['ADMIN', 'SUPERVISOR'], {
      type: 'VENCIMENTO',
      title: `${doc.type} — ${doc.vehicle.plate}`,
      message: days < 0
        ? `Documento vencido há ${Math.abs(days)} dia(s).`
        : `Vence em ${days} dia(s).`,
      link: `/veiculos/${doc.vehicle.id}`,
    });
  }
  return docs.length;
}
