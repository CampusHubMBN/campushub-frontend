// src/app/(protected)/dashboard/page.tsx
'use client';

import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  console.log('User', user);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour, {user?.name} 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Bienvenue sur ton espace CampusHub
        </p>
      </div>

      {/* Feed Placeholder */}
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <Sparkles className="h-5 w-5" />
              Ton feed personnalisé arrive bientôt !
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Tu retrouveras ici :
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-campus-blue" />
                Les dernières offres qui matchent ton profil
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-campus-orange" />
                Les articles et guides recommandés
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-campus-blue" />
                L'actualité de ton campus
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-campus-orange" />
                Les événements à venir
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Stats - ✅ Utiliser user.info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Complétion profil"
            value={`${user?.info?.profile_completion || 0}%`}
            color="bg-campus-blue"
          />
          <StatCard
            label="Réputation"
            value={user?.info?.reputation_points || 0}
            color="bg-campus-orange"
          />
          <StatCard
            label="Niveau"
            value={formatLevel(user?.info?.level || 'beginner')}
            color="bg-purple-500"
          />
          <StatCard
            label="Candidatures"
            value="0"
            color="bg-green-500"
          />
        </div>

        {/* Profile Completion Alert */}
        {user?.info && user.info.profile_completion < 100 && (
          <Card className="border-campus-orange bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-campus-orange flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">
                    {user.info.profile_completion}%
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Complète ton profil
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Un profil complet augmente tes chances de trouver les meilleures opportunités !
                  </p>
                  <button 
                    onClick={() => window.location.href = '/profile'}
                    className="text-sm font-medium text-campus-orange hover:underline"
                  >
                    Compléter mon profil →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: string | number; 
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className={`h-12 w-12 rounded-full ${color} flex items-center justify-center mb-3`}>
            <span className="text-white font-bold text-lg">
              {typeof value === 'number' ? value : value.slice(0, 1)}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ✅ Helper pour formater le niveau
function formatLevel(level: string): string {
  const levels: Record<string, string> = {
    beginner: 'Débutant',
    active_member: 'Actif',
    contributor: 'Contributeur',
    expert: 'Expert',
    vip: 'VIP',
  };
  return levels[level] || level;
}