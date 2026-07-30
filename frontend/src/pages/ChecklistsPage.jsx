import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/labels';
import { Field, Modal, PageHeader } from '../components/ui';

export default function ChecklistsPage() {
  const [items, setItems] = useState([]);
  const [template, setTemplate] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', driverId: '', type: 'PRE_USO', shift: '', notes: '', odometerKm: '' });
  const [checks, setChecks] = useState([]);

  async function load() {
    const [list, tpl, veh, drv] = await Promise.all([
      api('/checklists?pageSize=50'),
      api('/checklists/template'),
      api('/vehicles?pageSize=100'),
      api('/drivers?pageSize=100'),
    ]);
    setItems(list.items);
    setTemplate(tpl);
    setChecks(tpl.map((i) => ({ ...i })));
    setVehicles(veh.items);
    setDrivers(drv.items);
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function save(e) {
    e.preventDefault();
    await api('/checklists', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        shift: form.shift || null,
        driverId: form.driverId || null,
        odometerKm: form.odometerKm ? Number(form.odometerKm) : null,
        items: checks,
      }),
    });
    setOpen(false);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Checklists digitais"
        subtitle="Pré/pós uso e início/fim de turno"
        actions={<button className="btn btn-primary" onClick={() => { setChecks(template.map((i) => ({ ...i }))); setOpen(true); }}><Plus size={16} /> Novo checklist</button>}
      />
      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr><th>Data</th><th>Tipo</th><th>Turno</th><th>Veículo</th><th>Motorista</th><th>OK?</th><th>Obs.</th></tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>{fmtDateTime(c.createdAt)}</td>
                <td>{c.type}</td>
                <td>{c.shift || '—'}</td>
                <td className="font-semibold">{c.vehicle.plate}</td>
                <td>{c.driver?.name || '—'}</td>
                <td>{c.approved ? 'Sim' : 'Não'}</td>
                <td>{c.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Checklist digital" wide>
        <form className="space-y-3" onSubmit={save}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Tipo">
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="PRE_USO">Pré-uso</option>
                <option value="POS_USO">Pós-uso</option>
                <option value="INICIO_TURNO">Início de turno</option>
                <option value="FIM_TURNO">Fim de turno</option>
              </select>
            </Field>
            <Field label="Turno">
              <select className="select" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                <option value="">—</option>
                <option value="MANHA">Manhã</option>
                <option value="TARDE">Tarde</option>
                <option value="NOITE">Noite</option>
              </select>
            </Field>
            <Field label="Veículo">
              <select className="select" required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Selecione</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
              </select>
            </Field>
            <Field label="Motorista">
              <select className="select" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                <option value="">Opcional</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {checks.map((item, idx) => (
              <label key={item.key} className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border)]">
                <input
                  type="checkbox"
                  checked={item.ok}
                  onChange={(e) => {
                    const next = [...checks];
                    next[idx] = { ...item, ok: e.target.checked };
                    setChecks(next);
                  }}
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>
          <Field label="Observações"><textarea className="textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Salvar checklist</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
