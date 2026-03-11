// src/lib/axios.ts
import axios from 'axios';
// import { useAuthStore } from '@/store/authStore';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true, //cookie pour auth
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Interceptor Request: Ajouter X-XSRF-TOKEN depuis cookie
api.interceptors.request.use(
  (config) => {
    // Extraire XSRF-TOKEN du cookie
    const token = getCookie('XSRF-TOKEN');
    
    if (token) {
      // Décoder le token (Laravel encode en URL)
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// nterceptor Response: Gérer 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
)

// Helper: Extraire cookie par nom
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

export default api;