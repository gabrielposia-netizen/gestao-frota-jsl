/** Métrica de uso inteligente (frontend) */

export function suggestUsageMetric(type, fuelType) {
  const fuel = String(fuelType || '').toLowerCase();
  if (type === 'EMPILHADEIRA' || type === 'REBOCADOR') return 'HOURS';
  if (fuel.includes('eletric') || fuel.includes('elétr') || fuel.includes('eletr')) return 'HOURS';
  return 'KM';
}

export function usageLabel(metric) {
  return metric === 'HOURS' ? 'Horas rodadas' : 'Odômetro (km)';
}

export function usageUnit(metric) {
  return metric === 'HOURS' ? 'h' : 'km';
}

export function formatUsage(value, metric = 'KM') {
  const n = Number(value) || 0;
  const formatted = n.toLocaleString('pt-BR', { maximumFractionDigits: metric === 'HOURS' ? 1 : 0 });
  return `${formatted} ${usageUnit(metric)}`;
}
