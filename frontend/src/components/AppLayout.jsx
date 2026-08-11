import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell, CalendarClock, ClipboardCheck, Droplets, FileBarChart, Fuel, LayoutDashboard,
  LogOut, Map, Menu, Moon, Search, Shield, Sun, Truck, Tv, Users, Wrench, X, AlertTriangle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { ROLE_LABEL } from '../lib/labels';
import { homeForRole } from '../lib/access';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR'] },
  { to: '/veiculos', label: 'Veículos', icon: Truck },
  { to: '/motoristas', label: 'Motoristas', icon: Users },
  { to: '/movimentacoes', label: 'Entrada/Saída', icon: ClipboardCheck },
  { to: '/checklists', label: 'Checklists', icon: ClipboardCheck },
  { to: '/abastecimentos', label: 'Abastecimento', icon: Fuel },
  { to: '/manutencoes', label: 'Manutenções', icon: Wrench },
  { to: '/pneus', label: 'Pneus e baterias', icon: Droplets },
  { to: '/avarias', label: 'Avarias', icon: AlertTriangle },
  { to: '/mapa', label: 'Mapa', icon: Map, roles: ['ADMIN', 'SUPERVISOR'] },
  { to: '/turnos', label: 'Turnos', icon: CalendarClock, roles: ['ADMIN', 'SUPERVISOR'] },
  { to: '/relatorios', label: 'Relatórios', icon: FileBarChart, roles: ['ADMIN', 'SUPERVISOR'] },
  { to: '/usuarios', label: 'Usuários', icon: Shield, roles: ['ADMIN'] },
  { to: '/tv', label: 'Painel TV', icon: Tv, roles: ['ADMIN', 'SUPERVISOR'] },
];

export default function AppLayout({ children }) {
  const { user, logout, can } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    api('/notifications/unread-count').then((d) => setUnread(d.count)).catch(() => {});
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      api(`/search?q=${encodeURIComponent(q)}`).then(setResults).catch(() => setResults(null));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function openNotifications() {
    setShowNotifs((v) => !v);
    if (!showNotifs) {
      const items = await api('/notifications');
      setNotifs(items);
    }
  }

  const visibleLinks = links.filter((l) => !l.roles || can(...l.roles));

  function doLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <button className="app-mobile-toggle btn btn-primary lg:hidden" type="button" onClick={() => setOpen(true)} aria-label="Abrir menu">
        <Menu size={18} />
      </button>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="brand-mark">Sistema interno</div>
              <h1>Gestão de Frota</h1>
              <p>Operação de veículos e checklists</p>
            </div>
            <button className="btn btn-ghost p-2 lg:hidden" type="button" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X size={16} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip sidebar-user">
            <Shield size={14} />
            <span className="truncate">{user?.name?.split(' ')[0]} · {ROLE_LABEL[user?.role] || user?.role}</span>
          </div>
          <button className="btn btn-ghost" type="button" onClick={toggle}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            Modo {dark ? 'claro' : 'escuro'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={doLogout}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {open && <div className="sidebar-backdrop lg:hidden" onClick={() => setOpen(false)} />}

      <main className="main">
        <div className="topbar">
          <div className="relative flex-1 max-w-xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="input pl-9"
              placeholder="Pesquisar placa, motorista ou veículo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {results && (
              <div className="absolute top-full mt-2 w-full card shadow-xl p-2 z-50 text-[var(--text)]">
                <div className="text-xs uppercase text-[var(--muted)] px-2 py-1">Veículos</div>
                {results.vehicles.length === 0 && <div className="px-2 py-2 text-sm text-[var(--muted)]">Nenhum</div>}
                {results.vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-[var(--surface-2)] text-sm"
                    onClick={() => {
                      setQ('');
                      setResults(null);
                      navigate(`/veiculos/${v.id}`);
                    }}
                  >
                    <span className="font-semibold">{v.plate}</span> — {v.model}
                  </button>
                ))}
                <div className="text-xs uppercase text-[var(--muted)] px-2 py-1 mt-1">Motoristas</div>
                {results.drivers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-[var(--surface-2)] text-sm"
                    onClick={() => {
                      setQ('');
                      setResults(null);
                      navigate('/motoristas');
                    }}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            <div className="relative">
              <button className="btn btn-secondary p-2 relative" type="button" onClick={openNotifications}>
                <Bell size={17} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-[var(--jsl-red)] text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-bold">
                    {unread}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto card shadow-xl p-2 z-50 text-[var(--text)]">
                  <div className="flex items-center justify-between px-2 py-1 mb-1">
                    <span className="font-semibold text-sm">Notificações</span>
                    <button
                      type="button"
                      className="text-xs text-[var(--jsl-red)] font-bold"
                      onClick={() => api('/notifications/mark-all-read', { method: 'POST' }).then(() => setUnread(0))}
                    >
                      Marcar lidas
                    </button>
                  </div>
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`w-full text-left px-2 py-2 rounded-lg hover:bg-[var(--surface-2)] ${n.read ? 'opacity-60' : ''}`}
                      onClick={() => {
                        api(`/notifications/${n.id}/read`, { method: 'PATCH' });
                        if (n.link) {
                          const target = n.link === '/' ? homeForRole(user.role) : n.link;
                          navigate(target);
                        }
                        setShowNotifs(false);
                      }}
                    >
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-[var(--muted)]">{n.message}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="user-chip hidden sm:inline-flex">
              {user?.name} · {ROLE_LABEL[user?.role] || user?.role}
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
