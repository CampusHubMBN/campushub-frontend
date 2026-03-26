// src/app/(protected)/blog/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { postsApi } from '@/services/api/posts.api';
import { Post } from '@/types/post';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Plus, MessageSquare, Eye, ThumbsUp,
  Lightbulb, HandMetal, Filter, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Post card feed ───────────────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
  const router = useRouter();

  const initials = post.author?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const totalReactions = post.likes_count + post.useful_count + post.bravo_count;

  return (
    <div
      onClick={() => router.push(`/blog/${post.id}`)}
      className="bg-white border border-campus-gray-200 rounded-xl p-5 cursor-pointer hover:border-campus-blue-200 hover:shadow-sm transition-all group"
    >
      {/* Cover image */}
      {post.cover_image_url && (
        <div className="mb-4 -mx-5 -mt-5 rounded-t-xl overflow-hidden">
          <img
            src={storageUrl(post.cover_image_url)}
            alt={post.title}
            className="w-full h-40 object-cover"
          />
        </div>
      )}

      {/* Header auteur */}
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={storageUrl(post.author?.avatar_url) ?? undefined} />
          <AvatarFallback className="bg-campus-blue text-white text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-campus-gray-800">
              {post.author?.name}
            </span>
            {post.category && (
              <>
                <span className="text-campus-gray-300">·</span>
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: post.category.color }}
                >
                  {post.category.name}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-campus-gray-400">
            {formatDistanceToNow(
              new Date(post.published_at ?? post.created_at),
              { addSuffix: true, locale: fr }
            )}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-campus-gray-300 group-hover:text-campus-blue transition-colors" />
      </div>

      {/* Titre */}
      <h3 className="font-semibold text-campus-gray-900 mb-2 leading-snug group-hover:text-campus-blue transition-colors">
        {post.title}
      </h3>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-sm text-campus-gray-500 line-clamp-2 mb-3 leading-relaxed">
          {post.excerpt}
        </p>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag) => (
            <span key={tag}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-campus-gray-500 bg-campus-gray-100 px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-xs text-campus-gray-400 border-t border-campus-gray-100 pt-3 mt-1">
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />{post.views_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />{post.comments_count}
        </span>
        {totalReactions > 0 && (
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" />{totalReactions}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function PostCardSkeleton() {
  return (
    <div className="bg-white border border-campus-gray-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 rounded-full bg-campus-gray-200" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-32 bg-campus-gray-200" />
          <Skeleton className="h-3 w-20 bg-campus-gray-200" />
        </div>
      </div>
      <Skeleton className="h-5 w-4/5 bg-campus-gray-200" />
      <Skeleton className="h-4 w-full bg-campus-gray-200" />
      <Skeleton className="h-4 w-2/3 bg-campus-gray-200" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-3 w-12 bg-campus-gray-200" />
        <Skeleton className="h-3 w-12 bg-campus-gray-200" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const router     = useRouter();
  const { user }   = useAuthStore();
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [activeCategory, setCategory] = useState('all');
  const [activeTag, setTag]           = useState('');
  const [page, setPage]               = useState(1);

  // Debounce search
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__blogSearchTimeout);
    (window as any).__blogSearchTimeout = setTimeout(() => {
      setDebounced(val);
      setPage(1);
    }, 400);
  };

  // Queries
  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories'],
    queryFn:  postsApi.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['posts', { search: debouncedSearch, category: activeCategory, tag: activeTag, page }],
    queryFn: () => postsApi.getPosts({
      search:   debouncedSearch || undefined,
      category: activeCategory !== 'all' ? activeCategory : undefined,
      tag:      activeTag || undefined,
      page,
    }),
  });

  const categories = categoriesData ?? [];
  const posts      = data?.data ?? [];
  const meta       = data?.meta;

  return (
    <div className="min-h-screen bg-campus-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-campus-gray-200">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-campus-gray-900">Blog</h1>
              <p className="text-campus-gray-500 text-sm mt-0.5">
                Expériences, conseils et actualités de la communauté
              </p>
            </div>
            <Button
              onClick={() => router.push('/blog/new/edit')}
              className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-2 flex-shrink-0"
            >
              <Plus className="h-4 w-4" />Écrire
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-campus-gray-400" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher un post..."
              className="pl-10 border-campus-gray-300 focus-visible:ring-campus-blue bg-campus-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex gap-8">

          {/* ── Sidebar filtres ── */}
          <aside className="w-48 flex-shrink-0 hidden md:block space-y-6">

            {/* Catégories */}
            <div>
              <p className="text-xs font-semibold text-campus-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />Catégories
              </p>
              <ul className="space-y-0.5">
                <li>
                  <button
                    onClick={() => { setCategory('all'); setPage(1); }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      activeCategory === 'all'
                        ? 'bg-campus-blue-50 text-campus-blue font-medium'
                        : 'text-campus-gray-600 hover:bg-campus-gray-100'
                    )}
                  >
                    Tous les posts
                    {meta && <span className="ml-auto float-right text-xs text-campus-gray-400">{meta.total}</span>}
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => { setCategory(cat.slug); setPage(1); }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                        activeCategory === cat.slug
                          ? 'bg-campus-blue-50 text-campus-blue font-medium'
                          : 'text-campus-gray-600 hover:bg-campus-gray-100'
                      )}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 truncate">{cat.name}</span>
                      {cat.posts_count !== undefined && (
                        <span className="text-xs text-campus-gray-400">{cat.posts_count}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA écrire */}
            <div className="bg-campus-blue-50 border border-campus-blue-100 rounded-lg p-4">
              <p className="text-sm font-medium text-campus-blue-800 mb-1">Partagez !</p>
              <p className="text-xs text-campus-blue-600 mb-3">
                Vos expériences enrichissent la communauté
              </p>
              <Button
                size="sm"
                className="w-full bg-campus-blue hover:bg-campus-blue-600 text-white"
                onClick={() => router.push('/blog/new/edit')}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />Écrire un post
              </Button>
            </div>
          </aside>

          {/* ── Feed ── */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* Résultats */}
            {!isLoading && (
              <p className="text-sm text-campus-gray-500">
                {meta?.total ?? posts.length} post{(meta?.total ?? posts.length) > 1 ? 's' : ''}
                {debouncedSearch && ` pour "${debouncedSearch}"`}
                {activeCategory !== 'all' && ` · ${categories.find(c => c.slug === activeCategory)?.name}`}
              </p>
            )}

            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)
              : posts.length === 0
              ? (
                <div className="bg-white border border-campus-gray-200 rounded-xl py-16 text-center">
                  <MessageSquare className="h-12 w-12 text-campus-gray-300 mx-auto mb-3" />
                  <p className="text-campus-gray-500 font-medium">Aucun post trouvé</p>
                  <p className="text-sm text-campus-gray-400 mt-1 mb-5">
                    Soyez le premier à partager quelque chose !
                  </p>
                  <Button
                    className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-2"
                    onClick={() => router.push('/blog/new/edit')}
                  >
                    <Plus className="h-4 w-4" />Écrire un post
                  </Button>
                </div>
              )
              : posts.map((post) => <PostCard key={post.id} post={post} />)
            }

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-lg border border-campus-gray-300 text-campus-gray-600 hover:bg-campus-gray-50 disabled:opacity-40"
                >
                  Précédent
                </button>
                <span className="text-sm text-campus-gray-500">
                  {page} / {meta.last_page}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={page === meta.last_page}
                  className="px-4 py-2 text-sm rounded-lg border border-campus-gray-300 text-campus-gray-600 hover:bg-campus-gray-50 disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
