// src/app/(protected)/chat/page.tsx
// Desktop: empty state shown in the right panel when no conversation is selected.
// Mobile: this page is never visible — the layout hides the right panel on /chat.
import { MessageSquare } from 'lucide-react';

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center bg-campus-gray-50">
      <div className="p-5 rounded-2xl bg-white border border-campus-gray-200 mb-4 shadow-sm">
        <MessageSquare className="h-10 w-10 text-campus-blue" />
      </div>
      <h3 className="text-base font-semibold text-campus-gray-800 mb-1">
        Vos messages
      </h3>
      <p className="text-sm text-campus-gray-500 max-w-xs leading-relaxed">
        Sélectionnez une conversation pour commencer, ou démarrez-en une depuis un profil ou une candidature.
      </p>
    </div>
  );
}
