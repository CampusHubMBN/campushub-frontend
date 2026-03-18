// src/app/(protected)/profile/[id]/page.tsx
'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { usersApi } from '@/services/api/users.api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, BookOpen, Github, Linkedin, Globe,
  GraduationCap, Star, Clock, Eye, ChevronRight,
  Award, TrendingUp, ExternalLink, MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageUrl } from '@/lib/utils';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, ArticleDifficulty } from '@/types/article';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  student:     'Étudiant',
  alumni:      'Alumni',
  bde_member:  'Membre BDE',
  pedagogical: 'Administration',
  company:     'Entreprise',
};

const ROLE_COLORS: Record<string, string> = {
  student:     'bg-campus-blue-50 text-campus-blue border-campus-blue-200',
  alumni:      'bg-campus-orange-50 text-campus-orange-700 border-campus-orange-200',
  bde_member:  'bg-purple-50 text-purple-700 border-purple-200',
  pedagogical: 'bg-green-50 text-green-700 border-green-200',
  company:     'bg-campus-gray-100 text-campus-gray-700 border-campus-gray-300',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner:      'Débutant',
  active_member: 'Actif',
  contributor:   'Contributeur',
  expert:        'Expert',
  vip:           'VIP',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-campus-gray-50">
      <div className="bg-white border-b border-campus-gray-200">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full bg-campus-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-48 bg-campus-gray-200" />
              <Skeleton className="h-4 w-64 bg-campus-gray-200" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full bg-campus-gray-200" />
                <Skeleton className="h-6 w-20 rounded-full bg-campus-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-5">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-campus-gray-200">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-32 bg-campus-gray-200" />
              <Skeleton className="h-4 w-full bg-campus-gray-200" />
              <Skeleton className="h-4 w-2/3 bg-campus-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Article card ─────────────────────────────────────────────────────────────
function ArticleCard({ article }: { article: any }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/articles/${article.slug}`)}
      className="flex items-start gap-3 p-3 rounded-lg cursor-pointer border border-campus-gray-200 hover:border-campus-blue-200 hover:bg-campus-blue-50/40 transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-campus-blue-50 border border-campus-blue-100 flex items-center justify-center flex-shrink-0 text-sm">
        {article.category?.icon ?? '📄'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-campus-gray-900 truncate group-hover:text-campus-blue transition-colors">
          {article.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {article.difficulty && (
            <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', DIFFICULTY_COLORS[article.difficulty as ArticleDifficulty])}>
              {DIFFICULTY_LABELS[article.difficulty as ArticleDifficulty]}
            </span>
          )}
          {article.estimated_read_time && (
            <span className="text-xs text-campus-gray-400 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />{article.estimated_read_time} min
            </span>
          )}
          <span className="text-xs text-campus-gray-400 flex items-center gap-0.5">
            <Eye className="h-2.5 w-2.5" />{article.views_count}
          </span>
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-campus-gray-400 flex-shrink-0 mt-1" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }   = use(params);
  const router   = useRouter();
  const { user } = useAuthStore();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['user-profile', id],
    queryFn:  () => usersApi.getUser(id),
    enabled:  !!user,
  });

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !profile) return (
    <div className="min-h-screen bg-campus-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-campus-gray-500 font-medium mb-3">Profil introuvable</p>
        <Button className="bg-campus-blue hover:bg-campus-blue-600 text-white" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    </div>
  );

  // Redirige si c'est son propre profil
  if (profile.is_own_profile) {
    router.replace('/profile');
    return null;
  }

  // ✅ info vient de UserInfoResource via UserResource
  const info     = profile.info;
  const articles = profile.articles ?? [];
  const isAuthor = ['pedagogical', 'bde_member'].includes(profile.role);

  const initials = profile.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-campus-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-campus-gray-200">
        <div className="container mx-auto px-4 py-8 max-w-4xl">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-campus-gray-500 hover:text-campus-blue mb-6 -ml-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />Retour
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-6">

            {/* Avatar */}
            <Avatar className="h-24 w-24 border-4 border-campus-gray-200 flex-shrink-0">
              <AvatarImage src={storageUrl(info?.avatar_url)} alt={profile.name} />
              <AvatarFallback className="bg-campus-blue text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-campus-gray-900 mb-1">{profile.name}</h1>

              {info?.program && (
                <p className="text-campus-gray-500 text-sm flex items-center gap-1.5 mb-2">
                  <GraduationCap className="h-4 w-4 flex-shrink-0" />
                  {info.program}
                  {info.year && ` · Année ${info.year}`}
                  {info.campus && ` · ${info.campus}`}
                </p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className={cn('border text-xs', ROLE_COLORS[profile.role] ?? ROLE_COLORS.student)}>
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </Badge>
                {info?.level && (
                  <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">
                    <Star className="h-3 w-3 mr-1" />
                    {LEVEL_LABELS[info.level] ?? info.level}
                  </Badge>
                )}
                {info?.campus && !info?.program && (
                  <span className="text-xs text-campus-gray-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{info.campus}
                  </span>
                )}
              </div>

              {/* Réseaux */}
              <div className="flex items-center gap-2 flex-wrap">
                {info?.linkedin_url && (
                  <a href={info.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-campus-gray-500 hover:text-campus-blue px-2.5 py-1.5 rounded-lg border border-campus-gray-200 hover:border-campus-blue-200 hover:bg-campus-blue-50 transition-colors"
                  >
                    <Linkedin className="h-3.5 w-3.5" />LinkedIn
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                )}
                {info?.github_url && (
                  <a href={info.github_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-campus-gray-500 hover:text-campus-gray-900 px-2.5 py-1.5 rounded-lg border border-campus-gray-200 hover:border-campus-gray-400 hover:bg-campus-gray-50 transition-colors"
                  >
                    <Github className="h-3.5 w-3.5" />GitHub
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                )}
                {info?.website_url && (
                  <a href={info.website_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-campus-gray-500 hover:text-campus-blue px-2.5 py-1.5 rounded-lg border border-campus-gray-200 hover:border-campus-blue-200 hover:bg-campus-blue-50 transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />Portfolio
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            {info?.reputation_points !== undefined && (
              <div className="flex gap-4 flex-shrink-0">
                <div className="text-center">
                  <div className="h-10 w-10 rounded-lg bg-campus-blue-50 flex items-center justify-center mx-auto mb-1">
                    <TrendingUp className="h-5 w-5 text-campus-blue" />
                  </div>
                  <p className="text-lg font-bold text-campus-gray-900">{info.reputation_points}</p>
                  <p className="text-xs text-campus-gray-500">Réputation</p>
                </div>
                {isAuthor && profile.articles_count > 0 && (
                  <div className="text-center">
                    <div className="h-10 w-10 rounded-lg bg-campus-orange-50 flex items-center justify-center mx-auto mb-1">
                      <BookOpen className="h-5 w-5 text-campus-orange" />
                    </div>
                    <p className="text-lg font-bold text-campus-gray-900">{profile.articles_count}</p>
                    <p className="text-xs text-campus-gray-500">Articles</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-5">

        {/* Bio */}
        {info?.bio && (
          <Card className="border-campus-gray-300 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-campus-gray-900">À propos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-campus-gray-600 leading-relaxed">{info.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Formation */}
        {(info?.program || info?.year || info?.campus) && (
          <Card className="border-campus-gray-300 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-campus-gray-900 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-campus-blue" />Formation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {info?.program && (
                  <div>
                    <p className="text-xs text-campus-gray-500 mb-0.5">Programme</p>
                    <p className="text-sm font-medium text-campus-gray-900">{info.program}</p>
                  </div>
                )}
                {info?.year && (
                  <div>
                    <p className="text-xs text-campus-gray-500 mb-0.5">Année</p>
                    <p className="text-sm font-medium text-campus-gray-900">Année {info.year}</p>
                  </div>
                )}
                {info?.campus && (
                  <div>
                    <p className="text-xs text-campus-gray-500 mb-0.5">Campus</p>
                    <p className="text-sm font-medium text-campus-gray-900">{info.campus}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compétences */}
        {info?.skills && info.skills.length > 0 && (
          <Card className="border-campus-gray-300 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-campus-gray-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-campus-blue" />Compétences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {info.skills.map((skill: string, i: number) => (
                  <Badge key={i} className="bg-campus-blue-50 text-campus-blue border border-campus-blue-100 font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Articles publiés */}
        {isAuthor && articles.length > 0 && (
          <Card className="border-campus-gray-300 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base text-campus-gray-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-campus-blue" />
                Articles publiés
                <span className="text-xs font-normal bg-campus-blue-50 text-campus-blue px-2 py-0.5 rounded-full border border-campus-blue-100">
                  {profile.articles_count}
                </span>
              </CardTitle>
              <Button variant="ghost" size="sm"
                className="text-xs text-campus-blue hover:bg-campus-blue-50 -mr-2"
                onClick={() => router.push('/articles')}
              >
                Voir tous <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {articles.map((article: any) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!info?.bio && !info?.skills?.length && !info?.program && articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-campus-gray-400">Ce profil est encore peu renseigné.</p>
          </div>
        )}
      </div>
    </div>
  );
}
