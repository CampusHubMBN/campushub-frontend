// src/services/api/articles.api.ts
import { api } from '@/lib/axios';
import {
  Article,
  ArticleCategory,
  ArticlesResponse,
  ArticleFilters,
  ArticlePayload,
} from '@/types/article';

export const articlesApi = {
  // ── Lecture publique ──────────────────────────────────────────────────────

  getArticles: async (filters?: ArticleFilters): Promise<ArticlesResponse> => {
    const response = await api.get<ArticlesResponse>('/articles', { params: filters });
    return response.data;
  },

  /** Lecture par slug — utilisé côté public (page détail) */
  getArticle: async (slug: string): Promise<Article> => {
    const response = await api.get<{ data: Article }>(`/articles/${slug}`);
    return response.data.data;
  },

  /**
   * Lecture par ID — utilisé côté admin (page édition)
   * Le backend reçoit l'UUID mais la route {slug} accepte aussi les UUIDs
   * car findOrFail cherche sur la colonne `slug` OR `id` selon le controller.
   * Si ton controller cherche uniquement par slug, utilise getArticleBySlug.
   */
  getArticleById: async (id: string): Promise<Article> => {
    const response = await api.get<{ data: Article }>(`/articles/${id}`);
    return response.data.data;
  },

  getFeatured: async (): Promise<Article[]> => {
    const response = await api.get<{ data: Article[] }>('/articles/featured');
    return response.data.data;
  },

  getCategories: async (): Promise<ArticleCategory[]> => {
    const response = await api.get<{ data: ArticleCategory[] }>('/article-categories');
    return response.data.data;
  },

  // ── Écriture (pedagogical | bde_member) ──────────────────────────────────

  createArticle: async (payload: ArticlePayload): Promise<Article> => {
    const response = await api.post<{ data: Article }>('/articles', payload);
    return response.data.data;
  },

  updateArticle: async (id: string, payload: Partial<ArticlePayload>): Promise<Article> => {
    const response = await api.patch<{ data: Article }>(`/articles/${id}`, payload);
    return response.data.data;
  },

  deleteArticle: async (id: string): Promise<void> => {
    await api.delete(`/articles/${id}`);
  },

  togglePublish: async (id: string): Promise<Article> => {
    const response = await api.post<{ data: Article }>(`/articles/${id}/toggle-publish`);
    return response.data.data;
  },

  markHelpful: async (slug: string): Promise<void> => {
    await api.post(`/articles/${slug}/helpful`);
  },
};
