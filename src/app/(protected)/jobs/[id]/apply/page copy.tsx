// src/app/(protected)/jobs/[id]/apply/page.tsx
'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation } from '@tanstack/react-query';
import { jobsApi } from '@/services/api/jobs.api';
import { jobApplicationsApi } from '@/services/api/job-applications.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Building2 } from 'lucide-react';
import { ApplicationForm } from '@/components/jobs/ApplicationForm';
import { ApplicationFormData } from '@/types/job-application';
import { toast } from 'sonner';

export default function JobApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  // ✅ Auth check
  if (!user) {
    router.push(`/login?redirect=/jobs/${id}/apply`);
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-campus-blue" />
      </div>
    );
  }

  // Fetch job
  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getJob(id),
  });

  // Submit application mutation
  const applyMutation = useMutation({
    mutationFn: (data: ApplicationFormData) =>
      jobApplicationsApi.apply(id, data),
    onSuccess: () => {
      toast.success('Candidature envoyée avec succès ! 🎉');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'envoi';
      toast.error(message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-campus-blue" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-screen">
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

  // Check if external job
  if (job.source_type === 'external') {
    router.push(`/jobs/${id}`);
    return null;
  }

  // Check if already applied
  if (job.has_applied) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-green-200">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Candidature déjà envoyée
            </h2>
            <p className="text-gray-600 mb-6">
              Vous avez déjà postulé à cette offre. Vous pouvez suivre l'état de votre candidature dans votre tableau de bord.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/jobs')}>
                Voir d'autres offres
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Mes candidatures
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if job is still active
  if (!job.is_active) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-yellow-200">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Offre expirée
            </h2>
            <p className="text-gray-600 mb-6">
              Cette offre n'est plus disponible. Les candidatures sont fermées.
            </p>
            <Button onClick={() => router.push('/jobs')}>
              Voir d'autres offres
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const companyName = job.company?.name || job.company_name;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/jobs/${id}`)}
          className="mb-4"
        >
          ← Retour à l'offre
        </Button>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              {job.company?.logo_url ? (
                <img
                  src={job.company.logo_url}
                  alt={companyName}
                  className="w-16 h-16 object-contain rounded border"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-campus-blue/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-campus-blue" />
                </div>
              )}

              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">
                  Postuler : {job.title}
                </CardTitle>
                <p className="text-gray-600 mb-3">{companyName}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{job.type}</Badge>
                  <Badge variant="outline">{job.location_type}</Badge>
                  {job.location_city && (
                    <Badge variant="secondary">{job.location_city}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Important Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900">
                  Conseils pour votre candidature
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Personnalisez votre lettre de motivation pour ce poste</li>
                  <li>Relisez attentivement avant d'envoyer</li>
                  <li>Assurez-vous que votre CV est à jour</li>
                  <li>Vous recevrez une confirmation par email</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <ApplicationForm
          onSubmit={applyMutation.mutateAsync}
          defaultCvUrl={user.info?.cv_url}
          loading={applyMutation.isPending}
        />

        {/* Footer Actions */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push(`/jobs/${id}`)}
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
