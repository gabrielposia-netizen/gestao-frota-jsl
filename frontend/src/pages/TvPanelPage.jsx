import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { TYPE_LABEL } from '../lib/labels';
import { StatusBadge } from '../components/ui';
import JslLogo from '../components/JslLogo';
import TvLogisticsBackground from '../components/TvLogisticsBackground';

export default function TvPanelPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    async function tick() {
      try {
        const d = await api('/vehicles/tv');
        if (active) setData(d);
      } catch (e) {
        console.error(e);
      }
    }
    tick();
    const id = setInterval(tick, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen relative grid place-items-center text-[var(--muted)]">
        <TvLogisticsBackground />
        <div className="relative z-10">Carregando painel TV...</div>
      </div>
    );
  }

  const available = data.items.filter((v) => v.status === 'DISPONIVEL');
  const others = data.items.filter((v) => v.status !== 'DISPONIVEL');

  return (
    <div className="min-h-screen relative overflow-hidden">
      <TvLogisticsBackground />

      <div className="relative z-10">
        <div className="jsl-header px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <JslLogo compact />
            <div className="hidden sm:block text-[10px] uppercase tracking-[0.16em] text-white/80 border-l border-white/25 pl-3">
              Painel TV · Tempo real
            </div>
          </div>
          <Link to="/" className="btn btn-ghost">Voltar</Link>
        </div>

        <div className="p-4 md:p-6 text-[var(--text)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <span className="live-dot !bg-[var(--jsl-red)] !shadow-[0_0_0_4px_rgba(227,6,19,0.2)]" />
                Ao vivo · atualiza a cada 15s
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-black uppercase mt-2 tracking-tight">
                Frota <span className="highlight-chip">disponível</span>
              </h1>
            </div>
            <div className="flex gap-3 items-center">
              <div className="rounded-2xl bg-white/90 backdrop-blur-sm px-4 py-3 text-center border border-[var(--border)] shadow-sm">
                <div className="text-3xl font-black text-[var(--jsl-red)]">{data.summary.DISPONIVEL || 0}</div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Disponíveis</div>
              </div>
              <div className="rounded-2xl bg-white/90 backdrop-blur-sm px-4 py-3 text-center border border-[var(--border)] shadow-sm">
                <div className="text-3xl font-black">{data.summary.EM_USO || 0}</div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Em uso</div>
              </div>
              <div className="rounded-2xl bg-white/90 backdrop-blur-sm px-4 py-3 text-center border border-[var(--border)] shadow-sm">
                <div className="text-3xl font-black">{data.summary.MANUTENCAO || 0}</div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Manutenção</div>
              </div>
            </div>
          </div>

          <h2 className="text-[var(--muted)] font-display text-sm uppercase tracking-[0.14em] mb-3">Prontos para uso</h2>
          <div className="tv-grid mb-8">
            {available.map((v) => (
              <div key={v.id} className="rounded-2xl p-4 bg-white/92 backdrop-blur-sm border border-[var(--border)] shadow-sm card-interactive">
                <div className="text-2xl font-black tracking-wide">{v.plate}</div>
                <div className="text-[var(--muted)]">{v.model}</div>
                <div className="text-sm text-[var(--muted)] mt-1">{TYPE_LABEL[v.type]} · {v.sector || '—'}</div>
                <div className="mt-3"><StatusBadge status={v.status} /></div>
              </div>
            ))}
          </div>

          <h2 className="text-[var(--muted)] font-display text-sm uppercase tracking-[0.14em] mb-3">Demais status</h2>
          <div className="tv-grid">
            {others.map((v) => (
              <div key={v.id} className="rounded-2xl p-4 bg-white/75 backdrop-blur-sm border border-[var(--border)]">
                <div className="text-xl font-bold">{v.plate}</div>
                <div className="text-[var(--muted)] text-sm">{v.model} · {TYPE_LABEL[v.type]}</div>
                <div className="mt-2"><StatusBadge status={v.status} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
