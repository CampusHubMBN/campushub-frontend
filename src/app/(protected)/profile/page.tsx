// src/app/(protected)/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { AvatarSkeleton } from '@/components/layout/avatar-skeleton';

export default function ProfilePage() {
  const { user, setAuth, updateUserInfo } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  // ✅ Pattern: Attendre que component soit monté côté client
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
        <Card>
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
        <Card>
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
        <Card>
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
          <Card>
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
        <Card>
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