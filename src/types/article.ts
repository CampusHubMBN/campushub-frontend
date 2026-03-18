// src/types/article.ts

// ─── Rôles autorisés à créer/éditer ──────────────────────────────────────────
export const ARTICLE_AUTHOR_ROLES = ['pedagogical', 'bde_member'] as const;
export type ArticleAuthorRole = typeof ARTICLE_AUTHOR_ROLES[number];

// ─── Enums ────────────────────────────────────────────────────────────────────
export type ArticleDifficulty = 'easy' | 'medium' | 'complex';

export const DIFFICULTY_LABELS: Record<ArticleDifficulty, string> = {
  easy:    'Facile',
  medium:  'Intermédiaire',
  complex: 'Avancé',
};

export const DIFFICULTY_COLORS: Record<ArticleDifficulty, string> = {
  easy:    'bg-green-50 text-green-700 border border-green-200',
  medium:  'bg-campus-orange-50 text-campus-orange-700 border border-campus-orange-200',
  complex: 'bg-red-50 text-red-600 border border-red-200',
};

// ─── Blocs JSON structurés ────────────────────────────────────────────────────

export interface RelatedLink {
  title: string;
  url:   string;
  type:  'official' | 'guide' | 'video' | 'tool' | 'other';
}

export interface Attachment {
  title:       string;
  description: string | null;
  file_url:    string;
  type:        'pdf' | 'doc' | 'image' | 'other';
}

export interface ChecklistItem {
  text:        string;
  is_optional: boolean;
}

export interface Checklist {
  title: string;
  items: ChecklistItem[];
}

export interface TimelineStep {
  step:               number;
  title:              string;
  description:        string;
  estimated_duration: string | null; // ex: "2 semaines", "1 mois"
}

export interface CostItem {
  item:        string;
  amount:      number | null;
  currency:    string;        // ex: "EUR"
  is_variable: boolean;
}

// ─── Catégorie ────────────────────────────────────────────────────────────────
export interface ArticleCategory {
  id:            string;
  name:          string;
  slug:          string;
  icon:          string | null;
  description:   string | null;
  display_order: number;
  created_at:    string;
  updated_at:    string;
  // Computed (via withCount)
  articles_count?: number;
}

// ─── Article complet ──────────────────────────────────────────────────────────
export interface Article {
  id:          string;           // UUID
  category_id: string | null;
  author_id:   string;

  // Content
  title:       string;
  slug:        string;
  description: string | null;
  content:     string;           // HTML (Tiptap output)

  // Metadata
  difficulty:          ArticleDifficulty;
  estimated_read_time: number | null;       // minutes
  target_audience:     string[] | null;     // ["Étudiants EU", "Hors EU"]

  // Rich blocs
  related_links: RelatedLink[] | null;
  attachments:   Attachment[]  | null;
  checklist:     Checklist     | null;
  timeline:      TimelineStep[]| null;
  costs:         CostItem[]    | null;

  // Versioning
  version:         number;
  changelog:       string | null;
  last_reviewed_at: string | null;

  // Stats
  views_count:    number;
  helpful_count:  number;
  comments_count: number;

  // Status
  is_published: boolean;
  is_featured:  boolean;

  created_at: string;
  updated_at: string;

  // Relations
  category?: ArticleCategory | null;
  author?: {
    id:         string;
    name:       string;
    role:       string;
    avatar_url: string | null;
  };
}

// ─── Réponses API ─────────────────────────────────────────────────────────────
export interface ArticlesResponse {
  data: Article[];
  meta: {
    current_page: number;
    last_page:    number;
    per_page:     number;
    total:        number;
  };
}

// ─── Filtres liste ────────────────────────────────────────────────────────────
export interface ArticleFilters {
  search?:      string;
  category?:    string;        // slug
  difficulty?:  ArticleDifficulty | 'all';
  audience?:    string;
  featured?:    boolean;
  page?:        number;
}

// ─── Payload création / édition ───────────────────────────────────────────────
export interface ArticlePayload {
  category_id?:        string | null;
  title:               string;
  slug?:               string;        // auto-généré si absent
  description?:        string | null;
  content:             string;
  difficulty?:         ArticleDifficulty;
  estimated_read_time?: number | null;
  target_audience?:    string[] | null;
  related_links?:      RelatedLink[] | null;
  attachments?:        Attachment[]  | null;
  checklist?:          Checklist     | null;
  timeline?:           TimelineStep[]| null;
  costs?:              CostItem[]    | null;
  changelog?:          string | null;
  is_published?:       boolean;
  is_featured?:        boolean;
}
