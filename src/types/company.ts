import { Job } from "./job";

 // src/types/company.ts
export type CompanySize =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1001+';

export interface Company {
  id: string;
  name: string;
  siret: string | null;
  logo_url: string | null;
  website: string | null;
  linkedin_url: string | null;
  description: string | null;
  industry: string | null;
  size: CompanySize | null;
  headquarters_city: string | null;
  headquarters_country: string;
  is_partner: boolean;
  is_verified: boolean;
  verified_at: string | null;
  jobs_posted: number;
  active_jobs: number;
  jobs?: Job[]; // When loaded
  created_at: string;
  updated_at: string;
}

export interface CompaniesResponse {
  data: Company[];
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

export interface CompanyFilters {
  search?: string;
  is_partner?: boolean;
  is_verified?: boolean;
  industry?: string;
  sort_by?: 'name' | 'created_at' | 'jobs_posted' | 'active_jobs';
  sort_order?: 'asc' | 'desc';
  page?: number;
}
