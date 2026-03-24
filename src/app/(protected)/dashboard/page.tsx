// src/app/(protected)/dashboard/page.tsx
'use client';

import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobApplicationsApi } from '@/services/api/job-applications.api';
import { jobsApi } from '@/services/api/jobs.api';
import { articlesApi } from '@/services/api/articles.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarSkeleton } from '@/components/layout/avatar-skeleton';
import {
  Sparkles, Briefcase, Clock, CheckCircle2, TrendingUp,
  ArrowRight, Building2, MapPin, Eye, RotateCcw, ChevronRight,
  FileText, Lightbulb, BookOpen, Pencil, Plus, ToggleRight,
  MessageSquare,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  JobApplication, ApplicationStatus,
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_DOTS, WITHDRAWABLE_STATUSES,
} from '@/types/job-application';
import { Article, ARTICLE_AUTHOR_ROLES, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/types/article';
import { Job } from '@/types/job';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { postsApi } from '@/services/api/posts.api';
import { Post, REACTION_LABELS } from '@/types/post';
import { PostFeedCard } from '@/components/blog/PostFeedCard';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeAppStats(applications: JobApplication[]) {
  return {
    total:       applications.length,
    in_progress: applications.filter((a) => ['pending', 'reviewed', 'shortlisted'].includes(a.status)).length,
    interview:   applications.filter((a) => a.status === 'interview').length,
    accepted:    applications.filter((a) => a.status === 'accepted').length,
  };
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, colorClass, icon: Icon }: {
  label: string; value: string | number; colorClass: string; icon: React.ElementType;
}) {
  return (
    <Card className="border-campus-gray-300 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-campus-gray-900 leading-none mb-0.5">{value}</p>
            <p className="text-xs text-campus-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', APPLICATION_STATUS_COLORS[status])}>
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', APPLICATION_STATUS_DOTS[status])} />
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Application row ──────────────────────────────────────────────────────────
function ApplicationRow({ application, onWithdraw, withdrawing }: {
  application: JobApplication; onWithdraw: (id: string) => void; withdrawing: boolean;
}) {
  const router  = useRouter();
  const job     = application.job;
  const company = job?.company?.name ?? job?.company_name ?? 'Entreprise';
  const canWithdraw = WITHDRAWABLE_STATUSES.includes(application.status);

  return (
    <div className="flex items-center gap-3 py-3 px-1 group">
      <div className="w-9 h-9 rounded-lg border border-campus-gray-200 bg-campus-gray-50 flex items-center justify-center flex-shrink-0">
        <Building2 className="h-4 w-4 text-campus-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-campus-gray-900 truncate leading-snug">{job?.title ?? '—'}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-campus-gray-500 truncate">{company}</span>
          {job?.location_city && (
            <><span className="text-campus-gray-300 text-xs">·</span>
            <span className="text-xs text-campus-gray-400 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{job.location_city}</span></>
          )}
          <span className="text-campus-gray-300 text-xs">·</span>
          <span className="text-xs text-campus-gray-400">
            {formatDistanceToNow(new Date(application.created_at), { addSuffix: true, locale: fr })}
          </span>
          {application.interview_at && (
            <><span className="text-campus-gray-300 text-xs">·</span>
            <span className="text-xs text-campus-blue-600 font-medium">
              Entretien le {new Date(application.interview_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span></>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={application.status} />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50"
            title="Voir l'offre" onClick={() => job && router.push(`/jobs/${job.id}`)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canWithdraw && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-campus-gray-400 hover:text-red-500 hover:bg-red-50"
              title="Retirer la candidature" disabled={withdrawing} onClick={() => onWithdraw(application.id)}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Recommended job card ─────────────────────────────────────────────────────
function RecommendedJobCard({ job }: { job: Job }) {
  const router = useRouter();
  const companyName = job.company?.name ?? job.company_name ?? 'Entreprise';
  const TYPE_LABELS: Record<string, string> = {
    internship: 'Stage', apprenticeship: 'Alternance', cdd: 'CDD', cdi: 'CDI', freelance: 'Freelance',
  };
  return (
    <div onClick={() => router.push(`/jobs/${job.id}`)}
      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-campus-gray-200 hover:border-campus-blue-200 hover:bg-campus-blue-50/40"
    >
      <div className="w-9 h-9 rounded-lg border border-campus-gray-200 bg-white flex items-center justify-center flex-shrink-0">
        {job.company?.logo_url
          ? <img src={job.company.logo_url} alt={companyName} className="w-7 h-7 object-contain" />
          : <Building2 className="h-4 w-4 text-campus-gray-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-campus-gray-900 truncate leading-snug">{job.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-campus-gray-500 truncate">{companyName}</span>
          {job.location_city && <><span className="text-campus-gray-300 text-xs">·</span><span className="text-xs text-campus-gray-400">{job.location_city}</span></>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Badge className="bg-campus-blue-50 text-campus-blue border-campus-blue-100 border text-xs font-medium">
          {TYPE_LABELS[job.type] ?? job.type}
        </Badge>
        <ChevronRight className="h-3.5 w-3.5 text-campus-gray-400" />
      </div>
    </div>
  );
}

// ─── Article card compacte ────────────────────────────────────────────────────
function ArticleCard({ article }: { article: Article }) {
  const router = useRouter();
  return (
    <div onClick={() => router.push(`/articles/${article.slug}`)}
      className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-campus-gray-200 hover:border-campus-blue-200 hover:bg-campus-blue-50/40 group"
    >
      {/* Icône catégorie */}
      <div className="w-8 h-8 rounded-lg bg-campus-blue-50 border border-campus-blue-100 flex items-center justify-center flex-shrink-0 text-sm">
        {article.category?.icon ?? '📄'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-campus-gray-900 truncate leading-snug group-hover:text-campus-blue transition-colors">
          {article.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {article.difficulty && (
            <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', DIFFICULTY_COLORS[article.difficulty])}>
              {DIFFICULTY_LABELS[article.difficulty]}
            </span>
          )}
          {article.estimated_read_time && (
            <span className="text-xs text-campus-gray-400 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />{article.estimated_read_time} min
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-campus-gray-400 flex-shrink-0 mt-1" />
    </div>
  );
}

// ─── Article brouillon card (pour auteurs) ────────────────────────────────────
function DraftArticleCard({ article, onPublish, publishing }: {
  article: Article; onPublish: (id: string) => void; publishing: boolean;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 py-2.5 px-1 group">
      <div className="w-2 h-2 rounded-full bg-campus-gray-300 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-campus-gray-700 truncate">{article.title}</p>
        <p className="text-xs text-campus-gray-400">
          Modifié {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true, locale: fr })}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => router.push(`/dashboard/articles/${article.id}/edit`)}
          className="h-6 w-6 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50 transition-colors">
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={() => onPublish(article.id)}
          disabled={publishing}
          className="h-6 px-2 flex items-center gap-1 rounded text-xs text-green-600 border border-green-200 hover:bg-green-50 transition-colors"
        >
          <ToggleRight className="h-3 w-3" />Publier
        </button>
      </div>
    </div>
  );
}


// ─── Skeletons ────────────────────────────────────────────────────────────────
function ApplicationsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3 px-1">
          <Skeleton className="w-9 h-9 rounded-lg bg-campus-gray-200" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/5 bg-campus-gray-200" />
            <Skeleton className="h-3 w-2/5 bg-campus-gray-200" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full bg-campus-gray-200" />
        </div>
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-campus-gray-200">
          <Skeleton className="w-8 h-8 rounded-lg bg-campus-gray-200" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/5 bg-campus-gray-200" />
            <Skeleton className="h-3 w-2/5 bg-campus-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}



// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }    = useAuthStore();
  const router      = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  console.log('User', user);

  const isAuthor = user && ARTICLE_AUTHOR_ROLES.includes(user.role as any);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: applications = [], isLoading: loadingApps } = useQuery({
    queryKey: ['my-applications'],
    queryFn:  jobApplicationsApi.getMyApplications,
    enabled:  mounted && !!user,
  });

  const { data: recommendedData, isLoading: loadingJobs } = useQuery({
    queryKey: ['jobs', 'recommended'],
    queryFn:  () => jobsApi.getJobs({ page: 1 }),
    enabled:  mounted && !!user,
  });

  // Posts récents (tous utilisateurs)
  const { data: recentPostsData, isLoading: loadingPosts } = useQuery({
    queryKey: ['posts', 'dashboard-recent'],
    queryFn:  () => postsApi.getPosts({ page: 1 }),
    enabled:  mounted && !!user,
    staleTime: 60 * 1000,
  });

  // Brouillons posts de l'auteur
  const { data: postDraftsData } = useQuery({
    queryKey: ['my-posts', 'draft'],
    queryFn:  () => postsApi.getPosts({ mine: true, status: 'draft' }),
    enabled:  mounted && !!user,
    staleTime: 30 * 1000,
  });

  // Articles récents (tous utilisateurs)
  const { data: recentArticlesData, isLoading: loadingArticles } = useQuery({
    queryKey: ['articles', 'dashboard-recent'],
    queryFn:  () => articlesApi.getArticles({ page: 1 }),
    enabled:  mounted && !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Brouillons de l'auteur (si auteur uniquement)
  const { data: draftsData, isLoading: loadingDrafts } = useQuery({
    queryKey: ['my-articles', 'draft'],
    queryFn:  () => articlesApi.getArticles({ mine: true, status: 'draft' } as any),
    enabled:  mounted && !!isAuthor,
    staleTime: 30 * 1000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => jobApplicationsApi.withdrawApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      toast.success('Candidature retirée');
    },
    onError: () => toast.error('Impossible de retirer la candidature'),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => articlesApi.togglePublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article publié !');
    },
    onError: () => toast.error('Erreur lors de la publication'),
  });

  const publishPostMutation = useMutation({
    mutationFn: (id: string) => postsApi.togglePublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post publié !');
    },
    onError: () => toast.error('Erreur lors de la publication'),
  });

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!mounted) return <AvatarSkeleton />;
  if (!user) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-campus-gray-500">Aucun utilisateur connecté</p>
    </div>
  );

  // ── Données dérivées ──────────────────────────────────────────────────────
  const appStats      = computeAppStats(applications);
  const appliedJobIds = new Set(applications.map((a) => String(a.job_id)));
  const recommended   = (recommendedData?.data ?? [])
    .filter((j) => !appliedJobIds.has(String(j.id)) && j.can_apply)
    .slice(0, 3);
  const recentArticles = (recentArticlesData?.data ?? []).slice(0, 4);
  const drafts         = (draftsData?.data ?? []).slice(0, 3);

  const recentPosts = (recentPostsData?.data ?? []).slice(0, 4);
  const postDrafts  = (postDraftsData?.data ?? []).slice(0, 3);

  return (
    <div className="min-h-screen bg-campus-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-campus-gray-900">Bonjour, {user.name} 👋</h1>
          <p className="text-campus-gray-500 mt-1 text-sm">Bienvenue sur ton espace CampusHub</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Complétion profil" value={`${user.info?.profile_completion ?? 0}%`} colorClass="bg-campus-blue"     icon={TrendingUp}  />
          <StatCard label="Candidatures"       value={appStats.total}                           colorClass="bg-campus-blue-700" icon={Briefcase}   />
          <StatCard label="En cours"           value={appStats.in_progress}                     colorClass="bg-campus-orange"   icon={Clock}       />
          <StatCard label="Entretiens / Acc."  value={appStats.interview + appStats.accepted}   colorClass="bg-green-500"       icon={CheckCircle2}/>
        </div>

        {/* Grid principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Colonne principale (2/3) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Candidatures */}
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-campus-gray-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-campus-blue" />
                  Mes candidatures
                  {appStats.total > 0 && (
                    <span className="text-xs font-normal bg-campus-blue-50 text-campus-blue px-2 py-0.5 rounded-full border border-campus-blue-100">
                      {appStats.total}
                    </span>
                  )}
                </CardTitle>
                {appStats.total > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs text-campus-blue hover:bg-campus-blue-50 -mr-2"
                    onClick={() => router.push('/dashboard/applications')}>
                    Voir tout <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {loadingApps ? <ApplicationsSkeleton /> : applications.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="h-12 w-12 rounded-full bg-campus-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-campus-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-campus-gray-700 mb-1">Aucune candidature pour l'instant</p>
                    <p className="text-xs text-campus-gray-400 mb-4">Explorez les offres et postulez en quelques clics</p>
                    <Button size="sm" className="bg-campus-blue hover:bg-campus-blue-600 text-white" onClick={() => router.push('/jobs')}>
                      Voir les offres
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-campus-gray-100">
                      {applications.slice(0, 5).map((app) => (
                        <ApplicationRow key={app.id} application={app}
                          onWithdraw={(id) => withdrawMutation.mutate(id)}
                          withdrawing={withdrawMutation.isPending && withdrawMutation.variables === app.id}
                        />
                      ))}
                    </div>
                    {!loadingApps && (
                      <div className="mt-4 pt-4 border-t border-campus-gray-100 grid grid-cols-3 gap-2">
                        {[
                          { label: 'En cours',  count: appStats.in_progress, color: 'text-campus-gray-700'   },
                          { label: 'Entretien', count: appStats.interview,   color: 'text-campus-blue-700'   },
                          { label: 'Acceptées', count: appStats.accepted,    color: 'text-campus-orange-700' },
                        ].map(({ label, count, color }) => (
                          <div key={label} className="text-center">
                            <p className={cn('text-lg font-bold', color)}>{count}</p>
                            <p className="text-xs text-campus-gray-500">{label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── Section auteur : brouillons à publier ── */}
            {isAuthor && (
              <Card className="border-campus-gray-300 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-campus-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-campus-blue" />
                    Mes brouillons
                    {drafts.length > 0 && (
                      <span className="text-xs font-normal bg-campus-gray-100 text-campus-gray-600 px-2 py-0.5 rounded-full border border-campus-gray-300">
                        {draftsData?.meta?.total ?? drafts.length}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-1 -mr-2">
                    <Button variant="ghost" size="sm" className="text-xs text-campus-blue hover:bg-campus-blue-50"
                      onClick={() => router.push('/dashboard/articles')}>
                      Gérer <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                    <Button size="sm" className="bg-campus-blue hover:bg-campus-blue-600 text-white h-7 px-2 text-xs gap-1"
                      onClick={() => router.push('/dashboard/articles/new/edit')}>
                      <Plus className="h-3 w-3" />Nouveau
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {loadingDrafts ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full bg-campus-gray-200" />)}
                    </div>
                  ) : drafts.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-campus-gray-500 mb-3">Aucun brouillon en attente</p>
                      <Button variant="outline" size="sm"
                        className="border-campus-gray-300 text-campus-gray-600 gap-1.5 text-xs"
                        onClick={() => router.push('/dashboard/articles/new/edit')}>
                        <Plus className="h-3 w-3" />Rédiger un article
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-campus-gray-100">
                      {drafts.map((article) => (
                        <DraftArticleCard key={article.id} article={article}
                          onPublish={(id) => publishMutation.mutate(id)}
                          publishing={publishMutation.isPending && publishMutation.variables === article.id}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* {// Brouillons posts — visibles par tous (tout le monde peut bloguer) } */}
            {postDrafts.length > 0 && (
              <Card className="border-campus-gray-300 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-campus-gray-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-campus-blue" />
                    Mes brouillons blog
                    <span className="text-xs font-normal bg-campus-gray-100 text-campus-gray-600 px-2 py-0.5 rounded-full border border-campus-gray-300">
                      {postDraftsData?.meta?.total ?? postDrafts.length}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-1 -mr-2">
                    <Button variant="ghost" size="sm"
                      className="text-xs text-campus-blue hover:bg-campus-blue-50"
                      onClick={() => router.push('/dashboard/blog')}
                    >
                      Gérer <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                    <Button size="sm"
                      className="bg-campus-blue hover:bg-campus-blue-600 text-white h-7 px-2 text-xs gap-1"
                      onClick={() => router.push('/dashboard/blog/new/edit')}
                    >
                      <Plus className="h-3 w-3" />Nouveau
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-campus-gray-100">
                    {postDrafts.map((post) => (
                      <div key={post.id} className="flex items-center gap-3 py-2.5 px-1 group">
                        <div className="w-2 h-2 rounded-full bg-campus-gray-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-campus-gray-700 truncate">{post.title}</p>
                          <p className="text-xs text-campus-gray-400">
                            Modifié {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => router.push(`/dashboard/blog/${post.id}/edit`)}
                            className="h-6 w-6 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => publishMutation.mutate(post.id)}
                            disabled={publishMutation.isPending}
                            className="h-6 px-2 flex items-center gap-1 rounded text-xs text-green-600 border border-green-200 hover:bg-green-50"
                          >
                            <ToggleRight className="h-3 w-3" />Publier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile completion */}
            {user.info && user.info.profile_completion < 100 && (
              <Card className="border-campus-orange-200 bg-campus-orange-50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-campus-orange flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{user.info.profile_completion}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-campus-orange-900 mb-0.5">Complète ton profil</h3>
                      <p className="text-xs text-campus-orange-700">Un profil complet augmente tes chances d'être repéré</p>
                    </div>
                    <Button size="sm" className="bg-campus-orange hover:bg-campus-orange-600 text-white flex-shrink-0"
                      onClick={() => router.push('/profile')}>Compléter</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Sidebar (1/3) ── */}
          <div className="space-y-5">

            {/* Offres recommandées */}
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-campus-gray-900 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-campus-orange" />Offres pour toi
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-campus-blue hover:bg-campus-blue-50 -mr-2"
                  onClick={() => router.push('/jobs')}>
                  Toutes <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {loadingJobs ? <SidebarSkeleton /> : recommended.length === 0 ? (
                  <div className="py-6 text-center">
                    <Sparkles className="h-8 w-8 text-campus-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-campus-gray-500">Aucune offre disponible</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recommended.map((job) => <RecommendedJobCard key={job.id} job={job} />)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ✅ Articles récents — remplace "Bientôt disponible" */}
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-campus-gray-900 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-campus-blue" />Articles récents
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-campus-blue hover:bg-campus-blue-50 -mr-2"
                  onClick={() => router.push('/articles')}>
                  Tous <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {loadingArticles ? <SidebarSkeleton /> : recentArticles.length === 0 ? (
                  <div className="py-6 text-center">
                    <BookOpen className="h-8 w-8 text-campus-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-campus-gray-500">Aucun article publié</p>
                    {isAuthor && (
                      <Button variant="ghost" size="sm" className="mt-2 text-xs text-campus-blue"
                        onClick={() => router.push('/dashboard/articles/new/edit')}>
                        <Plus className="h-3 w-3 mr-1" />Rédiger le premier
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentArticles.map((article) => <ArticleCard key={article.id} article={article} />)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* // ── Posts récents ── */}
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-campus-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-campus-blue" />Posts récents
                </CardTitle>
                <Button variant="ghost" size="sm"
                  className="text-xs text-campus-blue hover:bg-campus-blue-50 -mr-2"
                  onClick={() => router.push('/blog')}
                >
                  Tous <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {loadingPosts ? <SidebarSkeleton /> : recentPosts.length === 0 ? (
                  <div className="py-6 text-center">
                    <MessageSquare className="h-8 w-8 text-campus-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-campus-gray-500">Aucun post publié</p>
                    <Button variant="ghost" size="sm"
                      className="mt-2 text-xs text-campus-blue"
                      onClick={() => router.push('/dashboard/blog/new/edit')}
                    >
                      <Plus className="h-3 w-3 mr-1" />Écrire le premier
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentPosts.map((post) => <PostFeedCard key={post.id} post={post} />)}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
