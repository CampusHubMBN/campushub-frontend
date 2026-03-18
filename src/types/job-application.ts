// src/types/job-application.ts

/**
 * Statuts alignés sur les méthodes du modèle JobApplication.php
 *   pending      → candidature soumise
 *   reviewed     → markAsReviewed()
 *   shortlisted  → markAsShortlisted()
 *   interview    → scheduleInterview()
 *   accepted     → accept()
 *   rejected     → reject()
 *   withdrawn    → action côté étudiant
 */
export type ApplicationStatus =
  | 'pending'
  | 'reviewed'
  | 'shortlisted'
  | 'interview'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

/**
 * Données envoyées au POST /jobs/:id/apply (multipart/form-data)
 * Champs extra (portfolio_url, etc.) sont hors modèle Laravel —
 * à n'inclure que si ton JobApplicationController les accepte.
 */
export interface ApplicationFormData {
  cover_letter: string;
  cv?: File;                      // → cv_url après upload serveur
  additional_documents?: File[];  // → additional_documents[] (array, casté en JSON)
  // Champs optionnels si acceptés par le controller
  portfolio_url?: string;
  availability_date?: string;
  salary_expectation?: number;
  additional_info?: string;
}

/**
 * Réponse API — reflète exactement $fillable + HasUuids du modèle
 */
export interface JobApplication {
  id: string;                          // UUID (HasUuids)
  job_id: string;
  user_id: string;
  status: ApplicationStatus;
  cover_letter: string;
  cv_url: string | null;               // URL après upload
  additional_documents: string[] | null; // tableau d'URLs (cast: 'array')
  notes: string | null;                // ⚠️ était admin_notes — champ réel = notes
  reviewed_at: string | null;          // datetime
  interview_at: string | null;         // datetime → scheduleInterview()
  responded_at: string | null;         // datetime → accept() / reject()
  created_at: string;
  updated_at: string;

  // Relations (chargées selon le contexte)
  job?: {
    id: string;
    title: string;
    type: string;
    location_city: string | null;
    company_name: string | null;       // jobs externes
    company: {
      name: string;
      logo_url: string | null;
    } | null;
  };
  // Relation user() du modèle → nommée "applicant" dans les ressources API
  applicant?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  };
}

export interface UpdateStatusPayload {
  status: ApplicationStatus;
  notes?: string;            // ⚠️ était admin_notes
  interview_at?: string;     // requis si status = 'interview'
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending:     "En attente",
  reviewed:    "Examinée",
  shortlisted: "Présélectionnée",
  interview:   "Entretien",
  accepted:    "Acceptée",
  rejected:    "Refusée",
  withdrawn:   "Retirée",
};

/**
 * Badge classes — palette CampusHub
 * Progression : pending → reviewed → shortlisted → interview (blue scale)
 * Résolution : accepted (orange) / rejected (red) / withdrawn (gray)
 */
export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending:     "bg-campus-blue-50   text-campus-blue-500  border border-campus-blue-100",
  reviewed:    "bg-campus-blue-100  text-campus-blue-600  border border-campus-blue-200",
  shortlisted: "bg-campus-blue-200  text-campus-blue-700  border border-campus-blue-300",
  interview:   "bg-campus-blue-300  text-campus-blue-800  border border-campus-blue-400",
  accepted:    "bg-campus-orange-50 text-campus-orange-700 border border-campus-orange-200",
  rejected:    "bg-red-50           text-red-600           border border-red-200",
  withdrawn:   "bg-campus-gray-100  text-campus-gray-600   border border-campus-gray-300",
};

export const APPLICATION_STATUS_DOTS: Record<ApplicationStatus, string> = {
  pending:     "bg-campus-blue-300",
  reviewed:    "bg-campus-blue-400",
  shortlisted: "bg-campus-blue-600",
  interview:   "bg-campus-blue-700",
  accepted:    "bg-campus-orange",
  rejected:    "bg-red-500",
  withdrawn:   "bg-campus-gray-400",
};

/** Statuts où l'étudiant peut encore retirer sa candidature */
export const WITHDRAWABLE_STATUSES: ApplicationStatus[] = [
  'pending',
  'reviewed',
  'shortlisted',
];
