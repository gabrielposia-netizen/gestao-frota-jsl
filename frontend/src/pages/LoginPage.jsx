import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import JslLogo from '../components/JslLogo';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@frota.jsl');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block overflow-hidden bg-[#1a1a1a]">
        <img
          src="/jsl-hero.png"
          alt="Frota JSL"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
        <div className="brand-swoosh opacity-90" />
        <div className="relative z-10 h-full flex flex-col justify-between p-10 text-white">
          <JslLogo compact className="drop-shadow-md" />
          <div className="max-w-xl">
            <h1 className="font-display text-4xl xl:text-5xl font-black uppercase leading-[1.05]">
              Para cada operação,{' '}
              <span className="highlight-chip">uma JSL</span>{' '}
              diferente.
            </h1>
            <p className="mt-5 text-white/90 text-lg max-w-md">
              Gestão de frota interna com a identidade e a agilidade da operação logística JSL.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--jsl-red)] px-5 py-3 font-bold uppercase text-sm tracking-wide">
              Controle operacional
              <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-white text-[var(--jsl-red)]">
                <ArrowRight size={15} />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 bg-[var(--bg)]">
        <form onSubmit={onSubmit} className="card w-full max-w-md p-6 md:p-8 space-y-4 shadow-lg">
          <div className="lg:hidden mb-2 rounded-xl overflow-hidden bg-[var(--jsl-red)] px-2 py-2">
            <JslLogo banner />
          </div>
          <div>
            <div className="font-display text-2xl font-extrabold uppercase tracking-tight">Entrar</div>
            <p className="text-[var(--muted)] text-sm mt-1">Acesso interno da equipe operacional</p>
          </div>
          {error && <div className="rounded-xl bg-[var(--jsl-red-soft)] text-[var(--jsl-red)] px-3 py-2 text-sm font-medium">{error}</div>}
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">E-mail</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Senha</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
          <div className="text-xs text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-3">
            Demo: <strong>admin@frota.jsl</strong> / admin123 · supervisor@frota.jsl / super123 · operador@frota.jsl / oper123
          </div>
        </form>
      </div>
    </div>
  );
}
