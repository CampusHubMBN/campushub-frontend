// src/components/jobs/JobList.tsx
'use client';

import { useState } from 'react';
import { JobCard } from './JobCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/services/api/jobs.api';
import { useDebounce } from 'use-debounce';
import { JobType } from '@/types/job';
import { useAuthStore } from '@/store/auth.store';

const APPLICANT_ROLES = ['student', 'alumni', 'bde_member'];

export function JobList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<JobType | 'all'>('all');
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const { user } = useAuthStore();

  const isApplicant = user && APPLICANT_ROLES.includes(user.role);
  const hasSkills = (user?.info?.skills?.length ?? 0) > 0;

  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['jobs', debouncedSearch, typeFilter],
    queryFn: () =>
      jobsApi.getJobs({
        search: debouncedSearch,
        type: typeFilter,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Fetch match scores once per session when the user has a CV with skills
  const { data: scoreMap = {} } = useQuery<Record<string, number>>({
    queryKey: ['cv-match-scores', user?.id],
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
      if (!res.ok) return {};
      const results: { jobOffer: { id: string }; score: number }[] = await res.json();
      return Object.fromEntries(results.map((r) => [r.jobOffer.id, r.score]));
    },
    enabled: !!isApplicant && hasSkills && !!user?.info?.cv_url,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une offre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-campus-orange-600"
            />
          </div>

          {/* Job Type Filter */}
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as JobType | 'all')}>
            <SelectTrigger className="w-full md:w-[200px] border-campus-orange-600">
              <SelectValue placeholder="Type de contrat" />
            </SelectTrigger>
            <SelectContent className='border-campus-orange-600'>
              <SelectItem value="all">Tous les contrats</SelectItem>
              <SelectItem value="internship">Stage</SelectItem>
              <SelectItem value="apprenticeship">Alternance</SelectItem>
              <SelectItem value="cdd">CDD</SelectItem>
              <SelectItem value="cdi">CDI</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>

          {/* More Filters Button (TODO) */}
          <Button variant="outline" className="gap-2 border-campus-orange-600">
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-campus-blue mb-4" />
          <p className="text-gray-500">Chargement des offres...</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">
            Erreur lors du chargement des offres
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
              <span className="font-semibold">{jobs.length}</span> offre
              {jobs.length > 1 ? 's' : ''} trouvée{jobs.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Job Cards Grid */}
          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} matchScore={scoreMap[job.id]} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="max-w-md mx-auto">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune offre trouvée
                </h3>
                <p className="text-sm text-gray-500">
                  Essayez de modifier vos critères de recherche ou vos filtres
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
