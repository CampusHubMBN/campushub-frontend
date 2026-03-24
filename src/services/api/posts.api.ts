// src/services/api/posts.api.ts
import { api } from '@/lib/axios';
import {
  Post, PostsResponse, PostFilters, PostPayload,
  BlogCategory, CommentsResponse, Comment, ReactPayload,
} from '@/types/post';

export const postsApi = {
  // ── Lecture ──────────────────────────────────────────────────────────────

  getPosts: async (filters?: PostFilters): Promise<PostsResponse> => {
    const response = await api.get<PostsResponse>('/posts', { params: filters });
    return response.data;
  },

  getPost: async (slug: string): Promise<Post> => {
    const response = await api.get<{ data: Post }>(`/posts/${slug}`);
    return response.data.data;
  },

  getCategories: async (): Promise<BlogCategory[]> => {
    const response = await api.get<{ data: BlogCategory[] }>('/blog-categories');
    return response.data.data;
  },

  getComments: async (postId: string, page = 1): Promise<CommentsResponse> => {
    const response = await api.get<CommentsResponse>(
      `/posts/${postId}/comments`,
      { params: { page } }
    );
    return response.data;
  },

  getReplies: async (commentId: string, page = 1): Promise<CommentsResponse> => {
    const response = await api.get<CommentsResponse>(
      `/comments/${commentId}/replies`,
      { params: { page } }
    );
    return response.data;
  },

  // ── Écriture ─────────────────────────────────────────────────────────────

  createPost: async (payload: PostPayload): Promise<Post> => {
    const response = await api.post<{ data: Post }>('/posts', payload);
    return response.data.data;
  },

  updatePost: async (id: string, payload: Partial<PostPayload>): Promise<Post> => {
    const response = await api.patch<{ data: Post }>(`/posts/${id}`, payload);
    return response.data.data;
  },

  deletePost: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  togglePublish: async (id: string): Promise<Post> => {
    const response = await api.post<{ data: Post }>(`/posts/${id}/toggle-publish`);
    return response.data.data;
  },

  uploadCover: async (id: string, file: File): Promise<{ cover_image_url: string }> => {
    const formData = new FormData();
    formData.append('cover_image', file);
    const response = await api.post(`/posts/${id}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // ── Réactions ─────────────────────────────────────────────────────────────

  react: async (postId: string, payload: ReactPayload): Promise<{
    likes_count:   number;
    useful_count:  number;
    bravo_count:   number;
    user_reaction: string | null;
  }> => {
    const response = await api.post(`/posts/${postId}/react`, payload);
    return response.data.data;
  },

  // ── Commentaires ──────────────────────────────────────────────────────────

  addComment: async (postId: string, content: string, parentId?: string): Promise<Comment> => {
    const response = await api.post<{ data: Comment }>(`/posts/${postId}/comments`, {
      content,
      parent_id: parentId ?? null,
    });

    return response.data.data;
  },

  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    const response = await api.patch<{ data: Comment }>(`/comments/${commentId}`, { content });
    return response.data.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },
};
