// src/services/api/events.api.ts
import { api } from '@/lib/axios';
import { CampusEvent, EventsResponse } from '@/types/event';

export const eventsApi = {
  /**
   * GET /events — Public list of upcoming published events
   */
  getEvents: async (params?: {
    type?: string;
    upcoming?: boolean;
    page?: number;
  }): Promise<EventsResponse> => {
    const { data } = await api.get('/events', { params });
    return data;
  },

  /**
   * GET /events/:id — Single event detail
   */
  getEvent: async (id: string): Promise<CampusEvent> => {
    const { data } = await api.get(`/events/${id}`);
    return data;
  },

  /**
   * POST /events/:id/attend — Register for an event
   */
  attend: async (id: string): Promise<{ message: string; attendees_count: number }> => {
    const { data } = await api.post(`/events/${id}/attend`);
    return data;
  },

  /**
   * DELETE /events/:id/attend — Unregister from an event
   */
  unattend: async (id: string): Promise<{ message: string; attendees_count: number }> => {
    const { data } = await api.delete(`/events/${id}/attend`);
    return data;
  },
};
