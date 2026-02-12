import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
    return (
        <div
            className={`animate-pulse bg-slate-200 rounded ${className}`}
            aria-hidden="true"
        />
    );
};

// Specific skeleton variants
export const ProductCardSkeleton = () => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-start gap-3">
            <Skeleton className="w-16 h-16 rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
        <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
        </div>
    </div>
);

export const DashboardStatsSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 mb-6">
        {[1, 2].map(i => (
            <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2 mt-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        ))}
    </div>
);

export const ProductListSkeleton = () => (
    <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
            <ProductCardSkeleton key={i} />
        ))}
    </div>
);
