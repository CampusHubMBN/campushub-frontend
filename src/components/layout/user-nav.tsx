// src/components/layout/user-nav.tsx
'use client';

import { authApi } from '@/services/api/auth.api';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export function UserNav() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  console.log('🔍 UserNav render - user:', user ? 'présent' : 'null');
  console.log('🔍 UserNav render - user.name:', user?.name);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      toast.success('Déconnexion réussie');
      router.push('/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

// ✅ Protected layout garantit que user existe
  // Mais garde un guard défensif
  if (!user || !user.name) {
    return null;
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-campus-blue rounded-full p-1">
          <Avatar className="h-9 w-9 border-2 border-campus-blue">
            {/* ✅ Avatar depuis user.info */}
            <AvatarImage 
              src={user.info?.avatar_url || undefined} 
              alt={user.name} 
            />
            <AvatarFallback className="bg-campus-blue text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          Profil
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Paramètres
        </DropdownMenuItem>

        {/* Admin Menu */}
        {user.role === 'admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/invitations')}>
              <Shield className="mr-2 h-4 w-4" />
              Administration
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}