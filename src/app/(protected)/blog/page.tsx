// src/app/(protected)/blog/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { postsApi } from '@/services/api/posts.api';
import { Post, PostType } from '@/types/post';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Plus, MessageSquare, Eye, ThumbsUp,
  Filter, HelpCircle,
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
  const isQuestion = post.type === 'question';

  return (
    <div
      onClick={() => router.push(`/blog/${post.id}`)}
      className="bg-white border border-campus-gray-200 rounded-xl p-4 cursor-pointer hover:border-campus-blue-200 hover:shadow-sm transition-all"
    >
      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={storageUrl(post.author?.avatar_url) ?? undefined} />
          <AvatarFallback className="bg-campus-blue text-white text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-campus-gray-900">{post.author?.name}</span>
          <p className="text-xs text-campus-gray-400">
            {formatDistanceToNow(
              new Date(post.published_at ?? post.created_at),
              { addSuffix: true, locale: fr }
            )}
            {post.category && (
              <span>
                {' · '}
                <span
                  className="inline-block text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none"
                  style={{ backgroundColor: post.category.color }}
                >
                  {post.category.name}
                </span>
              </span>
            )}
          </p>
        </div>
        {isQuestion ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-campus-orange bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex-shrink-0">
            <HelpCircle className="h-3 w-3" />Question
          </span>
        ) : (
          <span className="text-xs font-medium text-campus-blue bg-campus-blue-50 border border-campus-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
            Post
          </span>
        )}
      </div>

      {/* Content row: text left, thumbnail right */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-campus-gray-900 leading-snug mb-1 hover:text-campus-blue transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-campus-gray-500 line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.slice(0, 4).map((tag) => (
                <span key={tag}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-campus-gray-500 bg-campus-gray-100 px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail */}
        {post.cover_image_url && (
          <div className="flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden">
            <img
              src={storageUrl(post.cover_image_url)}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-xs text-campus-gray-400 border-t border-campus-gray-100 pt-3 mt-3">
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />{post.views_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {post.comments_count} {isQuestion ? 'réponse' : 'commentaire'}{post.comments_count > 1 ? 's' : ''}
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
    <div className="bg-white border border-campus-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-9 rounded-full bg-campus-gray-200" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-28 bg-campus-gray-200" />
          <Skeleton className="h-3 w-20 bg-campus-gray-200" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5 bg-campus-gray-200" />
          <Skeleton className="h-3.5 w-full bg-campus-gray-200" />
          <Skeleton className="h-3.5 w-2/3 bg-campus-gray-200" />
        </div>
        <Skeleton className="h-16 w-20 rounded-lg bg-campus-gray-200 flex-shrink-0" />
      </div>
      <div className="flex gap-4 pt-2 border-t border-campus-gray-100">
        <Skeleton className="h-3 w-10 bg-campus-gray-200" />
        <Skeleton className="h-3 w-16 bg-campus-gray-200" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const router     = useRouter();
  const { user }   = useAuthStore();
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [activeCategory, setCategory]  = useState('all');
  const [activeTag, setTag]            = useState('');
  const [activeType, setType]          = useState<PostType | 'all'>('all');
  const [page, setPage]                = useState(1);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__blogSearchTimeout);
    (window as any).__blogSearchTimeout = setTimeout(() => {
      setDebounced(val);
      setPage(1);
    }, 400);
  };

  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories'],
    queryFn:  postsApi.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['posts', { search: debouncedSearch, category: activeCategory, tag: activeTag, type: activeType, page }],
    queryFn: () => postsApi.getPosts({
      search:   debouncedSearch || undefined,
      category: activeCategory !== 'all' ? activeCategory : undefined,
      tag:      activeTag || undefined,
      type:     activeType !== 'all' ? activeType : undefined,
      page,
    }),
  });

  const categories = categoriesData ?? [];
  const posts      = data?.data ?? [];
  const meta       = data?.meta;

  return (
    <div className="min-h-screen bg-campus-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-campus-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-campus-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-10 border-campus-gray-300 focus-visible:ring-campus-blue bg-campus-gray-50 h-9"
                />
              </div>
            </div>
            <Button
              onClick={() => router.push('/blog/new/edit')}
              className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-1.5 h-9"
            >
              <Plus className="h-4 w-4" />Publier
            </Button>
          </div>

          {/* Type tabs + count */}
          <div className="flex items-center gap-1 mt-3">
            {([
              { value: 'all',      label: 'Tous' },
              { value: 'post',     label: 'Posts' },
              { value: 'question', label: 'Questions', icon: <HelpCircle className="h-3.5 w-3.5" /> },
            ] as { value: PostType | 'all'; label: string; icon?: React.ReactNode }[]).map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setType(tab.value); setPage(1); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  activeType === tab.value
                    ? 'bg-campus-blue text-white'
                    : 'text-campus-gray-600 hover:text-campus-blue hover:bg-campus-blue-50'
                )}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
            {!isLoading && meta && (
              <span className="ml-auto text-xs text-campus-gray-400">{meta.total} résultat{meta.total > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex gap-6">

          {/* ── Sidebar filtres ── */}
          <aside className="w-44 flex-shrink-0 hidden md:block">
            <div className="bg-white border border-campus-gray-200 rounded-xl p-4 sticky top-[88px]">
              <p className="text-xs font-semibold text-campus-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />Catégories
              </p>
              <ul className="space-y-0.5">
                <li>
                  <button
                    onClick={() => { setCategory('all'); setPage(1); }}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded-lg text-sm transition-colors',
                      activeCategory === 'all'
                        ? 'bg-campus-blue-50 text-campus-blue font-medium'
                        : 'text-campus-gray-600 hover:bg-campus-gray-100'
                    )}
                  >
                    Tous
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => { setCategory(cat.slug); setPage(1); }}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2',
                        activeCategory === cat.slug
                          ? 'bg-campus-blue-50 text-campus-blue font-medium'
                          : 'text-campus-gray-600 hover:bg-campus-gray-100'
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 truncate text-xs">{cat.name}</span>
                      {cat.posts_count !== undefined && (
                        <span className="text-xs text-campus-gray-400">{cat.posts_count}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-4 border-t border-campus-gray-100">
                <Button
                  size="sm"
                  className="w-full bg-campus-blue hover:bg-campus-blue-600 text-white text-xs"
                  onClick={() => router.push('/blog/new/edit')}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />Écrire
                </Button>
              </div>
            </div>
          </aside>

          {/* ── Feed ── */}
          <main className="flex-1 min-w-0 space-y-3">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <PostCardSkeleton key={i} />)
              : posts.length === 0
              ? (
                <div className="bg-white border border-campus-gray-200 rounded-xl py-14 text-center">
                  <MessageSquare className="h-10 w-10 text-campus-gray-300 mx-auto mb-3" />
                  <p className="text-campus-gray-500 font-medium">Aucun post trouvé</p>
                  <p className="text-sm text-campus-gray-400 mt-1 mb-5">
                    Soyez le premier à partager quelque chose !
                  </p>
                  <Button
                    className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-2"
                    onClick={() => router.push('/blog/new/edit')}
                  >
                    <Plus className="h-4 w-4" />Publier
                  </Button>
                </div>
              )
              : posts.map((post) => <PostCard key={post.id} post={post} />)
            }

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 pt-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-lg border border-campus-gray-300 text-campus-gray-600 hover:bg-campus-gray-50 disabled:opacity-40"
                >
                  Précédent
                </button>
                <span className="text-sm text-campus-gray-500">{page} / {meta.last_page}</span>
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
