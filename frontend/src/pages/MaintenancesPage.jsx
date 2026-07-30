import { useEffect, useState } from 'react';
import { Check, FileText, Plus, X } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDate, money } from '../lib/labels';
import { Field, Modal, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function MaintenancesPage() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [agenda, setAgenda] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [form, setForm] = useState({
    vehicleId: '', type: 'PREVENTIVA', title: '', description: '', cost: '', scheduledAt: '', workshop: '',
  });

  async function load() {
    const [list, veh] = await Promise.all([
      api(`/maintenances?pageSize=50${agenda ? '&agenda=true' : ''}`),
      api('/vehicles?pageSize=100'),
    ]);
    setItems(list.items);
    setVehicles(veh.items);
  }

  useEffect(() => { load().catch(console.error); }, [agenda]);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
    if (invoice) fd.append('invoice', invoice);
    await api('/maintenances', { method: 'POST', body: fd });
    setOpen(false);
    setInvoice(null);
    setForm({ vehicleId: '', type: 'PREVENTIVA', title: '', description: '', cost: '', scheduledAt: '', workshop: '' });
    load();
  }

  async function approve(id, approved) {
    await api(`/maintenances/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved, note: approved ? 'Aprovado pela liderança' : 'Rejeitado' }),
    });
    load();
  }

  async function advance(id, status) {
    const fd = new FormData();
    fd.append('status', status);
    await api(`/maintenances/${id}`, { method: 'PATCH', body: fd });
    load();
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Manutenções"
        subtitle="Preventiva, corretiva, agenda, NF e aprovação da liderança"
        actions={
          <>
            <button className={`btn ${agenda ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAgenda(true)}>Agenda</button>
            <button className={`btn ${!agenda ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAgenda(false)}>Todas</button>
            <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Nova</button>
          </>
        }
      />
      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Agendada</th><th>Veículo</th><th>Título</th><th>Tipo</th><th>Status</th>
              <th>Custo</th><th>NF</th><th>Parada</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="row-interactive">
                <td>{fmtDate(m.scheduledAt)}</td>
                <td className="font-semibold">{m.vehicle.plate}</td>
                <td>{m.title}</td>
                <td>{m.type}</td>
                <td>{m.status}</td>
                <td>{money(m.cost)}</td>
                <td>
                  {m.invoiceUrl ? (
                    <a className="btn btn-secondary px-2 py-1" href={m.invoiceUrl} target="_blank" rel="noreferrer">
                      <FileText size={14} /> NF
                    </a>
                  ) : '—'}
                </td>
                <td>{m.downtimeHours != null ? `${m.downtimeHours}h` : '—'}</td>
                <td>
                  <div className="flex gap-1">
                    {m.status === 'AGUARDANDO_APROVACAO' && can('ADMIN', 'SUPERVISOR') && (
                      <>
                        <button className="btn btn-primary px-2 py-1" onClick={() => approve(m.id, true)}><Check size={14} /></button>
                        <button className="btn btn-danger px-2 py-1" onClick={() => approve(m.id, false)}><X size={14} /></button>
                      </>
                    )}
                    {['AGENDADA', 'APROVADA'].includes(m.status) && (
                      <button className="btn btn-secondary px-2 py-1" onClick={() => advance(m.id, 'EM_ANDAMENTO')}>Iniciar</button>
                    )}
                    {m.status === 'EM_ANDAMENTO' && (
                      <button className="btn btn-secondary px-2 py-1" onClick={() => advance(m.id, 'CONCLUIDA')}>Concluir</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova manutenção">
        <form className="space-y-3" onSubmit={save}>
          <Field label="Veículo">
            <select className="select" required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Selecione</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
            </select>
          </Field>
          <Field label="Tipo">
            <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="PREVENTIVA">Preventiva</option>
              <option value="CORRETIVA">Corretiva</option>
            </select>
          </Field>
          <Field label="Título"><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Descrição"><textarea className="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Custo"><input className="input" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
            <Field label="Data"><input className="input" type="date" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></Field>
          </div>
          <Field label="Oficina"><input className="input" value={form.workshop} onChange={(e) => setForm({ ...form, workshop: e.target.value })} /></Field>
          <Field label="Anexo da nota fiscal (PDF ou imagem)">
            <input className="input" type="file" accept="image/*,.pdf" onChange={(e) => setInvoice(e.target.files?.[0] || null)} />
            {invoice && <div className="text-xs text-[var(--muted)] mt-1">Arquivo: {invoice.name}</div>}
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
