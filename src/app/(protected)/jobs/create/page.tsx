// src/app/(protected)/jobs/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/services/api/jobs.api';
import { companiesApi } from '@/services/api/companies.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Briefcase, Loader2, ExternalLink, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type SourceType = 'internal' | 'external';

export default function CreateJobPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [sourceType, setSourceType] = useState<SourceType>('internal');

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    type: 'internship',
    location_type: 'onsite',
    location_city: '',
    location_country: 'France',
    salary_min: '',
    salary_max: '',
    salary_period: 'monthly',
    duration_months: '',
    hours_per_week: '',
    start_date: '',
    application_deadline: '',
    application_email: '',
    // internal
    company_id: user?.info?.company_id ?? '',
    // external
    company_name: '',
    external_url: '',
    status: 'draft',
  });

  // Admin/pedagogical need the company list to pick one
  const { data: companiesData } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => companiesApi.getCompanies(),
    enabled: user?.role === 'admin' || user?.role === 'pedagogical',
  });
  const companies = companiesData ?? [];

  const { mutate: createJob, isPending } = useMutation({
    mutationFn: (payload: Record<string, any>) => jobsApi.createJob(payload),
    onSuccess: (job) => {
      toast.success('Offre créée avec succès !');
      router.push('/recruiter');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Une erreur est survenue';
      toast.error(msg);
    },
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, any> = {
      title:            form.title,
      description:      form.description,
      requirements:     form.requirements || undefined,
      benefits:         form.benefits || undefined,
      type:             form.type,
      location_type:    form.location_type,
      location_city:    form.location_city || undefined,
      location_country: form.location_country || 'France',
      salary_min:       form.salary_min ? Number(form.salary_min) : undefined,
      salary_max:       form.salary_max ? Number(form.salary_max) : undefined,
      salary_period:    form.salary_period || undefined,
      duration_months:  form.duration_months ? Number(form.duration_months) : undefined,
      hours_per_week:   form.hours_per_week ? Number(form.hours_per_week) : undefined,
      start_date:       form.start_date || undefined,
      application_deadline: form.application_deadline || undefined,
      source_type:      sourceType,
      status:           form.status,
    };

    if (sourceType === 'internal') {
      payload.company_id = form.company_id;
    } else {
      payload.company_name  = form.company_name;
      payload.external_url  = form.external_url || undefined;
      payload.application_email = form.application_email || undefined;
    }

    createJob(payload);
  };

  if (!user || !['admin', 'company', 'pedagogical'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Accès non autorisé.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-campus-blue/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-campus-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Publier une offre</h1>
              <p className="text-gray-500 text-sm">Remplissez les informations de votre offre d'emploi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Source type toggle */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">Type d'offre</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'internal', label: 'Interne (candidature sur CampusHub)', icon: Building2 },
                { value: 'external', label: 'Externe (lien vers site tiers)', icon: ExternalLink },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSourceType(value)}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    sourceType === value
                      ? 'border-campus-blue bg-campus-blue/5 text-campus-blue'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900">Informations générales</h2>

            <div>
              <Label htmlFor="title">Titre du poste *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ex: Développeur Full-Stack React/Node.js"
                required
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type de contrat *</Label>
                <Select value={form.type} onValueChange={(v) => set('type', v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internship">Stage</SelectItem>
                    <SelectItem value="apprenticeship">Alternance</SelectItem>
                    <SelectItem value="cdd">CDD</SelectItem>
                    <SelectItem value="cdi">CDI</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="student_job">Job étudiant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location_type">Mode de travail *</Label>
                <Select value={form.location_type} onValueChange={(v) => set('location_type', v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">Présentiel</SelectItem>
                    <SelectItem value="remote">Télétravail</SelectItem>
                    <SelectItem value="hybrid">Hybride</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location_city">Ville</Label>
                <Input
                  id="location_city"
                  value={form.location_city}
                  onChange={(e) => set('location_city', e.target.value)}
                  placeholder="Paris"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="location_country">Pays</Label>
                <Input
                  id="location_country"
                  value={form.location_country}
                  onChange={(e) => set('location_country', e.target.value)}
                  placeholder="France"
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Company — internal only */}
            {sourceType === 'internal' && (user.role === 'admin' || user.role === 'pedagogical') && (
              <div>
                <Label htmlFor="company_id">Entreprise *</Label>
                <Select value={form.company_id} onValueChange={(v) => set('company_id', v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Sélectionner une entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* External fields */}
            {sourceType === 'external' && (
              <>
                <div>
                  <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={(e) => set('company_name', e.target.value)}
                    placeholder="Google, Microsoft..."
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="external_url">Lien vers l'offre</Label>
                  <Input
                    id="external_url"
                    type="url"
                    value={form.external_url}
                    onChange={(e) => set('external_url', e.target.value)}
                    placeholder="https://..."
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="application_email">Email de candidature</Label>
                  <Input
                    id="application_email"
                    type="email"
                    value={form.application_email}
                    onChange={(e) => set('application_email', e.target.value)}
                    placeholder="recrutement@entreprise.com"
                    className="mt-1.5"
                  />
                </div>
              </>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900">Description du poste</h2>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Décrivez les missions, le contexte, l'équipe..."
                required
                rows={6}
                className="mt-1.5 resize-none"
              />
            </div>
            <div>
              <Label htmlFor="requirements">Profil recherché</Label>
              <Textarea
                id="requirements"
                value={form.requirements}
                onChange={(e) => set('requirements', e.target.value)}
                placeholder="Compétences requises, formation, expérience..."
                rows={4}
                className="mt-1.5 resize-none"
              />
            </div>
            <div>
              <Label htmlFor="benefits">Avantages</Label>
              <Textarea
                id="benefits"
                value={form.benefits}
                onChange={(e) => set('benefits', e.target.value)}
                placeholder="RTT, tickets resto, télétravail, mutuelle..."
                rows={3}
                className="mt-1.5 resize-none"
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900">Conditions</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary_min">Salaire min (€)</Label>
                <Input
                  id="salary_min"
                  type="number"
                  value={form.salary_min}
                  onChange={(e) => set('salary_min', e.target.value)}
                  placeholder="1800"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="salary_max">Salaire max (€)</Label>
                <Input
                  id="salary_max"
                  type="number"
                  value={form.salary_max}
                  onChange={(e) => set('salary_max', e.target.value)}
                  placeholder="2500"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary_period">Période</Label>
                <Select value={form.salary_period} onValueChange={(v) => set('salary_period', v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Par mois</SelectItem>
                    <SelectItem value="yearly">Par an</SelectItem>
                    <SelectItem value="hourly">Par heure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration_months">Durée (mois)</Label>
                <Input
                  id="duration_months"
                  type="number"
                  value={form.duration_months}
                  onChange={(e) => set('duration_months', e.target.value)}
                  placeholder="6"
                  className="mt-1.5"
                />
              </div>
            </div>

            {form.type === 'student_job' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hours_per_week">Heures / semaine <span className="text-gray-400 font-normal">(max 21h)</span></Label>
                  <Input
                    id="hours_per_week"
                    type="number"
                    min={1}
                    max={21}
                    value={form.hours_per_week}
                    onChange={(e) => set('hours_per_week', e.target.value)}
                    placeholder="21"
                    className="mt-1.5"
                  />
                  <p className="text-xs text-gray-400 mt-1">Réglementation française : 21h max/semaine pour les étudiants</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Date de début</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set('start_date', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="application_deadline">Date limite de candidature</Label>
                <Input
                  id="application_deadline"
                  type="date"
                  value={form.application_deadline}
                  onChange={(e) => set('application_deadline', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Publish / draft */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">Publication</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'draft',     label: 'Enregistrer en brouillon', desc: 'Visible uniquement par vous' },
                { value: 'published', label: 'Publier maintenant',        desc: 'Visible par tous les étudiants' },
              ] as const).map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('status', value)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    form.status === value
                      ? 'border-campus-blue bg-campus-blue/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <p className={cn('text-sm font-semibold', form.status === value ? 'text-campus-blue' : 'text-gray-900')}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {form.status === 'published' ? 'Publier l\'offre' : 'Enregistrer le brouillon'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
