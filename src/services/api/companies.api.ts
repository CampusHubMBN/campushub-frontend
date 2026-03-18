// src/services/api/companies.api.ts
import { api } from '@/lib/axios';
import { Company, CompaniesResponse, CompanyFilters } from '@/types/company';

export const companiesApi = {
  /**
   * Get all companies (public)
   */
  getCompanies: async (filters?: CompanyFilters): Promise<Company[]> => {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.is_partner !== undefined) {
      params.append('is_partner', filters.is_partner.toString());
    }
    if (filters?.is_verified !== undefined) {
      params.append('is_verified', filters.is_verified.toString());
    }
    if (filters?.industry) {
      params.append('industry', filters.industry);
    }
    if (filters?.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    if (filters?.sort_order) {
      params.append('sort_order', filters.sort_order);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/companies?${queryString}` : '/companies';

    const response = await api.get<CompaniesResponse>(url);
    return response.data.data;
  },

  /**
   * Get single company (public)
   */
  getCompany: async (id: string): Promise<Company> => {
    const response = await api.get<{ data: Company }>(`/companies/${id}`);
    return response.data.data;
  },

  /**
   * Get partners only (public)
   */
  getPartners: async (): Promise<Company[]> => {
    const response = await api.get<{ data: Company[] }>('/companies/partners');
    return response.data.data;
  },

  /**
   * Create company (admin only)
   */
  createCompany: async (data: FormData): Promise<Company> => {
    const response = await api.post<{ data: Company }>('/companies', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Update company (admin only)
   */
  updateCompany: async (id: string, data: FormData): Promise<Company> => {
    const response = await api.patch<{ data: Company }>(`/companies/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Delete company (admin only)
   */
  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },

  /**
   * Upload logo (admin only)
   */
  uploadLogo: async (id: string, file: File): Promise<Company> => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post<{ company: { data: Company } }>(
      `/companies/${id}/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.company.data;
  },

  /**
   * Toggle partner status (admin only)
   */
  togglePartner: async (id: string): Promise<Company> => {
    const response = await api.post<{ company: { data: Company } }>(
      `/companies/${id}/toggle-partner`
    );
    return response.data.company.data;
  },

  /**
   * Toggle verified status (admin only)
   */
  toggleVerified: async (id: string): Promise<Company> => {
    const response = await api.post<{ company: { data: Company } }>(
      `/companies/${id}/toggle-verified`
    );
    return response.data.company.data;
  },
};
