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
  'LIDER DE LOGISTICA',
  'LIDER DE MOVIMENTACAO',
  'COORDENADOR DE OPERACOES',
  'SUPERVISOR DE OPERACOES',
];

/** Pessoas liberadas mesmo com cargo fora da lista (nome no QLP) */
const ALLOWED_NAME_KEYWORDS = [
  'KEROLAYNE',
  'KAROLAINE',
  'KAROLAYNE',
  'KEROLAINE',
];

export function isCargoAllowedForRegister(cargo) {
  const n = normalizeText(cargo);
  if (n.includes('LIDER') && n.includes('MOVIMENT')) return true;
  return ALLOWED_CARGO_PREFIXES.some((prefix) => n === prefix || n.startsWith(`${prefix} `) || n.startsWith(prefix));
}

export function isNameAllowedForRegister(nome) {
  const n = normalizeText(nome);
  return ALLOWED_NAME_KEYWORDS.some((k) => n.includes(k));
}

export function canRegisterEmployee(employee) {
  if (!employee) return false;
  return isCargoAllowedForRegister(employee.cargo) || isNameAllowedForRegister(employee.nome);
}

export function roleFromCargo(cargo, nome = '') {
  const n = normalizeText(cargo);
  const person = normalizeText(nome);
  if (ALLOWED_NAME_KEYWORDS.some((k) => person.includes(k))) return 'SUPERVISOR';
  if (
    n.startsWith('COORDENADOR DE OPERACOES') ||
    n.startsWith('SUPERVISOR DE OPERACOES') ||
    n.startsWith('LIDER DE MANUTENCAO') ||
    n.startsWith('LIDER DE LOGISTICA') ||
    (n.includes('LIDER') && n.includes('MOVIMENT'))
  ) {
    return 'SUPERVISOR';
  }
  return 'OPERADOR';
}

export function isEmployeeActive(status) {
  return normalizeText(status).includes('ATIVO');
}
