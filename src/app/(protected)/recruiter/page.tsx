'use client';

import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/services/api/jobs.api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase, Users, Clock, ChevronRight,
  Building2, MapPin, Plus, Eye, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Job } from '@/types/job';
import { User } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const JOB_TYPE_LABELS: Record<string, string> = {
  internship: 'Stage', apprenticeship: 'Alternance',
  cdd: 'CDD', cdi: 'CDI', freelance: 'Freelance',
};

const JOB_STATUS_STYLES: Record<string, string> = {
  draft:     'bg-campus-gray-100 text-campus-gray-600 border border-campus-gray-300',
  published: 'bg-green-50 text-green-700 border border-green-200',
  closed:    'bg-red-50 text-red-600 border border-red-200',
  filled:    'bg-campus-orange-50 text-campus-orange-700 border border-campus-orange-200',
};

const JOB_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', published: 'Publiée', closed: 'Fermée', filled: 'Pourvue',
};

function StatCard({ label, value, icon: Icon, colorClass }: {
  label: string; value: number; icon: React.ElementType; colorClass: string;
}) {
  return (
    <Card className="border-campus-gray-300 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-campus-gray-900 leading-none mb-0.5">{value}</p>
            <p className="text-xs text-campus-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function JobRow({ job, user }: { job: Job & { applications_count: number; pending_count?: number }; user: User | null }) {
  const router = useRouter();
  const company = job.company?.name ?? job.company_name ?? '—';
  const isExternal = job.source_type === 'external';

  const handlePrimaryAction = () => {
    if (isExternal) {
      if (job.external_url) window.open(job.external_url, '_blank');
    } else {
      router.push(`/recruiter/jobs/${job.id}/applications`);
    }
  };

  return (
    <div className="flex items-center gap-3 py-3 px-1 group border-b border-campus-gray-100 last:border-0">
      <div className="w-9 h-9 rounded-lg border border-campus-gray-200 bg-campus-gray-50 flex items-center justify-center flex-shrink-0">
        {job.company?.logo_url
          ? <img src={job.company.logo_url} alt={company} className="w-7 h-7 object-contain rounded" />
          : <Building2 className="h-4 w-4 text-campus-gray-400" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-campus-gray-900 truncate">{job.title}</p>
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', JOB_STATUS_STYLES[job.status])}>
            {JOB_STATUS_LABELS[job.status]}
          </span>
          {isExternal && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-campus-gray-100 text-campus-gray-500 border border-campus-gray-200">
              Externe
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-campus-gray-500">{company}</span>
          {job.location_city && (
            <><span className="text-campus-gray-300 text-xs">·</span>
            <span className="text-xs text-campus-gray-400 flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />{job.location_city}
            </span></>
          )}
          {user?.role === 'admin' && job.posted_by && (
            <><span className="text-campus-gray-300 text-xs">·</span>
            <span className="text-xs text-campus-gray-400">par {job.posted_by.name}</span></>
          )}
          <span className="text-campus-gray-300 text-xs">·</span>
          <span className="text-xs text-campus-gray-400">
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {isExternal ? (
          <span className="text-xs text-campus-gray-400 hidden sm:block">Candidatures externes</span>
        ) : (
          <>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-campus-gray-900">{job.applications_count}</p>
              <p className="text-xs text-campus-gray-400">candidature{job.applications_count !== 1 ? 's' : ''}</p>
            </div>
            {(job as any).pending_count > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-campus-blue-50 text-campus-blue border border-campus-blue-100">
                {(job as any).pending_count} en attente
              </span>
            )}
          </>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50"
            title="Voir l'offre" onClick={() => router.push(`/jobs/${job.id}`)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {isExternal ? (
            job.external_url && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50"
                title="Ouvrir le lien externe" onClick={() => window.open(job.external_url!, '_blank')}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50"
              title="Voir les candidatures" onClick={() => router.push(`/recruiter/jobs/${job.id}/applications`)}>
              <Users className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <ChevronRight
          className="h-4 w-4 text-campus-gray-300 cursor-pointer hover:text-campus-blue transition-colors"
          onClick={handlePrimaryAction}
        />
      </div>
    </div>
  );
}

export default function RecruiterDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'company' && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['my-posted-jobs'],
    queryFn: jobsApi.getMyPostedJobs,
    enabled: !!user,
  });

  const typedJobs = (jobs ?? []) as Array<Job & { applications_count: number; pending_count: number }>;

  const internalJobs = typedJobs.filter((j) => j.source_type === 'internal');
  const totalApplications = internalJobs.reduce((sum, j) => sum + (j.applications_count ?? 0), 0);
  const pendingApplications = internalJobs.reduce((sum, j) => sum + (j.pending_count ?? 0), 0);
  const activeJobs = typedJobs.filter((j) => j.status === 'published').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-campus-gray-900">
            {user?.role === 'admin' ? 'Gestion des offres' : 'Espace recruteur'}
          </h1>
          <p className="text-sm text-campus-gray-500 mt-0.5">
            {user?.role === 'admin' ? 'Toutes les offres et candidatures' : 'Gérez vos offres et candidatures'}
          </p>
        </div>
        <Button
          className="bg-campus-blue hover:bg-campus-blue/90 text-white gap-1.5"
          onClick={() => router.push('/jobs/create')}
        >
          <Plus className="h-4 w-4" />
          Nouvelle offre
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Offres actives" value={activeJobs} icon={Briefcase} colorClass="bg-campus-blue" />
        <StatCard label="Candidatures" value={totalApplications} icon={Users} colorClass="bg-campus-orange" />
        <StatCard label="En attente" value={pendingApplications} icon={Clock} colorClass="bg-campus-gray-500" />
      </div>

      {/* Jobs list */}
      <Card className="border-campus-gray-300 shadow-sm">
        <CardHeader className="px-5 py-4 border-b border-campus-gray-100">
          <CardTitle className="text-sm font-semibold text-campus-gray-900">
            {user?.role === 'admin' ? 'Toutes les offres' : 'Mes offres'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 px-4">
          {isLoading ? (
            <div className="py-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : typedJobs.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase className="h-8 w-8 text-campus-gray-300 mx-auto mb-2" />
              <p className="text-sm text-campus-gray-500">Aucune offre publiée pour l'instant</p>
              <Button variant="ghost" className="mt-2 text-campus-blue text-sm" onClick={() => router.push('/jobs/create')}>
                Créer votre première offre
              </Button>
            </div>
          ) : (
            <div>
              {typedJobs.map((job) => (
                <JobRow key={job.id} job={job} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
