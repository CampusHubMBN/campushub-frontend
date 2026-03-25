// src/app/(protected)/events/[id]/page.tsx
'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/services/api/events.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Calendar, Clock, Users, ArrowLeft, Loader2,
  Trophy, Mic2, Network, Dumbbell, Star, CheckCircle2, XCircle,
  Pencil, Trash2, Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EventType } from '@/types/event';

const ORGANIZER_ROLES = ['admin', 'bde_member', 'pedagogical'];

const EVENT_CONFIG: Record<EventType, { label: string; icon: React.ElementType; gradient: string }> = {
  general:    { label: 'Événement',  icon: Star,     gradient: 'from-campus-blue to-blue-700' },
  workshop:   { label: 'Atelier',    icon: Trophy,   gradient: 'from-purple-600 to-purple-800' },
  conference: { label: 'Conférence', icon: Mic2,     gradient: 'from-indigo-600 to-indigo-800' },
  networking: { label: 'Networking', icon: Network,  gradient: 'from-emerald-600 to-emerald-800' },
  sports:     { label: 'Sport',      icon: Dumbbell, gradient: 'from-orange-500 to-orange-700' },
};

const ROLE_LABELS: Record<string, string> = {
  student: 'Étudiants', alumni: 'Alumni', bde_member: 'BDE',
  pedagogical: 'Équipe pédagogique', company: 'Entreprises', admin: 'Admin',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getEvent(id),
  });

  const isOrganizer = user && ORGANIZER_ROLES.includes(user.role) &&
    (user.role === 'admin' || event?.organizer?.id === user.id);

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.delete(id),
    onSuccess: () => {
      toast.success('Événement annulé');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      router.push('/events');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de l\'annulation');
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => eventsApi.publish(id),
    onSuccess: () => {
      toast.success('Événement publié !');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la publication');
    },
  });

  const attendMutation = useMutation({
    mutationFn: () => eventsApi.attend(id),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Une erreur est survenue');
    },
  });

  const unattendMutation = useMutation({
    mutationFn: () => eventsApi.unattend(id),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Une erreur est survenue');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-campus-blue" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Événement introuvable.</p>
      </div>
    );
  }

  const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.general;
  const Icon = config.icon;
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL ?? 'http://localhost:8000';
  const isPast = new Date(event.start_date) < new Date();
  const canRegister = isAuthenticated && !isPast && !event.is_full && !event.is_registered;
  const canUnregister = isAuthenticated && !isPast && event.is_registered;
  const isProcessing = attendMutation.isPending || unattendMutation.isPending;

  const capacityPct = event.capacity
    ? Math.min(100, Math.round((event.attendees_count / event.capacity) * 100))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className={cn('relative bg-gradient-to-br text-white overflow-hidden', config.gradient)}>
        {event.cover_image && (
          <img
            src={`${storageUrl}/storage/${event.cover_image}`}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full border-[40px] border-white translate-x-32 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full border-[30px] border-white -translate-x-12 translate-y-8" />
        </div>

        <div className="container mx-auto px-4 py-10 relative">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux événements
            </button>

            {isOrganizer && (
              <div className="flex items-center gap-2">
                {!event.published_at && (
                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending}
                    className="bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                  >
                    {publishMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                    Publier
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => router.push(`/events/${id}/edit`)}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Annuler l'événement "${event.title}" ? Les inscrits seront notifiés.`)) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="bg-red-500/80 hover:bg-red-600 text-xs font-semibold backdrop-blur-sm"
                >
                  {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                  Annuler l'événement
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
              <Icon className="h-4 w-4" />
              {config.label}
            </span>
            {isPast && (
              <span className="inline-flex items-center gap-1.5 bg-gray-800/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                Passé
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 max-w-2xl">{event.title}</h1>

          <div className="flex flex-wrap gap-4 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.start_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatTime(event.start_date)} – {formatTime(event.end_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                {event.attendees_count} inscrit{event.attendees_count !== 1 ? 's' : ''}
                {event.capacity ? ` / ${event.capacity} places` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-lg mb-4">À propos de cet événement</h2>
              <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                {event.description}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Informations pratiques</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Date</dt>
                  <dd className="font-medium text-gray-900 capitalize">{formatDate(event.start_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Horaires</dt>
                  <dd className="font-medium text-gray-900">{formatTime(event.start_date)} – {formatTime(event.end_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Lieu</dt>
                  <dd className="font-medium text-gray-900">{event.location}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Organisateur</dt>
                  <dd className="font-medium text-gray-900">{event.organizer.name}</dd>
                </div>
                {event.target_roles && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ouvert à</dt>
                    <dd className="flex flex-wrap gap-2">
                      {event.target_roles.map((role) => (
                        <Badge key={role} variant="secondary">{ROLE_LABELS[role] ?? role}</Badge>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Registration card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-20">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Inscription</h2>

              {/* Capacity bar */}
              {capacityPct !== null && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{event.attendees_count} inscrits</span>
                    <span>{event.capacity} places</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 70 ? 'bg-orange-400' : 'bg-emerald-500'
                      )}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                  {event.is_full && (
                    <p className="text-red-500 text-xs font-medium mt-1.5">Événement complet</p>
                  )}
                </div>
              )}

              {/* Status */}
              {event.is_registered && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2.5 mb-4 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Vous êtes inscrit(e)
                </div>
              )}

              {isPast ? (
                <p className="text-gray-500 text-sm text-center py-2">Cet événement est terminé.</p>
              ) : !isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-gray-500 text-sm text-center">Connectez-vous pour vous inscrire</p>
                  <Button
                    className="w-full"
                    onClick={() => router.push('/login')}
                  >
                    Se connecter
                  </Button>
                </div>
              ) : canRegister ? (
                <Button
                  className="w-full"
                  onClick={() => attendMutation.mutate()}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  S'inscrire à cet événement
                </Button>
              ) : canUnregister ? (
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => unattendMutation.mutate()}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  <XCircle className="h-4 w-4 mr-2" />
                  Se désinscrire
                </Button>
              ) : event.is_full ? (
                <Button disabled className="w-full">Complet</Button>
              ) : null}

              {isAuthenticated && !isPast && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Un email de confirmation sera envoyé après inscription.
                  <br />Un rappel 24h avant l'événement.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
