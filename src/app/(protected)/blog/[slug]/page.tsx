// src/app/(protected)/blog/[slug]/page.tsx
'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { postsApi } from '@/services/api/posts.api';
import { useAuthStore } from '@/store/auth.store';
import { Comment, ReactionType, REACTION_LABELS, REACTION_NAMES } from '@/types/post';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, MessageSquare, Eye, Pencil,
  Send, CornerDownRight, Trash2, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageUrl } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { error } from 'console';

// ─── Réaction button ──────────────────────────────────────────────────────────
function ReactionBtn({
  type, count, active, onClick, disabled,
}: {
  type: ReactionType; count: number; active: boolean;
  onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={REACTION_NAMES[type]}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
        active
          ? 'bg-campus-blue-50 border-campus-blue-200 text-campus-blue'
          : 'bg-white border-campus-gray-200 text-campus-gray-600 hover:border-campus-blue-200 hover:bg-campus-blue-50/50',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <span>{REACTION_LABELS[type]}</span>
      {count > 0 && <span className="text-xs">{count}</span>}
    </button>
  );
}

// ─── Comment item ─────────────────────────────────────────────────────────────
function CommentItem({
  comment, postId, depth = 0,
}: {
  comment: Comment; postId: string; depth?: number;
}) {
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const [showReply, setShowReply]   = useState(false);
  const [replyText, setReplyText]   = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [editText, setEditText]     = useState(comment.content ?? '');

  const initials = comment.author?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  // Replies query (chargées à la demande)
  const { data: repliesData, isLoading: loadingReplies } = useQuery({
    queryKey: ['comment-replies', comment.id],
    queryFn:  () => postsApi.getReplies(comment.id),
    enabled:  showReplies && comment.replies_count > 0,
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) => postsApi.addComment(postId, content, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-replies', comment.id] });
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      setReplyText('');
      setShowReply(false);
      setShowReplies(true);
      toast.success('Réponse ajoutée');
    },
    onError: ((error) => {
      toast.error('Erreur lors de l\'envoi');
      console.log('erreur', error)
    }),
  });

  const updateMutation = useMutation({
    mutationFn: (content: string) => postsApi.updateComment(comment.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['comment-replies', comment.parent_id ?? ''] });
      setEditMode(false);
      toast.success('Commentaire modifié');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => postsApi.deleteComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['comment-replies', comment.parent_id ?? ''] });
      toast.success('Commentaire supprimé');
    },
  });

  const replies = repliesData?.data ?? comment.replies ?? [];

  console.log(comment);

  return (
    <div className={cn('flex gap-3', depth > 0 && 'ml-10 mt-3')}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={storageUrl(comment.author?.avatar_url) ?? undefined} />
        <AvatarFallback className="bg-campus-blue text-white text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Bulle commentaire */}
        <div className="bg-campus-gray-50 rounded-xl px-4 py-3 border border-campus-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-campus-gray-900">
                {comment.is_deleted ? 'Commentaire supprimé' : comment.author?.name}
              </span>
              <span className="text-xs text-campus-gray-400">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
              </span>
            </div>

            {/* Actions propriétaire */}
            {!comment.is_deleted && comment.is_own && (
              <div className="flex items-center gap-1">
                <button onClick={() => setEditMode(!editMode)}
                  className="h-6 w-6 flex items-center justify-center rounded text-campus-gray-400 hover:text-campus-blue hover:bg-campus-blue-50 transition-colors">
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => window.confirm('Supprimer ce commentaire ?') && deleteMutation.mutate()}
                  className="h-6 w-6 flex items-center justify-center rounded text-campus-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {comment.is_deleted ? (
            <p className="text-sm text-campus-gray-400 italic">Ce commentaire a été supprimé.</p>
          ) : editMode ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="resize-none text-sm border-campus-gray-300 focus-visible:ring-campus-blue"
              />
              <div className="flex gap-2">
                <Button size="sm" className="bg-campus-blue hover:bg-campus-blue-600 text-white h-7 text-xs"
                  onClick={() => updateMutation.mutate(editText)}
                  disabled={updateMutation.isPending || !editText.trim()}
                >
                  Modifier
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditMode(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-campus-gray-700 leading-relaxed">{comment.content}</p>
          )}
        </div>

        {/* Actions sous le commentaire */}
        {!comment.is_deleted && depth === 0 && (
          <div className="flex items-center gap-3 mt-1.5 ml-2">
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-xs text-campus-gray-400 hover:text-campus-blue transition-colors flex items-center gap-1"
            >
              <CornerDownRight className="h-3 w-3" />
              Répondre
            </button>
            {comment.replies_count > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-campus-gray-400 hover:text-campus-blue transition-colors flex items-center gap-1"
              >
                <ChevronDown className={cn('h-3 w-3 transition-transform', showReplies && 'rotate-180')} />
                {comment.replies_count} réponse{comment.replies_count > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        {/* Zone réponse */}
        {showReply && (
          <div className="mt-3 ml-2 flex gap-2">
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarImage src={storageUrl(user?.info?.avatar_url) ?? undefined} />
              <AvatarFallback className="bg-campus-blue text-white text-xs">
                {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Répondre à ${comment.author?.name}...`}
                rows={2}
                className="resize-none text-sm border-campus-gray-300 focus-visible:ring-campus-blue"
              />
              <div className="flex gap-2">
                <Button size="sm" className="bg-campus-blue hover:bg-campus-blue-600 text-white h-7 text-xs gap-1"
                  onClick={() => replyMutation.mutate(replyText)}
                  disabled={replyMutation.isPending || !replyText.trim()}
                >
                  <Send className="h-3 w-3" />Envoyer
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowReply(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {showReplies && (
          <div className="mt-2 space-y-3">
            {loadingReplies
              ? <Skeleton className="h-16 w-full bg-campus-gray-200 ml-10" />
              : replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} postId={postId} depth={1} />
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug }    = use(params);
  const router      = useRouter();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: post, isLoading: loadingPost } = useQuery({
    queryKey: ['post', slug],
    queryFn:  () => postsApi.getPost(slug),
  });

  const { data: commentsData, isLoading: loadingComments } = useQuery({
    queryKey: ['post-comments', post?.id],
    queryFn:  () => postsApi.getComments(post!.id),
    enabled:  !!post?.id,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const reactMutation = useMutation({
    mutationFn: (type: ReactionType) => postsApi.react(post!.id, { type }),
    onSuccess: (data) => {
      queryClient.setQueryData(['post', slug], (old: any) => ({
        ...old,
        likes_count:   data.likes_count,
        useful_count:  data.useful_count,
        bravo_count:   data.bravo_count,
        user_reaction: data.user_reaction,
      }));
    },
    onError: () => toast.error('Erreur lors de la réaction'),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => postsApi.addComment(post!.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', post?.id] });
      setCommentText('');
      toast.success('Commentaire ajouté');
    },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingPost) return (
    <div className="min-h-screen bg-campus-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-5">
        <Skeleton className="h-6 w-24 bg-campus-gray-200" />
        <Skeleton className="h-10 w-3/4 bg-campus-gray-200" />
        <div className="flex gap-3"><Skeleton className="h-8 w-8 rounded-full bg-campus-gray-200" /><div className="space-y-1.5"><Skeleton className="h-4 w-32 bg-campus-gray-200" /><Skeleton className="h-3 w-20 bg-campus-gray-200" /></div></div>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full bg-campus-gray-200" />)}
      </div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-campus-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-campus-gray-500 font-medium mb-3">Post introuvable</p>
        <Button className="bg-campus-blue hover:bg-campus-blue-600 text-white" onClick={() => router.push('/blog')}>
          Retour au blog
        </Button>
      </div>
    </div>
  );

  const initials = post.author?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  const comments = commentsData?.data ?? [];

  return (
    <div className="min-h-screen bg-campus-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Back */}
        <button onClick={() => router.push('/blog')}
          className="flex items-center gap-1.5 text-sm text-campus-gray-500 hover:text-campus-blue mb-6 -ml-1 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />Blog
        </button>

        {/* Cover */}
        {post.cover_image_url && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <img src={storageUrl(post.cover_image_url)} alt={post.title} className="w-full h-56 object-cover" />
          </div>
        )}

        {/* Catégorie + tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {post.category && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: post.category.color }}>
              {post.category.name}
            </span>
          )}
          {post.tags?.map((tag) => (
            <span key={tag} className="text-xs text-campus-gray-500 bg-campus-gray-100 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        {/* Titre */}
        <h1 className="text-2xl md:text-3xl font-bold text-campus-gray-900 mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Auteur + meta */}
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-campus-gray-200">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 cursor-pointer" onClick={() => router.push(`/profile/${post.author_id}`)}>
              <AvatarImage src={storageUrl(post.author?.avatar_url) ?? undefined} />
              <AvatarFallback className="bg-campus-blue text-white font-medium">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-campus-gray-900 cursor-pointer hover:text-campus-blue"
                onClick={() => router.push(`/profile/${post.author_id}`)}>
                {post.author?.name}
              </p>
              <p className="text-xs text-campus-gray-400">
                {post.published_at
                  ? format(new Date(post.published_at), 'd MMMM yyyy', { locale: fr })
                  : 'Non publié'}
                {' · '}{post.views_count} vue{post.views_count > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Bouton éditer si propriétaire */}
          {post.is_own_post && (
            <Button variant="outline" size="sm"
              className="border-campus-gray-300 text-campus-gray-600 hover:border-campus-blue hover:text-campus-blue"
              onClick={() => router.push(`/dashboard/blog/${post.id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />Modifier
            </Button>
          )}
        </div>

        {/* Contenu HTML */}
        <div className={cn(
          'prose prose-sm max-w-none mb-8',
          'prose-headings:text-campus-gray-900 prose-headings:font-semibold',
          'prose-p:text-campus-gray-700 prose-p:leading-relaxed',
          'prose-a:text-campus-blue prose-a:no-underline hover:prose-a:underline',
          'prose-strong:text-campus-gray-900 prose-li:text-campus-gray-700',
          'prose-blockquote:border-l-4 prose-blockquote:border-campus-blue prose-blockquote:pl-4 prose-blockquote:text-campus-gray-600',
          'prose-img:rounded-lg prose-img:shadow-sm prose-img:mx-auto',
          '[&_div[data-callout]]:rounded-lg [&_div[data-callout]]:border [&_div[data-callout]]:p-4 [&_div[data-callout]]:my-3 [&_div[data-callout]]:not-prose',
          '[&_div[data-type=info]]:bg-campus-blue-50 [&_div[data-type=info]]:border-campus-blue-200 [&_div[data-type=info]]:text-campus-blue-800',
          '[&_div[data-type=warning]]:bg-campus-orange-50 [&_div[data-type=warning]]:border-campus-orange-200 [&_div[data-type=warning]]:text-campus-orange-800',
          '[&_div[data-type=tip]]:bg-green-50 [&_div[data-type=tip]]:border-green-200 [&_div[data-type=tip]]:text-green-800',
          '[&_div[data-type=success]]:bg-emerald-50 [&_div[data-type=success]]:border-emerald-200 [&_div[data-type=success]]:text-emerald-800',
        )}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* ── Réactions ── */}
        <div className="flex flex-wrap items-center gap-2 py-5 border-t border-b border-campus-gray-200 mb-8">
          <span className="text-sm text-campus-gray-500 mr-1">Réagir :</span>
          {(['like', 'useful', 'bravo'] as ReactionType[]).map((type) => (
            <ReactionBtn
              key={type}
              type={type}
              count={type === 'like' ? post.likes_count : type === 'useful' ? post.useful_count : post.bravo_count}
              active={post.user_reaction === type}
              onClick={() => reactMutation.mutate(type)}
              disabled={reactMutation.isPending}
            />
          ))}
        </div>

        {/* ── Commentaires ── */}
        <div>
          <h2 className="text-base font-semibold text-campus-gray-900 mb-5 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-campus-blue" />
            {post.comments_count} commentaire{post.comments_count > 1 ? 's' : ''}
          </h2>

          {/* Zone nouveau commentaire */}
          <div className="flex gap-3 mb-6">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={storageUrl(user?.info?.avatar_url) ?? undefined} />
              <AvatarFallback className="bg-campus-blue text-white text-xs">
                {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Écrire un commentaire..."
                rows={3}
                className="resize-none border-campus-gray-300 focus-visible:ring-campus-blue"
              />
              <Button
                size="sm"
                className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-1.5"
                onClick={() => commentMutation.mutate(commentText)}
                disabled={commentMutation.isPending || !commentText.trim()}
              >
                <Send className="h-3.5 w-3.5" />
                {commentMutation.isPending ? 'Envoi...' : 'Commenter'}
              </Button>
            </div>
          </div>

          {/* Liste commentaires */}
          {loadingComments ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full bg-campus-gray-200" />
                  <Skeleton className="h-20 flex-1 rounded-xl bg-campus-gray-200" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-campus-gray-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-campus-gray-300" />
              <p className="text-sm">Soyez le premier à commenter !</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} postId={post.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
