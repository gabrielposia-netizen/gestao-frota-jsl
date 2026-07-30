import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell, CalendarClock, ClipboardCheck, Droplets, FileBarChart, Fuel, LayoutDashboard,
  LogOut, Map, Menu, Moon, Search, Settings, Shield, Sun, Truck, Tv, Users, Wrench, X, AlertTriangle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { ROLE_LABEL } from '../lib/labels';
import JslLogo from './JslLogo';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/veiculos', label: 'Veículos', icon: Truck },
  { to: '/motoristas', label: 'Motoristas', icon: Users },
  { to: '/movimentacoes', label: 'Entrada/Saída', icon: ClipboardCheck },
  { to: '/checklists', label: 'Checklists', icon: ClipboardCheck },
  { to: '/abastecimentos', label: 'Abastecimento', icon: Fuel },
  { to: '/manutencoes', label: 'Manutenções', icon: Wrench },
  { to: '/pneus', label: 'Pneus', icon: Droplets },
  { to: '/avarias', label: 'Avarias', icon: AlertTriangle },
  { to: '/mapa', label: 'Mapa', icon: Map },
  { to: '/turnos', label: 'Turnos', icon: CalendarClock },
  { to: '/relatorios', label: 'Relatórios', icon: FileBarChart },
  { to: '/usuarios', label: 'Usuários', icon: Shield, roles: ['ADMIN'] },
  { to: '/tv', label: 'Painel TV', icon: Tv },
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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="jsl-header">
        <div className="h-10 px-4 md:px-6 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-white/85 border-b border-white/15">
          <span>Gestão de Frota · Operação interna</span>
          <span className="hidden sm:inline">{ROLE_LABEL[user?.role]}</span>
        </div>
        <div className="h-16 px-4 md:px-6 flex items-center gap-3">
          <button className="lg:hidden btn btn-ghost p-2" onClick={() => setOpen(true)}><Menu size={18} /></button>
          <JslLogo compact className="min-w-0 brightness-110" />
          <div className="relative flex-1 max-w-xl ml-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input
              className="input pl-9 !bg-white/15 !border-white/25 !text-white placeholder:text-white/60"
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
          <div className="relative">
            <button className="btn btn-ghost p-2 relative" onClick={openNotifications}>
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-white text-[var(--jsl-red)] rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-bold">
                  {unread}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto card shadow-xl p-2 z-50 text-[var(--text)]">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="font-semibold text-sm">Notificações</span>
                  <button
                    className="text-xs text-[var(--jsl-red)] font-bold uppercase"
                    onClick={() => api('/notifications/mark-all-read', { method: 'POST' }).then(() => setUnread(0))}
                  >
                    Marcar lidas
                  </button>
                </div>
                {notifs.map((n) => (
                  <button
                    key={n.id}
                    className={`w-full text-left px-2 py-2 rounded-lg hover:bg-[var(--surface-2)] ${n.read ? 'opacity-60' : ''}`}
                    onClick={() => {
                      api(`/notifications/${n.id}/read`, { method: 'PATCH' });
                      if (n.link) navigate(n.link);
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
          <button className="btn btn-ghost p-2" onClick={toggle} title="Modo escuro">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="btn btn-ghost p-2 hidden sm:inline-flex" onClick={() => navigate('/usuarios')} title="Configurações">
            <Settings size={17} />
          </button>
          <button
            className="btn btn-ghost hidden md:inline-flex"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[var(--surface)] border-r border-[var(--border)] lg:static lg:translate-x-0 transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="lg:hidden flex items-center justify-between gap-2 bg-[var(--jsl-red)] px-3 py-3">
            <JslLogo banner className="flex-1 min-w-0" />
            <button className="btn btn-ghost p-2 shrink-0" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X size={16} />
            </button>
          </div>
          <div className="hidden lg:flex items-center bg-[var(--jsl-red)] px-3 py-3">
            <JslLogo banner />
          </div>
          <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-5.5rem)] pb-24 lg:pb-3">
            {visibleLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition ${
                    isActive
                      ? 'nav-active'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="absolute bottom-0 inset-x-0 p-3 border-t border-[var(--border)] bg-[var(--surface)] lg:hidden">
            <div className="text-sm font-semibold truncate">{user?.name}</div>
            <button
              className="btn btn-secondary w-full mt-2"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </aside>

        {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

        <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
