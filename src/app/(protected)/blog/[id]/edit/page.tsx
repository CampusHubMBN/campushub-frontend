// src/app/(protected)/blog/[id]/edit/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { postsApi } from '@/services/api/posts.api';
import { useAuthStore } from '@/store/auth.store';
import { BlogCategory } from '@/types/post';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Save, Eye, Loader2, X, Plus,
  Image as ImageIcon, AlertCircle, ToggleRight, ToggleLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageUrl } from '@/lib/utils';
import { toast } from 'sonner';

// ✅ Import dynamique Tiptap — pas de SSR
const ArticleEditor = dynamic(
  () => import('@/components/articles/ArticleEditor').then((m) => m.ArticleEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border border-campus-gray-300 rounded-lg overflow-hidden">
        <div className="h-14 bg-campus-gray-50 border-b border-campus-gray-200 animate-pulse" />
        <div className="min-h-[360px] p-5 bg-white">
          <p className="text-campus-gray-400 text-sm">Chargement de l'éditeur...</p>
        </div>
      </div>
    ),
  }
);

// ─── Schema ───────────────────────────────────────────────────────────────────
const postSchema = z.object({
  title:       z.string().min(3, 'Titre trop court').max(200),
  category_id: z.string().optional(),
  tag_input:   z.string().optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PostEditPage({
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
  const [tags, setTags]                 = useState<string[]>([]);
  const [tagInput, setTagInput]         = useState('');
  const [coverFile, setCoverFile]       = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [savedPostId, setSavedPostId]   = useState<string | null>(null);

  const editId = isNew ? savedPostId : id;

  // ── Fetch post existant ──────────────────────────────────────────────────
  const { data: existing, isLoading } = useQuery({
    queryKey: ['post-edit', id],
    queryFn:  () => postsApi.getPost(id),
    enabled:  !isNew,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['blog-categories'],
    queryFn:  postsApi.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  // ── Form ─────────────────────────────────────────────────────────────────
  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    mode: 'onChange',
    defaultValues: { title: '', category_id: '' },
  });

  useEffect(() => {
    if (existing) {
      reset({
        title:       existing.title,
        category_id: existing.category_id ?? '',
      });
      setContent(existing.content);
      setTags(existing.tags ?? []);
      if (existing.cover_image_url) {
        setCoverPreview(storageUrl(existing.cover_image_url) ?? null);
      }
    }
  }, [existing, reset]);

  const titleValue = watch('title');

  // ── Tags ─────────────────────────────────────────────────────────────────
  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  // ── Cover ─────────────────────────────────────────────────────────────────
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image max 2 Mo'); return; }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (values: PostFormValues & { publish?: boolean }) => {
      const payload = {
        title:       values.title,
        content,
        category_id: values.category_id || null,
        tags,
        status:      values.publish ? 'published' as const : 'draft' as const,
      };

      if (isNew && !savedPostId) {
        return postsApi.createPost(payload);
      }
      return postsApi.updatePost(editId!, payload);
    },
    onSuccess: async (post) => {
      if (coverFile) {
        try {
          await postsApi.uploadCover(post.id, coverFile);
          setCoverFile(null);
        } catch {
          toast.error("Erreur lors de l'upload de l'image");
        }
      }

      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success(isNew && !savedPostId ? 'Post créé !' : 'Post mis à jour !');

      if (isNew && !savedPostId) {
        setSavedPostId(post.id);
        router.replace(`/blog/${post.id}/edit`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => postsApi.togglePublish(editId!),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['post-edit', id] });
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      toast.success(post.status === 'published' ? 'Post publié !' : 'Post dépublié');
    },
    onError: () => toast.error('Erreur lors du changement de statut'),
  });

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = (values: PostFormValues) => {
    if (!content || content === '<p></p>') {
      setContentError('Le contenu est requis');
      return;
    }
    setContentError('');
    saveMutation.mutate(values);
  };

  const onPublish = (values: PostFormValues) => {
    if (!content || content === '<p></p>') {
      setContentError('Le contenu est requis');
      return;
    }
    setContentError('');
    saveMutation.mutate({ ...values, publish: true });
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen bg-campus-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl space-y-5">
          <Skeleton className="h-8 w-28 bg-campus-gray-200" />
          <Skeleton className="h-12 w-full bg-campus-gray-200" />
          <Skeleton className="h-96 w-full bg-campus-gray-200" />
        </div>
      </div>
    );
  }

  const isPublished = existing?.status === 'published';

  return (
    <div className="min-h-screen bg-campus-gray-50">
      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ── Topbar sticky ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-campus-gray-200 shadow-sm">
          <div className="container mx-auto px-4 max-w-3xl py-3 flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm"
              onClick={() => router.push('/blog')}
              className="text-campus-gray-600 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />Blog
            </Button>

            <span className="text-campus-gray-300">|</span>
            <span className="text-sm font-medium text-campus-gray-700">
              {isNew ? 'Nouveau post' : 'Modifier le post'}
            </span>

            {!isNew && (
              <Badge className={cn('text-xs border',
                isPublished
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-campus-gray-100 text-campus-gray-600 border-campus-gray-300'
              )}>
                {isPublished ? 'Publié' : 'Brouillon'}
              </Badge>
            )}

            <div className="ml-auto flex items-center gap-2">
              {/* Prévisualiser */}
              {!isNew && isPublished && (
                <Button type="button" variant="outline" size="sm"
                  className="border-campus-gray-300 text-campus-gray-600"
                  onClick={() => window.open(`/blog/${id}`, '_blank')}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />Voir
                </Button>
              )}

              {/* Toggle publish */}
              {!isNew && editId && (
                <Button type="button" variant="outline" size="sm"
                  className={cn('border', isPublished
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-green-200 text-green-700 hover:bg-green-50'
                  )}
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : isPublished
                    ? <><ToggleLeft className="h-3.5 w-3.5 mr-1" />Dépublier</>
                    : <><ToggleRight className="h-3.5 w-3.5 mr-1" />Publier</>
                  }
                </Button>
              )}

              {/* Enregistrer brouillon */}
              <Button type="submit" size="sm"
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

        <div className="container mx-auto px-4 max-w-3xl py-8 space-y-5">

          {/* ── Titre ── */}
          <div className="space-y-1.5">
            <Input
              {...register('title')}
              placeholder="Titre de votre post..."
              className={cn(
                'text-xl font-semibold border-campus-gray-300 focus-visible:ring-campus-blue h-14 px-4',
                errors.title && 'border-red-400'
              )}
            />
            {errors.title && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />{errors.title.message}
              </p>
            )}
          </div>

          {/* ── Meta : catégorie + tags ── */}
          <Card className="border-campus-gray-300 shadow-sm">
            <CardContent className="pt-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Catégorie */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-campus-gray-700">Catégorie</Label>
                  <select
                    {...register('category_id')}
                    className="w-full h-10 px-3 rounded-lg border border-campus-gray-300 text-sm text-campus-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-campus-blue"
                  >
                    <option value="">Sans catégorie</option>
                    {categories.map((cat: BlogCategory) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-campus-gray-700">
                    Tags <span className="text-campus-gray-400 font-normal">(max 5, Entrée pour valider)</span>
                  </Label>
                  <div className={cn(
                    'flex flex-wrap gap-1.5 min-h-10 px-3 py-1.5 rounded-lg border bg-white transition-colors',
                    'border-campus-gray-300 focus-within:ring-2 focus-within:ring-campus-blue focus-within:border-campus-blue'
                  )}>
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-campus-blue-50 text-campus-blue border border-campus-blue-100">
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {tags.length < 5 && (
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => tagInput && addTag(tagInput)}
                        placeholder={tags.length === 0 ? 'ex: emploi, conseil...' : ''}
                        className="flex-1 min-w-20 text-sm outline-none bg-transparent text-campus-gray-700 placeholder:text-campus-gray-400"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Cover image */}
              <div className="space-y-1.5">
                <Label className="text-sm text-campus-gray-700">Image de couverture <span className="text-campus-gray-400 font-normal">(optionnelle · max 2 Mo)</span></Label>
                {coverPreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-campus-gray-200">
                    <img src={coverPreview} alt="Cover" className="w-full h-40 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                      className="absolute top-2 right-2 h-7 w-7 bg-white/90 rounded-full flex items-center justify-center text-campus-gray-600 hover:text-red-500 shadow"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-campus-gray-300 hover:border-campus-blue hover:bg-campus-blue-50 cursor-pointer transition-colors">
                    <ImageIcon className="h-5 w-5 text-campus-gray-400" />
                    <span className="text-sm text-campus-gray-500">Cliquez pour ajouter une image</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Éditeur Tiptap ── */}
          <div className="space-y-1.5">
            <ArticleEditor
              content={content}
              onChange={(html) => { setContent(html); setContentError(''); }}
              placeholder="Partagez vos expériences, conseils, actualités..."
            />
            {contentError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />{contentError}
              </p>
            )}
          </div>

          {/* ── Actions bas de page ── */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" size="sm"
              onClick={() => router.push('/blog')}
              className="text-campus-gray-400 hover:text-campus-gray-700"
            >
              Annuler
            </Button>

            <div className="flex items-center gap-2">
              {(!isNew || savedPostId) && !isPublished && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                  onClick={handleSubmit(onPublish)}
                  disabled={saveMutation.isPending}
                >
                  <ToggleRight className="h-3.5 w-3.5 mr-1.5" />
                  Enregistrer et publier
                </Button>
              )}
              <Button type="submit" size="sm"
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
      </form>
    </div>
  );
}
