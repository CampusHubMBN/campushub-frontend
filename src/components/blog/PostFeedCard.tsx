// src/components/blog/PostFeedCard.tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { storageUrl } from '@/lib/utils';
import { Post } from '@/types/post';
import { useRouter } from 'next/navigation';

export function PostFeedCard({ post }: { post: Post }) {
  const router = useRouter();
  const totalReactions = post.likes_count + post.useful_count + post.bravo_count;
  const initials = post.author?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div
      onClick={() => router.push(`/blog/${post.slug}`)}
      className="flex gap-3 p-3 rounded-lg cursor-pointer border border-campus-gray-200 hover:border-campus-blue-200 hover:bg-campus-blue-50/40 transition-colors group"
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={storageUrl(post.author?.avatar_url)} />
        <AvatarFallback className="bg-campus-blue text-white text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-medium text-campus-gray-700">{post.author?.name}</span>
          <span className="text-campus-gray-300 text-xs">·</span>
          <span className="text-xs text-campus-gray-400">
            {formatDistanceToNow(new Date(post.published_at ?? post.created_at), { addSuffix: true, locale: fr })}
          </span>
        </div>

        <p className="text-sm font-medium text-campus-gray-900 truncate group-hover:text-campus-blue transition-colors leading-snug">
          {post.title}
        </p>

        <div className="flex items-center gap-2 mt-1">
          {post.category && (
            <span
              className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: post.category.color }}
            >
              {post.category.name}
            </span>
          )}
          <span className="text-xs text-campus-gray-400 flex items-center gap-0.5">
            <MessageSquare className="h-2.5 w-2.5" />{post.comments_count}
          </span>
          {totalReactions > 0 && (
            <span className="text-xs text-campus-gray-400">
              {totalReactions} réaction{totalReactions > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
