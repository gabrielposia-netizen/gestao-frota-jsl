import { useEffect, useMemo, useState } from 'react';
import { Battery, Package, Plus, TriangleAlert } from 'lucide-react';
import { api } from '../lib/api';
import { Field, Modal, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function TiresPage() {
  const { can } = useAuth();
  const [tab, setTab] = useState('estoque');
  const [tires, setTires] = useState([]);
  const [stock, setStock] = useState({ items: [], lowStock: [] });
  const [vehicles, setVehicles] = useState([]);
  const [openTire, setOpenTire] = useState(false);
  const [openStock, setOpenStock] = useState(false);
  const [openMove, setOpenMove] = useState(null);
  const [tireForm, setTireForm] = useState({ vehicleId: '', position: 'DE', brand: '', treadDepth: '', pressurePsi: '', status: 'OK' });
  const [stockForm, setStockForm] = useState({ type: 'PNEU', brand: '', model: '', spec: '', quantity: 0, minQuantity: 2, location: '', unitCost: '' });
  const [moveForm, setMoveForm] = useState({ type: 'ENTRADA', quantity: 1, vehicleId: '', notes: '' });

  async function load() {
    const [t, s, v] = await Promise.all([
      api('/tires'),
      api('/stock'),
      api('/vehicles?pageSize=100'),
    ]);
    setTires(t);
    setStock(s);
    setVehicles(v.items);
  }

  useEffect(() => { load().catch(console.error); }, []);

  const pneusEstoque = useMemo(() => stock.items.filter((i) => i.type === 'PNEU'), [stock.items]);
  const bateriasEstoque = useMemo(() => stock.items.filter((i) => i.type === 'BATERIA'), [stock.items]);

  async function saveTire(e) {
    e.preventDefault();
    await api('/tires', {
      method: 'POST',
      body: JSON.stringify({
        ...tireForm,
        treadDepth: tireForm.treadDepth ? Number(tireForm.treadDepth) : null,
        pressurePsi: tireForm.pressurePsi ? Number(tireForm.pressurePsi) : null,
      }),
    });
    setOpenTire(false);
    load();
  }

  async function saveStock(e) {
    e.preventDefault();
    await api('/stock', { method: 'POST', body: JSON.stringify(stockForm) });
    setOpenStock(false);
    setStockForm({ type: 'PNEU', brand: '', model: '', spec: '', quantity: 0, minQuantity: 2, location: '', unitCost: '' });
    load();
  }

  async function saveMove(e) {
    e.preventDefault();
    await api(`/stock/${openMove.id}/move`, { method: 'POST', body: JSON.stringify(moveForm) });
    setOpenMove(null);
    setMoveForm({ type: 'ENTRADA', quantity: 1, vehicleId: '', notes: '' });
    load();
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Pneus e baterias"
        subtitle="Estoque inteligente + itens instalados nos veículos"
        actions={(
          <div className="flex flex-wrap gap-2">
            {can('ADMIN', 'SUPERVISOR') && (
              <button className="btn btn-secondary" onClick={() => setOpenStock(true)}><Package size={16} /> Novo item estoque</button>
            )}
            <button className="btn btn-primary" onClick={() => setOpenTire(true)}><Plus size={16} /> Pneu no veículo</button>
          </div>
        )}
      />

      {stock.lowStock?.length > 0 && (
        <div className="mb-4 rounded-xl px-3 py-2 bg-amber-500/15 text-amber-800 dark:text-amber-200 text-sm font-semibold flex items-center gap-2">
          <TriangleAlert size={16} />
          {stock.lowStock.length} item(ns) abaixo do estoque mínimo — repor o quanto antes.
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        <button type="button" className={`btn ${tab === 'estoque' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('estoque')}>
          <Package size={16} /> Estoque
        </button>
        <button type="button" className={`btn ${tab === 'veiculos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('veiculos')}>
          Instalados nos veículos
        </button>
      </div>

      {tab === 'estoque' && (
        <div className="grid lg:grid-cols-2 gap-4">
          {[
            { title: 'Pneus em estoque', icon: Package, items: pneusEstoque },
            { title: 'Baterias em estoque', icon: Battery, items: bateriasEstoque },
          ].map((block) => (
            <div key={block.title} className="card table-wrap">
              <div className="px-4 py-3 border-b border-[var(--border)] font-semibold flex items-center gap-2">
                <block.icon size={16} /> {block.title}
              </div>
              <table className="data">
                <thead>
                  <tr>
                    <th>Marca/Modelo</th>
                    <th>Spec</th>
                    <th>Qtd</th>
                    <th>Mín.</th>
                    <th>Local</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {block.items.length === 0 && (
                    <tr><td colSpan={6} className="text-[var(--muted)] text-sm">Nenhum item cadastrado.</td></tr>
                  )}
                  {block.items.map((i) => (
                    <tr key={i.id} className={i.quantity <= i.minQuantity ? 'bg-amber-500/10' : ''}>
                      <td className="font-semibold">{[i.brand, i.model].filter(Boolean).join(' ') || '—'}</td>
                      <td>{i.spec || '—'}</td>
                      <td className="font-bold">{i.quantity}</td>
                      <td>{i.minQuantity}</td>
                      <td>{i.location || '—'}</td>
                      <td>
                        <button className="btn btn-secondary px-2 py-1" onClick={() => { setOpenMove(i); setMoveForm({ type: 'ENTRADA', quantity: 1, vehicleId: '', notes: '' }); }}>
                          Movimentar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab === 'veiculos' && (
        <div className="card table-wrap">
          <table className="data">
            <thead><tr><th>Veículo</th><th>Posição</th><th>Marca</th><th>Sulco (mm)</th><th>PSI</th><th>Status</th></tr></thead>
            <tbody>
              {tires.map((t) => (
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
      )}

      <Modal open={openTire} onClose={() => setOpenTire(false)} title="Registrar pneu no veículo">
        <form className="space-y-3" onSubmit={saveTire}>
          <Field label="Veículo">
            <select className="select" required value={tireForm.vehicleId} onChange={(e) => setTireForm({ ...tireForm, vehicleId: e.target.value })}>
              <option value="">Selecione</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
            </select>
          </Field>
          <Field label="Posição">
            <select className="select" value={tireForm.position} onChange={(e) => setTireForm({ ...tireForm, position: e.target.value })}>
              {['DE', 'DD', 'TE', 'TD', 'EE', 'ED', 'STEPE'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Marca"><input className="input" value={tireForm.brand} onChange={(e) => setTireForm({ ...tireForm, brand: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sulco mm"><input className="input" type="number" step="0.1" value={tireForm.treadDepth} onChange={(e) => setTireForm({ ...tireForm, treadDepth: e.target.value })} /></Field>
            <Field label="PSI"><input className="input" type="number" value={tireForm.pressurePsi} onChange={(e) => setTireForm({ ...tireForm, pressurePsi: e.target.value })} /></Field>
          </div>
          <Field label="Status">
            <select className="select" value={tireForm.status} onChange={(e) => setTireForm({ ...tireForm, status: e.target.value })}>
              <option value="OK">OK</option>
              <option value="ATENCAO">Atenção</option>
              <option value="TROCAR">Trocar</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpenTire(false)}>Cancelar</button>
            <button className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal open={openStock} onClose={() => setOpenStock(false)} title="Novo item de estoque">
        <form className="space-y-3" onSubmit={saveStock}>
          <Field label="Tipo">
            <select className="select" value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}>
              <option value="PNEU">Pneu</option>
              <option value="BATERIA">Bateria</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca"><input className="input" value={stockForm.brand} onChange={(e) => setStockForm({ ...stockForm, brand: e.target.value })} /></Field>
            <Field label="Modelo"><input className="input" value={stockForm.model} onChange={(e) => setStockForm({ ...stockForm, model: e.target.value })} /></Field>
          </div>
          <Field label={stockForm.type === 'PNEU' ? 'Medida (ex.: 275/80R22.5)' : 'Especificação (ex.: 12V 150Ah)'}>
            <input className="input" value={stockForm.spec} onChange={(e) => setStockForm({ ...stockForm, spec: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Qtd"><input className="input" type="number" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} /></Field>
            <Field label="Mínimo"><input className="input" type="number" value={stockForm.minQuantity} onChange={(e) => setStockForm({ ...stockForm, minQuantity: e.target.value })} /></Field>
            <Field label="Custo unit."><input className="input" type="number" step="0.01" value={stockForm.unitCost} onChange={(e) => setStockForm({ ...stockForm, unitCost: e.target.value })} /></Field>
          </div>
          <Field label="Local"><input className="input" value={stockForm.location} onChange={(e) => setStockForm({ ...stockForm, location: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpenStock(false)}>Cancelar</button>
            <button className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!openMove} onClose={() => setOpenMove(null)} title={`Movimentar estoque · ${openMove?.brand || ''} ${openMove?.model || ''}`}>
        <form className="space-y-3" onSubmit={saveMove}>
          <Field label="Tipo">
            <select className="select" value={moveForm.type} onChange={(e) => setMoveForm({ ...moveForm, type: e.target.value })}>
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída / aplicação</option>
              <option value="AJUSTE">Ajuste (definir saldo)</option>
            </select>
          </Field>
          <Field label="Quantidade"><input className="input" type="number" required value={moveForm.quantity} onChange={(e) => setMoveForm({ ...moveForm, quantity: e.target.value })} /></Field>
          {moveForm.type === 'SAIDA' && (
            <Field label="Veículo (opcional)">
              <select className="select" value={moveForm.vehicleId} onChange={(e) => setMoveForm({ ...moveForm, vehicleId: e.target.value })}>
                <option value="">Sem vínculo</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
              </select>
            </Field>
          )}
          <Field label="Obs."><input className="input" value={moveForm.notes} onChange={(e) => setMoveForm({ ...moveForm, notes: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpenMove(null)}>Cancelar</button>
            <button className="btn btn-primary">Confirmar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
