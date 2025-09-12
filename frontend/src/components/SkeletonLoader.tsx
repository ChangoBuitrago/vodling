import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  height = 'h-4',
  width = 'w-full',
  rounded = true,
}) => {
  return (
    <div
      className={`
        animate-pulse bg-gray-700/30
        ${height}
        ${width}
        ${rounded ? 'rounded' : ''}
        ${className}
      `}
    />
  );
};

// Predefined skeleton components for common use cases
export const BalanceSkeleton: React.FC = () => (
  <div className="space-y-4">
    <SkeletonLoader height="h-8" width="w-32" />
    <SkeletonLoader height="h-6" width="w-24" />
    <SkeletonLoader height="h-4" width="w-16" />
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <SkeletonLoader height="h-4" width="w-32" />
      <SkeletonLoader height="h-12" width="w-full" />
    </div>
    <SkeletonLoader height="h-12" width="w-full" />
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="glass-effect p-6 space-y-4">
    <div className="flex items-center space-x-4">
      <SkeletonLoader height="h-12" width="w-12" rounded />
      <SkeletonLoader height="h-6" width="w-32" />
    </div>
    <div className="space-y-3">
      <SkeletonLoader height="h-4" width="w-full" />
      <SkeletonLoader height="h-4" width="w-3/4" />
      <SkeletonLoader height="h-4" width="w-1/2" />
    </div>
  </div>
);

export const TransactionSkeleton: React.FC = () => (
  <div className="glass-effect p-8 text-center space-y-6">
    <SkeletonLoader height="h-16" width="w-16" rounded className="mx-auto" />
    <div className="space-y-3">
      <SkeletonLoader height="h-8" width="w-48" className="mx-auto" />
      <SkeletonLoader height="h-4" width="w-64" className="mx-auto" />
    </div>
    <SkeletonLoader height="h-4" width="w-32" className="mx-auto" />
  </div>
);

export default SkeletonLoader;
