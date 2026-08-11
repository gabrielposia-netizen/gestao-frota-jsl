import prisma from '../lib/prisma.js';
import { suggestUsageMetric } from '../lib/usage.js';

/** Alinha usageMetric dos veículos ao tipo/combustível (sem sobrescrever ajuste manual feito no cadastro recente não é possível distinguir — só corrige default KM em tipos de horas). */
export async function backfillUsageMetric() {
  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, type: true, fuelType: true, usageMetric: true },
  });
  let updated = 0;
  for (const v of vehicles) {
    const suggested = suggestUsageMetric(v.type, v.fuelType);
    if (v.usageMetric === suggested) continue;
    // Só auto-corrige quando o cadastro ainda está no default KM e o tipo exige horas
    if (v.usageMetric === 'KM' && suggested === 'HOURS') {
      await prisma.vehicle.update({ where: { id: v.id }, data: { usageMetric: 'HOURS' } });
      updated += 1;
    }
  }
  if (updated) console.log(`usageMetric: ${updated} veículo(s) ajustados para horas`);
  return updated;
}
