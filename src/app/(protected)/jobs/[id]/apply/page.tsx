// src/app/(protected)/jobs/[id]/apply/page.tsx
'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/services/api/jobs.api';
import { jobApplicationsApi } from '@/services/api/job-applications.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Building2,
  ArrowLeft,
  MapPin,
  Clock,
  ExternalLink,
  Info,
} from 'lucide-react';
import { ApplicationForm } from '@/components/jobs/ApplicationForm';
import { ApplicationFormData } from '@/types/job-application';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Mappings ─────────────────────────────────────────────────────────────────
const JOB_TYPE_LABELS: Record<string, string> = {
  internship:    'Stage',
  apprenticeship:'Alternance',
  part_time:     'Job étudiant',
  full_time:     'CDI',
  freelance:     'Freelance',
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  remote:  'Télétravail',
  on_site: 'Présentiel',
  hybrid:  'Hybride',
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-campus-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-28 bg-campus-gray-200" />
        <Card className="border-campus-gray-300">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Skeleton className="w-16 h-16 rounded-lg bg-campus-gray-200" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-2/3 bg-campus-gray-200" />
                <Skeleton className="h-4 w-1/3 bg-campus-gray-200" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 bg-campus-gray-200" />
                  <Skeleton className="h-5 w-20 bg-campus-gray-200" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-campus-gray-300">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-48 bg-campus-gray-200" />
            <Skeleton className="h-48 w-full bg-campus-gray-200" />
            <Skeleton className="h-11 w-full bg-campus-gray-200" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── State card (already applied / expired / not found) ──────────────────────
function StateCard({
  icon: Icon,
  iconClass,
  cardClass,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  iconClass: string;
  cardClass?: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-campus-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className={cn('shadow-sm', cardClass)}>
          <CardContent className="p-12 text-center">
            <div className={cn('h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5', iconClass)}>
              <Icon className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-campus-gray-900 mb-2">{title}</h2>
            <p className="text-campus-gray-600 text-sm mb-7">{description}</p>
            <div className="flex gap-3 justify-center flex-wrap">{children}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function JobApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }      = use(params);
  const router      = useRouter();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();

  // Auth guard
  useEffect(() => {
    if (!user) router.replace(`/login?redirect=/jobs/${id}/apply`);
  }, [user, id, router]);

  // Fetch job
  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn:  () => jobsApi.getJob(id),
    enabled:  !!user,
    retry:    1,
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: (data: ApplicationFormData) => jobApplicationsApi.apply(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      toast.success('Candidature envoyée avec succès ! 🎉');
      router.push('/dashboard?tab=applications');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.cover_letter?.[0] ||
        "Erreur lors de l'envoi de la candidature";
      toast.error(message);
    },
  });

  // ── States ──────────────────────────────────────────────────────────────
  if (!user || isLoading) return <PageSkeleton />;

  if (isError) return (
    <StateCard
      icon={AlertCircle}
      iconClass="bg-red-100 text-red-500"
      cardClass="border-red-200"
      title="Erreur de chargement"
      description="Impossible de charger cette offre. Vérifiez votre connexion et réessayez."
    >
      <Button
        className="bg-campus-blue hover:bg-campus-blue-600 text-white"
        onClick={() => router.push('/jobs')}
      >
        Retour aux offres
      </Button>
      <Button variant="outline" className="border-campus-gray-300" onClick={() => window.location.reload()}>
        Réessayer
      </Button>
    </StateCard>
  );

  if (!job) return (
    <StateCard
      icon={AlertCircle}
      iconClass="bg-campus-gray-100 text-campus-gray-400"
      cardClass="border-campus-gray-200"
      title="Offre introuvable"
      description="Cette offre n'existe pas ou a été supprimée."
    >
      <Button
        className="bg-campus-blue hover:bg-campus-blue-600 text-white"
        onClick={() => router.push('/jobs')}
      >
        Retour aux offres
      </Button>
    </StateCard>
  );

  if (job.source_type === 'external') {
    router.replace(`/jobs/${id}`);
    return null;
  }

  if (job.has_applied) return (
    <StateCard
      icon={CheckCircle}
      iconClass="bg-campus-blue-50 text-campus-blue"
      cardClass="border-campus-blue-100"
      title="Candidature déjà envoyée"
      description="Vous avez déjà postulé à cette offre. Suivez l'avancement dans votre tableau de bord."
    >
      <Button
        className="bg-campus-blue hover:bg-campus-blue-600 text-white"
        onClick={() => router.push('/dashboard?tab=applications')}
      >
        Mes candidatures
      </Button>
      <Button
        variant="outline"
        className="border-campus-gray-300 text-campus-gray-700"
        onClick={() => router.push('/jobs')}
      >
        Voir d'autres offres
      </Button>
    </StateCard>
  );

  if (!job.is_active) return (
    <StateCard
      icon={Clock}
      iconClass="bg-campus-orange-50 text-campus-orange"
      cardClass="border-campus-orange-200"
      title="Offre expirée"
      description="Cette offre n'est plus disponible. Les candidatures sont fermées."
    >
      <Button
        className="bg-campus-blue hover:bg-campus-blue-600 text-white"
        onClick={() => router.push('/jobs')}
      >
        Voir d'autres offres
      </Button>
    </StateCard>
  );

  // ── Normal flow ──────────────────────────────────────────────────────────
  const companyName      = job.company?.name || job.company_name || 'Entreprise';
  const jobTypeLabel     = JOB_TYPE_LABELS[job.type]          || job.type;
  const locationLabel    = LOCATION_TYPE_LABELS[job.location_type] || job.location_type;

  return (
    <div className="min-h-screen bg-campus-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Back */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/jobs/${id}`)}
          className="mb-5 -ml-2 text-campus-gray-600 hover:text-campus-gray-900 hover:bg-campus-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Retour à l'offre
        </Button>

        {/* Job header card */}
        <Card className="mb-5 border-campus-gray-300 shadow-sm overflow-hidden">
          {/* Accent stripe */}
          <div className="h-1 bg-campus-blue" />

          <CardHeader className="pt-5 pb-4">
            <div className="flex items-start gap-4">
              {/* Logo */}
              {job.company?.logo_url ? (
                <img
                  src={job.company.logo_url}
                  alt={companyName}
                  className="w-16 h-16 object-contain rounded-lg border border-campus-gray-200 bg-white p-1 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-campus-blue-50 flex items-center justify-center flex-shrink-0 border border-campus-blue-100">
                  <Building2 className="h-7 w-7 text-campus-blue" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl text-campus-gray-900 mb-1 leading-snug">
                  {job.title}
                </CardTitle>
                <p className="text-campus-gray-500 font-medium text-sm mb-3">{companyName}</p>

                <div className="flex flex-wrap gap-2">
                  {/* Type */}
                  <Badge className="bg-campus-blue-50 text-campus-blue border-campus-blue-100 border font-medium text-xs">
                    {jobTypeLabel}
                  </Badge>

                  {/* Location type */}
                  <Badge variant="outline" className="border-campus-gray-300 text-campus-gray-600 text-xs">
                    {locationLabel}
                  </Badge>

                  {/* City */}
                  {job.location_city && (
                    <Badge variant="outline" className="border-campus-gray-300 text-campus-gray-600 text-xs gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location_city}
                    </Badge>
                  )}

                  {/* Deadline */}
                  {job.application_deadline && (
                    <Badge className="bg-campus-orange-50 text-campus-orange-700 border border-campus-orange-200 text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      Clôture :{' '}
                      {new Date(job.application_deadline).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Open full job in new tab */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(`/jobs/${id}`, '_blank')}
                title="Voir l'offre complète"
                className="flex-shrink-0 text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Tips banner */}
        <Card className="mb-5 border-campus-blue-100 bg-campus-blue-50 shadow-none">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-4 w-4 text-campus-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-campus-blue-800 mb-1">
                  Conseils pour maximiser vos chances
                </p>
                <ul className="text-xs text-campus-blue-700 space-y-0.5 list-disc list-inside marker:text-campus-blue-400">
                  <li>Personnalisez votre lettre pour ce poste précis</li>
                  <li>Mentionnez les compétences clés de l'annonce</li>
                  <li>Relisez attentivement avant d'envoyer</li>
                  <li>Vous recevrez une confirmation par email</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <ApplicationForm
          onSubmit={applyMutation.mutateAsync}
          defaultCvUrl={user.info?.cv_url}
          loading={applyMutation.isPending}
        />

        {/* Cancel */}
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/jobs/${id}`)}
            className="text-campus-gray-400 hover:text-campus-gray-700 hover:bg-campus-gray-100"
          >
            Annuler et revenir à l'offre
          </Button>
        </div>
      </div>
    </div>
  );
}
