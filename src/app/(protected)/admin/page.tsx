// src/app/(protected)/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, AdminUser } from '@/services/api/admin.api';
import { invitationsApi } from '@/services/api/invitation.api';
import { postsApi } from '@/services/api/posts.api';
import { Invitation, UserRole } from '@/types/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Shield, Users, Mail, BookOpen, MessageSquare, TrendingUp,
  UserPlus, Search, Ban, CheckCircle, XCircle, Clock, Copy,
  RefreshCw, Trash2, Pencil, Eye, Plus, Tag, LayoutGrid,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageUrl } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  student:     'Étudiant',
  alumni:      'Alumni',
  bde_member:  'BDE',
  pedagogical: 'Pédagogique',
  company:     'Entreprise',
  admin:       'Admin',
};

const ROLE_COLORS: Record<string, string> = {
  student:     'bg-campus-blue-50 text-campus-blue border-campus-blue-200',
  alumni:      'bg-campus-orange-50 text-campus-orange-700 border-campus-orange-200',
  bde_member:  'bg-purple-50 text-purple-700 border-purple-200',
  pedagogical: 'bg-green-50 text-green-700 border-green-200',
  company:     'bg-campus-gray-100 text-campus-gray-700 border-campus-gray-300',
  admin:       'bg-red-50 text-red-700 border-red-200',
};

const TABS = [
  { key: 'stats',       label: 'Vue d\'ensemble', icon: TrendingUp   },
  { key: 'users',       label: 'Utilisateurs',    icon: Users        },
  { key: 'invitations', label: 'Invitations',     icon: Mail         },
  { key: 'categories',  label: 'Catégories',      icon: LayoutGrid   },
] as const;

