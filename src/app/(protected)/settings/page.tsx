'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { usersApi } from '@/services/api/users.api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Lock, Mail, Trash2, ShieldCheck, Settings, Eye, EyeOff, Loader2, TriangleAlert,
} from 'lucide-react';

// ── Small section card ────────────────────────────────────────────────────────
function SectionCard({
  icon: Icon, title, description, children, danger,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border shadow-sm overflow-hidden',
      danger ? 'border-red-200' : 'border-gray-100'
    )}>
      <div className={cn('px-6 py-4 border-b', danger ? 'border-red-100 bg-red-50/40' : 'border-gray-100')}>
        <div className="flex items-center gap-2.5">
          <Icon className={cn('h-5 w-5', danger ? 'text-red-500' : 'text-campus-blue')} />
          <div>
            <h2 className={cn('font-semibold text-sm', danger ? 'text-red-700' : 'text-gray-900')}>{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Password input with show/hide toggle ─────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, id }: {
  value: string; onChange: (v: string) => void; placeholder?: string; id?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const router = useRouter();

  // ── Change password ─────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  const passwordMutation = useMutation({
    mutationFn: () => usersApi.changePassword({
      current_password:      pwForm.current,
      password:              pwForm.next,
      password_confirmation: pwForm.confirm,
    }),
    onSuccess: ({ message }) => {
      toast.success(message);
      setPwForm({ current: '', next: '', confirm: '' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.errors
        ? Object.values(err.response.data.errors as Record<string, string[]>).flat()[0]
        : err?.response?.data?.message ?? 'Erreur lors du changement de mot de passe';
      toast.error(msg);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (pwForm.next.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    passwordMutation.mutate();
  };

  // ── Change email ────────────────────────────────────────────────
  const [emailForm, setEmailForm] = useState({ email: '', password: '' });

  const emailMutation = useMutation({
    mutationFn: () => usersApi.changeEmail(emailForm),
    onSuccess: ({ message, email }) => {
      toast.success(message);
      updateUser({ email });
      setEmailForm({ email: '', password: '' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.errors
        ? Object.values(err.response.data.errors as Record<string, string[]>).flat()[0]
        : err?.response?.data?.message ?? 'Erreur lors du changement d\'email';
      toast.error(msg);
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    emailMutation.mutate();
  };

  // ── Delete account ───────────────────────────────────────────────
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => usersApi.deleteAccount(deletePassword),
    onSuccess: () => {
      toast.success('Votre compte a été supprimé');
      logout();
      router.replace('/login');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la suppression');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-campus-blue/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-campus-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-5">

        {/* ── Sécurité ──────────────────────────────────────── */}
        <SectionCard
          icon={ShieldCheck}
          title="Sécurité"
          description="Gérez votre mot de passe et votre adresse email"
        >
          <div className="space-y-6">

            {/* Change password */}
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-gray-400" />
                Changer le mot de passe
              </p>
              <PasswordInput
                value={pwForm.current}
                onChange={(v) => setPwForm((f) => ({ ...f, current: v }))}
                placeholder="Mot de passe actuel"
              />
              <PasswordInput
                value={pwForm.next}
                onChange={(v) => setPwForm((f) => ({ ...f, next: v }))}
                placeholder="Nouveau mot de passe (min. 8 caractères)"
              />
              <PasswordInput
                value={pwForm.confirm}
                onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))}
                placeholder="Confirmer le nouveau mot de passe"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={passwordMutation.isPending || !pwForm.current || !pwForm.next}
                >
                  {passwordMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Mettre à jour
                </Button>
              </div>
            </form>

            <div className="border-t border-gray-100" />

            {/* Change email */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-gray-400" />
                Changer l'adresse email
              </p>
              <p className="text-xs text-gray-400">Email actuel : <span className="font-medium text-gray-600">{user?.email}</span></p>
              <Input
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Nouvelle adresse email"
                required
              />
              <PasswordInput
                value={emailForm.password}
                onChange={(v) => setEmailForm((f) => ({ ...f, password: v }))}
                placeholder="Confirmez avec votre mot de passe"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={emailMutation.isPending || !emailForm.email || !emailForm.password}
                >
                  {emailMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Mettre à jour
                </Button>
              </div>
            </form>
          </div>
        </SectionCard>

        {/* ── Danger zone ───────────────────────────────────── */}
        <SectionCard
          icon={TriangleAlert}
          title="Zone de danger"
          description="Actions irréversibles sur votre compte"
          danger
        >
          {!deleteConfirm ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">Supprimer mon compte</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Toutes vos données seront définitivement supprimées.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirm(true)}
                className="shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Supprimer
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
                <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
                Cette action est <strong className="mx-1">irréversible</strong>. Entrez votre mot de passe pour confirmer.
              </div>
              <PasswordInput
                value={deletePassword}
                onChange={setDeletePassword}
                placeholder="Votre mot de passe"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDeleteConfirm(false); setDeletePassword(''); }}
                  disabled={deleteMutation.isPending}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!deletePassword || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Confirmer la suppression
                </Button>
              </div>
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
