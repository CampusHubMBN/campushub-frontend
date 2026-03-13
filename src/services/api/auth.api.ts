// src/services/api/auth.api.ts
import api from '@/lib/axios';
import { AuthResponse, LoginRequest, RegisterRequest, RegisterWithInvitationRequest, User } from '@/types/api';
import axios from 'axios';

// Récupérer le CSRFcookie
const getCsrfToken = async () => {
  await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
};

export const authApi = {
  // Register
  register: async (data: RegisterWithInvitationRequest): Promise<AuthResponse> => {
    await getCsrfToken();
    const response = await api.post<AuthResponse>('/register', data);
    return response.data;
  },

  // Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    await getCsrfToken(); // ✅ Obtenir CSRF token d'abord
    const response = await api.post<AuthResponse>('/login', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/logout');
  },

  // Get current user
  me: async (): Promise<User> => {
    const response = await api.get<{ data: User }>('/me');
    console.log('res dta', response.data)
    return response.data.data;
  },
};