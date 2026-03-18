// src/types/job.ts
export type JobType = 'internship' | 'apprenticeship' | 'cdd' | 'cdi' | 'freelance';
export type LocationType = 'onsite' | 'remote' | 'hybrid';
export type JobStatus = 'draft' | 'published' | 'closed' | 'filled';
export type SourceType = 'internal' | 'external';
export type SalaryPeriod = 'hourly' | 'monthly' | 'yearly';

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  is_partner: boolean;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  
  type: JobType;
  location_type: LocationType;
  location_city: string | null;
  location_country: string;
  
  salary_min: number | null;
  salary_max: number | null;
  salary_period: SalaryPeriod;
  salary_currency: string;
  
  duration_months: number | null;
  start_date: string | null;
  
  application_url: string | null;
  application_email: string | null;
  application_deadline: string | null;
  
  source_type: SourceType;
  company_name: string | null; // For external jobs
  external_url: string | null;
  
  company: Company | null; // For internal jobs
  posted_by: {
    id: string;
    name: string;
  } | null;
  
  views_count: number;
  applications_count: number;
  
  status: JobStatus;
  published_at: string | null;
  closed_at: string | null;
  
  is_active: boolean;
  can_apply: boolean;
  has_applied?: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface JobsResponse {
  data: Job[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface JobFilters {
  search?: string;
  type?: JobType | 'all';
  location_type?: LocationType | 'all';
  source_type?: SourceType | 'all';
  page?: number;
}