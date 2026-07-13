import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'cardapio_admin_token';

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(r => setAdmin(r.data.admin))
        .catch(() => { localStorage.removeItem(TOKEN_KEY); delete api.defaults.headers.common['Authorization']; })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setAdmin(data.admin);
    return data.admin;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
