import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, QrCode } from 'lucide-react';
import { api } from '../lib/api';
import { TYPE_LABEL } from '../lib/labels';
import { Field, Modal, PageHeader, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const empty = {
  plate: '', model: '', manufacturer: '', year: new Date().getFullYear(),
  renavam: '', chassis: '', sector: '', type: 'CAMINHAO', status: 'DISPONIVEL',
  odometerKm: 0, fuelType: 'Diesel', locationLabel: '', currentLat: '', currentLng: '',
};

export default function VehiclesPage() {
  const { can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    params.set('pageSize', '50');
    const data = await api(`/vehicles?${params}`);
    setItems(data.items);
  }

  useEffect(() => {
    const fromUrl = searchParams.get('status') || '';
    setStatus(fromUrl);
  }, [searchParams]);

  useEffect(() => { load().catch(console.error); }, [q, type, status]);

  function changeStatus(value) {
    setStatus(value);
    if (value) setSearchParams({ status: value });
    else setSearchParams({});
  }

  async function save(e) {
    e.preventDefault();
    await api('/vehicles', { method: 'POST', body: JSON.stringify(form) });
    setOpen(false);
    setForm(empty);
    load();
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Veículos"
        subtitle="Caminhões, utilitários, empilhadeiras, rebocadores e apoio"
        actions={
          can('ADMIN', 'SUPERVISOR') && (
            <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Novo veículo</button>
          )
        }
      />

      {status && (
        <div className="mb-3 rounded-xl px-3 py-2 bg-[var(--jsl-red-soft)] text-[var(--jsl-red)] text-sm font-semibold animate-scale-in">
          Filtro ativo: {status} · <button className="underline" onClick={() => changeStatus('')}>limpar</button>
        </div>
      )}

      <div className="card p-3 mb-4 grid md:grid-cols-4 gap-2">
        <input className="input" placeholder="Buscar placa/modelo..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="select" value={status} onChange={(e) => changeStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="DISPONIVEL">Disponível</option>
          <option value="EM_USO">Em uso</option>
          <option value="MANUTENCAO">Manutenção</option>
          <option value="PARADO">Parado</option>
        </select>
        <div className="text-sm text-[var(--muted)] flex items-center px-2">{items.length} veículo(s)</div>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Tipo</th>
              <th>Setor</th>
              <th>Status</th>
              <th>Local</th>
              <th>Km</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="row-interactive">
                <td className="font-semibold">{v.plate}</td>
                <td>{v.manufacturer} {v.model}</td>
                <td>{TYPE_LABEL[v.type]}</td>
                <td>{v.sector || '—'}</td>
                <td><StatusBadge status={v.status} /></td>
                <td>{v.locationLabel || '—'}</td>
                <td>{Number(v.odometerKm).toLocaleString('pt-BR')}</td>
                <td>
                  <Link className="btn btn-secondary px-2 py-1" to={`/veiculos/${v.id}`}>
                    <QrCode size={14} /> Detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar veículo" wide>
        <form className="grid sm:grid-cols-2 gap-3" onSubmit={save}>
          {[
            ['plate', 'Placa'], ['model', 'Modelo'], ['manufacturer', 'Fabricante'], ['year', 'Ano'],
            ['renavam', 'RENAVAM'], ['chassis', 'Chassi'], ['sector', 'Setor'], ['fuelType', 'Combustível'],
            ['odometerKm', 'Odômetro (km)'], ['locationLabel', 'Localização'], ['currentLat', 'Latitude'], ['currentLng', 'Longitude'],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input className="input" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={['plate', 'model', 'manufacturer', 'year'].includes(key)} />
            </Field>
          ))}
          <Field label="Tipo">
            <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DISPONIVEL">Disponível</option>
              <option value="EM_USO">Em uso</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="PARADO">Parado</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </Field>
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
