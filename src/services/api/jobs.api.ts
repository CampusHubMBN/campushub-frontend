// src/services/api/jobs.api.ts
import { api } from '@/lib/axios';
import { Job, JobsResponse, JobFilters } from '@/types/job';

export const jobsApi = {
  /**
   * Get all jobs (public)
   */
  getJobs: async (filters?: JobFilters): Promise<Job[]> => {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.type && filters.type !== 'all') {
      params.append('type', filters.type);
    }
    if (filters?.location_type && filters.location_type !== 'all') {
      params.append('location_type', filters.location_type);
    }
    if (filters?.source_type && filters.source_type !== 'all') {
      params.append('source_type', filters.source_type);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/jobs?${queryString}` : '/jobs';

    const response = await api.get<JobsResponse>(url);
    return response.data.data;
  },

  /**
   * Get single job (public)
   */
  getJob: async (id: string): Promise<Job> => {
    const response = await api.get<{ data: Job }>(`/jobs/${id}`);
    return response.data.data;
  },

  /**
   * Create job (admin/company only)
   */
  createJob: async (data: Partial<Job>): Promise<Job> => {
    const response = await api.post<{ data: Job }>('/jobs', data);
    return response.data.data;
  },

  /**
   * Update job (admin/creator only)
   */
  updateJob: async (id: string, data: Partial<Job>): Promise<Job> => {
    const response = await api.patch<{ data: Job }>(`/jobs/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete job (admin/creator only)
   */
  deleteJob: async (id: string): Promise<void> => {
    await api.delete(`/jobs/${id}`);
  },
};

// Export pour compatibilité avec ton code actuel
export const fetchJobs = jobsApi.getJobs;
