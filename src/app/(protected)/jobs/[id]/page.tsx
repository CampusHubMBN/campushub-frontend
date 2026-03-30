// src/app/jobs/[id]/page.tsx
'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/services/api/jobs.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MapPin,
  Clock,
  Briefcase,
  Euro,
  Calendar,
  Building2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  XOctagon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const APPLICANT_ROLES = ['student', 'alumni', 'bde_member'];

interface MatchDetail {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canApply = !user || APPLICANT_ROLES.includes(user.role);
  const isApplicant = user && APPLICANT_ROLES.includes(user.role);
  const hasSkills = (user?.info?.skills?.length ?? 0) > 0;

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getJob(id),
  });

  const { data: matchDetail } = useQuery<MatchDetail | null>({
    queryKey: ['cv-match-detail', id, user?.id],
    queryFn: async () => {
      const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:3001';
      const languages: string[] = (user!.info!.languages ?? []).map((l: any) =>
        typeof l === 'string' ? l : l.language,
      );
      const res = await fetch(`${realtimeUrl}/cv-matching/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv: {
            rawText: '',
            skills: user!.info!.skills ?? [],
            experience: [],
            education: [],
            languages,
          },
        }),
      });
      if (!res.ok) return null;
      const results: { jobOffer: { id: string }; score: number; matchedSkills: string[]; missingSkills: string[] }[] =
        await res.json();
      const found = results.find((r) => r.jobOffer.id === id);
      return found ? { score: found.score, matchedSkills: found.matchedSkills, missingSkills: found.missingSkills } : null;
    },
    enabled: !!isApplicant && hasSkills && !!user?.info?.cv_url && job?.source_type !== 'external',
    staleTime: 5 * 60 * 1000,
  });

  const closeRecruitmentMutation = useMutation({
    mutationFn: () => jobsApi.updateJob(id, { status: 'closed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['my-posted-jobs'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-campus-blue" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Offre introuvable
          </h2>
          <Button onClick={() => router.push('/jobs')}>
            Retour aux offres
          </Button>
        </div>
      </div>
    );
  }

  const companyName = job.company?.name || job.company_name || 'Entreprise';
  const isOwner = user && (user.role === 'admin' || job.posted_by?.id === user.id);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/jobs')}
            className="mb-4"
          >
            ← Retour aux offres
          </Button>

          <div className="flex items-start gap-4">
            {job.company?.logo_url ? (
              <img
                src={job.company.logo_url}
                alt={companyName}
                className="w-20 h-20 object-contain rounded border"
              />
            ) : (
              <div className="w-20 h-20 rounded bg-campus-blue/10 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-campus-blue" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {job.title}
              </h1>
              <p className="text-lg text-gray-600">{companyName}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge>{job.type}</Badge>
                <Badge variant="outline">{job.location_type}</Badge>
                {job.source_type === 'external' && (
                  <Badge variant="secondary">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Externe
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">
                  {job.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && (
              <Card className="border-campus-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle>Profil recherché</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">
                    {job.requirements}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits && (
              <Card className="border-campus-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle>Avantages</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">
                    {job.benefits}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            {canApply && (
              <Card className="border-campus-gray-300 shadow-sm">
                <CardHeader>
                  <CardTitle>Postuler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (job.source_type === 'external') {
                        window.open(job.application_url || job.external_url!, '_blank');
                      } else {
                        router.push(`/jobs/${job.id}/apply`);
                      }
                    }}
                  >
                    {job.source_type === 'external' ? (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Postuler sur le site
                      </>
                    ) : job.has_applied ? (
                      'Candidature envoyée'
                    ) : (
                      'Postuler maintenant'
                    )}
                  </Button>

                  {job.application_deadline && (
                    <p className="text-sm text-gray-600 text-center">
                      Date limite :{' '}
                      {new Date(job.application_deadline).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Close recruitment — owner/admin only, published offers */}
            {isOwner && job.status === 'published' && (
              <Card className="border-red-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-red-700">Fermer le recrutement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-3">
                    Les candidats ne pourront plus postuler à cette offre.
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={closeRecruitmentMutation.isPending}
                    onClick={() => closeRecruitmentMutation.mutate()}
                  >
                    {closeRecruitmentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XOctagon className="h-4 w-4 mr-2" />
                    )}
                    Fermer l'offre
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Compatibility Card — internal offers + CV uploaded only */}
            {matchDetail && job.source_type !== 'external' && (
              <Card className="border-campus-gray-300 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Compatibilité avec votre profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Score global</span>
                      <span className={`font-bold text-lg ${
                        matchDetail.score >= 70 ? 'text-emerald-600' :
                        matchDetail.score >= 40 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {matchDetail.score}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          matchDetail.score >= 70 ? 'bg-emerald-500' :
                          matchDetail.score >= 40 ? 'bg-amber-400' : 'bg-gray-400'
                        }`}
                        style={{ width: `${matchDetail.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Matched skills */}
                  {matchDetail.matchedSkills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Compétences correspondantes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchDetail.matchedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing skills */}
                  {matchDetail.missingSkills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-gray-400" />
                        Compétences à développer
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchDetail.missingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Details Card */}
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader>
                <CardTitle>Détails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {job.location_city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>
                      {job.location_city}, {job.location_country}
                    </span>
                  </div>
                )}

                {job.duration_months && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{job.duration_months} mois</span>
                  </div>
                )}

                {(job.salary_min || job.salary_max) && (
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-gray-400" />
                    <span>
                      {job.salary_min && job.salary_max
                        ? `${job.salary_min} - ${job.salary_max} €`
                        : job.salary_min
                        ? `À partir de ${job.salary_min} €`
                        : `Jusqu'à ${job.salary_max} €`}
                    </span>
                  </div>
                )}

                {job.start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      Début : {new Date(job.start_date).toLocaleDateString('fr-FR')}
                    </span>
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
