// src/services/api/admin.api.ts
import { api } from '@/lib/axios';

export interface AdminStats {
  users: {
    total:          number;
    active:         number;
    suspended:      number;
    by_role:        Record<string, number>;
    new_this_month: number;
  };
  posts: {
    total:     number;
    published: number;
    drafts:    number;
  };
  articles: {
    total:     number;
    published: number;
    drafts:    number;
  };
}

export interface AdminUser {
  id:           string;
  name:         string;
  email:        string;
  role:         string;
  suspended_at: string | null;
  last_login_at: string | null;
  created_at:   string;
  info?: {
    avatar_url:         string | null;
    profile_completion: number;
  } | null;
}

export interface AdminUsersResponse {
  data: AdminUser[];
  meta: {
    current_page: number;
    last_page:    number;
    per_page:     number;
    total:        number;
  };
}

export interface AdminUserFilters {
  search?:  string;
  role?:    string;
  status?:  'active' | 'suspended';
  page?:    number;
}

export const adminApi = {
  // ── Stats ─────────────────────────────────────────────────────────────────
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get<{ data: AdminStats }>('/admin/stats');
    return response.data.data;
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  getUsers: async (filters?: AdminUserFilters): Promise<AdminUsersResponse> => {
    const response = await api.get<AdminUsersResponse>('/admin/users', { params: filters });
    return response.data;
  },

  toggleSuspend: async (userId: string): Promise<{
    id: string; suspended_at: string | null; is_suspended: boolean;
  }> => {
    const response = await api.patch(`/admin/users/${userId}/suspend`);
    return response.data.data;
  },

  updateRole: async (userId: string, role: string): Promise<{ id: string; role: string }> => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data.data;
  },

  // ── Blog categories ───────────────────────────────────────────────────────
  createBlogCategory: async (data: {
    name: string; color?: string; display_order?: number;
  }) => {
    const response = await api.post('/admin/blog-categories', data);
    return response.data.data;
  },

  updateBlogCategory: async (id: string, data: {
    name?: string; color?: string; display_order?: number;
  }) => {
    const response = await api.patch(`/admin/blog-categories/${id}`, data);
    return response.data.data;
  },

  deleteBlogCategory: async (id: string): Promise<void> => {
    await api.delete(`/admin/blog-categories/${id}`);
  },
};
