import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearSession, getStoredUser, getToken, setSession } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then((u) => {
        setUser(u);
        setSession(getToken(), u);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      applySession(token, nextUser) {
        setSession(token, nextUser);
        setUser(nextUser);
      },
      async login(matricula, password) {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ matricula, password }),
        });
        setSession(data.token, data.user);
        setUser(data.user);
        return data.user;
      },
      logout() {
        clearSession();
        setUser(null);
      },
      can(...roles) {
        return user && roles.includes(user.role);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
