import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { TYPE_LABEL } from '../lib/labels';
import { PageHeader, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function ShiftsPage() {
  const { can } = useAuth();
  const [data, setData] = useState({ items: [], summary: {} });
  const [shift, setShift] = useState('MANHA');

  async function load() {
    const d = await api(`/shifts?shift=${shift}`);
    setData(d);
  }

  useEffect(() => { load().catch(console.error); }, [shift]);

  return (
    <div>
      <PageHeader
        title="Disponibilidade por turno"
        subtitle="Painel diário da frota operacional"
        actions={
          <>
            {['MANHA', 'TARDE', 'NOITE'].map((s) => (
              <button key={s} className={`btn ${shift === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShift(s)}>
                {s === 'MANHA' ? 'Manhã' : s === 'TARDE' ? 'Tarde' : 'Noite'}
              </button>
            ))}
            {can('ADMIN', 'SUPERVISOR') && (
              <button className="btn btn-secondary" onClick={() => api('/shifts/sync-today', { method: 'POST' }).then(load)}>
                Sincronizar hoje
              </button>
            )}
          </>
        }
      />
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {Object.entries(data.summary[shift] || {}).map(([status, count]) => (
          <div key={status} className="card p-4 flex items-center justify-between">
            <StatusBadge status={status} />
            <span className="font-display text-2xl font-bold">{count}</span>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {data.items.map((item) => (
          <div key={item.id} className="card p-4">
            <div className="flex justify-between gap-2 mb-2">
              <div className="font-semibold text-lg">{item.vehicle.plate}</div>
              <StatusBadge status={item.status} />
            </div>
            <div className="text-sm text-[var(--muted)]">{item.vehicle.model}</div>
            <div className="text-sm">{TYPE_LABEL[item.vehicle.type]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
