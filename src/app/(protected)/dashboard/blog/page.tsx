// src/app/(protected)/dashboard/blog/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/services/api/posts.api';
import { useAuthStore } from '@/store/auth.store';
import { Post } from '@/types/post';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus, Pencil, Eye, Trash2, ToggleLeft, ToggleRight,
  MessageSquare, ThumbsUp, Clock, Globe, FileText, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 px-5">
      <Skeleton className="h-4 w-4/12 bg-campus-gray-200" />
      <Skeleton className="h-5 w-16 rounded-full bg-campus-gray-200" />
      <Skeleton className="h-4 w-2/12 bg-campus-gray-200 ml-auto" />
      <Skeleton className="h-7 w-24 bg-campus-gray-200" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardBlogPage() {
  const router      = useRouter();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['my-posts', filter],
    queryFn: () => postsApi.getPosts({
      mine:   true,
      status: filter !== 'all' ? filter : undefined,
    }),
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => postsApi.togglePublish(id),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success(post.status === 'published' ? 'Post publié !' : 'Post dépublié');
    },
    onError: () => toast.error('Erreur lors du changement de statut'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => postsApi.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      toast.success('Post supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Supprimer "${title}" ?`)) return;
    deleteMutation.mutate(id);
  };

  const posts  = data?.data ?? [];
  const total  = data?.meta?.total ?? 0;
  const counts = {
    all:       total,
    published: posts.filter((p) => p.status === 'published').length,
    draft:     posts.filter((p) => p.status === 'draft').length,
  };

  return (
    <div className="min-h-screen bg-campus-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-campus-gray-900">Mes posts</h1>
            <p className="text-campus-gray-500 text-sm mt-0.5">
              Gérez vos publications et brouillons
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/blog/new/edit')}
            className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-2"
          >
            <Plus className="h-4 w-4" />Nouveau post
          </Button>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mb-5 bg-campus-gray-100 rounded-lg p-1 w-fit">
          {([
            { key: 'all',       label: 'Tous',       icon: FileText },
            { key: 'published', label: 'Publiés',    icon: Globe    },
            { key: 'draft',     label: 'Brouillons', icon: Clock    },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                filter === key
                  ? 'bg-white text-campus-gray-900 shadow-sm'
                  : 'text-campus-gray-500 hover:text-campus-gray-700'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                filter === key ? 'bg-campus-blue-50 text-campus-blue' : 'bg-campus-gray-200 text-campus-gray-500'
              )}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Liste */}
        <Card className="border-campus-gray-300 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-campus-gray-100">
              {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : posts.length === 0 ? (
            <CardContent className="py-16 text-center">
              <Sparkles className="h-12 w-12 text-campus-gray-300 mx-auto mb-3" />
              <p className="text-campus-gray-500 font-medium mb-1">
                {filter === 'draft' ? 'Aucun brouillon' : filter === 'published' ? 'Aucun post publié' : 'Aucun post'}
              </p>
              <p className="text-sm text-campus-gray-400 mb-5">
                Partagez vos expériences avec la communauté
              </p>
              <Button
                onClick={() => router.push('/dashboard/blog/new/edit')}
                className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-2"
              >
                <Plus className="h-4 w-4" />Écrire un post
              </Button>
            </CardContent>
          ) : (
            <div className="divide-y divide-campus-gray-100">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center gap-4 py-4 px-5 hover:bg-campus-gray-50/50 group">

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-campus-gray-900 truncate mb-1">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-campus-gray-400">
                      {post.category && (
                        <span
                          className="px-1.5 py-0.5 rounded font-medium text-white text-xs"
                          style={{ backgroundColor: post.category.color }}
                        >
                          {post.category.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />{post.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />{post.comments_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {post.likes_count + post.useful_count + post.bravo_count}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                  </div>

                  {/* Statut */}
                  <Badge className={cn(
                    'text-xs border flex-shrink-0',
                    post.status === 'published'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-campus-gray-100 text-campus-gray-600 border-campus-gray-300'
                  )}>
                    {post.status === 'published' ? 'Publié' : 'Brouillon'}
                  </Badge>

                  {/* Actions au hover */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      title={post.status === 'published' ? 'Dépublier' : 'Publier'}
                      onClick={() => toggleMutation.mutate(post.id)}
                      disabled={toggleMutation.isPending && toggleMutation.variables === post.id}
                      className={cn(
                        'h-7 px-2 rounded text-xs flex items-center gap-1 transition-colors border',
                        post.status === 'published'
                          ? 'text-campus-gray-500 border-campus-gray-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50'
                          : 'text-green-600 border-green-200 hover:bg-green-50'
                      )}
                    >
                      {post.status === 'published'
                        ? <><ToggleLeft className="h-3.5 w-3.5" />Dépublier</>
                        : <><ToggleRight className="h-3.5 w-3.5" />Publier</>
                      }
                    </button>

                    {post.status === 'published' && (
                      <button title="Voir le post"
                        onClick={() => router.push(`/blog/${post.slug}`)}
                        className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button title="Modifier"
                      onClick={() => router.push(`/dashboard/blog/${post.id}/edit`)}
                      className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button title="Supprimer"
                      onClick={() => handleDelete(post.id, post.title)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === post.id}
                      className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
