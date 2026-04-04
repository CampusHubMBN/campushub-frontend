// ─────────────────────────────────────────────────────────────────────────────
// src/lib/features.ts
//
// Feature flags — single source of truth for optional modules.
// To disable a feature across the whole frontend: set the env var to 'false'
// or remove it from the .env file.
//
// Backend counterpart: comment out the corresponding module in
// campushub-realtime/src/app.module.ts (e.g. ChatModule).
// ─────────────────────────────────────────────────────────────────────────────

export const FEATURES = {
  /** 1-to-1 messaging between users (recruiter ↔ applicant).
   *  Requires ChatModule running in campushub-realtime. */
  CHAT: process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true',
} as const;
