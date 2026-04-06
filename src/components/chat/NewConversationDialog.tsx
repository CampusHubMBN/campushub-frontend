'use client';

// components/chat/NewConversationDialog.tsx
// Dialog to search and select a user to start a conversation with.
// Opens from the "+" button in the chat sidebar header.

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MessageSquare } from 'lucide-react';
import { START_CONVERSATION } from '@/lib/graphql/chat';
import { usersApi, UserSearchResult } from '@/services/api/users.api';
import { storageUrl } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/role-labels';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null); // userId being opened
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [startConversation] = useMutation<{ startConversation: { id: string } }>(START_CONVERSATION);

  // Debounced search — waits 300ms after user stops typing before calling the API
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await usersApi.searchUsers(query.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setLoading(false);
      setStarting(null);
    }
  }, [open]);

  async function handleSelectUser(userId: string) {
    setStarting(userId);
    try {
      // startConversation is idempotent: returns existing conversation if one already exists
      const { data } = await startConversation({ variables: { otherUserId: userId } });
      const conversationId = data?.startConversation?.id;
      if (conversationId) {
        onOpenChange(false);
        router.push(`/chat/${conversationId}`);
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setStarting(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-campus-gray-100">
          <DialogTitle className="text-base font-semibold text-campus-gray-900">
            Nouvelle conversation
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-campus-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-campus-gray-400" />
            <Input
              autoFocus
              placeholder="Rechercher un utilisateur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-campus-gray-50 border-campus-gray-200 focus-visible:ring-campus-blue"
            />
          </div>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto">
          {/* Loading skeletons */}
          {loading && (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-1.5">
                  <Skeleton className="h-9 w-9 rounded-full bg-campus-gray-200 flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-28 bg-campus-gray-200" />
                    <Skeleton className="h-3 w-20 bg-campus-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state — shown only after a search with no results */}
          {!loading && query.trim().length > 0 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Search className="h-8 w-8 text-campus-gray-300 mb-2" />
              <p className="text-sm text-campus-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}

          {/* Prompt — shown when search field is empty */}
          {!loading && query.trim().length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <MessageSquare className="h-8 w-8 text-campus-gray-300 mb-2" />
              <p className="text-sm text-campus-gray-500">Tapez un nom pour rechercher</p>
            </div>
          )}

          {/* User results */}
          {!loading && results.map((user) => {
            const initials = user.name
              .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            const isStarting = starting === user.id;

            return (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                disabled={!!starting}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-campus-gray-50 transition-colors disabled:opacity-60 text-left"
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={storageUrl(user.avatar_url) ?? undefined} />
                  <AvatarFallback className="bg-campus-blue text-white text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-campus-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-campus-gray-400">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </p>
                </div>
                {isStarting && (
                  <span className="h-4 w-4 rounded-full border-2 border-campus-blue border-t-transparent animate-spin flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
