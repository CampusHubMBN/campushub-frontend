// src/components/layout/avatar-skeleton.tsx
export function AvatarSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-1">
      <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
      <div className="hidden lg:block space-y-1">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}