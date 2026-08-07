import { STATUS_COLOR, STATUS_LABEL } from '../lib/labels';

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_COLOR[status] || 'bg-slate-500/15'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl md:text-[1.55rem] font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[var(--muted)] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function KpiCard({ label, value, hint, icon: Icon, tone = 'brand', onClick, active }) {
  const tones = {
    brand: 'from-[color-mix(in_oklab,var(--jsl-red)_14%,transparent)]',
    warn: 'from-[color-mix(in_oklab,var(--warn)_18%,transparent)]',
    danger: 'from-[color-mix(in_oklab,var(--jsl-red)_22%,transparent)]',
    info: 'from-[color-mix(in_oklab,#1a1a1a_10%,transparent)]',
  };
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`card card-interactive p-4 bg-gradient-to-br ${tones[tone]} to-transparent text-left w-full ${
        onClick ? 'cursor-pointer' : ''
      } ${active ? 'ring-2 ring-[var(--jsl-red)] shadow-lg scale-[1.02]' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</div>
        {Icon && <Icon size={18} className="text-[var(--jsl-red)] icon-bob" />}
      </div>
      <div className="font-display text-2xl font-black mt-2 tracking-tight">{value}</div>
      {hint && <div className="text-xs text-[var(--muted)] mt-1">{hint}</div>}
      {onClick && (
        <div className="text-[10px] uppercase tracking-wide font-bold text-[var(--jsl-red)] mt-2">
          {active ? 'Filtro ativo · clique para limpar' : 'Clique para filtrar'}
        </div>
      )}
    </Comp>
  );
}

export function EmptyState({ message }) {
  return <div className="text-center py-10 text-[var(--muted)]">{message}</div>;
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-auto p-5 shadow-2xl animate-scale-in`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">{title}</h2>
          <button className="btn btn-secondary px-3" onClick={onClose}>Fechar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}
