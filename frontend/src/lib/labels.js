export const STATUS_LABEL = {
  DISPONIVEL: 'Disponível',
  EM_USO: 'Em uso',
  MANUTENCAO: 'Manutenção',
  PARADO: 'Parado',
  INATIVO: 'Inativo',
};

export const STATUS_COLOR = {
  DISPONIVEL: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  EM_USO: 'bg-[color-mix(in_oklab,#e30613_12%,transparent)] text-[#b80510] dark:text-[#ff8a90]',
  MANUTENCAO: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  PARADO: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  INATIVO: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
};

export const TYPE_LABEL = {
  CAMINHAO: 'Caminhão',
  UTILITARIO: 'Utilitário',
  EMPILHADEIRA: 'Empilhadeira',
  REBOCADOR: 'Rebocador',
  APOIO: 'Apoio',
  OUTRO: 'Outro',
};

export const ROLE_LABEL = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  OPERADOR: 'Operador',
};

export function money(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('pt-BR');
}

export function fmtDateTime(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString('pt-BR');
}

export function daysUntil(date) {
  return Math.ceil((new Date(date) - new Date()) / 86400000);
}
