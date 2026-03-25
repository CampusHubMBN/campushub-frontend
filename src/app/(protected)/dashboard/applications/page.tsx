'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { jobApplicationsApi } from '@/services/api/job-applications.api';
import {
  JobApplication, ApplicationStatus,
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS,
  WITHDRAWABLE_STATUSES,
} from '@/types/job-application';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Briefcase, Building2, MapPin, Clock,
  CalendarDays, FileText, ExternalLink, RotateCcw, Search,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  internship: 'Stage', apprenticeship: 'Alternance',
  cdd: 'CDD', cdi: 'CDI', freelance: 'Freelance',
};

const STATUS_FILTERS: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all',         label: 'Toutes'        },
  { value: 'pending',     label: 'En attente'    },
  { value: 'reviewed',    label: 'Examinées'     },
  { value: 'shortlisted', label: 'Présélectionnées' },
  { value: 'interview',   label: 'Entretien'     },
  { value: 'accepted',    label: 'Acceptées'     },
  { value: 'rejected',    label: 'Refusées'      },
  { value: 'withdrawn',   label: 'Retirées'      },
];

export default function ApplicationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => jobApplicationsApi.getMyApplications(),
  });

  const { mutate: withdraw, isPending: withdrawing } = useMutation({
    mutationFn: (id: string) => jobApplicationsApi.withdrawApplication(id),
    onSuccess: () => {
      toast.success('Candidature retirée');
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
    onError: () => toast.error('Erreur lors du retrait'),
  });

  const filtered = applications.filter((app) => {
    const matchStatus = filter === 'all' || app.status === filter;
    const matchSearch = !search ||
      app.job?.title?.toLowerCase().includes(search.toLowerCase()) ||
      (app.job?.company?.name ?? app.job?.company_name ?? '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = STATUS_FILTERS.slice(1).reduce((acc, { value }) => {
    acc[value as ApplicationStatus] = applications.filter((a) => a.status === value).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-campus-blue/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-campus-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes candidatures</h1>
              <p className="text-gray-500 text-sm">{applications.length} candidature{applications.length !== 1 ? 's' : ''} au total</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-5">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par poste ou entreprise..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-campus-blue/30"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ value, label }) => {
            const count = value === 'all' ? applications.length : (counts[value as ApplicationStatus] ?? 0);
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                  filter === value
                    ? 'bg-campus-blue text-white border-campus-blue'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                )}
              >
                {label}
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  filter === value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune candidature trouvée</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter !== 'all' ? 'Essayez un autre filtre' : 'Commencez par postuler à une offre !'}
            </p>
            {filter === 'all' && (
              <Button className="mt-4" onClick={() => router.push('/jobs')}>
                Voir les offres
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <ApplicationRow
                key={app.id}
                app={app}
                onWithdraw={() => withdraw(app.id)}
                withdrawing={withdrawing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationRow({
  app, onWithdraw, withdrawing,
}: {
  app: JobApplication;
  onWithdraw: () => void;
  withdrawing: boolean;
}) {
  const router = useRouter();
  const company = app.job?.company?.name ?? app.job?.company_name ?? 'Entreprise confidentielle';
  const logo    = app.job?.company?.logo_url;
  const canWithdraw = WITHDRAWABLE_STATUSES.includes(app.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4">
      {/* Logo */}
      {logo ? (
        <img src={logo} alt={company} className="h-12 w-12 rounded-xl object-contain border border-gray-100 shrink-0" />
      ) : (
        <div className="h-12 w-12 rounded-xl bg-campus-blue/10 flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-campus-blue" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900 truncate">
              {app.job?.title ?? 'Offre supprimée'}
            </p>
            <p className="text-sm text-gray-500">{company}</p>
          </div>
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full shrink-0', APPLICATION_STATUS_COLORS[app.status])}>
            {APPLICATION_STATUS_LABELS[app.status]}
          </span>
        </div>

        {/* Meta tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {app.job?.type && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
              <Briefcase className="h-3 w-3" />
              {TYPE_LABELS[app.job.type] ?? app.job.type}
            </span>
          )}
          {app.job?.location_city && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
              <MapPin className="h-3 w-3" />
              {app.job.location_city}
            </span>
          )}
          {app.interview_at && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              <CalendarDays className="h-3 w-3" />
              Entretien : {new Date(app.interview_at).toLocaleDateString('fr-FR')}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: fr })}
          </span>
        </div>

        {/* Notes from recruiter */}
        {app.notes && (
          <p className="mt-2 text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            💬 {app.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0">
        {app.job?.id && (
          <Button
            size="sm" variant="outline"
            onClick={() => router.push(`/jobs/${app.job!.id}`)}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Voir l'offre
          </Button>
        )}
        {canWithdraw && (
          <Button
            size="sm" variant="ghost"
            onClick={onWithdraw}
            disabled={withdrawing}
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Retirer
          </Button>
        )}
      </div>
    </div>
  );
}
