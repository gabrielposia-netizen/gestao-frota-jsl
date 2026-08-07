import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { ROLE_LABEL } from '../lib/labels';
import { Field, Modal, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', matricula: '', password: '', role: 'OPERADOR' });
  const allowed = can('ADMIN', 'SUPERVISOR');

  useEffect(() => {
    if (!allowed) return;
    api('/users?pageSize=50').then((data) => setItems(data.items)).catch(console.error);
  }, [allowed]);

  if (!allowed) return <Navigate to="/" replace />;

  async function save(e) {
    e.preventDefault();
    await api('/users', { method: 'POST', body: JSON.stringify(form) });
    setOpen(false);
    setForm({ name: '', email: '', matricula: '', password: '', role: 'OPERADOR' });
    const data = await api('/users?pageSize=50');
    setItems(data.items);
  }

  return (
    <div>
      <PageHeader
        title="Usuários e acessos"
        subtitle="Administrador, Supervisor e Operador"
        actions={can('ADMIN') && <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Novo usuário</button>}
      />
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Matrícula</th><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td className="font-semibold">{u.matricula}</td>
                <td className="font-semibold">{u.name}</td>
                <td>{u.email}</td>
                <td>{ROLE_LABEL[u.role]}</td>
                <td>{u.active ? 'Ativo' : 'Inativo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo usuário">
        <form className="space-y-3" onSubmit={save}>
          <Field label="Nome"><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Matrícula"><input className="input" required value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} /></Field>
          <Field label="E-mail"><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Senha"><input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Perfil">
            <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ADMIN">Administrador</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="OPERADOR">Operador</option>
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
