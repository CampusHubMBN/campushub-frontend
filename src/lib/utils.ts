// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function storageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:8000';
  // Évite les doubles slashes
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}
