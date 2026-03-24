// src/components/jobs/JobCard.tsx
'use client';

import { Job } from '@/types/job';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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

  const getTypeBadgeStyle = (type: string) => {
    const styles: Record<string, string> = {
      internship:    'bg-violet-100 text-violet-700 border-violet-200',
      apprenticeship:'bg-teal-100   text-teal-700   border-teal-200',
      cdd:           'bg-amber-100  text-amber-700  border-amber-200',
      cdi:           'bg-emerald-100 text-emerald-700 border-emerald-200',
      freelance:     'bg-blue-100   text-blue-700   border-blue-200',
    };
    return styles[type] ?? 'bg-gray-100 text-gray-700 border-gray-200';
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
        {/* Job Type badge — colored per type like reference design */}
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeBadgeStyle(job.type)}`}>
            {getTypeLabel(job.type)}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            {getLocationTypeLabel(job.location_type)}
          </span>
        </div>

        {/* Detail pill tags */}
        <div className="flex flex-wrap gap-1.5">
          {job.location_city && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200">
              <MapPin className="h-3 w-3" />
              {job.location_city}
            </span>
          )}
          {job.duration_months && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200">
              <Clock className="h-3 w-3" />
              {job.duration_months} mois
            </span>
          )}
          {formatSalary() && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200">
              <Euro className="h-3 w-3" />
              {formatSalary()}
            </span>
          )}
          {job.start_date && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200">
              <Calendar className="h-3 w-3" />
              {new Date(job.start_date).toLocaleDateString('fr-FR')}
            </span>
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
