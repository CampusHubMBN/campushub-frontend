// src/lib/axios.ts
import axios from 'axios';
// import { useAuthStore } from '@/store/authStore';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  // withCredentials: true, // SESSION AUTH: cookie pour auth (SPA same-domain only)
  headers: {
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Interceptor Request: Ajouter Authorization Bearer token
api.interceptors.request.use(
  (config) => {
    // --- TOKEN AUTH ---
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token;
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {}
    }

    // --- SESSION AUTH (SPA same-domain only) ---
    // const xsrf = getCookie('XSRF-TOKEN');
    // if (xsrf) config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf);

    return config;
  },
  (error) => Promise.reject(error)
);

// nterceptor Response: Gérer 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    const isAuthEndpoint = url.includes('/login') || url.includes('/register') || url.includes('/csrf-cookie');
    const onLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

    if (error.response?.status === 401 && !isAuthEndpoint && !onLoginPage) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }

    if (
      error.response?.status === 403 &&
      (error.response.data?.code === 'ACCOUNT_SUSPENDED' ||
        error.response?.data?.message?.includes('suspendu'))
    ) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login?suspended=true';
    }

    return Promise.reject(error);
  }
)

// Helper: Extraire cookie par nom (SESSION AUTH)
// function getCookie(name: string): string | null {
//   if (typeof document === 'undefined') return null;
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
//   return null;
// }

export default api;
