'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobApplicationsApi } from '@/services/api/job-applications.api';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft, FileText, Download, Mail, Calendar,
  CheckCircle2, XCircle, Clock, User, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  JobApplication, ApplicationStatus, UpdateStatusPayload,
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, APPLICATION_STATUS_DOTS,
} from '@/types/job-application';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

// Statuses a recruiter can set (excludes 'withdrawn' which is student-only)
const RECRUITER_STATUSES: ApplicationStatus[] = [
  'reviewed', 'shortlisted', 'interview', 'accepted', 'rejected',
];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium', APPLICATION_STATUS_COLORS[status])}>
      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', APPLICATION_STATUS_DOTS[status])} />
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}

function Timeline({ application }: { application: JobApplication }) {
  const steps: { label: string; date: string | null; icon: React.ElementType; done: boolean }[] = [
    { label: 'Candidature reçue',  date: application.created_at,   icon: FileText,     done: true },
    { label: 'Examinée',           date: application.reviewed_at,   icon: User,         done: !!application.reviewed_at },
    { label: 'Entretien planifié', date: application.interview_at,  icon: Calendar,     done: !!application.interview_at },
    { label: application.status === 'accepted' ? 'Acceptée' : 'Décision finale',
                                   date: application.responded_at,  icon: application.status === 'accepted' ? CheckCircle2 : XCircle,
                                   done: !!application.responded_at },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={i} className="flex items-start gap-3">
            <div className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 border',
              step.done
                ? 'bg-campus-blue border-campus-blue'
                : 'bg-campus-gray-50 border-campus-gray-200'
            )}>
              <Icon className={cn('h-3.5 w-3.5', step.done ? 'text-white' : 'text-campus-gray-300')} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className={cn('text-sm font-medium', step.done ? 'text-campus-gray-900' : 'text-campus-gray-400')}>
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-campus-gray-400 mt-0.5">
                  {format(new Date(step.date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { appId } = useParams<{ appId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [interviewAt, setInterviewAt] = useState('');

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', appId],
    queryFn: () => jobApplicationsApi.getApplication(appId),
    enabled: !!appId,
  });

  const { mutate: updateStatus, isPending: updating } = useMutation({
    mutationFn: (payload: UpdateStatusPayload) =>
      jobApplicationsApi.updateApplicationStatus(appId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['application', appId], updated);
      // Invalidate the job applications list
      if (updated.job_id) {
        queryClient.invalidateQueries({ queryKey: ['job-applications', updated.job_id] });
      }
      setNewStatus('');
      toast.success('Statut mis à jour avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du statut');
    },
  });

  const handleSubmit = () => {
    if (!newStatus) return;
    const payload: UpdateStatusPayload = { status: newStatus, notes: notes || undefined };
    if (newStatus === 'interview' && interviewAt) {
      payload.interview_at = new Date(interviewAt).toISOString();
    }
    updateStatus(payload);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!application) return null;

  const applicant = application.applicant;
  const job = application.job;
  const name = applicant?.name ?? 'Candidat';
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const storageBase = process.env.NEXT_PUBLIC_STORAGE_URL ?? 'http://localhost:8000/storage';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-campus-gray-500 hover:text-campus-gray-900"
          onClick={() => job ? router.push(`/recruiter/jobs/${application.job_id}/applications`) : router.push('/recruiter')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-campus-gray-500">
            {job?.title ?? 'Offre'} · <span className="text-campus-gray-400">Candidature de {name}</span>
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: applicant + cover letter + docs */}
        <div className="md:col-span-2 space-y-4">

          {/* Applicant profile card */}
          <Card className="border-campus-gray-300 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full border border-campus-gray-200 bg-campus-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {applicant?.avatar_url
                    ? <img src={applicant.avatar_url} alt={name} className="w-full h-full object-cover" />
                    : <span className="text-sm font-bold text-campus-gray-500">{initials}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-campus-gray-900">{name}</p>
                  {applicant?.email && (
                    <a href={`mailto:${applicant.email}`}
                      className="text-sm text-campus-blue hover:underline flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" />{applicant.email}
                    </a>
                  )}
                  <p className="text-xs text-campus-gray-400 mt-1">
                    Candidature soumise le {format(new Date(application.created_at), "d MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover letter */}
          <Card className="border-campus-gray-300 shadow-sm">
            <CardHeader className="px-5 py-4 border-b border-campus-gray-100">
              <CardTitle className="text-sm font-semibold text-campus-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-campus-blue" />
                Lettre de motivation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-sm text-campus-gray-700 whitespace-pre-wrap leading-relaxed">
                {application.cover_letter}
              </p>
            </CardContent>
          </Card>

          {/* Documents */}
          {(application.cv_url || (application.additional_documents && application.additional_documents.length > 0)) && (
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="px-5 py-4 border-b border-campus-gray-100">
                <CardTitle className="text-sm font-semibold text-campus-gray-900">Documents</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-2">
                {application.cv_url && (
                  <a
                    href={`${storageBase}/${application.cv_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-campus-gray-200 hover:border-campus-blue-200 hover:bg-campus-blue-50/40 transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-campus-blue flex-shrink-0" />
                    <span className="text-sm font-medium text-campus-gray-700 group-hover:text-campus-blue flex-1">
                      CV
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-campus-gray-400 group-hover:text-campus-blue" />
                  </a>
                )}
                {application.additional_documents?.map((doc, i) => (
                  <a
                    key={i}
                    href={`${storageBase}/${doc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-campus-gray-200 hover:border-campus-blue-200 hover:bg-campus-blue-50/40 transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-campus-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-campus-gray-700 group-hover:text-campus-blue flex-1">
                      Document {i + 1}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-campus-gray-400 group-hover:text-campus-blue" />
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recruiter notes (read) */}
          {application.notes && !['pending'].includes(application.status) && (
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="px-5 py-4 border-b border-campus-gray-100">
                <CardTitle className="text-sm font-semibold text-campus-gray-900">Notes recruteur</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-sm text-campus-gray-700 whitespace-pre-wrap">{application.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar: timeline + status update */}
        <div className="space-y-4">
          {/* Timeline */}
          <Card className="border-campus-gray-300 shadow-sm">
            <CardHeader className="px-5 py-4 border-b border-campus-gray-100">
              <CardTitle className="text-sm font-semibold text-campus-gray-900">Historique</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <Timeline application={application} />
            </CardContent>
          </Card>

          {/* Update status */}
          {application.status !== 'accepted' && application.status !== 'rejected' && application.status !== 'withdrawn' && (
            <Card className="border-campus-gray-300 shadow-sm">
              <CardHeader className="px-5 py-4 border-b border-campus-gray-100">
                <CardTitle className="text-sm font-semibold text-campus-gray-900">Mettre à jour</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Status select */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-campus-gray-600">Nouveau statut</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ApplicationStatus)}>
                    <SelectTrigger className="h-9 text-sm border-campus-gray-200">
                      <SelectValue placeholder="Choisir un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECRUITER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-sm">
                          {APPLICATION_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Interview date (if interview selected) */}
                {newStatus === 'interview' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-campus-gray-600">Date d'entretien</Label>
                    <Input
                      type="datetime-local"
                      value={interviewAt}
                      onChange={(e) => setInterviewAt(e.target.value)}
                      className="h-9 text-sm border-campus-gray-200"
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-campus-gray-600">Notes (optionnel)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Commentaires internes sur le candidat..."
                    className="text-sm border-campus-gray-200 resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full bg-campus-blue hover:bg-campus-blue/90 text-white text-sm h-9"
                  disabled={!newStatus || updating || (newStatus === 'interview' && !interviewAt)}
                  onClick={handleSubmit}
                >
                  {updating ? 'Mise à jour...' : 'Confirmer'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Final decision badge */}
          {(application.status === 'accepted' || application.status === 'rejected') && (
            <Card className={cn(
              'border shadow-sm',
              application.status === 'accepted' ? 'border-campus-orange-200 bg-campus-orange-50' : 'border-red-200 bg-red-50'
            )}>
              <CardContent className="p-5 flex items-center gap-3">
                {application.status === 'accepted'
                  ? <CheckCircle2 className="h-5 w-5 text-campus-orange flex-shrink-0" />
                  : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                }
                <div>
                  <p className={cn('text-sm font-semibold', application.status === 'accepted' ? 'text-campus-orange-700' : 'text-red-700')}>
                    Candidature {application.status === 'accepted' ? 'acceptée' : 'refusée'}
                  </p>
                  {application.responded_at && (
                    <p className="text-xs text-campus-gray-500 mt-0.5">
                      {format(new Date(application.responded_at), "d MMM yyyy", { locale: fr })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
