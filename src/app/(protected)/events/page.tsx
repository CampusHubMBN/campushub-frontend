// src/app/(protected)/events/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/services/api/events.api';
import { useAuthStore } from '@/store/auth.store';
import { EventCard } from '@/components/events/EventCard';
import { Loader2, CalendarDays, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ORGANIZER_ROLES = ['admin', 'bde_member', 'pedagogical'];

const TYPE_FILTERS = [
  { value: '',             label: 'Tous' },
  { value: 'networking',   label: 'Networking' },
  { value: 'workshop',     label: 'Ateliers' },
  { value: 'conference',   label: 'Conférences' },
  { value: 'sports',       label: 'Sports' },
  { value: 'general',      label: 'Autres' },
];

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isOrganizer = user && ORGANIZER_ROLES.includes(user.role);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['events', typeFilter],
    queryFn: () => eventsApi.getEvents({ type: typeFilter || undefined, upcoming: true }),
  });

  const events = data?.data ?? [];

  const filtered = search
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase())
      )
    : events;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero banner */}
      <div className="relative bg-gradient-to-br from-campus-blue via-blue-700 to-campus-indigo text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full border-[40px] border-white translate-x-32 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full border-[30px] border-white -translate-x-16 translate-y-8" />
        </div>
        <div className="container mx-auto px-4 py-14 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CalendarDays className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-blue-200 text-sm font-medium uppercase tracking-widest">Campus</p>
              <h1 className="text-4xl font-bold leading-tight">Événements</h1>
            </div>
          </div>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <p className="text-blue-100 text-lg max-w-xl">
              Ateliers, conférences, networking et plus — restez connecté à la vie du campus.
            </p>
            {isOrganizer && (
              <Button
                onClick={() => router.push('/events/create')}
                className="bg-white text-campus-blue hover:bg-blue-50 font-semibold shrink-0"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Créer un événement
              </Button>
            )}
          </div>

          {/* Search bar */}
          <div className="mt-8 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un événement ou un lieu..."
              className="pl-9 bg-white text-gray-900 border-0 h-11 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  typeFilter === f.value
                    ? 'bg-campus-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-campus-blue" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucun événement à venir</p>
            <p className="text-gray-400 text-sm mt-1">Revenez bientôt, de nouveaux événements seront publiés.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6">
              {filtered.length} événement{filtered.length !== 1 ? 's' : ''} à venir
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
