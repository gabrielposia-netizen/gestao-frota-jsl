import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDate } from '../lib/labels';
import { Field, Modal, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const empty = { name: '', cpf: '', cnh: '', cnhCategory: 'B', cnhExpiry: '', phone: '', sector: '' };

export default function DriversPage() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  async function load() {
    const data = await api(`/drivers?q=${encodeURIComponent(q)}&pageSize=50`);
    setItems(data.items);
  }

  useEffect(() => { load().catch(console.error); }, [q]);

  async function save(e) {
    e.preventDefault();
    await api('/drivers', { method: 'POST', body: JSON.stringify(form) });
    setOpen(false);
    setForm(empty);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Motoristas"
        subtitle="Cadastro e validade de CNH"
        actions={can('ADMIN', 'SUPERVISOR') && (
          <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Novo motorista</button>
        )}
      />
      <div className="card p-3 mb-4">
        <input className="input max-w-md" placeholder="Buscar nome, CPF ou setor..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr><th>Nome</th><th>CPF</th><th>CNH</th><th>Cat.</th><th>Validade</th><th>Setor</th><th>Status</th></tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id}>
                <td className="font-semibold">{d.name}</td>
                <td>{d.cpf}</td>
                <td>{d.cnh}</td>
                <td>{d.cnhCategory}</td>
                <td>{fmtDate(d.cnhExpiry)}</td>
                <td>{d.sector || '—'}</td>
                <td>{d.active ? 'Ativo' : 'Inativo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar motorista">
        <form className="space-y-3" onSubmit={save}>
          {[['name', 'Nome'], ['cpf', 'CPF'], ['cnh', 'CNH'], ['cnhCategory', 'Categoria CNH'], ['cnhExpiry', 'Validade CNH'], ['phone', 'Telefone'], ['sector', 'Setor']].map(([k, label]) => (
            <Field key={k} label={label}>
              <input className="input" type={k === 'cnhExpiry' ? 'date' : 'text'} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={['name', 'cpf', 'cnh', 'cnhCategory', 'cnhExpiry'].includes(k)} />
            </Field>
          ))}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
