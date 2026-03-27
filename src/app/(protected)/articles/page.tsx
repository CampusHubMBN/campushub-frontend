// src/app/(protected)/articles/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { articlesApi } from '@/services/api/articles.api';
import { useAuthStore } from '@/store/auth.store';
import {
  ArticleDifficulty,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  ARTICLE_AUTHOR_ROLES,
} from '@/types/article';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Clock,
  BookOpen,
  ChevronRight,
  Star,
  LayoutGrid,
  Filter,
  Pencil,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  orientation:    '🎓',
  'vie-etudiante':'🏠',
  emploi:         '💼',
  international:  '🌍',
  administratif:  '📋',
  bourses:        '💰',
  sante:          '💚',
  default:        '📄',
};

// ─── Skeletons ────────────────────────────────────────────────────────────────
function ArticleCardSkeleton() {
  return (
    <Card className="border-campus-gray-200">
      <CardContent className="p-5 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full bg-campus-gray-200" />
          <Skeleton className="h-5 w-16 rounded-full bg-campus-gray-200" />
        </div>
        <Skeleton className="h-6 w-4/5 bg-campus-gray-200" />
        <Skeleton className="h-4 w-full bg-campus-gray-200" />
        <Skeleton className="h-4 w-2/3 bg-campus-gray-200" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-3 w-16 bg-campus-gray-200" />
          <Skeleton className="h-3 w-20 bg-campus-gray-200" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Article card ─────────────────────────────────────────────────────────────
function ArticleCard({ article, canEdit }: { article: any; canEdit: boolean }) {
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push(`/articles/${article.id}`)}
      className={cn(
        'border-campus-gray-200 shadow-sm cursor-pointer transition-all group',
        'hover:border-campus-blue-200 hover:shadow-md hover:-translate-y-0.5',
        article.is_featured && 'border-campus-orange-200'
      )}
    >
      <CardContent className="p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {article.is_featured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-campus-orange-50 text-campus-orange-700 border border-campus-orange-200">
              <Star className="h-3 w-3" />À la une
            </span>
          )}
          {article.category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-campus-blue-50 text-campus-blue border border-campus-blue-100">
              {article.category.icon || CATEGORY_ICONS[article.category.slug] || CATEGORY_ICONS.default}
              {article.category.name}
            </span>
          )}
          {article.difficulty && (
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', DIFFICULTY_COLORS[article.difficulty as ArticleDifficulty])}>
              {DIFFICULTY_LABELS[article.difficulty as ArticleDifficulty]}
            </span>
          )}
          {/* Brouillon visible seulement pour les auteurs */}
          {canEdit && !article.is_published && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-campus-gray-100 text-campus-gray-500 border border-campus-gray-200">
              Brouillon
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-campus-gray-900 mb-1.5 leading-snug line-clamp-2 group-hover:text-campus-blue transition-colors">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="text-sm text-campus-gray-500 line-clamp-2 mb-3">
            {article.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 text-xs text-campus-gray-400">
            {article.estimated_read_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />{article.estimated_read_time} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />{article.views_count} vues
            </span>
            <span>
              {formatDistanceToNow(new Date(article.created_at), { addSuffix: true, locale: fr })}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Bouton éditer au hover — visible seulement pour les auteurs */}
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // ne pas naviguer vers le détail
                  router.push(`/articles/${article.id}/edit`);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50"
                title="Modifier"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronRight className="h-4 w-4 text-campus-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ArticlesPage() {
  const router     = useRouter();
  const { user }   = useAuthStore();
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [activeCategory, setCategory]  = useState<string>('all');
  const [difficulty, setDifficulty]    = useState<ArticleDifficulty | 'all'>('all');
  const [page, setPage]                = useState(1);

  // Vérifie si l'utilisateur peut rédiger
  const canWrite = user && ARTICLE_AUTHOR_ROLES.includes(user.role as any);

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).__searchTimeout);
    (window as any).__searchTimeout = setTimeout(() => {
      setDebounced(value);
      setPage(1);
    }, 400);
  };

  // Queries
  const { data: categoriesData } = useQuery({
    queryKey: ['article-categories'],
    queryFn:  articlesApi.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['articles', { search: debouncedSearch, category: activeCategory, difficulty, page }],
    queryFn:  () => articlesApi.getArticles({
      search:     debouncedSearch || undefined,
      category:   activeCategory !== 'all' ? activeCategory : undefined,
      difficulty: difficulty !== 'all' ? difficulty : undefined,
      page,
    }),
  });

  const categories = categoriesData ?? [];
  const articles   = data?.data ?? [];
  const meta       = data?.meta;

  return (
    <div className="min-h-screen bg-campus-gray-50">

      {/* ── Hero header ── */}
      <div className="bg-white border-b border-campus-gray-200">
        <div className="container mx-auto px-4 py-10 max-w-5xl">

          {/* Titre + bouton rédiger */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5 text-campus-blue" />
                <span className="text-sm font-medium text-campus-blue">Base de connaissances</span>
              </div>
              <h1 className="text-3xl font-bold text-campus-gray-900">Articles & Guides</h1>
            </div>

            {/* ✅ Bouton visible uniquement pour pedagogical et bde_member */}
            {canWrite && (
              <Button
                onClick={() => router.push('/articles/new/edit')}
                className="bg-campus-blue hover:bg-campus-blue-600 text-white flex-shrink-0 gap-2"
              >
                <Plus className="h-4 w-4" />
                Rédiger un article
              </Button>
            )}
          </div>

          <p className="text-campus-gray-500 mb-6">
            Ressources rédigées par l'administration pour vous accompagner tout au long de votre parcours.
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-campus-gray-400" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher un article, un guide..."
              className="pl-10 border-campus-gray-300 focus-visible:ring-campus-blue bg-campus-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex gap-8">

          {/* ── Sidebar filtres ── */}
          <aside className="w-52 flex-shrink-0 hidden md:block">

            {/* Catégories */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-campus-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />Catégories
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
                    Tous les articles
                    {meta && (
                      <span className="ml-auto float-right text-xs text-campus-gray-400">{meta.total}</span>
                    )}
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
                      <span>{cat.icon || CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS.default}</span>
                      <span className="flex-1 truncate">{cat.name}</span>
                      {cat.articles_count !== undefined && (
                        <span className="text-xs text-campus-gray-400">{cat.articles_count}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Difficulté */}
            <div>
              <p className="text-xs font-semibold text-campus-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />Niveau
              </p>
              <ul className="space-y-0.5">
                {(['all', 'easy', 'medium', 'complex'] as const).map((d) => (
                  <li key={d}>
                    <button
                      onClick={() => { setDifficulty(d); setPage(1); }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                        difficulty === d
                          ? 'bg-campus-blue-50 text-campus-blue font-medium'
                          : 'text-campus-gray-600 hover:bg-campus-gray-100'
                      )}
                    >
                      {d === 'all' ? 'Tous les niveaux' : DIFFICULTY_LABELS[d]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── Grille articles ── */}
          <main className="flex-1 min-w-0">

            {/* Résultats header */}
            {!isLoading && (
              <p className="text-sm text-campus-gray-500 mb-4">
                {meta?.total ?? articles.length} article{(meta?.total ?? articles.length) > 1 ? 's' : ''}
                {debouncedSearch && ` pour "${debouncedSearch}"`}
                {activeCategory !== 'all' && ` · ${categories.find(c => c.slug === activeCategory)?.name}`}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
                : articles.length === 0
                ? (
                  <div className="col-span-2 py-16 text-center">
                    <BookOpen className="h-12 w-12 text-campus-gray-300 mx-auto mb-3" />
                    <p className="text-campus-gray-500 font-medium">Aucun article trouvé</p>
                    <p className="text-sm text-campus-gray-400 mt-1 mb-5">
                      Essayez d'autres mots-clés ou filtres
                    </p>
                    {/* CTA rédiger si aucun article et user auteur */}
                    {canWrite && (
                      <Button
                        onClick={() => router.push('/articles/new/edit')}
                        className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Rédiger le premier article
                      </Button>
                    )}
                  </div>
                )
                : articles.map((article) => (
                  <ArticleCard key={article.id} article={article} canEdit={!!canWrite} />
                ))
              }
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-lg border border-campus-gray-300 text-campus-gray-600 hover:bg-campus-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="text-sm text-campus-gray-500">
                  Page {page} / {meta.last_page}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={page === meta.last_page}
                  className="px-4 py-2 text-sm rounded-lg border border-campus-gray-300 text-campus-gray-600 hover:bg-campus-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
