import axios from 'axios';

// URL de base de l'API — configurée via .env (VITE_API_URL), fallback localhost en dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Origine du serveur (sans le préfixe /api) — pour les fichiers statiques /uploads
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/** Transforme une URL relative renvoyée par l'API (/uploads/…) en URL absolue. */
export const toAbsoluteUrl = (url?: string | null): string =>
  !url ? '' : url.startsWith('http') ? url : `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial pour envoyer le cookie HttpOnly du Refresh Token
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tower_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globales (ex: token expiré)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Routes publiques : on laisse l'erreur se propager normalement
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/refresh'];
    const isPublicRoute = publicRoutes.some(route => originalRequest.url?.includes(route));
    
    // Ne retenter le refresh QUE pour les requêtes authentifiées (avec token) qui reçoivent un 401
    const hasAuthHeader = !!originalRequest.headers?.Authorization;

    if (status === 401 && !isPublicRoute && hasAuthHeader && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data?.accessToken) {
          localStorage.setItem('tower_token', refreshResponse.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[AUTH] Échec du rafraîchissement du token', refreshError);
        localStorage.removeItem('tower_token');
        localStorage.removeItem('tower_user');
        window.location.href = '/learn/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
