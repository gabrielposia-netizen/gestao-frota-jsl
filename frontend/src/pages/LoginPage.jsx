import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { KeyRound, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import JslLogo from '../components/JslLogo';

export default function LoginPage() {
  const { login, applySession, user, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [identificador, setIdentificador] = useState('ADMIN01');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('admin123');
  const [confirma, setConfirma] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  function switchMode(next) {
    setMode(next);
    setErro('');
    setOk('');
    setSenha('');
    setConfirma('');
    if (next === 'login') setSenha('');
  }

  async function onLogin(e) {
    e.preventDefault();
    setErro('');
    setOk('');
    setBusy(true);
    try {
      await login(identificador, senha);
    } catch (err) {
      setErro(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onCadastro(e) {
    e.preventDefault();
    setErro('');
    setOk('');
    if (senha !== confirma) {
      setErro('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ matricula, email, password: senha }),
      });
      setOk('Conta criada! Entrando…');
      applySession(data.token, data.user);
    } catch (err) {
      setErro(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onRecuperar(e) {
    e.preventDefault();
    setErro('');
    setOk('');
    if (senha !== confirma) {
      setErro('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    try {
      const data = await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ matricula, email, password: senha }),
      });
      setOk(data.message || 'Senha redefinida! Faça login com a nova senha.');
      setMode('login');
      setIdentificador(matricula);
      setSenha('');
      setConfirma('');
    } catch (err) {
      setErro(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-hero">
          <div className="login-hero-logo">
            <JslLogo compact className="!h-12 drop-shadow-md" />
          </div>
          <div className="text-xs font-bold uppercase tracking-wide opacity-90">Sistema interno · JSL</div>
          <h1>Gestão de frota operacional</h1>
          <p>
            Cadastre-se com sua matrícula do quadro de ativos para controlar veículos, checklists,
            manutenção e indicadores.
          </p>
        </div>

        <div className="login-form">
          <JslLogo className="login-form-logo !h-10" />
          <div className="login-modes">
            <button type="button" className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => switchMode('login')}>
              <LogIn size={16} /> Entrar
            </button>
            <button type="button" className={`btn ${mode === 'cadastro' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => switchMode('cadastro')}>
              <UserPlus size={16} /> Cadastrar
            </button>
            <button type="button" className={`btn ${mode === 'recuperar' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => switchMode('recuperar')}>
              <KeyRound size={16} /> Recuperar senha
            </button>
          </div>

          {mode === 'login' && (
            <form onSubmit={onLogin}>
              <h2 className="font-display text-xl font-bold mt-2 mb-1">Login</h2>
              <p className="text-[var(--muted)] text-sm mt-0 mb-3">Use matrícula (ou e-mail) e a senha cadastrada.</p>
              <div className="login-field">
                <label>E-mail ou matrícula</label>
                <input className="input" value={identificador} onChange={(e) => setIdentificador(e.target.value)} placeholder="matrícula ou e-mail" required autoComplete="username" />
              </div>
              <div className="login-field">
                <label>Senha</label>
                <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
              </div>
              {erro && <div className="login-alert">{erro}</div>}
              {ok && <div className="login-alert ok">{ok}</div>}
              <button className="btn btn-primary w-full" type="submit" disabled={busy}>
                {busy ? 'Entrando…' : 'Entrar'}
              </button>
              <button type="button" className="btn btn-secondary w-full mt-2" onClick={() => switchMode('recuperar')}>
                Esqueci minha senha
              </button>
              <p className="text-xs text-[var(--muted)] mt-3 leading-relaxed">
                Demo: <strong>ADMIN01</strong> / admin123 · SUPER01 / super123 · OPER01 / oper123
              </p>
            </form>
          )}

          {mode === 'cadastro' && (
            <form onSubmit={onCadastro}>
              <h2 className="font-display text-xl font-bold mt-2 mb-1">Criar conta</h2>
              <p className="text-[var(--muted)] text-sm mt-0 mb-3">
                Informe a matrícula do ativo. Nome e perfil vêm do QLP (motorista, empilhadeira, líder de manutenção, coordenador ou supervisor).
              </p>
              <div className="login-field">
                <label>Matrícula</label>
                <input className="input" value={matricula} onChange={(e) => setMatricula(e.target.value)} required />
              </div>
              <div className="login-field">
                <label>E-mail</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="login-field">
                <label>Senha</label>
                <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required />
              </div>
              <div className="login-field">
                <label>Confirmar senha</label>
                <input className="input" type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} minLength={6} required />
              </div>
              {erro && <div className="login-alert">{erro}</div>}
              {ok && <div className="login-alert ok">{ok}</div>}
              <button className="btn btn-primary w-full" type="submit" disabled={busy}>
                {busy ? 'Cadastrando…' : 'Criar conta e entrar'}
              </button>
            </form>
          )}

          {mode === 'recuperar' && (
            <form onSubmit={onRecuperar}>
              <h2 className="font-display text-xl font-bold mt-2 mb-1">Recuperar senha</h2>
              <p className="text-[var(--muted)] text-sm mt-0 mb-3">
                Informe a matrícula e o e-mail cadastrados para definir uma nova senha.
              </p>
              <div className="login-field">
                <label>Matrícula</label>
                <input className="input" value={matricula} onChange={(e) => setMatricula(e.target.value)} required />
              </div>
              <div className="login-field">
                <label>E-mail cadastrado</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="login-field">
                <label>Nova senha</label>
                <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required />
              </div>
              <div className="login-field">
                <label>Confirmar nova senha</label>
                <input className="input" type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} minLength={6} required />
              </div>
              {erro && <div className="login-alert">{erro}</div>}
              {ok && <div className="login-alert ok">{ok}</div>}
              <button className="btn btn-primary w-full" type="submit" disabled={busy}>
                {busy ? 'Salvando…' : 'Atualizar senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
