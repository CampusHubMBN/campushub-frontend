// src/types/api.ts
// ========== USER TYPES ==========

export type UserRole =
  | 'student'
  | 'alumni'
  | 'bde_member'
  | 'pedagogical'
  | 'company'
  | 'admin';

export type UserLevel =
  | 'beginner'
  | 'active_member'
  | 'contributor'
  | 'expert'
  | 'vip';

// User (minimaliste - auth seulement)
export interface User {
  id: string; // UUID
  name: string;
  email: string;
  role: UserRole;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  suspended_at: string;

  // Relation eager loaded (optionnelle)
  info?: UserInfo;
}

// UserInfo (profil complet)
export interface UserInfo {
  id: string;
  user_id: string;

  // Profile
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;

  // Professional
  cv_url: string | null;
  skills: string[];
  languages: Language[];

  // Academic
  program: string | null;
  year: number | null;
  graduation_year: number | null;
  specialization: string | null;
  campus: string | null;

  // Company reference
  company_id: string | null;

  // Gamification
  reputation_points: number;
  level: UserLevel;
  profile_completion: number;

  created_at: string;
  updated_at: string;
}

export interface Language {
  language: string;
  level: string;
}

// auth types

export interface LoginRequest {
    email: string;
    password: string;
    remember?: boolean;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    invitation_token: string;
}


export interface AuthResponse {
  message: string;
  user: User; // User avec info déjà chargée
}

// API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Pagination
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// ========== INVITATION TYPES ==========

export interface Invitation {
  id: string;
  email: string;
  role: Exclude<UserRole, 'admin'>; // Pas de role admin pour invitations
  token: string;
  invitation_url: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  is_expired: boolean;
  is_valid: boolean;
  invited_by?: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
}

export interface CreateInvitationRequest {
  email: string;
  role: Exclude<UserRole, 'admin'>;
}

export interface VerifyInvitationRequest {
  token: string;
}

export interface VerifyInvitationResponse {
  email: string;
  role: UserRole;
}

// Alias pour compatibilité
export type RegisterWithInvitationRequest = RegisterRequest;
