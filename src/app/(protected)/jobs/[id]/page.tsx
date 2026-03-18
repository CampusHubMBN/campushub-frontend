// src/app/jobs/[id]/page.tsx
'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getJob(id),
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
