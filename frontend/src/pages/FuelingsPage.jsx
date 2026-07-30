import { useEffect, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDateTime, money } from '../lib/labels';
import { Field, Modal, PageHeader } from '../components/ui';

const CARDS = [
  'Visa Corporativo **** 4412',
  'Mastercard Frota **** 7781',
  'Elo Combustível **** 3309',
  'Cartão Shell Box',
  'Outro',
];

export default function FuelingsPage() {
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [form, setForm] = useState({
    vehicleId: '', driverId: '', liters: '', unitPrice: '', odometerKm: '', station: '', creditCard: '',
  });

  async function load() {
    const [list, veh, drv] = await Promise.all([
      api('/fuelings?pageSize=50'),
      api('/vehicles?pageSize=100'),
      api('/drivers?pageSize=100'),
    ]);
    setItems(list.items);
    setVehicles(veh.items);
    setDrivers(drv.items);
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
    if (receipt) fd.append('receipt', receipt);
    await api('/fuelings', { method: 'POST', body: fd });
    setOpen(false);
    setReceipt(null);
    setForm({ vehicleId: '', driverId: '', liters: '', unitPrice: '', odometerKm: '', station: '', creditCard: '' });
    load();
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Abastecimentos"
        subtitle="Controle de combustível, cartão e comprovantes"
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Registrar</button>}
      />
      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Data</th><th>Veículo</th><th>Litros</th><th>R$/L</th><th>Total</th>
              <th>Cartão</th><th>Comprovante</th><th>Motorista</th><th>Posto</th>
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id} className="row-interactive">
                <td>{fmtDateTime(f.fueledAt)}</td>
                <td className="font-semibold">{f.vehicle.plate}</td>
                <td>{f.liters}</td>
                <td>{money(f.unitPrice)}</td>
                <td>{money(f.totalCost)}</td>
                <td>{f.creditCard || '—'}</td>
                <td>
                  {f.receiptUrl ? (
                    <a className="btn btn-secondary px-2 py-1" href={f.receiptUrl} target="_blank" rel="noreferrer">
                      <FileText size={14} /> Ver
                    </a>
                  ) : '—'}
                </td>
                <td>{f.driver?.name || '—'}</td>
                <td>{f.station || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar abastecimento">
        <form className="space-y-3" onSubmit={save}>
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Litros"><input className="input" type="number" step="0.01" required value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} /></Field>
            <Field label="Preço/L"><input className="input" type="number" step="0.01" required value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></Field>
          </div>
          <Field label="Odômetro"><input className="input" type="number" value={form.odometerKm} onChange={(e) => setForm({ ...form, odometerKm: e.target.value })} /></Field>
          <Field label="Posto"><input className="input" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} /></Field>
          <Field label="Cartão de crédito utilizado">
            <select className="select" required value={form.creditCard} onChange={(e) => setForm({ ...form, creditCard: e.target.value })}>
              <option value="">Selecione o cartão</option>
              {CARDS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Anexo do comprovante (PDF ou imagem)">
            <input className="input" type="file" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
            {receipt && <div className="text-xs text-[var(--muted)] mt-1">Arquivo: {receipt.name}</div>}
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
