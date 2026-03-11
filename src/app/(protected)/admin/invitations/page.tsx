// src/app/(protected)/admin/invitations/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { Invitation, UserRole } from '@/types/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  UserPlus,
  Copy,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { invitationsApi } from '@/services/api/invitation.api';

export default function AdminInvitationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creatingInvitation, setCreatingInvitation] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    role: 'student' as Exclude<UserRole, 'admin'>,
  });

  // Check admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Accès non autorisé');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch invitations
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    try {
      const data = await invitationsApi.getInvitations();
      setInvitations(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingInvitation(true);

    try {
      const result = await invitationsApi.createInvitation(formData);
      toast.success(result.message);
      setInvitations([result.invitation, ...invitations]);
      setIsDialogOpen(false);
      setFormData({ email: '', role: 'student' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreatingInvitation(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Lien copié dans le presse-papier !');
  };

  const handleResend = async (id: string) => {
    try {
      const result = await invitationsApi.resendInvitation(id);
      toast.success(result.message);
      fetchInvitations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du renvoi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette invitation ?')) {
      return;
    }

    try {
      const result = await invitationsApi.deleteInvitation(id);
      toast.success(result.message);
      setInvitations(invitations.filter((inv) => inv.id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const stats = {
    total: invitations.length,
    pending: invitations.filter((inv) => !inv.used && !inv.is_expired).length,
    used: invitations.filter((inv) => inv.used).length,
    expired: invitations.filter((inv) => inv.is_expired && !inv.used).length,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-campus-blue" />
            Gestion des Invitations
          </h1>
          <p className="text-gray-600 mt-1">
            Invitez de nouveaux utilisateurs à rejoindre CampusHub
          </p>
        </div>

        {/* Create Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Nouvelle invitation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une invitation</DialogTitle>
              <DialogDescription>
                Invitez un nouvel utilisateur à rejoindre la plateforme
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="utilisateur@example.com"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      role: value as Exclude<UserRole, 'admin'>,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Étudiant</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                    <SelectItem value="bde_member">Membre du BDE</SelectItem>
                    <SelectItem value="pedagogical">Équipe Pédagogique</SelectItem>
                    <SelectItem value="company">Entreprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={creatingInvitation} className="flex-1">
                  {creatingInvitation ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Création...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Envoyer l'invitation
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={creatingInvitation}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Mail className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-campus-orange">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-campus-orange" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisées</p>
                <p className="text-2xl font-bold text-green-600">{stats.used}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expirées</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin text-4xl">⏳</div>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune invitation pour le moment</p>
              <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                Créer la première invitation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Expire le</TableHead>
                    <TableHead>Invité par</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {invitation.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invitation.used ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Utilisée
                          </Badge>
                        ) : invitation.is_expired ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Expirée
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                            <Clock className="h-3 w-3 mr-1" />
                            En attente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {invitation.invited_by?.name || 'Système'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!invitation.used && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(invitation.invitation_url)}
                                title="Copier le lien"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResend(invitation.id)}
                                title="Renvoyer l'invitation"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(invitation.id)}
                            className="text-red-600 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}