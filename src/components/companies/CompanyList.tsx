// src/components/companies/CompanyList.tsx
'use client';

import { useState } from 'react';
import { CompanyCard } from './CompanyCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/services/api/companies.api';
import { useDebounce } from 'use-debounce';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function CompanyList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [partnersOnly, setPartnersOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [debouncedSearch] = useDebounce(searchQuery, 500);

  const {
    data: companies = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['companies', debouncedSearch, partnersOnly, verifiedOnly],
    queryFn: () =>
      companiesApi.getCompanies({
        search: debouncedSearch,
        is_partner: partnersOnly || undefined,
        is_verified: verifiedOnly || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      }),
    placeholderData: (previousData) => previousData,
  });

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="partners"
                checked={partnersOnly}
                onCheckedChange={(checked) => setPartnersOnly(checked as boolean)}
              />
              <Label htmlFor="partners" className="cursor-pointer">
                Partenaires uniquement
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={verifiedOnly}
                onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
              />
              <Label htmlFor="verified" className="cursor-pointer">
                Vérifiées uniquement
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-campus-blue mb-4" />
          <p className="text-gray-500">Chargement des entreprises...</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">
            Erreur lors du chargement des entreprises
          </p>
          <p className="text-sm text-red-500 mt-1">
            {(error as any)?.response?.data?.message || 'Une erreur est survenue'}
          </p>
        </div>
      )}

      {/* Results */}
      {!isLoading && !isError && (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{companies.length}</span> entreprise
              {companies.length > 1 ? 's' : ''} trouvée
              {companies.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Company Cards Grid */}
          {companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="max-w-md mx-auto">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune entreprise trouvée
                </h3>
                <p className="text-sm text-gray-500">
                  Essayez de modifier vos critères de recherche
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
