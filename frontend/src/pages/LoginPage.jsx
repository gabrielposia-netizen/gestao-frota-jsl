import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import JslLogo from '../components/JslLogo';

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block overflow-hidden bg-[#1a1a1a]">
        <img src="/jsl-hero.png" alt="Frota JSL" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
        <div className="brand-swoosh opacity-90" />
        <div className="relative z-10 h-full flex flex-col justify-between p-10 text-white">
          <JslLogo compact className="drop-shadow-md" />
          <div className="max-w-xl">
            <h1 className="font-display text-4xl xl:text-5xl font-black uppercase leading-[1.05]">
              Para cada operação, <span className="highlight-chip">uma JSL</span> diferente.
            </h1>
            <p className="mt-5 text-white/90 text-lg max-w-md">
              Gestão de frota interna com a identidade e a agilidade da operação logística JSL.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="card w-full max-w-md p-6 md:p-8 space-y-4 shadow-lg">
          <div className="lg:hidden mb-2 rounded-xl overflow-hidden bg-[var(--jsl-red)] px-2 py-2">
            <JslLogo banner />
          </div>
          <div>
            <div className="font-display text-2xl font-extrabold uppercase tracking-tight">{title}</div>
            <p className="text-[var(--muted)] text-sm mt-1">{subtitle}</p>
          </div>
          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState('ADMIN01');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(matricula, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Entrar" subtitle="Acesso por matrícula da equipe operacional" footer={(
      <div className="space-y-2 text-sm border-t border-[var(--border)] pt-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link className="font-semibold text-[var(--jsl-red)]" to="/cadastro">Criar conta</Link>
          <Link className="font-semibold text-[var(--jsl-red)]" to="/recuperar-senha">Esqueci a senha</Link>
        </div>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Demo: matrícula <strong>ADMIN01</strong> / admin123 · SUPER01 / super123 · OPER01 / oper123
        </p>
      </div>
    )}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="rounded-xl bg-[var(--jsl-red-soft)] text-[var(--jsl-red)] px-3 py-2 text-sm font-medium">{error}</div>}
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Matrícula</span>
          <input className="input" value={matricula} onChange={(e) => setMatricula(e.target.value)} required autoComplete="username" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Senha</span>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <button className="btn btn-primary w-full py-3.5" disabled={busy}>
          {busy ? 'Entrando...' : (
            <>
              Acessar sistema
              <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-white/20">
                <ArrowRight size={14} />
              </span>
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export { AuthShell };