type Tab = typeof TABS[number]['key'];

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card className="border-campus-gray-300 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-campus-gray-900 leading-none">{value}</p>
            <p className="text-xs text-campus-gray-500 mt-0.5">{label}</p>
            {sub && <p className="text-xs text-campus-gray-400">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router      = useRouter();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  // Guard admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Accès non autorisé');
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-campus-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-campus-gray-200">
        <div className="container mx-auto px-4 max-w-6xl py-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-campus-blue flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-campus-gray-900">Panel Admin</h1>
              <p className="text-xs text-campus-gray-500">CampusHub — Administration</p>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === key
                    ? 'bg-campus-blue text-white'
                    : 'text-campus-gray-600 hover:bg-campus-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8">
        {activeTab === 'stats'       && <StatsTab />}
        {activeTab === 'users'       && <UsersTab />}
        {activeTab === 'invitations' && <InvitationsTab />}
        {activeTab === 'categories'  && <CategoriesTab />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS TAB
// ─────────────────────────────────────────────────────────────────────────────
function StatsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  adminApi.getStats,
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-24 bg-campus-gray-200 rounded-xl" />
      ))}
    </div>
  );

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Users */}
      <div>
        <h2 className="text-sm font-semibold text-campus-gray-500 uppercase tracking-wider mb-3">Utilisateurs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total users"    value={stats.users.total}          icon={Users}    color="bg-campus-blue"    />
          <StatCard label="Actifs"         value={stats.users.active}         icon={CheckCircle} color="bg-green-500"   />
          <StatCard label="Suspendus"      value={stats.users.suspended}      icon={Ban}      color="bg-red-500"        />
          <StatCard label="Ce mois"        value={stats.users.new_this_month} icon={UserPlus} color="bg-campus-orange"  sub="nouveaux inscrits" />
        </div>
      </div>

      {/* Répartition par rôle */}
      <Card className="border-campus-gray-300 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-campus-gray-900">Répartition par rôle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.users.by_role).map(([role, count]) => (
              <div key={role} className="flex items-center gap-2 px-3 py-2 bg-campus-gray-50 rounded-lg border border-campus-gray-200">
                <Badge className={cn('text-xs border', ROLE_COLORS[role] ?? ROLE_COLORS.student)}>
                  {ROLE_LABELS[role] ?? role}
                </Badge>
                <span className="text-sm font-bold text-campus-gray-900">{count as number}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Posts + Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-campus-gray-500 uppercase tracking-wider mb-3">Blog</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total"    value={stats.posts.total}     icon={MessageSquare} color="bg-campus-blue-700" />
            <StatCard label="Publiés"  value={stats.posts.published} icon={CheckCircle}   color="bg-green-500"      />
            <StatCard label="Brouillons" value={stats.posts.drafts}  icon={Clock}         color="bg-campus-gray-500"/>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-campus-gray-500 uppercase tracking-wider mb-3">Articles</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total"    value={stats.articles.total}     icon={BookOpen}    color="bg-campus-blue-700" />
            <StatCard label="Publiés"  value={stats.articles.published} icon={CheckCircle} color="bg-green-500"       />
            <StatCard label="Brouillons" value={stats.articles.drafts}  icon={Clock}       color="bg-campus-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS TAB
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_TRANSITIONS: Record<string, string[]> = {
  student:    ['bde_member', 'alumni'],
  bde_member: ['student', 'alumni'],
};

function UsersTab() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch]           = useState('');
  const [role, setRole]               = useState('all');
  const [status, setStatus]           = useState('all');
  const [page, setPage]               = useState(1);
  const [debSearch, setDeb]           = useState('');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__adminSearch);
    (window as any).__adminSearch = setTimeout(() => { setDeb(val); setPage(1); }, 400);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search: debSearch, role, status, page }],
    queryFn: () => adminApi.getUsers({
      search: debSearch || undefined,
      role:   role !== 'all' ? role : undefined,
      status: status !== 'all' ? status as any : undefined,
      page,
    }),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleSuspend(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(result.is_suspended ? 'Utilisateur suspendu' : 'Suspension levée');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateRole(userId, role),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingRoleId(null);
      toast.success(`Rôle mis à jour : ${ROLE_LABELS[result.role] ?? result.role}`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const users = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-campus-gray-400" />
          <Input value={search} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="pl-10 border-campus-gray-300 focus-visible:ring-campus-blue"
          />
        </div>
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-lg border border-campus-gray-300 text-sm text-campus-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-campus-blue"
        >
          <option value="all">Tous les rôles</option>
          <option value="student">Étudiant</option>
          <option value="alumni">Alumni</option>
          <option value="bde_member">BDE</option>
          <option value="pedagogical">Pédagogique</option>
          <option value="company">Entreprise</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-lg border border-campus-gray-300 text-sm text-campus-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-campus-blue"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
        </select>
        {meta && <span className="text-sm text-campus-gray-500 self-center">{meta.total} utilisateur{meta.total > 1 ? 's' : ''}</span>}
      </div>

      {/* Table */}
      <Card className="border-campus-gray-300 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-campus-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-9 w-9 rounded-full bg-campus-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40 bg-campus-gray-200" />
                  <Skeleton className="h-3 w-52 bg-campus-gray-200" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full bg-campus-gray-200" />
                <Skeleton className="h-7 w-24 bg-campus-gray-200" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="h-12 w-12 text-campus-gray-300 mx-auto mb-3" />
            <p className="text-campus-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-campus-gray-100">
            {users.map((u: AdminUser) => {
              const initials = u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
              const isSuspended = !!u.suspended_at;
              return (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-campus-gray-50/50">
                  {/* Avatar */}
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={storageUrl(u.info?.avatar_url) ?? undefined} />
                    <AvatarFallback className="bg-campus-blue text-white text-xs font-medium">{initials}</AvatarFallback>
                  </Avatar>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-campus-gray-900 truncate">{u.name}</p>
                      {isSuspended && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">Suspendu</span>
                      )}
                    </div>
                    <p className="text-xs text-campus-gray-400 truncate">{u.email}</p>
                    <p className="text-xs text-campus-gray-400">
                      Inscrit {formatDistanceToNow(new Date(u.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>

                  {/* Rôle */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingRoleId === u.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          autoFocus
                          defaultValue=""
                          disabled={roleMutation.isPending}
                          onChange={(e) => {
                            if (e.target.value) roleMutation.mutate({ userId: u.id, role: e.target.value });
                          }}
                          className="h-7 px-2 rounded border border-campus-blue text-xs text-campus-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-campus-blue"
                        >
                          <option value="" disabled>Choisir…</option>
                          {(ROLE_TRANSITIONS[u.role] ?? []).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setEditingRoleId(null)}
                          className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-gray-600 hover:bg-campus-gray-100 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Badge className={cn('text-xs border', ROLE_COLORS[u.role] ?? ROLE_COLORS.student)}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                        {ROLE_TRANSITIONS[u.role] && (
                          <button
                            title="Changer le rôle"
                            onClick={() => setEditingRoleId(u.id)}
                            className="h-5 w-5 flex items-center justify-center rounded text-campus-gray-300 hover:text-campus-blue hover:bg-campus-blue-50 transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button title="Voir le profil"
                      onClick={() => router.push(`/profile/${u.id}`)}
                      className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        title={isSuspended ? 'Lever la suspension' : 'Suspendre'}
                        onClick={() => suspendMutation.mutate(u.id)}
                        disabled={suspendMutation.isPending && suspendMutation.variables === u.id}
                        className={cn(
                          'h-7 px-2 flex items-center gap-1 rounded text-xs border transition-colors',
                          isSuspended
                            ? 'text-green-600 border-green-200 hover:bg-green-50'
                            : 'text-red-600 border-red-200 hover:bg-red-50'
                        )}
                      >
                        {isSuspended ? <><CheckCircle className="h-3 w-3" />Réactiver</> : <><Ban className="h-3 w-3" />Suspendre</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-campus-gray-300 text-campus-gray-600 hover:bg-campus-gray-50 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-campus-gray-500">{page} / {meta.last_page}</span>
          <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-campus-gray-300 text-campus-gray-600 hover:bg-campus-gray-50 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVITATIONS TAB (upgrade de ta page existante)
// ─────────────────────────────────────────────────────────────────────────────
function InvitationsTab() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', role: 'student' as string });

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['admin-invitations'],
    queryFn:  invitationsApi.getInvitations,
  });

  const createMutation = useMutation({
    mutationFn: () => invitationsApi.createInvitation(formData as any),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
      toast.success(result.message);
      setDialogOpen(false);
      setFormData({ email: '', role: 'student' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.resendInvitation(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
      toast.success(result.message);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.deleteInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
      toast.success('Invitation supprimée');
    },
  });

  const stats = {
    total:   invitations.length,
    pending: invitations.filter((i: any) => !i.used && !i.is_expired).length,
    used:    invitations.filter((i: any) => i.used).length,
    expired: invitations.filter((i: any) => i.is_expired && !i.used).length,
  };

  return (
    <div className="space-y-5">
      {/* Stats + bouton */}
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-4 gap-3 flex-1">
          {[
            { label: 'Total',      value: stats.total,   color: 'bg-campus-blue'    },
            { label: 'En attente', value: stats.pending, color: 'bg-campus-orange'  },
            { label: 'Utilisées',  value: stats.used,    color: 'bg-green-500'      },
            { label: 'Expirées',   value: stats.expired, color: 'bg-red-500'        },
          ].map(({ label, value, color }) => (
            <Card key={label} className="border-campus-gray-300 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-campus-gray-500 mb-1">{label}</p>
                <p className={cn('text-2xl font-bold', color === 'bg-campus-blue' ? 'text-campus-blue' : color === 'bg-campus-orange' ? 'text-campus-orange' : color === 'bg-green-500' ? 'text-green-600' : 'text-red-600')}>
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-2 flex-shrink-0">
              <UserPlus className="h-4 w-4" />Nouvelle invitation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une invitation</DialogTitle>
              <DialogDescription>Invitez un nouvel utilisateur à rejoindre CampusHub</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="utilisateur@example.com"
                  className="border-campus-gray-300 focus-visible:ring-campus-blue"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rôle</Label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-campus-gray-300 text-sm text-campus-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-campus-blue"
                >
                  <option value="student">Étudiant</option>
                  <option value="alumni">Alumni</option>
                  <option value="bde_member">Membre du BDE</option>
                  <option value="pedagogical">Équipe Pédagogique</option>
                  <option value="company">Entreprise</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-campus-blue hover:bg-campus-blue-600 text-white"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !formData.email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? 'Envoi...' : 'Envoyer l\'invitation'}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-campus-gray-300">
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table invitations */}
      <Card className="border-campus-gray-300 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-campus-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-4 w-48 bg-campus-gray-200" />
                <Skeleton className="h-5 w-20 rounded-full bg-campus-gray-200" />
                <Skeleton className="h-5 w-24 rounded-full bg-campus-gray-200 ml-auto" />
                <Skeleton className="h-7 w-20 bg-campus-gray-200" />
              </div>
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className="py-16 text-center">
            <Mail className="h-12 w-12 text-campus-gray-300 mx-auto mb-3" />
            <p className="text-campus-gray-500 mb-4">Aucune invitation</p>
            <Button className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-2"
              onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />Créer la première
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-campus-gray-50">
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Expire</TableHead>
                <TableHead>Invité par</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-sm">{inv.email}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs border', ROLE_COLORS[inv.role] ?? ROLE_COLORS.student)}>
                      {ROLE_LABELS[inv.role] ?? inv.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {inv.used ? (
                      <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs gap-1">
                        <CheckCircle className="h-3 w-3" />Utilisée
                      </Badge>
                    ) : inv.is_expired ? (
                      <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs gap-1">
                        <XCircle className="h-3 w-3" />Expirée
                      </Badge>
                    ) : (
                      <Badge className="bg-campus-orange-50 text-campus-orange-700 border border-campus-orange-200 text-xs gap-1">
                        <Clock className="h-3 w-3" />En attente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-campus-gray-500">
                    {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-sm text-campus-gray-500">
                    {inv.invited_by?.name ?? 'Système'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!inv.used && (
                        <>
                          <button title="Copier le lien"
                            onClick={() => { navigator.clipboard.writeText(inv.invitation_url); toast.success('Lien copié !'); }}
                            className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50 transition-colors"
                          ><Copy className="h-3.5 w-3.5" /></button>
                          <button title="Renvoyer"
                            onClick={() => resendMutation.mutate(inv.id)}
                            disabled={resendMutation.isPending && resendMutation.variables === inv.id}
                            className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50 transition-colors"
                          ><RefreshCw className="h-3.5 w-3.5" /></button>
                        </>
                      )}
                      <button title="Supprimer"
                        onClick={() => window.confirm('Supprimer cette invitation ?') && deleteMutation.mutate(inv.id)}
                        className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      ><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES TAB
// ─────────────────────────────────────────────────────────────────────────────
function CategoriesTab() {
  const queryClient = useQueryClient();
  const [activeSection, setSection] = useState<'blog' | 'articles'>('blog');
  const [isAdding, setIsAdding]     = useState(false);
  const [newName, setNewName]       = useState('');
  const [newColor, setNewColor]     = useState('#0038BC');
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editName, setEditName]     = useState('');

  const { data: blogCats = []    } = useQuery({ queryKey: ['blog-categories'],    queryFn: () => import('@/services/api/posts.api').then(m => m.postsApi.getCategories()) });
  const { data: articleCats = [] } = useQuery({ queryKey: ['article-categories'], queryFn: () => import('@/services/api/articles.api').then(m => m.articlesApi.getCategories()) });

  const createBlogMutation = useMutation({
    mutationFn: () => adminApi.createBlogCategory({ name: newName, color: newColor }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blog-categories'] }); setNewName(''); setIsAdding(false); toast.success('Catégorie créée'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBlogCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blog-categories'] }); toast.success('Catégorie supprimée'); },
  });

  const updateBlogMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => adminApi.updateBlogCategory(id, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blog-categories'] }); setEditingId(null); toast.success('Catégorie mise à jour'); },
  });

  const cats = activeSection === 'blog' ? blogCats : articleCats;

  return (
    <div className="space-y-5">
      {/* Toggle blog / articles */}
      <div className="flex gap-1 bg-campus-gray-100 rounded-lg p-1 w-fit">
        {(['blog', 'articles'] as const).map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
              activeSection === s ? 'bg-white text-campus-gray-900 shadow-sm' : 'text-campus-gray-500 hover:text-campus-gray-700'
            )}
          >{s === 'blog' ? 'Catégories Blog' : 'Catégories Articles'}</button>
        ))}
      </div>

      <Card className="border-campus-gray-300 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-campus-gray-900 flex items-center gap-2">
            <Tag className="h-4 w-4 text-campus-blue" />
            {activeSection === 'blog' ? 'Catégories Blog' : 'Catégories Articles'}
          </CardTitle>
          {activeSection === 'blog' && (
            <Button size="sm" className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-1.5"
              onClick={() => setIsAdding(true)}>
              <Plus className="h-3.5 w-3.5" />Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {/* Formulaire ajout */}
          {isAdding && activeSection === 'blog' && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-campus-gray-50 rounded-lg border border-campus-gray-200">
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border border-campus-gray-300" />
              <Input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom de la catégorie..."
                className="flex-1 border-campus-gray-300 focus-visible:ring-campus-blue h-8 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && newName && createBlogMutation.mutate()}
              />
              <Button size="sm" className="bg-campus-blue hover:bg-campus-blue-600 text-white h-8"
                onClick={() => createBlogMutation.mutate()} disabled={!newName || createBlogMutation.isPending}>
                Créer
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setIsAdding(false); setNewName(''); }}>
                Annuler
              </Button>
            </div>
          )}

          {/* Liste */}
          <div className="divide-y divide-campus-gray-100">
            {(cats as any[]).map((cat: any) => (
              <div key={cat.id} className="flex items-center gap-3 py-3 group">
                {/* Couleur (blog seulement) */}
                {activeSection === 'blog' && (
                  <div className="h-4 w-4 rounded-full flex-shrink-0 border border-white shadow-sm"
                    style={{ backgroundColor: cat.color }} />
                )}
                {activeSection === 'articles' && (
                  <span className="text-lg flex-shrink-0">{cat.icon ?? '📄'}</span>
                )}

                {/* Nom éditable */}
                {editingId === cat.id ? (
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 h-7 text-sm border-campus-gray-300 focus-visible:ring-campus-blue"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateBlogMutation.mutate({ id: cat.id, name: editName });
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-sm text-campus-gray-800">{cat.name}</span>
                )}

                {/* Posts count */}
                {cat.posts_count !== undefined && (
                  <span className="text-xs text-campus-gray-400">{cat.posts_count} post{cat.posts_count !== 1 ? 's' : ''}</span>
                )}
                {cat.articles_count !== undefined && (
                  <span className="text-xs text-campus-gray-400">{cat.articles_count} article{cat.articles_count !== 1 ? 's' : ''}</span>
                )}

                {/* Actions (blog seulement) */}
                {activeSection === 'blog' && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingId === cat.id ? (
                      <Button size="sm" className="h-6 px-2 text-xs bg-campus-blue hover:bg-campus-blue-600 text-white"
                        onClick={() => updateBlogMutation.mutate({ id: cat.id, name: editName })}>
                        Sauvegarder
                      </Button>
                    ) : (
                      <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                        className="h-6 w-6 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50">
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => window.confirm(`Supprimer "${cat.name}" ?`) && deleteBlogMutation.mutate(cat.id)}
                      className="h-6 w-6 flex items-center justify-center rounded text-campus-gray-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {cats.length === 0 && (
              <div className="py-8 text-center text-campus-gray-400 text-sm">
                Aucune catégorie — {activeSection === 'blog' ? 'créez-en une ci-dessus' : 'utilisez le seeder ArticleCategorySeeder'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
