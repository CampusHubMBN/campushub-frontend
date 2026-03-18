// src/components/companies/CompanyCard.tsx
'use client';

import { Company } from '@/types/company';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  ExternalLink,
  Briefcase,
  CheckCircle,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const router = useRouter();

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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Company Logo */}
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-16 h-16 object-contain rounded border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-campus-blue/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-campus-blue" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {company.name}
              </h3>
              {company.is_verified && (
                <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            {company.industry && (
              <p className="text-sm text-gray-600 mt-1">{company.industry}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Badges */}
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

        {/* Description */}
        {company.description && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {company.description}
          </p>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600">
          {/* Location */}
          {company.headquarters_city && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {company.headquarters_city}, {company.headquarters_country}
              </span>
            </div>
          )}

          {/* Active Jobs */}
          {company.active_jobs > 0 && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 flex-shrink-0 text-campus-blue" />
              <span className="font-medium text-campus-blue">
                {company.active_jobs} offre{company.active_jobs > 1 ? 's' : ''} active
                {company.active_jobs > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 gap-2">
        <Button
          onClick={() => router.push(`/companies/${company.id}`)}
          className="flex-1"
        >
          Voir l'entreprise
        </Button>
        {company.website && (
          <Button
            variant="outline"
            onClick={() => window.open(company.website!, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
