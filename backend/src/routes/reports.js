import { Router } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import prisma from '../lib/prisma.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();
router.use(authRequired, requireRoles('ADMIN', 'SUPERVISOR'));

router.get('/vehicles.xlsx', async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({ orderBy: { plate: 'asc' } });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Veículos');
  ws.columns = [
    { header: 'Placa', key: 'plate', width: 12 },
    { header: 'Modelo', key: 'model', width: 20 },
    { header: 'Fabricante', key: 'manufacturer', width: 16 },
    { header: 'Ano', key: 'year', width: 8 },
    { header: 'Tipo', key: 'type', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Setor', key: 'sector', width: 16 },
    { header: 'Odômetro', key: 'odometerKm', width: 12 },
  ];
  vehicles.forEach((v) => ws.addRow(v));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=veiculos.xlsx');
  await wb.xlsx.write(res);
  res.end();
});

router.get('/fuelings.xlsx', async (_req, res) => {
  const items = await prisma.fueling.findMany({
    orderBy: { fueledAt: 'desc' },
    include: { vehicle: true, driver: true },
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Abastecimentos');
  ws.columns = [
    { header: 'Data', key: 'date', width: 14 },
    { header: 'Placa', key: 'plate', width: 12 },
    { header: 'Litros', key: 'liters', width: 10 },
    { header: 'Preço/L', key: 'unitPrice', width: 10 },
    { header: 'Total', key: 'totalCost', width: 12 },
    { header: 'Motorista', key: 'driver', width: 20 },
    { header: 'Posto', key: 'station', width: 18 },
  ];
  items.forEach((f) =>
    ws.addRow({
      date: f.fueledAt.toISOString().slice(0, 10),
      plate: f.vehicle.plate,
      liters: f.liters,
      unitPrice: f.unitPrice,
      totalCost: f.totalCost,
      driver: f.driver?.name || '',
      station: f.station || '',
    }),
  );
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=abastecimentos.xlsx');
  await wb.xlsx.write(res);
  res.end();
});

router.get('/fleet.pdf', async (_req, res) => {
  const [vehicles, fuelCost, maintCost] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { plate: 'asc' } }),
    prisma.fueling.aggregate({ _sum: { totalCost: true } }),
    prisma.maintenance.aggregate({ _sum: { cost: true } }),
  ]);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=relatorio-frota.pdf');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(18).text('Relatório de Frota — JSL', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
  doc.text(`Total de veículos: ${vehicles.length}`);
  doc.text(`Custo combustível (acumulado): R$ ${(fuelCost._sum.totalCost || 0).toFixed(2)}`);
  doc.text(`Custo manutenção (acumulado): R$ ${(maintCost._sum.cost || 0).toFixed(2)}`);
  doc.moveDown();
  doc.fontSize(13).text('Veículos');
  doc.moveDown(0.5);
  doc.fontSize(9);
  vehicles.forEach((v) => {
    doc.text(`${v.plate} | ${v.model} | ${v.type} | ${v.status} | ${v.odometerKm} km`);
  });
  doc.end();
});

export default router;
