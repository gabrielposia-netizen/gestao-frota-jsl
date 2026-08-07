import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock3, Fuel, Gauge, Truck, Wrench, CircleDollarSign, Activity, ExternalLink,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { api } from '../lib/api';
import { TYPE_LABEL, daysUntil, fmtDate, fmtDateTime, money } from '../lib/labels';
import { KpiCard, PageHeader, StatusBadge } from '../components/ui';

const STATUS_FILTERS = {
  DISPONIVEL: { label: 'Disponíveis', status: 'DISPONIVEL' },
  MANUTENCAO: { label: 'Em manutenção', status: 'MANUTENCAO' },
  PARADO: { label: 'Parados', status: 'PARADO' },
  EM_USO: { label: 'Em uso', status: 'EM_USO' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    api('/dashboard').then(setData).catch(console.error);
    api('/vehicles?pageSize=100').then((d) => setVehicles(d.items)).catch(console.error);
  }, []);

  const filteredVehicles = useMemo(() => {
    if (!statusFilter) return [];
    return vehicles.filter((v) => v.status === statusFilter);
  }, [vehicles, statusFilter]);

  function toggleFilter(status) {
    setStatusFilter((current) => (current === status ? null : status));
  }

  if (!data) return <div className="text-[var(--muted)] animate-pulse">Carregando indicadores...</div>;
  const { kpis, vencimentos, recentMovements, monthly, shiftsToday } = data;

  const shiftSummary = shiftsToday.reduce((acc, s) => {
    acc[s.shift] = acc[s.shift] || { DISPONIVEL: 0, total: 0 };
    acc[s.shift].total += 1;
    if (s.status === 'DISPONIVEL') acc[s.shift].DISPONIVEL += 1;
    return acc;
  }, {});

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Dashboard operacional"
        subtitle="Clique nos indicadores de status para ver os veículos filtrados"
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5 stagger-children">
        <KpiCard
          label="Disponíveis"
          value={kpis.disponiveis}
          icon={Truck}
          tone="brand"
          hint={`${kpis.emUso} em uso`}
          active={statusFilter === 'DISPONIVEL'}
          onClick={() => toggleFilter('DISPONIVEL')}
        />
        <KpiCard
          label="Em manutenção"
          value={kpis.manutencao}
          icon={Wrench}
          tone="warn"
          active={statusFilter === 'MANUTENCAO'}
          onClick={() => toggleFilter('MANUTENCAO')}
        />
        <KpiCard
          label="Parados"
          value={kpis.parados}
          icon={AlertTriangle}
          tone="danger"
          active={statusFilter === 'PARADO'}
          onClick={() => toggleFilter('PARADO')}
        />
        <KpiCard label="Custo da frota (mês)" value={money(kpis.custoFrotaMes)} icon={CircleDollarSign} tone="info" />
        <KpiCard
          label="Em uso"
          value={kpis.emUso}
          icon={Activity}
          tone="brand"
          active={statusFilter === 'EM_USO'}
          onClick={() => toggleFilter('EM_USO')}
        />
        <KpiCard label="Consumo médio" value={`${kpis.consumoMedioLitros} L`} icon={Fuel} hint="Abastecimentos do mês" />
        <KpiCard label="Quilometragem total" value={`${Number(kpis.kmTotal).toLocaleString('pt-BR')} km`} icon={Gauge} />
        <KpiCard label="Tempo parado (manutenção)" value={`${kpis.tempoParadoHoras} h`} icon={Clock3} hint={`Média ${kpis.tempoParadoMedio} h`} />
      </div>

      {statusFilter && (
        <div className="card p-4 mb-5 border-[var(--jsl-red)]/30 animate-scale-in">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="font-display font-extrabold uppercase text-lg">
                Veículos · {STATUS_FILTERS[statusFilter].label}
              </h2>
              <p className="text-sm text-[var(--muted)]">{filteredVehicles.length} registro(s) encontrados</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => setStatusFilter(null)}>Limpar filtro</button>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/veiculos?status=${statusFilter}`)}
              >
                Ver lista completa <ExternalLink size={14} />
              </button>
            </div>
          </div>
          {filteredVehicles.length === 0 ? (
            <div className="text-[var(--muted)] text-sm py-6 text-center">Nenhum veículo neste status.</div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Modelo</th>
                    <th>Tipo</th>
                    <th>Setor</th>
                    <th>Local</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((v) => (
                    <tr key={v.id} className="row-interactive">
                      <td className="font-semibold">{v.plate}</td>
                      <td>{v.manufacturer} {v.model}</td>
                      <td>{TYPE_LABEL[v.type]}</td>
                      <td>{v.sector || '—'}</td>
                      <td>{v.locationLabel || '—'}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td>
                        <Link className="btn btn-secondary px-2 py-1" to={`/veiculos/${v.id}`}>Abrir</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="card card-interactive p-4 lg:col-span-2">
          <h2 className="font-display font-bold text-lg mb-3 uppercase tracking-tight">Indicadores mensais</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="gFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec1f28" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ec1f28" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} />
                <YAxis stroke="var(--muted)" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="fuelCost" name="Combustível R$" stroke="#ec1f28" fill="url(#gFuel)" />
                <Area type="monotone" dataKey="maintCost" name="Manutenção R$" stroke="#1a1a1a" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-interactive p-4">
          <h2 className="font-display font-bold text-lg mb-3 uppercase tracking-tight">Disponibilidade por turno</h2>
          <div className="space-y-3">
            {['MANHA', 'TARDE', 'NOITE'].map((shift) => {
              const s = shiftSummary[shift] || { DISPONIVEL: 0, total: 0 };
              const pct = s.total ? Math.round((s.DISPONIVEL / s.total) * 100) : 0;
              return (
                <div key={shift}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{shift === 'MANHA' ? 'Manhã' : shift === 'TARDE' ? 'Tarde' : 'Noite'}</span>
                    <span className="text-[var(--muted)]">{s.DISPONIVEL}/{s.total} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div className="h-full bg-[var(--jsl-red)] progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/turnos" className="btn btn-secondary w-full mt-4">Ver painel de turnos</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <div className="card card-interactive p-4">
          <h2 className="font-display font-bold text-lg mb-3 uppercase tracking-tight">Saídas por mês</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} />
                <YAxis stroke="var(--muted)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="exits" name="Saídas" fill="#ec1f28" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-interactive p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg uppercase tracking-tight">Vencimentos próximos</h2>
            <Link to="/relatorios" className="text-sm text-[var(--jsl-red)] font-bold uppercase tracking-wide">Relatórios</Link>
          </div>
          <div className="space-y-2">
            {vencimentos.length === 0 && <div className="text-[var(--muted)] text-sm">Nenhum vencimento em 30 dias.</div>}
            {vencimentos.map((d) => {
              const days = daysUntil(d.expiryDate);
              return (
                <Link key={d.id} to={`/veiculos/${d.vehicle.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition hover:translate-x-1">
                  <div>
                    <div className="font-semibold text-sm">{d.vehicle.plate} · {d.type}</div>
                    <div className="text-xs text-[var(--muted)]">{fmtDate(d.expiryDate)}</div>
                  </div>
                  <span className={`badge ${days < 0 ? 'bg-rose-500/15 text-rose-700' : 'bg-amber-500/15 text-amber-700'}`}>
                    {days < 0 ? `Vencido ${Math.abs(days)}d` : `${days}d`}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card card-interactive p-4">
        <h2 className="font-display font-bold text-lg mb-3 uppercase tracking-tight">Movimentações recentes</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Veículo</th>
                <th>Motorista</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.map((m) => (
                <tr key={m.id} className="row-interactive">
                  <td>{fmtDateTime(m.occurredAt)}</td>
                  <td><StatusBadge status={m.type === 'SAIDA' ? 'EM_USO' : 'DISPONIVEL'} /></td>
                  <td className="font-semibold">{m.vehicle.plate}</td>
                  <td>{m.driver?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
