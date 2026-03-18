// src/app/(protected)/profile/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { usersApi } from '@/services/api/users.api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  FileText,
  Award,
  TrendingUp,
  Upload,
  Save,
  X,
  Download,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { AvatarSkeleton } from '@/components/layout/avatar-skeleton';
import { storageUrl } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setAuth, updateUserInfo } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvDeleting, setCvDeleting] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 5 Mo');
      return;
    }
    setCvFile(file);
  };

  const handleCvUpload = async () => {
    if (!cvFile || !user) return;
    setCvLoading(true);
    try {
      const result = await usersApi.uploadCv(user.id, cvFile);
      updateUserInfo({ cv_url: result.cv_url, profile_completion: result.profile_completion });
      toast.success('CV uploadé avec succès !');
      setCvFile(null);
      if (cvInputRef.current) cvInputRef.current.value = '';
    } catch (error: any) {
      console.log('Error', error.response?.data?.message);
      toast.error(error.response?.data?.message || "Erreur lors de l'upload");
    } finally {
      setCvLoading(false);
    }
  };

  const handleCvDelete = async () => {
    if (!user || !window.confirm('Supprimer votre CV ?')) return;
    setCvDeleting(true);
    try {
      const result = await usersApi.deleteCv(user.id);
      updateUserInfo({ cv_url: null, profile_completion: result.profile_completion });
      toast.success('CV supprimé');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setCvDeleting(false);
    }
  };

  // Pattern: Attendre que component soit monté côté client
  useEffect(() => {
    setMounted(true);
  }, []);


  const [formData, setFormData] = useState({
    bio: user?.info?.bio || '',
    phone: user?.info?.phone || '',
    linkedin_url: user?.info?.linkedin_url || '',
    github_url: user?.info?.github_url || '',
    website_url: user?.info?.website_url || '',
    skills: user?.info?.skills?.join(', ') || '',
    program: user?.info?.program || '',
    year: user?.info?.year?.toString() || '',
    campus: user?.info?.campus || '',
  });

  // Sync formData when user changes (après update)
  useEffect(() => {
    if (user?.info && !isEditing) {
      setFormData({
        bio: user.info.bio || '',
        phone: user.info.phone || '',
        linkedin_url: user.info.linkedin_url || '',
        github_url: user.info.github_url || '',
        website_url: user.info.website_url || '',
        skills: user.info.skills?.join(', ') || '',
        program: user.info.program || '',
        year: user.info.year?.toString() || '',
        campus: user.info.campus || '',
      });
    }
  }, [user?.info, isEditing]);

  // Pendant SSR et avant hydration client
  if (!mounted) {
    return <AvatarSkeleton />
  }

  if (!user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload avatar si changé
      let avatar_url = user.info?.avatar_url;

      console.log('User AVANT update:', user);

      if (avatarFile) {
        const uploadResult = await usersApi.uploadAvatar(user.id, avatarFile);
        console.log('upload resulat:', uploadResult);
        avatar_url = uploadResult.avatar_url;
      }

      // Update user info
      const updateData = {
        ...formData,
        avatar_url,
        skills: formData.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        year: formData.year ? parseInt(formData.year) : null,
      };

      const updatedUser = await usersApi.updateUserInfo(user.id, updateData);
      console.log('User APRÈS update info:', updatedUser);
      // Update store
      console.log('updated user', updatedUser);
      if (updatedUser.info) {
        updateUserInfo(updatedUser.info);
        // update user complet
        // setAuth(updatedUser);
        console.log('Profil mis à jour avec succès');
      }

      toast.success('Profil mis à jour avec succès !');
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData({
      bio: user?.info?.bio || '',
      phone: user?.info?.phone || '',
      linkedin_url: user?.info?.linkedin_url || '',
      github_url: user?.info?.github_url || '',
      website_url: user?.info?.website_url || '',
      skills: user?.info?.skills?.join(', ') || '',
      program: user?.info?.program || '',
      year: user?.info?.year?.toString() || '',
      campus: user?.info?.campus || '',
    });
  };

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos informations personnelles
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Modifier le profil
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Header Card */}
        <Card className="border-campus-gray-300 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-campus-blue">
                  <AvatarImage
                    src={avatarPreview || user.info?.avatar_url || undefined}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-campus-blue text-white text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-campus-blue text-white flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="capitalize">
                    {user.role.replace('_', ' ')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="capitalize bg-purple-50 text-purple-700 border-purple-200"
                  >
                    {user.info?.level || 'Beginner'}
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-campus-blue/10 mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-campus-blue" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {user.info?.reputation_points || 0}
                  </p>
                  <p className="text-xs text-gray-600">Réputation</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-campus-orange/10 mx-auto mb-2">
                    <Award className="h-6 w-6 text-campus-orange" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {user.info?.profile_completion || 0}%
                  </p>
                  <p className="text-xs text-gray-600">Complétion</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="border-campus-gray-300 shadow-sm">
          <CardHeader>
            <CardTitle>À propos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div>
                <Label htmlFor="bio">Biographie</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Parlez-nous de vous..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            ) : (
              <p className="text-gray-700">
                {user.info?.bio || 'Aucune biographie renseignée.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contact & Links */}
        <Card className="border-campus-gray-300 shadow-sm">
          <CardHeader>
            <CardTitle>Contact & Liens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+33 6 12 34 56 78"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-700">
                    {user.info?.phone || 'Non renseigné'}
                  </p>
                )}
              </div>

              {/* LinkedIn */}
              <div>
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                {isEditing ? (
                  <Input
                    id="linkedin"
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) =>
                      setFormData({ ...formData, linkedin_url: e.target.value })
                    }
                    placeholder="https://linkedin.com/in/..."
                    className="mt-1"
                  />
                ) : user.info?.linkedin_url ? (
                  <a
                    href={user.info.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-campus-blue hover:underline block truncate"
                  >
                    {user.info.linkedin_url}
                  </a>
                ) : (
                  <p className="mt-1 text-gray-700">Non renseigné</p>
                )}
              </div>

              {/* GitHub */}
              <div>
                <Label htmlFor="github" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </Label>
                {isEditing ? (
                  <Input
                    id="github"
                    type="url"
                    value={formData.github_url}
                    onChange={(e) =>
                      setFormData({ ...formData, github_url: e.target.value })
                    }
                    placeholder="https://github.com/..."
                    className="mt-1"
                  />
                ) : user.info?.github_url ? (
                  <a
                    href={user.info.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-campus-blue hover:underline block truncate"
                  >
                    {user.info.github_url}
                  </a>
                ) : (
                  <p className="mt-1 text-gray-700">Non renseigné</p>
                )}
              </div>

              {/* Website */}
              <div>
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Site web
                </Label>
                {isEditing ? (
                  <Input
                    id="website"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) =>
                      setFormData({ ...formData, website_url: e.target.value })
                    }
                    placeholder="https://..."
                    className="mt-1"
                  />
                ) : user.info?.website_url ? (
                  <a
                    href={user.info.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-campus-blue hover:underline block truncate"
                  >
                    {user.info.website_url}
                  </a>
                ) : (
                  <p className="mt-1 text-gray-700">Non renseigné</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Info (students/alumni only) */}
        {(user.role === 'student' || user.role === 'alumni') && (
          <Card className="border-campus-gray-300 shadow-sm">
            <CardHeader>
              <CardTitle>Formation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Program */}
                <div>
                  <Label htmlFor="program">Programme</Label>
                  {isEditing ? (
                    <Input
                      id="program"
                      value={formData.program}
                      onChange={(e) =>
                        setFormData({ ...formData, program: e.target.value })
                      }
                      placeholder="Master Informatique"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">
                      {user.info?.program || 'Non renseigné'}
                    </p>
                  )}
                </div>

                {/* Year */}
                <div>
                  <Label htmlFor="year">Année</Label>
                  {isEditing ? (
                    <Input
                      id="year"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: e.target.value })
                      }
                      placeholder="2"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">
                      {user.info?.year ? `Année ${user.info.year}` : 'Non renseigné'}
                    </p>
                  )}
                </div>

                {/* Campus */}
                <div>
                  <Label htmlFor="campus">Campus</Label>
                  {isEditing ? (
                    <Input
                      id="campus"
                      value={formData.campus}
                      onChange={(e) =>
                        setFormData({ ...formData, campus: e.target.value })
                      }
                      placeholder="Paris"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">
                      {user.info?.campus || 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        <Card className="border-campus-gray-300 shadow-sm">
          <CardHeader>
            <CardTitle>Compétences</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div>
                <Label htmlFor="skills">
                  Compétences (séparées par des virgules)
                </Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData({ ...formData, skills: e.target.value })
                  }
                  placeholder="React, TypeScript, Laravel, PHP"
                  className="mt-1"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.info?.skills && user.info.skills.length > 0 ? (
                  user.info.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-700">Aucune compétence renseignée.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Remplacer le commentaire CV section  */}
        <Card className="border-campus-gray-300 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-campus-gray-900">
              <FileText className="h-5 w-5 text-campus-blue" />
              Curriculum Vitae
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>

            {user.info?.cv_url ? (
            // ── CV existant ──
            <div className="flex items-center gap-4 p-4 bg-campus-blue-50 rounded-lg border border-campus-blue-100">
              <div className="h-10 w-10 rounded-lg bg-campus-blue flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-campus-blue-800">CV actuel</p>
                <p className="text-xs text-campus-blue-600 truncate">{user.info.cv_url.split('/').pop()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  // href={user.info.cv_url}
                  href={storageUrl(user.info.cv_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-campus-blue border border-campus-blue-200 rounded-lg hover:bg-campus-blue-100 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Voir
                </a>
                <button
                  type="button"
                  onClick={handleCvDelete}
                  disabled={cvDeleting}
                  className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {cvDeleting
                    ? <span className="h-3.5 w-3.5 animate-spin border-2 border-red-300 border-t-red-600 rounded-full" />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            // ── Pas de CV ──
            <div className="flex items-center gap-3 p-4 bg-campus-gray-50 rounded-lg border border-campus-gray-200">
              <div className="h-10 w-10 rounded-lg bg-campus-gray-200 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-campus-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-campus-gray-700">Aucun CV renseigné</p>
                <p className="text-xs text-campus-gray-400">Uploadez votre CV pour faciliter vos candidatures</p>
              </div>
            </div>
          )}

            {/* // Zone upload (toujours visible pour remplacer ou ajouter)  */}
            <div>
              {cvFile ? (
                // Fichier sélectionné — confirmation avant upload
                <div className="flex items-center gap-3 p-3 bg-campus-blue-50 rounded-lg border border-campus-blue-100">
                  <CheckCircle2 className="h-5 w-5 text-campus-blue flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-campus-blue-800 truncate">{cvFile.name}</p>
                    <p className="text-xs text-campus-blue-500">{(cvFile.size / 1024 / 1024).toFixed(2)} Mo</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => { setCvFile(null); if (cvInputRef.current) cvInputRef.current.value = ''; }}
                      className="h-7 w-7 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCvUpload}
                      disabled={cvLoading}
                      className="h-7 px-3 flex items-center gap-1.5 text-xs font-medium bg-campus-blue text-white rounded-lg hover:bg-campus-blue-600 transition-colors disabled:opacity-50"
                    >
                      {cvLoading
                        ? <span className="h-3.5 w-3.5 animate-spin border-2 border-white/30 border-t-white rounded-full" />
                        : <Upload className="h-3.5 w-3.5" />
                      }
                      {cvLoading ? 'Upload...' : user.info?.cv_url ? 'Remplacer' : 'Uploader'}
                    </button>
                  </div>
                </div>
              ) : (
                // Zone drop / bouton select
                <div
                  onClick={() => cvInputRef.current?.click()}
                  className="border-2 border-dashed border-campus-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-campus-blue hover:bg-campus-blue-50 transition-colors"
                >
                  <Upload className="h-6 w-6 text-campus-gray-400 mx-auto mb-1.5" />
                  <p className="text-sm text-campus-gray-600 mb-0.5">
                    {user.info?.cv_url ? 'Cliquez pour remplacer votre CV' : 'Cliquez pour uploader votre CV'}
                  </p>
                  <p className="text-xs text-campus-gray-400">PDF uniquement · Max 5 Mo</p>
                </div>
              )}
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleCvChange}
              />
            </div>

          </CardContent>
        </Card>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
