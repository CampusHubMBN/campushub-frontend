'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobApplicationsApi } from '@/services/api/job-applications.api';
import { jobsApi } from '@/services/api/jobs.api';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft, User, MapPin, Calendar, FileText,
  ChevronRight, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  JobApplication, ApplicationStatus,
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, APPLICATION_STATUS_DOTS,
} from '@/types/job-application';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_FILTERS: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all',         label: 'Toutes' },
  { value: 'pending',     label: 'En attente' },
  { value: 'reviewed',    label: 'Examinées' },
  { value: 'shortlisted', label: 'Présélectionnées' },
  { value: 'interview',   label: 'Entretien' },
  { value: 'accepted',    label: 'Acceptées' },
  { value: 'rejected',    label: 'Refusées' },
];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', APPLICATION_STATUS_COLORS[status])}>
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', APPLICATION_STATUS_DOTS[status])} />
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}

function ApplicantRow({ application }: { application: JobApplication }) {
  const router = useRouter();
  const applicant = application.applicant;
  const name = applicant?.name ?? 'Candidat inconnu';
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className="flex items-center gap-3 py-3 px-1 group border-b border-campus-gray-100 last:border-0 cursor-pointer hover:bg-campus-gray-50/50 rounded transition-colors"
      onClick={() => router.push(`/recruiter/applications/${application.id}`)}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full border border-campus-gray-200 bg-campus-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {applicant?.avatar_url
          ? <img src={applicant.avatar_url} alt={name} className="w-full h-full object-cover" />
          : <span className="text-xs font-semibold text-campus-gray-500">{initials}</span>
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-campus-gray-900 truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-campus-gray-500">{applicant?.email ?? '—'}</span>
          <span className="text-campus-gray-300 text-xs">·</span>
          <span className="text-xs text-campus-gray-400">
            {formatDistanceToNow(new Date(application.created_at), { addSuffix: true, locale: fr })}
          </span>
          {application.interview_at && (
            <><span className="text-campus-gray-300 text-xs">·</span>
            <span className="text-xs text-campus-blue-600 font-medium flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              Entretien le {format(new Date(application.interview_at), 'd MMM', { locale: fr })}
            </span></>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={application.status} />
        <ChevronRight className="h-4 w-4 text-campus-gray-300 group-hover:text-campus-blue transition-colors" />
      </div>
    </div>
  );
}

export default function JobApplicationsPage() {
  const router = useRouter();
  const { jobId } = useParams<{ jobId: string }>();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.getJob(jobId),
    enabled: !!jobId,
  });

  const { data, isLoading: appsLoading } = useQuery({
    queryKey: ['job-applications', jobId, statusFilter],
    queryFn: () => jobApplicationsApi.getJobApplications(
      jobId,
      statusFilter !== 'all' ? { status: statusFilter } : undefined
    ),
    enabled: !!jobId,
  });

  const applications: JobApplication[] = data?.data ?? [];
  const total = data?.meta?.total ?? applications.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Back + Job info */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="mt-0.5 h-8 w-8 text-campus-gray-500 hover:text-campus-gray-900"
          onClick={() => router.push('/recruiter')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          {jobLoading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-campus-gray-900">{job?.title ?? '—'}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm text-campus-gray-500">
                  {job?.company?.name ?? job?.company_name ?? '—'}
                </span>
                {job?.location_city && (
                  <><span className="text-campus-gray-300">·</span>
                  <span className="text-sm text-campus-gray-400 flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />{job.location_city}
                  </span></>
                )}
                <span className="text-campus-gray-300">·</span>
                <span className="text-sm font-medium text-campus-blue">{job?.applications_count ?? 0} candidature{(job?.applications_count ?? 0) !== 1 ? 's' : ''}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              statusFilter === f.value
                ? 'bg-campus-blue text-white border-campus-blue'
                : 'bg-white text-campus-gray-600 border-campus-gray-200 hover:border-campus-blue-200 hover:text-campus-blue'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Applications list */}
      <Card className="border-campus-gray-300 shadow-sm">
        <CardHeader className="px-5 py-4 border-b border-campus-gray-100">
          <CardTitle className="text-sm font-semibold text-campus-gray-900">
            {appsLoading ? <Skeleton className="h-4 w-32" /> : `${total} candidature${total !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 px-4">
          {appsLoading ? (
            <div className="py-4 space-y-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-8 w-8 text-campus-gray-300 mx-auto mb-2" />
              <p className="text-sm text-campus-gray-500">
                {statusFilter === 'all' ? 'Aucune candidature reçue' : `Aucune candidature "${APPLICATION_STATUS_LABELS[statusFilter as ApplicationStatus]}"`}
              </p>
            </div>
          ) : (
            <div>
              {applications.map((app) => (
                <ApplicantRow key={app.id} application={app} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
