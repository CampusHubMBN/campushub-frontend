// src/services/api/job-applications.api.ts
import { api } from '@/lib/axios';
import { JobApplication, ApplicationFormData, UpdateStatusPayload, ApplicationStatus } from '@/types/job-application';

export const jobApplicationsApi = {
  /**
   * Postuler à une offre
   */
  apply: async (jobId: string, data: ApplicationFormData): Promise<JobApplication> => {
    const formData = new FormData();
    formData.append('cover_letter', data.cover_letter);

    if (data.cv) {
      formData.append('cv', data.cv);
    }

    if (data.additional_documents && data.additional_documents.length > 0) {
      data.additional_documents.forEach((file, index) => {
        formData.append(`additional_documents[${index}]`, file);
      });
    }

    const response = await api.post(`/jobs/${jobId}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Gestion des différentes structures de réponse Laravel
    return (
      response.data.application?.data ??
      response.data.application ??
      response.data.data
    );
  },

  /**
   * Mes candidatures (étudiant connecté)
   */
  getMyApplications: async (): Promise<JobApplication[]> => {
    const response = await api.get<{ data: JobApplication[] }>('/my-applications');
    return response.data.data;
  },

  /**
   * Voir une candidature
   */
  getApplication: async (id: string): Promise<JobApplication> => {
    const response = await api.get<{ data: JobApplication }>(`/applications/${id}`);
    return response.data.data;
  },

  /**
   * Retirer sa candidature
   */
  withdrawApplication: async (id: string): Promise<void> => {
    await api.post(`/applications/${id}/withdraw`);
  },

  /**
   * Candidatures pour un poste (recruteur/admin)
   */
  getJobApplications: async (
    jobId: string,
    filters?: { status?: ApplicationStatus; page?: number }
  ): Promise<{ data: JobApplication[]; meta?: { current_page: number; last_page: number; per_page: number; total: number } }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    const qs = params.toString();
    const response = await api.get(`/jobs/${jobId}/applications${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  /**
   * Mettre à jour le statut d'une candidature (recruteur/admin)
   */
  updateApplicationStatus: async (id: string, payload: UpdateStatusPayload): Promise<JobApplication> => {
    const response = await api.patch<{ application: JobApplication }>(`/applications/${id}/status`, payload);
    return response.data.application;
  },
};
