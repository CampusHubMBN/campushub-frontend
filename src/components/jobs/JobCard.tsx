// src/components/jobs/JobCard.tsx
'use client';

import { Job } from '@/types/job';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Clock,
  Briefcase,
  ExternalLink,
  Building2,
  Euro,
  Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (job.source_type === 'external' && job.external_url) {
      // Open external job in new tab
      window.open(job.external_url, '_blank');
    } else {
      // Navigate to internal job detail page
      router.push(`/jobs/${job.id}`);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      internship: 'Stage',
      apprenticeship: 'Alternance',
      cdd: 'CDD',
      cdi: 'CDI',
      freelance: 'Freelance',
    };
    return labels[type] || type;
  };

  const getLocationTypeLabel = (locationType: string) => {
    const labels: Record<string, string> = {
      onsite: 'Présentiel',
      remote: 'Remote',
      hybrid: 'Hybride',
    };
    return labels[locationType] || locationType;
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;

    const format = (amount: number) => {
      if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}k`;
      }
      return amount.toString();
    };

    if (job.salary_min && job.salary_max) {
      return `${format(job.salary_min)} - ${format(job.salary_max)} €`;
    }
    if (job.salary_min) {
      return `À partir de ${format(job.salary_min)} €`;
    }
    if (job.salary_max) {
      return `Jusqu'à ${format(job.salary_max)} €`;
    }
  };

  const companyName = job.company?.name || job.company_name || 'Entreprise confidentielle';
  const companyLogo = job.company?.logo_url;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-campus-gray-300 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Company Logo */}
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="w-12 h-12 object-contain rounded border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-campus-blue/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-campus-blue" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-campus-blue transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{companyName}</p>
          </div>

          {/* External indicator */}
          {job.source_type === 'external' && (
            <ExternalLink className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Job Type & Location Type */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{getTypeLabel(job.type)}</Badge>
          <Badge variant="outline">{getLocationTypeLabel(job.location_type)}</Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600">
          {/* Location */}
          {job.location_city && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {job.location_city}, {job.location_country}
              </span>
            </div>
          )}

          {/* Duration */}
          {job.duration_months && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{job.duration_months} mois</span>
            </div>
          )}

          {/* Salary */}
          {formatSalary() && (
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 flex-shrink-0" />
              <span>{formatSalary()}</span>
            </div>
          )}

          {/* Start Date */}
          {job.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                Début : {new Date(job.start_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>

        {/* Description Preview */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {job.description}
        </p>
      </CardContent>

      <CardFooter className="pt-3">
        <Button
          onClick={handleClick}
          className="w-full"
          variant={job.source_type === 'external' ? 'outline' : 'default'}
        >
          {job.source_type === 'external' ? (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir l'offre
            </>
          ) : job.has_applied ? (
            <>
              <Briefcase className="h-4 w-4 mr-2" />
              Candidature envoyée
            </>
          ) : (
            <>
              <Briefcase className="h-4 w-4 mr-2" />
              Postuler
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
