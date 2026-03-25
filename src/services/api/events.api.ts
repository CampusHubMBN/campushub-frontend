// src/services/api/events.api.ts
import { api } from '@/lib/axios';
import { CampusEvent, EventsResponse, EventType } from '@/types/event';

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  start_date: string; // ISO or datetime-local string
  end_date: string;
  capacity?: number | null;
  event_type?: EventType;
  target_roles?: string[] | null;
}

export const eventsApi = {
  getEvents: async (params?: {
    type?: string;
    upcoming?: boolean;
    page?: number;
  }): Promise<EventsResponse> => {
    const { data } = await api.get('/events', { params });
    return data;
  },

  getEvent: async (id: string): Promise<CampusEvent> => {
    const { data } = await api.get(`/events/${id}`);
    return data;
  },

  create: async (payload: EventFormData): Promise<CampusEvent> => {
    const { data } = await api.post('/events', payload);
    return data.data ?? data; // Laravel JsonResource wraps in { data: {...} }
  },

  update: async (id: string, payload: Partial<EventFormData>): Promise<CampusEvent> => {
    const { data } = await api.patch(`/events/${id}`, payload);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  publish: async (id: string): Promise<CampusEvent> => {
    const { data } = await api.post(`/events/${id}/publish`);
    return data;
  },

  uploadCover: async (id: string, file: File): Promise<{ cover_image: string }> => {
    const form = new FormData();
    form.append('cover', file);
    const { data } = await api.post(`/events/${id}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  attend: async (id: string): Promise<{ message: string; attendees_count: number }> => {
    const { data } = await api.post(`/events/${id}/attend`);
    return data;
  },

  unattend: async (id: string): Promise<{ message: string; attendees_count: number }> => {
    const { data } = await api.delete(`/events/${id}/attend`);
    return data;
  },
};
