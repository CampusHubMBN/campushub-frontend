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
  getUser: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    console.log('res dta', response.data)
    return response.data;
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
};