// src/app/(protected)/articles/[slug]/page.tsx
'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { articlesApi } from '@/services/api/articles.api';
import { useAuthStore } from '@/store/auth.store';
import {
  DIFFICULTY_LABELS, DIFFICULTY_COLORS,
  TimelineStep, RelatedLink, ARTICLE_AUTHOR_ROLES,
} from '@/types/article';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Clock, Eye, ThumbsUp, Calendar, User, Tag,
  ExternalLink, BookOpen, Star, Pencil, Link as LinkIcon,
  Play, Wrench, Globe, Info, AlertCircle, Lightbulb, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const LINK_ICONS: Record<string, React.ElementType> = {
  official: Globe, guide: BookOpen, video: Play, tool: Wrench, other: LinkIcon,
};
const LINK_LABELS: Record<string, string> = {
  official: 'Officiel', guide: 'Guide', video: 'Vidéo', tool: 'Outil', other: 'Lien',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ArticleSkeleton() {
  return (
    <div className="min-h-screen bg-campus-gray-50">
      <div className="bg-white border-b border-campus-gray-200">
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
          <Skeleton className="h-4 w-24 bg-campus-gray-200" />
          <Skeleton className="h-9 w-3/4 bg-campus-gray-200" />
          <Skeleton className="h-5 w-2/3 bg-campus-gray-200" />
          <div className="flex gap-3">
            <Skeleton className="h-5 w-20 rounded-full bg-campus-gray-200" />
            <Skeleton className="h-5 w-24 rounded-full bg-campus-gray-200" />
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 bg-campus-gray-200 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function TimelineBlock({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="my-8">
      <h3 className="text-base font-semibold text-campus-gray-900 mb-4 flex items-center gap-2">
        <span className="h-5 w-5 rounded-full bg-campus-blue flex items-center justify-center">
          <Clock className="h-3 w-3 text-white" />
        </span>
        Étapes & calendrier
      </h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-campus-blue-100" />
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.step} className="relative flex gap-4 pb-6 last:pb-0">
              <div className={cn(
                'relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2',
                i === 0 ? 'bg-campus-blue border-campus-blue text-white' : 'bg-white border-campus-blue-200 text-campus-blue-600'
              )}>
                {step.step}
              </div>
              <div className={cn('flex-1 bg-white rounded-lg border p-4 mb-2', i === 0 ? 'border-campus-blue-200' : 'border-campus-gray-200')}>
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-semibold text-campus-gray-900 text-sm">{step.title}</h4>
                  {step.estimated_duration && (
                    <span className="flex-shrink-0 text-xs text-campus-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />{step.estimated_duration}
                    </span>
                  )}
                </div>
                {step.description && (
                  <p className="text-sm text-campus-gray-600 mt-1 leading-relaxed">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Related links ────────────────────────────────────────────────────────────
function RelatedLinksBlock({ links }: { links: RelatedLink[] }) {
  return (
    <div className="my-8">
      <h3 className="text-base font-semibold text-campus-gray-900 mb-4 flex items-center gap-2">
        <span className="h-5 w-5 rounded-full bg-campus-orange flex items-center justify-center">
          <LinkIcon className="h-3 w-3 text-white" />
        </span>
        Liens utiles
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((link, i) => {
          const Icon = LINK_ICONS[link.type] ?? LinkIcon;
          return (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-lg border border-campus-gray-200 hover:border-campus-blue-200 hover:bg-campus-blue-50/40 transition-colors group"
            >
              <div className="h-8 w-8 rounded-lg bg-campus-blue-50 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-campus-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-campus-gray-900 truncate group-hover:text-campus-blue transition-colors">{link.title}</p>
                <p className="text-xs text-campus-gray-400">{LINK_LABELS[link.type] ?? 'Lien'}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-campus-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug }    = use(params);
  const router      = useRouter();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const [hasVoted, setHasVoted] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn:  () => articlesApi.getArticle(slug),
  });

  const helpfulMutation = useMutation({
    mutationFn: () => articlesApi.markHelpful(slug),
    onSuccess: () => {
      setHasVoted(true);
      queryClient.invalidateQueries({ queryKey: ['article', slug] });
      toast.success('Merci pour votre retour !');
    },
  });

  const canEdit = user && ARTICLE_AUTHOR_ROLES.includes(user.role as any);

  if (isLoading) return <ArticleSkeleton />;

  if (!article) return (
    <div className="min-h-screen bg-campus-gray-50 flex items-center justify-center">
      <div className="text-center">
        <BookOpen className="h-12 w-12 text-campus-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-campus-gray-700 mb-2">Article introuvable</h2>
        <Button className="bg-campus-blue hover:bg-campus-blue-600 text-white" onClick={() => router.push('/articles')}>
          Retour aux articles
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-campus-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-campus-gray-200">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <button onClick={() => router.push('/articles')}
            className="flex items-center gap-1.5 text-sm text-campus-gray-500 hover:text-campus-blue mb-5 -ml-1 transition-colors">
            <ArrowLeft className="h-4 w-4" />Articles & Guides
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {article.is_featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-campus-orange-50 text-campus-orange-700 border border-campus-orange-200">
                <Star className="h-3 w-3" />À la une
              </span>
            )}
            {article.category && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-campus-blue-50 text-campus-blue border border-campus-blue-100">
                {article.category.name}
              </span>
            )}
            {article.difficulty && (
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', DIFFICULTY_COLORS[article.difficulty])}>
                {DIFFICULTY_LABELS[article.difficulty]}
              </span>
            )}
            {article.target_audience?.map((aud) => (
              <span key={aud} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-campus-gray-100 text-campus-gray-600 border border-campus-gray-200">
                <Tag className="h-3 w-3" />{aud}
              </span>
            ))}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-campus-gray-900 mb-3 leading-tight">{article.title}</h1>

          {article.description && (
            <p className="text-campus-gray-500 text-base mb-5 leading-relaxed">{article.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-campus-gray-400 border-t border-campus-gray-100 pt-4">
            {article.author && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{article.author.name}</span>}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(article.created_at), 'd MMMM yyyy', { locale: fr })}
            </span>
            {article.estimated_read_time && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{article.estimated_read_time} min</span>}
            <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{article.views_count} vues</span>
            {article.version > 1 && <span className="text-xs px-2 py-0.5 bg-campus-gray-100 rounded-full">v{article.version}</span>}
            {canEdit && (
              <Button variant="outline" size="sm"
                className="ml-auto border-campus-gray-300 text-campus-gray-600 hover:border-campus-blue hover:text-campus-blue"
                onClick={() => router.push(`/dashboard/articles/${article.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />Modifier
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex gap-8">
          <article className="flex-1 min-w-0">

            {/* ✅ HTML enrichi avec styles call-out via Tailwind arbitrary */}
            <div
              className={cn(
                'prose prose-sm max-w-none',
                // Headings
                'prose-headings:text-campus-gray-900 prose-headings:font-semibold',
                // Paragraphes
                'prose-p:text-campus-gray-700 prose-p:leading-relaxed',
                // Liens
                'prose-a:text-campus-blue prose-a:no-underline hover:prose-a:underline',
                // Gras / listes
                'prose-strong:text-campus-gray-900 prose-li:text-campus-gray-700',
                // Citation
                'prose-blockquote:border-l-4 prose-blockquote:border-campus-blue prose-blockquote:pl-4 prose-blockquote:text-campus-gray-600 prose-blockquote:not-italic',
                // Code
                'prose-code:text-campus-blue-700 prose-code:bg-campus-blue-50 prose-code:rounded prose-code:px-1 prose-code:before:content-none prose-code:after:content-none',
                // Images
                'prose-img:rounded-lg prose-img:shadow-sm prose-img:mx-auto',
                // ✅ Call-out blocs
                '[&_div[data-callout]]:rounded-lg [&_div[data-callout]]:border [&_div[data-callout]]:p-4 [&_div[data-callout]]:my-4 [&_div[data-callout]]:not-prose',
                '[&_div[data-type=info]]:bg-campus-blue-50 [&_div[data-type=info]]:border-campus-blue-200 [&_div[data-type=info]]:text-campus-blue-800',
                '[&_div[data-type=warning]]:bg-campus-orange-50 [&_div[data-type=warning]]:border-campus-orange-200 [&_div[data-type=warning]]:text-campus-orange-800',
                '[&_div[data-type=tip]]:bg-green-50 [&_div[data-type=tip]]:border-green-200 [&_div[data-type=tip]]:text-green-800',
                '[&_div[data-type=success]]:bg-emerald-50 [&_div[data-type=success]]:border-emerald-200 [&_div[data-type=success]]:text-emerald-800',
              )}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {article.timeline && article.timeline.length > 0 && <TimelineBlock steps={article.timeline} />}
            {article.related_links && article.related_links.length > 0 && <RelatedLinksBlock links={article.related_links} />}

            {/* Vote utile */}
            <div className="mt-10 pt-8 border-t border-campus-gray-200 text-center">
              <p className="text-sm text-campus-gray-500 mb-3">Cet article vous a été utile ?</p>
              <Button
                variant="outline"
                onClick={() => !hasVoted && helpfulMutation.mutate()}
                disabled={hasVoted || helpfulMutation.isPending}
                className={cn('border-campus-gray-300 gap-2',
                  hasVoted ? 'border-campus-orange-200 text-campus-orange-700 bg-campus-orange-50' : 'hover:border-campus-blue hover:text-campus-blue'
                )}
              >
                <ThumbsUp className="h-4 w-4" />
                {hasVoted ? 'Merci !' : `Oui, utile (${article.helpful_count})`}
              </Button>
              {article.last_reviewed_at && (
                <p className="text-xs text-campus-gray-400 mt-4">
                  Dernière mise à jour : {format(new Date(article.last_reviewed_at), 'd MMMM yyyy', { locale: fr })}
                </p>
              )}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <Card className="border-campus-gray-200 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-semibold text-campus-gray-500 uppercase tracking-wider">Infos</p>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Vues',    val: article.views_count },
                      { label: 'Utile',   val: article.helpful_count },
                      ...(article.estimated_read_time ? [{ label: 'Lecture', val: `${article.estimated_read_time} min` }] : []),
                      { label: 'Version', val: `v${article.version}` },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-campus-gray-500">{label}</span>
                        <span className="font-medium text-campus-gray-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {article.target_audience && article.target_audience.length > 0 && (
                <Card className="border-campus-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-campus-gray-500 uppercase tracking-wider mb-2">Public cible</p>
                    <div className="flex flex-col gap-1.5">
                      {article.target_audience.map((aud) => (
                        <span key={aud} className="text-xs text-campus-gray-600 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-campus-blue flex-shrink-0" />{aud}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button variant="ghost" size="sm"
                className="w-full text-campus-gray-500 hover:text-campus-blue hover:bg-campus-blue-50"
                onClick={() => router.push('/articles')}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Tous les articles
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
