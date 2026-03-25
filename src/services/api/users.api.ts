// src/services/api/users.api.ts
import api from '@/lib/axios';
import { User, UserInfo } from '@/types/api';

export interface UpdateUserInfoRequest {
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  website_url?: string | null;
  cv_url?: string | null;
  skills?: string[];
  languages?: { language: string; level: string }[];
  program?: string | null;
  year?: number | null;
  graduation_year?: number | null;
  specialization?: string | null;
  campus?: string | null;
}

export const usersApi = {
  // Get user by ID
  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    // console.log('res dta', response.data)
    return {
      // Données utilisateur (UserResource)
      ...response.data.data,
      // Champs additionnels
      articles:       response.data.articles       ?? [],
      articles_count: response.data.articles_count ?? 0,
      is_own_profile: response.data.is_own_profile ?? false,
    };
  },

  // Update user info
  updateUserInfo: async (
    userId: string,
    data: UpdateUserInfoRequest
  ): Promise<User> => {
    const response = await api.patch<{ data: User }>(`/users/${userId}`, data);
    return response.data.data;
  },

  // Upload avatar
  uploadAvatar: async (userId: string, file: File): Promise<{ avatar_url: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post<{ avatar_url: string }>(
      `/users/${userId}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  // Upload CV (PDF)
  uploadCv: async (userId: string, file: File): Promise<{
    cv_url: string;
    profile_completion: number;
  }> => {
    const formData = new FormData();
    formData.append('cv', file);

    const response = await api.post(`/users/${userId}/cv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // Change password
  changePassword: async (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> => {
    const response = await api.patch('/account/password', data);
    return response.data;
  },

  // Change email
  changeEmail: async (data: {
    email: string;
    password: string;
  }): Promise<{ message: string; email: string }> => {
    const response = await api.patch('/account/email', data);
    return response.data;
  },

  // Delete account
  deleteAccount: async (password: string): Promise<void> => {
    await api.delete('/account', { data: { password } });
  },

  // Supprimer CV
  deleteCv: async (userId: string): Promise<{
    cv_url: null;
    profile_completion: number;
  }> => {
    const response = await api.delete(`/users/${userId}/cv`);
    return response.data.data;
  },
};
