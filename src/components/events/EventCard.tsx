// src/components/events/EventCard.tsx
'use client';

import { CampusEvent, EventType } from '@/types/event';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, Clock, ChevronRight, Trophy, Mic2, Network, Dumbbell, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: CampusEvent;
}

const EVENT_CONFIG: Record<EventType, {
  label: string;
  icon: React.ElementType;
  gradient: string;
  badgeClass: string;
}> = {
  general:      { label: 'Événement',   icon: Star,     gradient: 'from-campus-blue to-blue-700',     badgeClass: 'bg-blue-100 text-blue-700' },
  workshop:     { label: 'Atelier',     icon: Trophy,   gradient: 'from-purple-600 to-purple-800',    badgeClass: 'bg-purple-100 text-purple-700' },
  conference:   { label: 'Conférence',  icon: Mic2,     gradient: 'from-indigo-600 to-indigo-800', badgeClass: 'bg-indigo-100 text-indigo-700' },
  networking:   { label: 'Networking',  icon: Network,  gradient: 'from-emerald-600 to-emerald-800',  badgeClass: 'bg-emerald-100 text-emerald-700' },
  sports:       { label: 'Sport',       icon: Dumbbell, gradient: 'from-orange-500 to-orange-700',    badgeClass: 'bg-orange-100 text-orange-700' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isUpcoming(iso: string) {
  return new Date(iso) > new Date();
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.general;
  const Icon = config.icon;
  const upcoming = isUpcoming(event.start_date);

  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL ?? 'http://localhost:8000';

  return (
    <div
      onClick={() => router.push(`/events/${event.id}`)}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-100"
    >
      {/* Cover / Header band */}
      <div className={cn('relative h-44 bg-gradient-to-br', config.gradient)}>
        {event.cover_image ? (
          <img
            src={`${storageUrl}/storage/${event.cover_image}`}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        ) : null}

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-[20px] border-white" />
          <div className="absolute -bottom-8 -left-4 w-40 h-40 rounded-full border-[20px] border-white" />
        </div>

        {/* Type badge */}
        <div className="absolute top-4 left-4">
          <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', config.badgeClass)}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </span>
        </div>

        {/* Full badge */}
        {event.is_full && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            Complet
          </div>
        )}

        {/* Registered indicator */}
        {event.is_registered && (
          <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            ✓ Inscrit
          </div>
        )}

        {/* Date chip at bottom */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-campus-blue shrink-0" />
          <div>
            <p className="text-xs font-semibold text-gray-900 leading-tight">{formatDate(event.start_date)}</p>
            <p className="text-xs text-gray-500">{formatTime(event.start_date)}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-campus-blue transition-colors line-clamp-2">
            {event.title}
          </h3>
          <p className="text-gray-500 text-sm mt-1.5 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-gray-400" />
            <span>
              {formatTime(event.start_date)} → {formatTime(event.end_date)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>
              {event.attendees_count}
              {event.capacity ? ` / ${event.capacity}` : ''} inscrit{event.attendees_count !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center text-campus-blue text-sm font-semibold group-hover:gap-2 gap-1 transition-all">
            <span>{upcoming ? 'S\'inscrire' : 'Voir'}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
