// src/app/(protected)/articles/[id]/edit/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { articlesApi } from '@/services/api/articles.api';
import { useAuthStore } from '@/store/auth.store';
import {
  ARTICLE_AUTHOR_ROLES,
  ArticlePayload,
} from '@/types/article';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Save, Eye, Plus, Trash2, Loader2,
  Globe, BookOpen, Play, Wrench, Link as LinkIcon,
  Clock, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import dynamique — désactive le SSR pour Tiptap
// Évite l'erreur "SSR has been detected" de Tiptap
const ArticleEditor = dynamic(
  () => import('@/components/articles/ArticleEditor').then((mod) => mod.ArticleEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border border-campus-gray-300 rounded-lg overflow-hidden">
        <div className="h-12 bg-campus-gray-50 border-b border-campus-gray-200 animate-pulse" />
        <div className="min-h-[400px] p-4 bg-white flex items-start">
          <p className="text-campus-gray-400 text-sm">Chargement de l'éditeur...</p>
        </div>
      </div>
    ),
  }
);

// ─── Zod schema ───────────────────────────────────────────────────────────────
const timelineItemSchema = z.object({
  step:               z.number().min(1),
  title:              z.string().min(1, 'Titre requis'),
  description:        z.string(),
  estimated_duration: z.string().optional(),
});

const relatedLinkSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  url:   z.string().url('URL invalide'),
  type:  z.enum(['official', 'guide', 'video', 'tool', 'other']),
});

