import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import { normalizeMatricula } from '../src/lib/qlp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const QLP_FILE = path.resolve(__dirname, '../data/qlp-ativos.xlsx');

/**
 * Lê a planilha de ativos e devolve registros normalizados.
 */
export async function readQlpEmployees(filePath = QLP_FILE) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];
  const rows = [];

  ws.eachRow((row, index) => {
    if (index === 1) return;
    const matricula = normalizeMatricula(row.getCell(1).value);
    const sso = row.getCell(2).value != null ? String(row.getCell(2).value).trim() : null;
    const nome = row.getCell(3).value != null ? String(row.getCell(3).value).trim() : '';
    const cargo = row.getCell(4).value != null ? String(row.getCell(4).value).trim() : '';
    const status = row.getCell(9).value != null ? String(row.getCell(9).value).trim() : '';
    const unidade = row.getCell(14).value != null ? String(row.getCell(14).value).trim() : null;
    const setor = row.getCell(15).value != null ? String(row.getCell(15).value).trim() : null;
    const lider = row.getCell(16).value != null ? String(row.getCell(16).value).trim() : null;
    if (!matricula || !nome) return;
    rows.push({ matricula, sso, nome, cargo, status, unidade, setor, lider });
  });

  return rows;
}

export async function upsertQlpEmployees(prisma, filePath = QLP_FILE) {
  const rows = await readQlpEmployees(filePath);
  let count = 0;
  for (const row of rows) {
    await prisma.employee.upsert({
      where: { matricula: row.matricula },
      create: row,
      update: {
        nome: row.nome,
        cargo: row.cargo,
        status: row.status,
        unidade: row.unidade,
        setor: row.setor,
        lider: row.lider,
        sso: row.sso,
      },
    });
    count += 1;
  }
  return count;
}
