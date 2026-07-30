import { useEffect, useMemo, useState } from 'react';
import { Camera, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/labels';
import { Field, Modal, PageHeader } from '../components/ui';

export default function DamagesPage() {
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', description: '', severity: 'MEDIA' });
  const [files, setFiles] = useState([]);

  const previews = useMemo(
    () => [...files].map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files],
  );

  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  async function load() {
    const [list, veh] = await Promise.all([
      api('/damages?resolved=false&pageSize=50'),
      api('/vehicles?pageSize=100'),
    ]);
    setItems(list.items);
    setVehicles(veh.items);
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function save(e) {
    e.preventDefault();
    if (!files.length) {
      alert('Anexe ao menos uma foto da avaria.');
      return;
    }
    const fd = new FormData();
    fd.append('vehicleId', form.vehicleId);
    fd.append('description', form.description);
    fd.append('severity', form.severity);
    [...files].forEach((f) => fd.append('photos', f));
    await api('/damages', { method: 'POST', body: fd });
    setOpen(false);
    setFiles([]);
    setForm({ vehicleId: '', description: '', severity: 'MEDIA' });
    load();
  }

  async function resolve(id) {
    await api(`/damages/${id}`, { method: 'PATCH', body: JSON.stringify({ resolved: true }) });
    load();
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Avarias"
        subtitle="Registro com fotos anexadas e acompanhamento"
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Reportar</button>}
      />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
        {items.map((d) => (
          <div key={d.id} className="card card-interactive p-4 space-y-2">
            <div className="flex justify-between gap-2">
              <div className="font-semibold">{d.vehicle.plate}</div>
              <span className="badge bg-amber-500/15 text-amber-700">{d.severity}</span>
            </div>
            <p className="text-sm">{d.description}</p>
            <div className="text-xs text-[var(--muted)]">{fmtDateTime(d.reportedAt)} · {d.reportedBy?.name}</div>
            {Array.isArray(d.photoUrls) && d.photoUrls.length > 0 && (
              <div className="flex gap-2 overflow-auto">
                {d.photoUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="avaria" className="h-20 w-28 object-cover rounded-lg border border-[var(--border)] hover:scale-105 transition" />
                  </a>
                ))}
              </div>
            )}
            <button className="btn btn-secondary w-full" onClick={() => resolve(d.id)}>Marcar resolvida</button>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar avaria">
        <form className="space-y-3" onSubmit={save}>
          <Field label="Veículo">
            <select className="select" required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Selecione</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
            </select>
          </Field>
          <Field label="Descrição">
            <textarea className="textarea" required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Severidade">
            <select className="select" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
            </select>
          </Field>

          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Anexar fotos da avaria</div>
            <label className="flex items-center gap-3 w-full rounded-xl border border-dashed border-[var(--border)] px-3 py-3 cursor-pointer hover:border-[var(--jsl-red)] hover:bg-[var(--jsl-red-soft)] transition">
              <span className="inline-grid place-items-center w-10 h-10 rounded-full bg-[var(--jsl-red-soft)] shrink-0">
                <Camera size={18} className="text-[var(--jsl-red)]" />
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-sm font-semibold leading-tight">Selecionar fotos</span>
                <span className="block text-xs text-[var(--muted)] mt-0.5">JPG, PNG ou WEBP · até 5 arquivos</span>
              </span>
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
              />
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {previews.map((p) => (
                  <img key={p.url} src={p.url} alt={p.name} className="h-24 w-full object-cover rounded-lg border border-[var(--border)]" />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
