// src/types/event.ts

export type EventType = 'general' | 'workshop' | 'conference' | 'networking' | 'sports';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string; // ISO
  end_date: string;   // ISO
  capacity: number | null;
  cover_image: string | null;
  event_type: EventType;
  target_roles: string[] | null;
  published_at: string | null;
  attendees_count: number;
  is_full: boolean;
  is_registered?: boolean; // only returned when authenticated
  organizer: {
    id: string;
    name: string;
  };
  last_editor?: {
    id: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface EventsResponse {
  data: CampusEvent[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}
