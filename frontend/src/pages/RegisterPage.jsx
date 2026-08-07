import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from './LoginPage';

export default function RegisterPage() {
  const { user, loading, applySession } = useAuth();
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState('');
  const [employee, setEmployee] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function lookup() {
    setError('');
    setEmployee(null);
    const m = matricula.trim();
    if (!m) return;
    try {
      const data = await api(`/auth/qlp/${encodeURIComponent(m)}`);
      if (data.alreadyRegistered) {
        setError('Já existe conta para esta matrícula. Faça login ou recupere a senha.');
        return;
      }
      setEmployee(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!employee) {
      setError('Consulte a matrícula no QLP antes de cadastrar');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ matricula: employee.matricula, email, password }),
      });
      applySession(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cadastro liberado para motoristas, empilhadeiras, líder de manutenção, coordenadores e supervisores"
      footer={(
        <p className="text-sm border-t border-[var(--border)] pt-3">
          Já tem conta? <Link className="font-semibold text-[var(--jsl-red)]" to="/login">Entrar</Link>
        </p>
      )}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="rounded-xl bg-[var(--jsl-red-soft)] text-[var(--jsl-red)] px-3 py-2 text-sm font-medium">{error}</div>}
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Matrícula (Número Pessoal)</span>
          <div className="flex gap-2">
            <input className="input" value={matricula} onChange={(e) => { setMatricula(e.target.value); setEmployee(null); }} required />
            <button type="button" className="btn btn-secondary shrink-0" onClick={lookup}>Buscar</button>
          </div>
        </label>
        {employee && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm space-y-1">
            <div><span className="text-[var(--muted)]">Nome:</span> <strong>{employee.nome}</strong></div>
            <div><span className="text-[var(--muted)]">Cargo:</span> {employee.cargo}</div>
            {employee.setor && <div><span className="text-[var(--muted)]">Setor:</span> {employee.setor}</div>}
          </div>
        )}
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">E-mail</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!employee} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Senha</span>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={!employee} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Confirmar senha</span>
          <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} disabled={!employee} />
        </label>
        <button className="btn btn-primary w-full py-3.5" disabled={busy || !employee}>
          {busy ? 'Cadastrando...' : 'Criar conta e entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
