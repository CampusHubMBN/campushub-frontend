// src/app/(protected)/companies/[id]/page.tsx
'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/services/api/companies.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MapPin,
  ExternalLink,
  Building2,
  Loader2,
  Linkedin,
  Globe,
  CheckCircle,
  Users,
  Briefcase,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { JobCard } from '@/components/jobs/JobCard';

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companiesApi.getCompany(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-campus-blue" />
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Entreprise introuvable
          </h2>
          <Button onClick={() => router.push('/companies')}>
            Retour aux entreprises
          </Button>
        </div>
      </div>
    );
  }

  const getSizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      '1-10': '1-10 employés',
      '11-50': '11-50 employés',
      '51-200': '51-200 employés',
      '201-500': '201-500 employés',
      '501-1000': '501-1000 employés',
      '1001+': '1001+ employés',
    };
    return labels[size] || size;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/companies')}
            className="mb-4"
          >
            ← Retour aux entreprises
          </Button>

          <div className="flex items-start gap-6">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-24 h-24 object-contain rounded border"
              />
            ) : (
              <div className="w-24 h-24 rounded bg-campus-blue/10 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-campus-blue" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {company.name}
                </h1>
                {company.is_verified && (
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                )}
              </div>

              {company.industry && (
                <p className="text-lg text-gray-600 mb-4">{company.industry}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {company.is_partner && (
                  <Badge className="bg-campus-orange text-white">
                    Partenaire
                  </Badge>
                )}
                {company.size && (
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {getSizeLabel(company.size)}
                  </Badge>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-3 mt-4">
                {company.website && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(company.website!, '_blank')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Site web
                  </Button>
                )}
                {company.linkedin_url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(company.linkedin_url!, '_blank')}
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
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
            {company.description && (
              <Card>
                <CardHeader>
                  <CardTitle>À propos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">
                    {company.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Active Jobs */}
            {company.jobs && company.jobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Offres disponibles ({company.jobs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>En chiffres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Briefcase className="h-4 w-4" />
                    Offres actives
                  </div>
                  <p className="text-2xl font-bold text-campus-blue">
                    {company.active_jobs}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Briefcase className="h-4 w-4" />
                    Total offres postées
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {company.jobs_posted}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {company.headquarters_city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>
                      {company.headquarters_city}, {company.headquarters_country}
                    </span>
                  </div>
                )}

                {company.size && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{getSizeLabel(company.size)}</span>
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
