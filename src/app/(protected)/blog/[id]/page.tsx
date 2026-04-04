// src/app/(protected)/blog/[id]/page.tsx
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
  ChevronUp, CheckCircle2, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

// ─── Reaction button ───────────────────────────────────────────────────────────
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
      {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
    </button>
  );
}

// ─── Comment item ─────────────────────────────────────────────────────────────
function CommentItem({
  comment, postId, depth = 0, isQuestion = false, isPostAuthor = false,
}: {
  comment: Comment; postId: string; depth?: number;
  isQuestion?: boolean; isPostAuthor?: boolean;
}) {
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const [showReply, setShowReply]     = useState(false);
  const [replyText, setReplyText]     = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [editMode, setEditMode]       = useState(false);
  const [editText, setEditText]       = useState(comment.content ?? '');
  const [localVotesCount, setLocalVotesCount] = useState(comment.votes_count);
  const [localUserVote, setLocalUserVote]     = useState(comment.user_vote);

  const initials = comment.author?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

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
    onError: () => toast.error('Erreur lors de l\'envoi'),
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

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => postsApi.voteComment(comment.id, value),
    onSuccess: (data) => {
      setLocalVotesCount(data.votes_count);
      setLocalUserVote(data.user_vote);
    },
    onError: () => toast.error('Erreur lors du vote'),
  });

  const acceptMutation = useMutation({
    mutationFn: () => postsApi.acceptAnswer(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    },
    onError: () => toast.error('Erreur lors de l\'acceptation'),
  });

  const replies = repliesData?.data ?? comment.replies ?? [];

  return (
    <div className={cn('flex gap-3', depth > 0 && 'ml-10 mt-2')}>
      {/* Vote column — root answers on questions only */}
      {isQuestion && depth === 0 && (
        <div className="flex flex-col items-center gap-0.5 pt-2 flex-shrink-0">
          <button
            onClick={() => voteMutation.mutate(1)}
            disabled={comment.is_own || voteMutation.isPending}
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded-lg transition-colors',
              localUserVote === 1
                ? 'bg-campus-blue text-white'
                : 'text-campus-gray-400 hover:bg-campus-blue-50 hover:text-campus-blue',
              (comment.is_own || voteMutation.isPending) && 'opacity-40 cursor-not-allowed'
            )}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className={cn(
            'text-sm font-bold tabular-nums min-w-[1.5rem] text-center',
            localVotesCount > 0 ? 'text-campus-blue' : localVotesCount < 0 ? 'text-red-500' : 'text-campus-gray-400'
          )}>
            {localVotesCount}
          </span>
          <button
            onClick={() => voteMutation.mutate(-1)}
            disabled={comment.is_own || voteMutation.isPending}
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded-lg transition-colors',
              localUserVote === -1
                ? 'bg-red-100 text-red-500'
                : 'text-campus-gray-400 hover:bg-red-50 hover:text-red-400',
              (comment.is_own || voteMutation.isPending) && 'opacity-40 cursor-not-allowed'
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
        <AvatarImage src={storageUrl(comment.author?.avatar_url) ?? undefined} />
        <AvatarFallback className="bg-campus-blue text-white text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className={cn(
          'rounded-2xl px-4 py-3',
          comment.is_accepted_answer
            ? 'bg-green-50 border border-green-200'
            : depth > 0
            ? 'bg-campus-gray-100'
            : 'bg-campus-gray-50 border border-campus-gray-200'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-campus-gray-900">
                {comment.is_deleted ? 'Commentaire supprimé' : comment.author?.name}
              </span>
              {comment.is_accepted_answer && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />Réponse acceptée
                </span>
              )}
              <span className="text-xs text-campus-gray-400">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {isQuestion && isPostAuthor && !comment.is_deleted && depth === 0 && (
                <button
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                  title={comment.is_accepted_answer ? 'Désaccepter' : 'Marquer comme réponse acceptée'}
                  className={cn(
                    'h-6 w-6 flex items-center justify-center rounded transition-colors',
                    comment.is_accepted_answer
                      ? 'text-green-600 hover:bg-red-50 hover:text-red-400'
                      : 'text-campus-gray-400 hover:text-green-600 hover:bg-green-50'
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
              )}
              {!comment.is_deleted && comment.is_own && (
                <>
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
                </>
              )}
            </div>
          </div>

          {comment.is_deleted ? (
            <p className="text-sm text-campus-gray-400 italic">Ce commentaire a été supprimé.</p>
          ) : editMode ? (
            <div className="space-y-2 mt-1">
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

        {/* Reply / expand actions */}
        {!comment.is_deleted && depth === 0 && (
          <div className="flex items-center gap-3 mt-1 ml-3">
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-xs text-campus-gray-400 hover:text-campus-blue transition-colors flex items-center gap-1 font-medium"
            >
              <CornerDownRight className="h-3 w-3" />Répondre
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

        {showReply && (
          <div className="mt-2 ml-3 flex gap-2">
            <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
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
                className="resize-none text-sm border-campus-gray-300 focus-visible:ring-campus-blue rounded-2xl"
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

        {showReplies && (
          <div className="mt-2 space-y-2">
            {loadingReplies
              ? <Skeleton className="h-14 w-full bg-campus-gray-200 ml-10" />
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
  params: Promise<{ id: string }>;
}) {
  const { id }      = use(params);
  const router      = useRouter();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: post, isLoading: loadingPost } = useQuery({
    queryKey: ['post', id],
    queryFn:  () => postsApi.getPost(id),
  });

  const { data: commentsData, isLoading: loadingComments } = useQuery({
    queryKey: ['post-comments', post?.id],
    queryFn:  () => postsApi.getComments(post!.id),
    enabled:  !!post?.id,
  });

  const reactMutation = useMutation({
    mutationFn: (type: ReactionType) => postsApi.react(post!.id, { type }),
    onSuccess: (data) => {
      queryClient.setQueryData(['post', id], (old: any) => ({
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
      toast.success(isQuestion ? 'Réponse ajoutée' : 'Commentaire ajouté');
    },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  });

  if (loadingPost) return (
    <div className="min-h-screen bg-campus-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        <Skeleton className="h-5 w-20 bg-campus-gray-200" />
        <div className="bg-white rounded-xl p-5 space-y-4 border border-campus-gray-200">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-campus-gray-200 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32 bg-campus-gray-200" />
              <Skeleton className="h-3 w-24 bg-campus-gray-200" />
            </div>
          </div>
          <Skeleton className="h-6 w-3/4 bg-campus-gray-200" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full bg-campus-gray-200" />)}
        </div>
      </div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-campus-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-campus-gray-500 font-medium mb-3">Post introuvable</p>
        <Button className="bg-campus-blue hover:bg-campus-blue-600 text-white" onClick={() => router.push('/blog')}>
          Retour
        </Button>
      </div>
    </div>
  );

  const initials     = post.author?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  const userInitials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  const comments     = commentsData?.data ?? [];
  const isQuestion   = post.type === 'question';
  const isPostAuthor = user?.id === post.author_id;

  return (
    <div className="min-h-screen bg-campus-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-3">

        {/* Back */}
        <button onClick={() => router.push('/blog')}
          className="flex items-center gap-1.5 text-sm text-campus-gray-500 hover:text-campus-blue transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />Fil d'actualité
        </button>

        {/* ── Post card ── */}
        <div className="bg-white border border-campus-gray-200 rounded-xl overflow-hidden">

          {/* Author header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-3">
            <Avatar className="h-11 w-11 cursor-pointer flex-shrink-0" onClick={() => router.push(`/profile/${post.author_id}`)}>
              <AvatarImage src={storageUrl(post.author?.avatar_url) ?? undefined} />
              <AvatarFallback className="bg-campus-blue text-white font-medium">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-campus-gray-900 cursor-pointer hover:text-campus-blue"
                  onClick={() => router.push(`/profile/${post.author_id}`)}>
                  {post.author?.name}
                </p>
                {isQuestion ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-campus-orange bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                    <HelpCircle className="h-3 w-3" />Question
                  </span>
                ) : (
                  post.category && (
                    <span className="text-xs font-medium text-white px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: post.category.color }}>
                      {post.category.name}
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-campus-gray-400">
                {formatDistanceToNow(new Date(post.published_at ?? post.created_at), { addSuffix: true, locale: fr })}
                {' · '}<Eye className="h-3 w-3 inline -mt-0.5" /> {post.views_count}
              </p>
            </div>
            {post.is_own_post && (
              <button
                onClick={() => router.push(`/blog/${post.id}/edit`)}
                className="flex items-center gap-1 text-xs text-campus-gray-400 hover:text-campus-blue transition-colors px-2 py-1 rounded-lg hover:bg-campus-blue-50"
              >
                <Pencil className="h-3.5 w-3.5" />Modifier
              </button>
            )}
          </div>

          {/* Title */}
          <div className="px-5 pb-3">
            <h1 className="text-xl font-bold text-campus-gray-900 leading-tight">
              {post.title}
            </h1>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs text-campus-gray-500 bg-campus-gray-100 px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cover image — inset, not full bleed */}
          {post.cover_image_url && (
            <div className="px-5 pb-4">
              <img
                src={storageUrl(post.cover_image_url)}
                alt={post.title}
                className="w-full rounded-xl object-cover max-h-64"
              />
            </div>
          )}

          {/* Content */}
          <div className={cn(
            'px-5 pb-5',
            'prose prose-sm max-w-none',
            'prose-headings:text-campus-gray-900 prose-headings:font-semibold',
            'prose-p:text-campus-gray-700 prose-p:leading-relaxed',
            'prose-a:text-campus-blue prose-a:no-underline hover:prose-a:underline',
            'prose-strong:text-campus-gray-900 prose-li:text-campus-gray-700',
            'prose-blockquote:border-l-4 prose-blockquote:border-campus-blue prose-blockquote:pl-4 prose-blockquote:text-campus-gray-600',
            'prose-img:rounded-lg prose-img:shadow-sm prose-img:mx-auto',
          )}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Reactions bar */}
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-campus-gray-100 bg-campus-gray-50/50">
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
            <span className="ml-auto text-xs text-campus-gray-400 flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {post.comments_count} {isQuestion ? 'réponse' : 'commentaire'}{post.comments_count > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Comment input ── */}
        <div className="bg-white border border-campus-gray-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
              <AvatarImage src={storageUrl(user?.info?.avatar_url) ?? undefined} />
              <AvatarFallback className="bg-campus-blue text-white text-xs">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isQuestion ? 'Écrire une réponse...' : 'Écrire un commentaire...'}
                rows={2}
                className="resize-none border-campus-gray-200 focus-visible:ring-campus-blue rounded-2xl text-sm bg-campus-gray-50"
              />
              {commentText.trim() && (
                <Button
                  size="sm"
                  className="bg-campus-blue hover:bg-campus-blue-600 text-white gap-1.5"
                  onClick={() => commentMutation.mutate(commentText)}
                  disabled={commentMutation.isPending}
                >
                  <Send className="h-3.5 w-3.5" />
                  {commentMutation.isPending ? 'Envoi...' : isQuestion ? 'Répondre' : 'Commenter'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Comments ── */}
        {loadingComments ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full bg-campus-gray-200 flex-shrink-0" />
                <Skeleton className="h-16 flex-1 rounded-2xl bg-campus-gray-200" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-campus-gray-400">
            <MessageSquare className="h-7 w-7 mx-auto mb-2 text-campus-gray-300" />
            <p className="text-sm">
              {isQuestion ? 'Aucune réponse pour l\'instant — soyez le premier !' : 'Aucun commentaire — lancez la discussion !'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-8">
            {isQuestion && (
              <p className="text-xs text-campus-gray-400 px-1">
                {comments.length} réponse{comments.length > 1 ? 's' : ''} · triées par votes
              </p>
            )}
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={post.id}
                isQuestion={isQuestion}
                isPostAuthor={isPostAuthor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
