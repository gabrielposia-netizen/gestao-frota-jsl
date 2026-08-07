import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from './LoginPage';

export default function ForgotPasswordPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError('As senhas não conferem');
      return;
    }
    setBusy(true);
    setError('');
    setOk('');
    try {
      const data = await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ matricula, email, password }),
      });
      setOk(data.message || 'Senha atualizada');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe matrícula e e-mail cadastrados para definir uma nova senha"
      footer={(
        <p className="text-sm border-t border-[var(--border)] pt-3">
          <Link className="font-semibold text-[var(--jsl-red)]" to="/login">Voltar ao login</Link>
        </p>
      )}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="rounded-xl bg-[var(--jsl-red-soft)] text-[var(--jsl-red)] px-3 py-2 text-sm font-medium">{error}</div>}
        {ok && <div className="rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm font-medium">{ok}</div>}
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Matrícula</span>
          <input className="input" value={matricula} onChange={(e) => setMatricula(e.target.value)} required />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">E-mail cadastrado</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Nova senha</span>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Confirmar nova senha</span>
          <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
        </label>
        <button className="btn btn-primary w-full py-3.5" disabled={busy}>
          {busy ? 'Salvando...' : 'Atualizar senha'}
        </button>
      </form>
    </AuthShell>
  );
}
