/** Rotas e permissões por perfil */

export const OPERADOR_HOME = '/movimentacoes';

export const OPERADOR_BLOCKED = ['/', '/relatorios', '/tv', '/usuarios', '/mapa', '/turnos'];

export function homeForRole(role) {
  if (role === 'OPERADOR') return OPERADOR_HOME;
  return '/';
}

export function canAccessPath(role, path) {
  if (role === 'ADMIN' || role === 'SUPERVISOR') return true;
  if (role === 'OPERADOR') {
    if (path === '/' || path.startsWith('/relatorios') || path.startsWith('/tv') || path.startsWith('/usuarios') || path.startsWith('/mapa') || path.startsWith('/turnos')) {
      return false;
    }
  }
  return true;
}
