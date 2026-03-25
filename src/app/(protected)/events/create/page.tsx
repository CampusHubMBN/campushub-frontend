'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { EventForm } from '@/components/events/EventForm';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { useEffect } from 'react';

const ORGANIZER_ROLES = ['admin', 'bde_member', 'pedagogical'];

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && !ORGANIZER_ROLES.includes(user.role)) {
      router.replace('/events');
    }
  }, [user, router]);

  if (!user || !ORGANIZER_ROLES.includes(user.role)) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-campus-blue/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-campus-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Créer un événement</h1>
              <p className="text-gray-500 text-sm">Remplissez les informations de votre événement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <EventForm />
      </div>
    </div>
  );
}
