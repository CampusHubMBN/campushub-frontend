'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/services/api/events.api';
import { useAuthStore } from '@/store/auth.store';
import { EventForm } from '@/components/events/EventForm';
import { ArrowLeft, CalendarDays, Loader2 } from 'lucide-react';

const ORGANIZER_ROLES = ['admin', 'bde_member', 'pedagogical'];

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getEvent(id),
  });

  // Redirect if not an organizer or not the event owner
  useEffect(() => {
    if (!user || !ORGANIZER_ROLES.includes(user.role)) {
      router.replace(`/events/${id}`);
      return;
    }
    if (event && user.role !== 'admin' && event.organizer.id !== user.id) {
      router.replace(`/events/${id}`);
    }
  }, [user, event, id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-campus-blue" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <button
            onClick={() => router.push(`/events/${id}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'événement
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-campus-blue/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-campus-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modifier l'événement</h1>
              <p className="text-gray-500 text-sm truncate max-w-xs">{event.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <EventForm event={event} />
      </div>
    </div>
  );
}
