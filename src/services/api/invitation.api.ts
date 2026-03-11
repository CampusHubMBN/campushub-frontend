// src/services/api/invitations.api.ts
import api from '@/lib/axios';
import {
  Invitation,
  CreateInvitationRequest,
  VerifyInvitationRequest,
  VerifyInvitationResponse,
} from '@/types/api';

export const invitationsApi = {
  // Get all invitations (admin only)
  getInvitations: async (): Promise<Invitation[]> => {
    const response = await api.get<{ data: Invitation[] }>('/invitations');
    return response.data.data;
  },

  // Create invitation (admin only)
  createInvitation: async (
    data: CreateInvitationRequest
  ): Promise<{ message: string; invitation: Invitation }> => {
    const response = await api.post<{ message: string; invitation: Invitation }>(
      '/invitations',
      data
    );
    return response.data;
  },

  // Verify invitation token (public)
  verifyInvitation: async (
    data: VerifyInvitationRequest
  ): Promise<VerifyInvitationResponse> => {
    const response = await api.post<VerifyInvitationResponse>(
      '/invitations/verify',
      data
    );
    return response.data;
  },

  // Resend invitation (admin only)
  resendInvitation: async (
    id: string
  ): Promise<{ message: string; invitation: Invitation }> => {
    const response = await api.post<{ message: string; invitation: Invitation }>(
      `/invitations/${id}/resend`
    );
    return response.data;
  },

  // Delete invitation (admin only)
  deleteInvitation: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/invitations/${id}`);
    return response.data;
  },
};