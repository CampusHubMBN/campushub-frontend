// src/services/api/job-applications.api.ts
import { api } from '@/lib/axios';
import { JobApplication, ApplicationFormData } from '@/types/job-application';

export const jobApplicationsApi = {
  /**
   * Apply to a job
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

    try {
      const response = await api.post(
        `/jobs/${jobId}/apply`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Handle different response structures
      const application = response.data.application?.data
        || response.data.application
        || response.data.data;

      return application;
    } catch (error: any) {
      console.error('Apply error:', error.response?.data);
      throw error;
    }


    // return response.data.application.data;
  },

  /**
   * Get my applications
   */
  getMyApplications: async (): Promise<JobApplication[]> => {
    const response = await api.get<{ data: JobApplication[] }>('/my-applications');
    return response.data.data;
  },

  /**
   * Get single application
   */
  getApplication: async (id: string): Promise<JobApplication> => {
    const response = await api.get<{ data: JobApplication }>(`/applications/${id}`);
    return response.data.data;
  },

  /**
   * Withdraw application
   */
  withdrawApplication: async (id: string): Promise<void> => {
    await api.post(`/applications/${id}/withdraw`);
  },
};
