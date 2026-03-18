// src/app/(protected)/dashboard/articles/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/services/api/articles.api';
import { useAuthStore } from '@/store/auth.store';
import { ARTICLE_AUTHOR_ROLES } from '@/types/article';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Pencil, Eye, Trash2, ToggleLeft, ToggleRight,
  BookOpen, Clock, FileText, Globe, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
      <Skeleton className="h-7 w-20 bg-campus-gray-200" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardArticlesPage() {
  const router      = useRouter();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Redirect si pas auteur
  if (user && !ARTICLE_AUTHOR_ROLES.includes(user.role as any)) {
    router.replace('/dashboard');
    return null;
  }

  // ── Query : mes articles uniquement ──────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['my-articles', filter],
    queryFn: () => articlesApi.getArticles({
      // mine=true → backend retourne tous les articles de l'auteur connecté
      ...(({ mine: true, status: filter !== 'all' ? filter : undefined }) as any),
    }),
    enabled: !!user,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (id: string) => articlesApi.togglePublish(id),
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success(article.is_published ? 'Article publié !' : 'Article dépublié');
    },
    onError: () => toast.error('Erreur lors du changement de statut'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => articlesApi.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Supprimer "${title}" ? Cette action est irréversible.`)) return;
    deleteMutation.mutate(id);
  };

  const articles = data?.data ?? [];
  const total    = data?.meta?.total ?? 0;

  // Compteurs pour les onglets
  const counts = {
    all:       total,
    published: articles.filter((a) => a.is_published).length,
    draft:     articles.filter((a) => !a.is_published).length,
  };

  return (
    <div className="min-h-screen bg-campus-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-campus-gray-900">Mes articles</h1>
            <p className="text-campus-gray-500 text-sm mt-0.5">
              Gérez vos articles publiés et brouillons
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/articles/new/edit')}
            className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvel article
          </Button>
        </div>

        {/* ── Onglets filtre ── */}
        <div className="flex gap-1 mb-5 bg-campus-gray-100 rounded-lg p-1 w-fit">
          {([
            { key: 'all',       label: 'Tous',     icon: FileText   },
            { key: 'published', label: 'Publiés',  icon: Globe      },
            { key: 'draft',     label: 'Brouillons', icon: Clock    },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
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

        {/* ── Liste ── */}
        <Card className="border-campus-gray-300 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-campus-gray-100">
              {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : articles.length === 0 ? (
            <CardContent className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-campus-gray-300 mx-auto mb-3" />
              <p className="text-campus-gray-500 font-medium mb-1">
                {filter === 'draft' ? 'Aucun brouillon' : filter === 'published' ? 'Aucun article publié' : 'Aucun article'}
              </p>
              <p className="text-sm text-campus-gray-400 mb-5">
                Commencez à rédiger votre premier article
              </p>
              <Button
                onClick={() => router.push('/dashboard/articles/new/edit')}
                className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-2"
              >
                <Plus className="h-4 w-4" />Nouvel article
              </Button>
            </CardContent>
          ) : (
            <div className="divide-y divide-campus-gray-100">
              {articles.map((article) => (
                <div key={article.id} className="flex items-center gap-4 py-4 px-5 hover:bg-campus-gray-50/50 transition-colors group">

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-campus-gray-900 truncate">
                        {article.title}
                      </p>
                      {article.is_featured && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-campus-orange-50 text-campus-orange-700 border border-campus-orange-200 flex-shrink-0">
                          À la une
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-campus-gray-400">
                      {article.category && (
                        <span className="text-campus-blue">{article.category.name}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />{article.views_count}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                  </div>

                  {/* Statut */}
                  <Badge className={cn(
                    'text-xs border flex-shrink-0',
                    article.is_published
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-campus-gray-100 text-campus-gray-600 border-campus-gray-300'
                  )}>
                    {article.is_published ? 'Publié' : 'Brouillon'}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">

                    {/* Toggle publish */}
                    <button
                      title={article.is_published ? 'Dépublier' : 'Publier'}
                      onClick={() => toggleMutation.mutate(article.id)}
                      disabled={toggleMutation.isPending && toggleMutation.variables === article.id}
                      className={cn(
                        'h-7 px-2 rounded text-xs flex items-center gap-1 transition-colors border',
                        article.is_published
                          ? 'text-campus-gray-500 border-campus-gray-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50'
                          : 'text-green-600 border-green-200 hover:bg-green-50'
                      )}
                    >
                      {article.is_published
                        ? <><ToggleLeft className="h-3.5 w-3.5" />Dépublier</>
                        : <><ToggleRight className="h-3.5 w-3.5" />Publier</>
                      }
                    </button>

                    {/* Voir */}
                    {article.is_published && (
                      <button
                        title="Voir l'article"
                        onClick={() => router.push(`/articles/${article.slug}`)}
                        className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Éditer */}
                    <button
                      title="Modifier"
                      onClick={() => router.push(`/dashboard/articles/${article.id}/edit`)}
                      className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* Supprimer */}
                    <button
                      title="Supprimer"
                      onClick={() => handleDelete(article.id, article.title)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === article.id}
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

        {/* Note explicative */}
        <div className="mt-4 flex items-start gap-2 text-xs text-campus-gray-500">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <p>
            Les brouillons sont visibles uniquement par vous. Publiez un article pour le rendre accessible à tous les utilisateurs.
          </p>
        </div>
      </div>
    </div>
  );
}
