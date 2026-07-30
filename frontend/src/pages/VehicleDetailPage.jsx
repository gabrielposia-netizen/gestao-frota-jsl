import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { TYPE_LABEL, daysUntil, fmtDate, fmtDateTime, money } from '../lib/labels';
import { PageHeader, StatusBadge } from '../components/ui';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [history, setHistory] = useState(null);
  const [qr, setQr] = useState(null);
  const [tab, setTab] = useState('resumo');

  useEffect(() => {
    Promise.all([
      api(`/vehicles/${id}`),
      api(`/vehicles/${id}/history`),
      api(`/vehicles/${id}/qrcode`),
    ]).then(([v, h, q]) => {
      setVehicle(v);
      setHistory(h);
      setQr(q);
    });
  }, [id]);

  if (!vehicle) return <div className="text-[var(--muted)]">Carregando veículo...</div>;

  const tabs = [
    ['resumo', 'Resumo'],
    ['historico', 'Histórico de uso'],
    ['docs', 'Documentos'],
    ['manut', 'Manutenções'],
    ['qr', 'QR Code'],
  ];

  return (
    <div>
      <PageHeader
        title={`${vehicle.plate} — ${vehicle.model}`}
        subtitle={`${vehicle.manufacturer} · ${TYPE_LABEL[vehicle.type]} · ${vehicle.year}`}
        actions={<Link className="btn btn-secondary" to="/veiculos">Voltar</Link>}
      />

      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="card p-4"><div className="text-sm text-[var(--muted)]">Status</div><div className="mt-1"><StatusBadge status={vehicle.status} /></div></div>
        <div className="card p-4"><div className="text-sm text-[var(--muted)]">Odômetro</div><div className="font-bold text-xl mt-1">{Number(vehicle.odometerKm).toLocaleString('pt-BR')} km</div></div>
        <div className="card p-4"><div className="text-sm text-[var(--muted)]">Setor</div><div className="font-bold text-xl mt-1">{vehicle.sector || '—'}</div></div>
        <div className="card p-4"><div className="text-sm text-[var(--muted)]">Local</div><div className="font-bold text-lg mt-1">{vehicle.locationLabel || '—'}</div></div>
      </div>

      <div className="flex gap-2 mb-4 overflow-auto">
        {tabs.map(([k, label]) => (
          <button key={k} className={`btn ${tab === k ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'resumo' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-4 space-y-2 text-sm">
            <h3 className="font-display font-bold text-lg mb-2">Dados cadastrais</h3>
            <div><span className="text-[var(--muted)]">RENAVAM:</span> {vehicle.renavam || '—'}</div>
            <div><span className="text-[var(--muted)]">Chassi:</span> {vehicle.chassis || '—'}</div>
            <div><span className="text-[var(--muted)]">Combustível:</span> {vehicle.fuelType || '—'}</div>
            <div><span className="text-[var(--muted)]">Coords:</span> {vehicle.currentLat && vehicle.currentLng ? `${vehicle.currentLat}, ${vehicle.currentLng}` : '—'}</div>
          </div>
          <div className="card p-4">
            <h3 className="font-display font-bold text-lg mb-2">Avarias abertas</h3>
            {(vehicle.damages || []).filter((d) => !d.resolved).map((d) => (
              <div key={d.id} className="py-2 border-b border-[var(--border)] text-sm">
                <div className="font-medium">{d.description}</div>
                <div className="text-[var(--muted)]">{d.severity} · {fmtDate(d.reportedAt)}</div>
              </div>
            ))}
            {(vehicle.damages || []).filter((d) => !d.resolved).length === 0 && (
              <div className="text-[var(--muted)] text-sm">Nenhuma avaria aberta.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'historico' && history && (
        <div className="card table-wrap">
          <table className="data">
            <thead><tr><th>Data</th><th>Tipo</th><th>Motorista</th><th>Usuário</th><th>Finalidade</th><th>Km</th></tr></thead>
            <tbody>
              {history.movements.map((m) => (
                <tr key={m.id}>
                  <td>{fmtDateTime(m.occurredAt)}</td>
                  <td>{m.type}</td>
                  <td>{m.driver?.name || '—'}</td>
                  <td>{m.user?.name}</td>
                  <td>{m.purpose || '—'}</td>
                  <td>{m.odometerKm ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'docs' && (
        <div className="card table-wrap">
          <table className="data">
            <thead><tr><th>Tipo</th><th>Número</th><th>Vencimento</th><th>Dias</th></tr></thead>
            <tbody>
              {vehicle.documents.map((d) => {
                const days = daysUntil(d.expiryDate);
                return (
                  <tr key={d.id}>
                    <td>{d.type}</td>
                    <td>{d.number || '—'}</td>
                    <td>{fmtDate(d.expiryDate)}</td>
                    <td className={days < 15 ? 'text-rose-600 font-semibold' : ''}>{days}d</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'manut' && (
        <div className="card table-wrap">
          <table className="data">
            <thead><tr><th>Título</th><th>Tipo</th><th>Status</th><th>Custo</th><th>Parada (h)</th></tr></thead>
            <tbody>
              {vehicle.maintenances.map((m) => (
                <tr key={m.id}>
                  <td>{m.title}</td>
                  <td>{m.type}</td>
                  <td>{m.status}</td>
                  <td>{money(m.cost)}</td>
                  <td>{m.downtimeHours ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'qr' && qr && (
        <div className="card p-6 flex flex-col items-center gap-3">
          <img src={qr.dataUrl} alt={`QR ${vehicle.plate}`} className="w-56 h-56 rounded-xl border border-[var(--border)] bg-white p-2" />
          <div className="text-sm text-[var(--muted)] text-center max-w-md">
            Cole este QR Code no veículo para abrir rapidamente o histórico: <br />
            <code className="text-xs">{qr.payload}</code>
          </div>
        </div>
      )}
    </div>
  );
}
