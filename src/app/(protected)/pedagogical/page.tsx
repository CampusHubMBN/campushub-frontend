// src/app/(protected)/pedagogical/page.tsx
'use client';

import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/services/api/jobs.api';
import { articlesApi } from '@/services/api/articles.api';
import { postsApi } from '@/services/api/posts.api';
import { eventsApi } from '@/services/api/events.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase, FileText, BookOpen, CalendarClock,
  Plus, ChevronRight, MapPin, ArrowRight, Clock,
  Users, CheckCircle2, Pencil, ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Job } from '@/types/job';
import { Article } from '@/types/article';
import { Post } from '@/types/post';
import { CampusEvent } from '@/types/event';

const JOB_TYPE_LABELS: Record<string, string> = {
  internship: 'Stage', apprenticeship: 'Alternance',
  cdd: 'CDD', cdi: 'CDI', freelance: 'Freelance', student_job: 'Job étudiant',
};

function StatCard({ label, value, icon: Icon, colorClass }: {
  label: string; value: number | string; icon: React.ElementType; colorClass: string;
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

export default function PedagogicalDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['my-posted-jobs'],
    queryFn: () => jobsApi.getMyPostedJobs(),
  });

  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['articles-recent'],
    queryFn: () => articlesApi.getArticles({ page: 1 }),
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts-recent'],
    queryFn: () => postsApi.getPosts({ page: 1 }),
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: () => eventsApi.getEvents({ upcoming: true }),
  });

  const { data: articleDraftsData } = useQuery({
    queryKey: ['my-articles', 'draft'],
    queryFn: () => articlesApi.getArticles({ mine: true, status: 'draft' } as any),
  });

  const { data: postDraftsData } = useQuery({
    queryKey: ['my-posts', 'draft'],
    queryFn: () => postsApi.getPosts({ mine: true, status: 'draft' }),
  });

  const publishArticleMutation = useMutation({
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

  const jobs: Job[] = jobsData?.data ?? [];
  const publishedJobs  = jobs.filter((j) => j.status === 'published');
  const draftJobs      = jobs.filter((j) => j.status === 'draft');
  const totalApps      = jobs.reduce((sum, j) => sum + (j.applications_count ?? 0), 0);

  const articles: Article[] = (articlesData?.data ?? []).slice(0, 5);
  const posts: Post[]       = (postsData?.data ?? []).slice(0, 5);
  const events: CampusEvent[] = (eventsData as any)?.data ?? eventsData ?? [];
  const upcomingEvents = events.slice(0, 4);

  const articleDrafts = (articleDraftsData?.data ?? []).slice(0, 5);
  const postDrafts    = (postDraftsData?.data ?? []).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-campus-gray-900">
            Bonjour, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-campus-gray-500 mt-1">Votre espace pédagogique</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {jobsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-campus-gray-300 shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard label="Offres publiées"  value={publishedJobs.length} icon={CheckCircle2} colorClass="bg-green-500" />
              <StatCard label="Brouillons"        value={draftJobs.length}     icon={Clock}        colorClass="bg-amber-500" />
              <StatCard label="Total candidatures" value={totalApps}           icon={Users}        colorClass="bg-campus-blue" />
              <StatCard label="Toutes mes offres"  value={jobs.length}         icon={Briefcase}    colorClass="bg-indigo-500" />
            </>
          )}
        </div>

        {/* Article drafts */}
        {articleDrafts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-800">Articles en brouillon</span>
                  <span className="text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    {articleDraftsData?.meta?.total ?? articleDrafts.length}
                  </span>
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => router.push('/articles')} className="text-xs h-7 px-2 text-amber-700">
                  Voir tout <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-amber-100">
              {articleDrafts.map((article) => (
                <div key={article.id} className="flex items-center gap-3 py-2.5 group">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-campus-gray-900 truncate">{article.title}</p>
                    <p className="text-xs text-campus-gray-400">
                      Modifié {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => router.push(`/articles/${article.id}/edit`)}
                      className="h-6 w-6 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => publishArticleMutation.mutate(article.id)}
                      disabled={publishArticleMutation.isPending && publishArticleMutation.variables === article.id}
                      className="h-6 px-2 flex items-center gap-1 rounded text-xs text-green-600 border border-green-200 hover:bg-green-50 bg-white"
                    >
                      <ToggleRight className="h-3 w-3" />Publier
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Blog post drafts */}
        {postDrafts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-800">Posts blog en brouillon</span>
                  <span className="text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    {postDraftsData?.meta?.total ?? postDrafts.length}
                  </span>
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => router.push('/blog')} className="text-xs h-7 px-2 text-amber-700">
                  Voir tout <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-amber-100">
              {postDrafts.map((post) => (
                <div key={post.id} className="flex items-center gap-3 py-2.5 group">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-campus-gray-900 truncate">{post.title}</p>
                    <p className="text-xs text-campus-gray-400">
                      Modifié {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => router.push(`/blog/${post.id}/edit`)}
                      className="h-6 w-6 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => publishPostMutation.mutate(post.id)}
                      disabled={publishPostMutation.isPending && publishPostMutation.variables === post.id}
                      className="h-6 px-2 flex items-center gap-1 rounded text-xs text-green-600 border border-green-200 hover:bg-green-50 bg-white"
                    >
                      <ToggleRight className="h-3 w-3" />Publier
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Jobs + Events */}
          <div className="lg:col-span-2 space-y-6">

            {/* My job offers */}
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-campus-blue" />
                    Mes offres récentes
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => router.push('/jobs/create')} className="text-xs h-7 px-2">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Créer
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => router.push('/recruiter')} className="text-xs h-7 px-2">
                      Voir tout <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-campus-gray-100">
                {jobsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="py-3">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : jobs.length === 0 ? (
                  <p className="py-6 text-center text-sm text-campus-gray-400">Aucune offre postée</p>
                ) : (
                  jobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className="py-3 flex items-center gap-3 cursor-pointer group"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-campus-gray-900 truncate group-hover:text-campus-blue transition-colors">
                          {job.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-campus-gray-400">{JOB_TYPE_LABELS[job.type] ?? job.type}</span>
                          {job.location_city && (
                            <>
                              <span className="text-campus-gray-300 text-xs">·</span>
                              <span className="text-xs text-campus-gray-400 flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />{job.location_city}
                              </span>
                            </>
                          )}
                          <span className="text-campus-gray-300 text-xs">·</span>
                          <span className="text-xs text-campus-gray-400">{job.applications_count ?? 0} candidature(s)</span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('text-xs shrink-0', {
                          'border-green-200 text-green-700 bg-green-50': job.status === 'published',
                          'border-campus-gray-300 text-campus-gray-500': job.status === 'draft',
                          'border-red-200 text-red-600 bg-red-50': job.status === 'closed',
                        })}
                      >
                        {job.status === 'published' ? 'Publiée' : job.status === 'draft' ? 'Brouillon' : 'Fermée'}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming events */}
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-campus-blue" />
                    Événements à venir
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => router.push('/events')} className="text-xs h-7 px-2">
                    Voir tout <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-campus-gray-100">
                {eventsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="py-3">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : upcomingEvents.length === 0 ? (
                  <p className="py-6 text-center text-sm text-campus-gray-400">Aucun événement à venir</p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="py-3 flex items-start gap-3 cursor-pointer group"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <div className="h-10 w-10 rounded-lg bg-campus-blue/10 flex items-center justify-center flex-shrink-0">
                        <CalendarClock className="h-5 w-5 text-campus-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-campus-gray-900 truncate group-hover:text-campus-blue transition-colors">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-campus-gray-400">
                            {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          {event.location && (
                            <>
                              <span className="text-campus-gray-300 text-xs">·</span>
                              <span className="text-xs text-campus-gray-400 flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />{event.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Articles + Blog */}
          <div className="space-y-6">

            {/* Recent articles */}
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-campus-blue" />
                    Articles récents
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => router.push('/articles')} className="text-xs h-7 px-2">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-campus-gray-100">
                {articlesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="py-2.5">
                      <Skeleton className="h-3.5 w-full mb-1.5" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))
                ) : articles.length === 0 ? (
                  <p className="py-4 text-center text-xs text-campus-gray-400">Aucun article</p>
                ) : (
                  articles.map((article) => (
                    <div
                      key={article.id}
                      className="py-2.5 cursor-pointer group"
                      onClick={() => router.push(`/articles/${article.slug}`)}
                    >
                      <p className="text-xs font-medium text-campus-gray-900 line-clamp-2 group-hover:text-campus-blue transition-colors">
                        {article.title}
                      </p>
                      <p className="text-xs text-campus-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(article.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent blog posts */}
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-campus-blue" />
                    Blog récent
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => router.push('/blog')} className="text-xs h-7 px-2">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-campus-gray-100">
                {postsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="py-2.5">
                      <Skeleton className="h-3.5 w-full mb-1.5" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))
                ) : posts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-campus-gray-400">Aucun post</p>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="py-2.5 cursor-pointer group"
                      onClick={() => router.push(`/blog/${post.slug}`)}
                    >
                      <p className="text-xs font-medium text-campus-gray-900 line-clamp-2 group-hover:text-campus-blue transition-colors">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-campus-gray-400">
                          {post.author?.name ?? 'Auteur'}
                        </p>
                        <span className="text-campus-gray-300 text-xs">·</span>
                        <p className="text-xs text-campus-gray-400">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
