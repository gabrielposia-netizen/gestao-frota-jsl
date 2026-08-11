import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/labels';
import { Field, Modal, PageHeader, StatusBadge } from '../components/ui';
import { formatUsage, suggestUsageMetric, usageLabel, usageUnit } from '../lib/usage';

export default function MovementsPage() {
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', driverId: '', type: 'SAIDA', odometerKm: '', purpose: '' });

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const metric = selectedVehicle?.usageMetric || suggestUsageMetric(selectedVehicle?.type, selectedVehicle?.fuelType);

  async function load() {
    const [mov, veh, drv] = await Promise.all([
      api('/movements?pageSize=50'),
      api('/vehicles?pageSize=100'),
      api('/drivers?pageSize=100'),
    ]);
    setItems(mov.items);
    setVehicles(veh.items);
    setDrivers(drv.items);
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function save(e) {
    e.preventDefault();
    await api('/movements', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        driverId: form.driverId || null,
        odometerKm: form.odometerKm ? Number(form.odometerKm) : null,
      }),
    });
    setOpen(false);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Entrada e saída"
        subtitle="Controle de utilização e histórico de quem usou cada veículo"
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Registrar</button>}
      />
      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr><th>Data</th><th>Tipo</th><th>Veículo</th><th>Motorista</th><th>Finalidade</th><th>Uso</th><th>Registrado por</th></tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td>{fmtDateTime(m.occurredAt)}</td>
                <td><StatusBadge status={m.type === 'SAIDA' ? 'EM_USO' : 'DISPONIVEL'} /></td>
                <td className="font-semibold">{m.vehicle.plate}</td>
                <td>{m.driver?.name || '—'}</td>
                <td>{m.purpose || '—'}</td>
                <td>
                  {m.odometerKm != null
                    ? formatUsage(m.odometerKm, m.vehicle?.usageMetric || suggestUsageMetric(m.vehicle?.type, m.vehicle?.fuelType))
                    : '—'}
                </td>
                <td>{m.user?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar movimentação">
        <form className="space-y-3" onSubmit={save}>
          <Field label="Tipo">
            <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="SAIDA">Saída</option>
              <option value="ENTRADA">Entrada</option>
            </select>
          </Field>
          <Field label="Veículo">
            <select
              className="select"
              required
              value={form.vehicleId}
              onChange={(e) => {
                const vehicleId = e.target.value;
                const v = vehicles.find((x) => x.id === vehicleId);
                setForm({
                  ...form,
                  vehicleId,
                  odometerKm: v?.odometerKm != null ? String(v.odometerKm) : '',
                });
              }}
            >
              <option value="">Selecione</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>)}
            </select>
          </Field>
          <Field label="Motorista">
            <select className="select" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
              <option value="">Opcional</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label={usageLabel(metric)}>
            <input className="input" type="number" step="0.1" value={form.odometerKm} onChange={(e) => setForm({ ...form, odometerKm: e.target.value })} />
            <div className="text-xs text-[var(--muted)] mt-1">Unidade: {usageUnit(metric)} · preenchido com o valor atual do veículo</div>
          </Field>
          <Field label="Finalidade"><input className="input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
