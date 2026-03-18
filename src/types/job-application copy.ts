// src/types/job-application.ts
import { Job } from './job';
import { User } from './api';

export type ApplicationStatus =
  | 'pending'
  | 'reviewed'
  | 'shortlisted'
  | 'interview'
  | 'rejected'
  | 'accepted';

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;

  job?: Job;
  user?: User;

  cover_letter: string;
  cv_url: string | null;
  additional_documents: string[] | null;

  status: ApplicationStatus;
  notes: string | null;

  reviewed_at: string | null;
  interview_at: string | null;
  responded_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface ApplicationFormData {
  cover_letter: string;
  cv?: File;
  additional_documents?: File[];
}
