/** Regras de cadastro público com base no cargo do QLP */

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeMatricula(value = '') {
  return String(value).replace(/\s+/g, '').toUpperCase().trim();
}

/** Prefixos/cargos autorizados a se cadastrar */
const ALLOWED_CARGO_PREFIXES = [
  'MOTORISTA DE CARROS LEVE',
  'OPERADOR DE EMPILHADEIRA',
  'LIDER DE MANUTENCAO',
  'COORDENADOR DE OPERACOES',
  'SUPERVISOR DE OPERACOES',
];

export function isCargoAllowedForRegister(cargo) {
  const n = normalizeText(cargo);
  return ALLOWED_CARGO_PREFIXES.some((prefix) => n === prefix || n.startsWith(`${prefix} `) || n.startsWith(prefix));
}

export function roleFromCargo(cargo) {
  const n = normalizeText(cargo);
  if (
    n.startsWith('COORDENADOR DE OPERACOES') ||
    n.startsWith('SUPERVISOR DE OPERACOES') ||
    n.startsWith('LIDER DE MANUTENCAO')
  ) {
    return 'SUPERVISOR';
  }
  return 'OPERADOR';
}

export function isEmployeeActive(status) {
  return normalizeText(status).includes('ATIVO');
}
