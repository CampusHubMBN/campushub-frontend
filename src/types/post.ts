// src/types/post.ts

export type PostStatus = 'draft' | 'published';
export type PostType   = 'post' | 'question';
export type ReactionType = 'like' | 'useful' | 'bravo';

export const REACTION_LABELS: Record<ReactionType, string> = {
  like:   '👍',
  useful: '💡',
  bravo:  '👏',
};

export const REACTION_NAMES: Record<ReactionType, string> = {
  like:   'Like',
  useful: 'Utile',
  bravo:  'Bravo',
};

export interface BlogCategory {
  id:            string;
  name:          string;
  slug:          string;
  color:         string;
  display_order: number;
  posts_count?:  number;
}

export interface PostAuthor {
  id:         string;
  name:       string;
  role:       string;
  avatar_url: string | null;
}

export interface Post {
  id:              string;
  author_id:       string;
  category_id:     string | null;
  type:            PostType;
  title:           string;
  slug:            string;
  excerpt:         string | null;
  content:         string;
  cover_image_url: string | null;
  tags:            string[];

  // Stats
  views_count:    number;
  comments_count: number;
  likes_count:    number;
  useful_count:   number;
  bravo_count:    number;

  // Computed
  user_reaction: ReactionType | null;
  is_own_post:   boolean;

  // Status
  status:       PostStatus;
  published_at: string | null;
  created_at:   string;
  updated_at:   string;

  // Relations
  author?:   PostAuthor;
  category?: BlogCategory | null;
}

export interface PostsResponse {
  data: Post[];
  meta: {
    current_page: number;
    last_page:    number;
    per_page:     number;
    total:        number;
  };
}

export interface Comment {
  id:                  string;
  post_id:             string;
  parent_id:           string | null;
  content:             string | null;
  is_deleted:          boolean;
  replies_count:       number;
  votes_count:         number;
  is_accepted_answer:  boolean;
  user_vote:           1 | -1 | null;
  is_own:              boolean;
  created_at:          string;
  updated_at:          string;
  author?: PostAuthor;
  replies?: Comment[];
}

export interface CommentsResponse {
  data: Comment[];
  meta: {
    current_page: number;
    last_page:    number;
    per_page:     number;
    total:        number;
  };
}

export interface PostFilters {
  search?:    string;
  category?:  string;
  tag?:       string;
  author_id?: string;
  mine?:      boolean;
  status?:    PostStatus;
  type?:      PostType;
  page?:      number;
}

export interface PostPayload {
  title:           string;
  slug?:           string;
  excerpt?:        string | null;
  content:         string;
  category_id?:    string | null;
  tags?:           string[];
  status?:         PostStatus;
  type?:           PostType;
}

export interface ReactPayload {
  type: ReactionType;
}
