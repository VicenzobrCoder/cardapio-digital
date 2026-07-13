import axios from 'axios';

// Em desenvolvimento: usa o proxy do Vite (/api → localhost:3001)
// Em produção (Vercel): usa a variável VITE_API_URL apontando para o Railway
// ⚙️ Configure VITE_API_URL nas variáveis de ambiente do Vercel
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

const TOKEN_KEY = 'cardapio_admin_token';

api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