const articleFormSchema = z.object({
  title:               z.string().min(3, 'Titre trop court').max(200),
  slug:                z.string().optional(),
  description:         z.string().max(300).optional(),
  category_id:         z.string().optional(),
  difficulty:          z.enum(['easy', 'medium', 'complex']),
  estimated_read_time: z.coerce.number().min(1).max(120).optional().or(z.literal('')),
  target_audience:     z.string().optional(),
  is_published:        z.boolean(),
  is_featured:         z.boolean(),
  changelog:           z.string().optional(),
  timeline:            z.array(timelineItemSchema),
  related_links:       z.array(relatedLinkSchema),
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

// ─── Link type options ────────────────────────────────────────────────────────
const LINK_TYPE_OPTIONS = [
  { value: 'official', label: 'Officiel', icon: Globe },
  { value: 'guide',    label: 'Guide',    icon: BookOpen },
  { value: 'video',    label: 'Vidéo',    icon: Play },
  { value: 'tool',     label: 'Outil',    icon: Wrench },
  { value: 'other',    label: 'Autre',    icon: LinkIcon },
] as const;

// ─── Section accordéon ────────────────────────────────────────────────────────
function SectionCard({
  title, icon: Icon, children, defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-campus-gray-300 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full px-5 py-4 flex items-center justify-between text-left',
          'hover:bg-campus-gray-50 transition-colors',
          open && 'border-b border-campus-gray-200'
        )}
      >
        <span className="font-semibold text-sm text-campus-gray-800 flex items-center gap-2">
          <Icon className="h-4 w-4 text-campus-blue" />
          {title}
        </span>
        {open
          ? <ChevronUp className="h-4 w-4 text-campus-gray-400" />
          : <ChevronDown className="h-4 w-4 text-campus-gray-400" />
        }
      </button>
      {open && <CardContent className="pt-5">{children}</CardContent>}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }   = use(params);
  const isNew    = id === 'new';
  const router   = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [content, setContent]           = useState('');
  const [contentError, setContentError] = useState('');

  // Auth guard
  useEffect(() => {
    if (user && !ARTICLE_AUTHOR_ROLES.includes(user.role as any)) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  // Fetch article existant (mode édition)
  const { data: existing, isLoading } = useQuery({
    queryKey: ['article-edit', id],
    queryFn:  () => articlesApi.getArticle(id),
    enabled:  !isNew,
  });

  const { data: categories } = useQuery({
    queryKey: ['article-categories'],
    queryFn:  articlesApi.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Form
  const {
    register, control, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      difficulty:    'easy',
      is_published:  false,
      is_featured:   false,
      timeline:      [],
      related_links: [],
    },
  });

  // Pré-remplir en mode édition
  useEffect(() => {
    if (existing) {
      reset({
        title:               existing.title,
        slug:                existing.slug,
        description:         existing.description ?? '',
        category_id:         existing.category_id ?? '',
        difficulty:          existing.difficulty,
        estimated_read_time: existing.estimated_read_time ?? '',
        target_audience:     existing.target_audience?.join(', ') ?? '',
        is_published:        existing.is_published,
        is_featured:         existing.is_featured,
        changelog:           existing.changelog ?? '',
        timeline:            existing.timeline ?? [],
        related_links:       existing.related_links ?? [],
      });
      setContent(existing.content);
    }
  }, [existing, reset]);

  // Auto-slug depuis le titre (création uniquement)
  const titleValue = watch('title');
  useEffect(() => {
    if (isNew && titleValue) {
      const slug = titleValue
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      setValue('slug', slug);
    }
  }, [titleValue, isNew, setValue]);

  // Field arrays
  const timelineFields = useFieldArray({ control, name: 'timeline' });
  const linksFields    = useFieldArray({ control, name: 'related_links' });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (payload: ArticlePayload) =>
      isNew ? articlesApi.createArticle(payload) : articlesApi.updateArticle(id, payload),
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success(isNew ? 'Article créé !' : 'Article mis à jour !');
      if (isNew) router.replace(`/articles/${article.id}/edit`);
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  const publishMutation = useMutation({
    mutationFn: () => articlesApi.togglePublish(id),
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['article-edit', id] });
      toast.success(article.is_published ? 'Article publié !' : 'Article dépublié');
    },
  });

  // Submit
  const onSubmit = (values: ArticleFormValues) => {
    if (!content || content === '<p></p>') {
      setContentError('Le contenu est requis');
      return;
    }
    setContentError('');

    const payload: ArticlePayload = {
      title:               values.title,
      slug:                values.slug || undefined,
      description:         values.description || null,
      category_id:         values.category_id || null,
      content,
      difficulty:          values.difficulty,
      estimated_read_time: values.estimated_read_time ? Number(values.estimated_read_time) : null,
      target_audience:     values.target_audience
        ? values.target_audience.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      is_published:  values.is_published,
      is_featured:   values.is_featured,
      changelog:     values.changelog || null,
      timeline:      values.timeline.length > 0 ? values.timeline : null,
      related_links: values.related_links.length > 0 ? values.related_links : null,
    };

    saveMutation.mutate(payload);
  };

  // Loading skeleton (mode édition)
  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen bg-campus-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl space-y-5">
          <Skeleton className="h-8 w-28 bg-campus-gray-200" />
          <Skeleton className="h-12 w-full bg-campus-gray-200" />
          <Skeleton className="h-96 w-full bg-campus-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-campus-gray-50">
      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ── Sticky topbar ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-campus-gray-200 shadow-sm">
          <div className="container mx-auto px-4 max-w-4xl py-3 flex items-center gap-3">
            <Button
              type="button" variant="ghost" size="sm"
              onClick={() => router.push('/articles')}
              className="text-campus-gray-600 hover:text-campus-gray-900 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />Articles
            </Button>

            <span className="text-campus-gray-300">|</span>
            <span className="text-sm font-medium text-campus-gray-700">
              {isNew ? 'Nouvel article' : "Modifier l'article"}
            </span>

            {!isNew && (
              <Badge className={cn(
                'text-xs border',
                existing?.is_published
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-campus-gray-100 text-campus-gray-600 border-campus-gray-300'
              )}>
                {existing?.is_published ? 'Publié' : 'Brouillon'}
              </Badge>
            )}

            <div className="ml-auto flex items-center gap-2">
              {!isNew && (
                <Button
                  type="button" variant="outline" size="sm"
                  className="border-campus-gray-300 text-campus-gray-600"
                  onClick={() => window.open(`/articles/${existing?.id}`, '_blank')}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />Prévisualiser
                </Button>
              )}
              {!isNew && (
                <Button
                  type="button" variant="outline" size="sm"
                  className={cn(
                    'border',
                    existing?.is_published
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-green-200 text-green-700 hover:bg-green-50'
                  )}
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : existing?.is_published ? 'Dépublier' : 'Publier'
                  }
                </Button>
              )}
              <Button
                type="submit" size="sm"
                className="bg-campus-blue hover:bg-campus-blue-600 text-white"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Enregistrement…</>
                  : <><Save className="h-3.5 w-3.5 mr-1.5" />Enregistrer</>
                }
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-4xl py-8 space-y-5">

          {/* ── Métadonnées ── */}
          <Card className="border-campus-gray-300 shadow-sm">
            <CardContent className="pt-5 space-y-4">

              <div className="space-y-1.5">
                <Label className="text-sm text-campus-gray-700 font-medium">
                  Titre <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register('title')}
                  placeholder="Titre de l'article"
                  className={cn(
                    'text-lg font-medium border-campus-gray-300 focus-visible:ring-campus-blue',
                    errors.title && 'border-red-400'
                  )}
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-campus-gray-700">
                  Slug <span className="text-campus-gray-400 font-normal">(auto-généré)</span>
                </Label>
                <Input
                  {...register('slug')}
                  placeholder="mon-article"
                  className="font-mono text-sm border-campus-gray-300 focus-visible:ring-campus-blue text-campus-gray-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-campus-gray-700">
                  Description <span className="text-campus-gray-400 font-normal">(300 car. max)</span>
                </Label>
                <Textarea
                  {...register('description')}
                  placeholder="Courte description affichée dans les listings..."
                  rows={2}
                  className="resize-none border-campus-gray-300 focus-visible:ring-campus-blue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-campus-gray-700">Catégorie</Label>
                  <select
                    {...register('category_id')}
                    className="w-full h-10 px-3 rounded-lg border border-campus-gray-300 text-sm text-campus-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-campus-blue"
                  >
                    <option value="">Sans catégorie</option>
                    {(categories ?? []).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-campus-gray-700">Niveau</Label>
                  <select
                    {...register('difficulty')}
                    className="w-full h-10 px-3 rounded-lg border border-campus-gray-300 text-sm text-campus-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-campus-blue"
                  >
                    <option value="easy">Facile</option>
                    <option value="medium">Intermédiaire</option>
                    <option value="complex">Avancé</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-campus-gray-700">
                    Temps de lecture <span className="text-campus-gray-400">(min)</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-campus-gray-400" />
                    <Input
                      type="number"
                      {...register('estimated_read_time')}
                      placeholder="5"
                      min={1} max={120}
                      className="pl-10 border-campus-gray-300 focus-visible:ring-campus-blue"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-campus-gray-700">
                    Public cible <span className="text-campus-gray-400 font-normal">(virgule pour plusieurs)</span>
                  </Label>
                  <Input
                    {...register('target_audience')}
                    placeholder="Étudiants EU, Hors EU, L3..."
                    className="border-campus-gray-300 focus-visible:ring-campus-blue"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-campus-gray-700">Options</Label>
                  <div className="flex items-center gap-4 h-10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('is_featured')} className="h-4 w-4 accent-campus-orange rounded" />
                      <span className="text-sm text-campus-gray-600">À la une</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('is_published')} className="h-4 w-4 accent-campus-blue rounded" />
                      <span className="text-sm text-campus-gray-600">Publié</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Contenu Tiptap ── */}
          <Card className="border-campus-gray-300 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-campus-gray-900">
                Contenu <span className="text-red-500">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* ✅ ArticleEditor chargé dynamiquement — pas de SSR */}
              <ArticleEditor
                content={content}
                onChange={(html) => { setContent(html); setContentError(''); }}
                placeholder="Rédigez votre article ici..."
              />
              {contentError && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{contentError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Timeline ── */}
          <SectionCard title="Étapes & timeline" icon={Clock}>
            <div className="space-y-3">
              {timelineFields.fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start p-3 bg-campus-gray-50 rounded-lg border border-campus-gray-200">
                  <div className="h-7 w-7 rounded-full bg-campus-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      {...register(`timeline.${index}.title`)}
                      placeholder="Titre de l'étape"
                      className="border-campus-gray-300 focus-visible:ring-campus-blue text-sm"
                    />
                    <Input
                      {...register(`timeline.${index}.estimated_duration`)}
                      placeholder="Durée (ex: 2 semaines)"
                      className="border-campus-gray-300 focus-visible:ring-campus-blue text-sm"
                    />
                    <Textarea
                      {...register(`timeline.${index}.description`)}
                      placeholder="Description..."
                      rows={2}
                      className="sm:col-span-2 resize-none border-campus-gray-300 focus-visible:ring-campus-blue text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => timelineFields.remove(index)}
                    className="text-campus-gray-400 hover:text-red-500 mt-1 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button" variant="outline" size="sm"
                className="border-campus-gray-300 text-campus-gray-600 hover:border-campus-blue hover:text-campus-blue"
                onClick={() => timelineFields.append({ step: timelineFields.fields.length + 1, title: '', description: '', estimated_duration: '' })}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />Ajouter une étape
              </Button>
            </div>
          </SectionCard>

          {/* ── Liens utiles ── */}
          <SectionCard title="Liens utiles" icon={LinkIcon}>
            <div className="space-y-3">
              {linksFields.fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start p-3 bg-campus-gray-50 rounded-lg border border-campus-gray-200">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      {...register(`related_links.${index}.title`)}
                      placeholder="Titre du lien"
                      className="border-campus-gray-300 focus-visible:ring-campus-blue text-sm"
                    />
                    <Input
                      {...register(`related_links.${index}.url`)}
                      placeholder="https://..."
                      className="border-campus-gray-300 focus-visible:ring-campus-blue text-sm"
                    />
                    <select
                      {...register(`related_links.${index}.type`)}
                      className="h-10 px-3 rounded-lg border border-campus-gray-300 text-sm text-campus-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-campus-blue"
                    >
                      {LINK_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.related_links?.[index]?.url && (
                      <p className="sm:col-span-3 text-xs text-red-500">
                        {errors.related_links[index]?.url?.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => linksFields.remove(index)}
                    className="text-campus-gray-400 hover:text-red-500 mt-1 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button" variant="outline" size="sm"
                className="border-campus-gray-300 text-campus-gray-600 hover:border-campus-blue hover:text-campus-blue"
                onClick={() => linksFields.append({ title: '', url: '', type: 'official' })}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />Ajouter un lien
              </Button>
            </div>
          </SectionCard>

          {/* ── Changelog (mode édition) ── */}
          {!isNew && (
            <SectionCard title="Note de mise à jour" icon={Save} defaultOpen={false}>
              <div className="space-y-1.5">
                <Label className="text-sm text-campus-gray-700">
                  Décrivez les changements apportés à cette version
                </Label>
                <Textarea
                  {...register('changelog')}
                  placeholder="Ex: Mise à jour des délais, ajout d'un lien officiel..."
                  rows={3}
                  className="resize-none border-campus-gray-300 focus-visible:ring-campus-blue"
                />
              </div>
            </SectionCard>
          )}
        </div>
      </form>
    </div>
  );
}
