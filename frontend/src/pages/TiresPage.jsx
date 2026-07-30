import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { Field, Modal, PageHeader } from '../components/ui';

export default function TiresPage() {
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', position: 'DE', brand: '', treadDepth: '', pressurePsi: '', status: 'OK' });

  async function load() {
    const [tires, veh] = await Promise.all([api('/tires'), api('/vehicles?pageSize=100')]);
    setItems(tires);
    setVehicles(veh.items);
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function save(e) {
    e.preventDefault();
    await api('/tires', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        treadDepth: form.treadDepth ? Number(form.treadDepth) : null,
        pressurePsi: form.pressurePsi ? Number(form.pressurePsi) : null,
      }),
    });
    setOpen(false);
    load();
  }

  return (
    <div>
      <PageHeader title="Controle de pneus" subtitle="Posição, sulco, pressão e status" actions={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Adicionar</button>} />
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Veículo</th><th>Posição</th><th>Marca</th><th>Sulco (mm)</th><th>PSI</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td className="font-semibold">{t.vehicle.plate}</td>
                <td>{t.position}</td>
                <td>{t.brand || '—'}</td>
                <td>{t.treadDepth ?? '—'}</td>
                <td>{t.pressurePsi ?? '—'}</td>
                <td>{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar pneu">
        <form className="space-y-3" onSubmit={save}>
          <Field label="Veículo">
            <select className="select" required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Selecione</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
            </select>
          </Field>
          <Field label="Posição">
            <select className="select" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
              {['DE', 'DD', 'TE', 'TD', 'EE', 'ED', 'STEPE'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Marca"><input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sulco mm"><input className="input" type="number" step="0.1" value={form.treadDepth} onChange={(e) => setForm({ ...form, treadDepth: e.target.value })} /></Field>
            <Field label="PSI"><input className="input" type="number" value={form.pressurePsi} onChange={(e) => setForm({ ...form, pressurePsi: e.target.value })} /></Field>
          </div>
          <Field label="Status">
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="OK">OK</option>
              <option value="ATENCAO">Atenção</option>
              <option value="TROCAR">Trocar</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
