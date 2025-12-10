import React from 'react';

interface SkeletonProps {
  className?: string;
  rows?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full", rows = 1 }) => {
  if (rows === 1) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex gap-2 pt-2">
             <Skeleton className="h-8 w-20 rounded-full" />
             <Skeleton className="h-8 w-20 rounded-full" />
        </div>
    </div>
);