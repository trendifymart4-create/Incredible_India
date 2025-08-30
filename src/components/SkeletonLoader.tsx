import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'shimmer' | 'pulse' | 'orange' | 'blue';
  width?: string;
  height?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'shimmer',
  width = 'w-full',
  height = 'h-4',
  rounded = 'md'
}) => {
  const baseClasses = 'animate-pulse';
  const variantClasses = {
    shimmer: 'skeleton',
    pulse: 'skeleton-pulse',
    orange: 'skeleton-orange',
    blue: 'skeleton-blue'
  };
  
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${width} ${height} ${roundedClasses[rounded]} ${className}`}
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => (
  <div className={className}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height="h-4"
        className={`mb-2 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        rounded="sm"
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl overflow-hidden shadow-xl ${className}`}>
    <Skeleton height="h-64" rounded="none" className="mb-0" />
    <div className="p-6">
      <Skeleton height="h-6" className="mb-4" width="w-3/4" />
      <SkeletonText lines={3} className="mb-4" />
      <div className="flex space-x-4 mb-4">
        <Skeleton height="h-4" width="w-16" />
        <Skeleton height="h-4" width="w-20" />
      </div>
      <Skeleton height="h-10" rounded="lg" />
    </div>
  </div>
);

export const SkeletonDestination: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-orange-100 ${className}`}>
    {/* Image skeleton */}
    <div className="relative h-64">
      <Skeleton height="h-full" rounded="none" variant="orange" />
      {/* Rating badge skeleton */}
      <div className="absolute top-4 left-4">
        <Skeleton width="w-16" height="h-6" rounded="full" variant="blue" />
      </div>
      {/* VR badge skeleton */}
      <div className="absolute top-4 right-4">
        <Skeleton width="w-20" height="h-6" rounded="full" variant="orange" />
      </div>
      {/* Location skeleton */}
      <div className="absolute bottom-4 left-4">
        <Skeleton width="w-32" height="h-5" rounded="md" />
      </div>
    </div>
    
    {/* Content skeleton */}
    <div className="p-6">
      <Skeleton height="h-8" width="w-3/4" className="mb-2" />
      <SkeletonText lines={2} className="mb-4" />
      
      {/* Stats skeleton */}
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton width="w-20" height="h-4" />
        <Skeleton width="w-24" height="h-4" />
      </div>
      
      {/* Highlights skeleton */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton width="w-16" height="h-6" rounded="full" variant="blue" />
        <Skeleton width="w-20" height="h-6" rounded="full" variant="blue" />
        <Skeleton width="w-18" height="h-6" rounded="full" variant="blue" />
      </div>
      
      {/* Button skeleton */}
      <Skeleton height="h-12" rounded="lg" variant="orange" />
    </div>
  </div>
);

export const SkeletonVideo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`max-w-4xl mx-auto ${className}`}>
    <Skeleton height="h-8" width="w-64" className="mx-auto mb-12" />
    <div className="relative w-full">
      <div className="relative w-full h-0 pb-[56.25%] bg-gray-200 rounded-lg overflow-hidden shadow-2xl">
        <Skeleton height="h-full" rounded="lg" className="absolute inset-0" />
        {/* Play button skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton width="w-16" height="h-16" rounded="full" variant="orange" />
        </div>
      </div>
    </div>
    <div className="text-center mt-8">
      <SkeletonText lines={2} className="max-w-2xl mx-auto" />
    </div>
  </div>
);

export const SkeletonTestimonial: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl p-8 shadow-lg ${className}`}>
    {/* Quote icon skeleton */}
    <div className="flex justify-center mb-6">
      <Skeleton width="w-12" height="h-12" rounded="full" variant="orange" />
    </div>
    
    {/* Rating skeleton */}
    <div className="flex justify-center mb-4 space-x-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} width="w-5" height="h-5" />
      ))}
    </div>
    
    {/* Text skeleton */}
    <SkeletonText lines={4} className="mb-6" />
    
    {/* Author skeleton */}
    <div className="flex items-center justify-center space-x-4">
      <Skeleton width="w-12" height="h-12" rounded="full" />
      <div>
        <Skeleton width="w-24" height="h-5" className="mb-1" />
        <Skeleton width="w-20" height="h-4" />
      </div>
    </div>
  </div>
);

export const SkeletonHero: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative min-h-screen flex items-center justify-center ${className}`}>
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      {/* Badge skeleton */}
      <Skeleton width="w-48" height="h-8" rounded="full" className="mx-auto mb-8" />
      
      {/* Main heading skeleton */}
      <div className="mb-6">
        <Skeleton height="h-16" width="w-full" className="mb-2" />
        <Skeleton height="h-16" width="w-3/4" className="mx-auto" />
      </div>
      
      {/* Subheading skeleton */}
      <SkeletonText lines={2} className="max-w-3xl mx-auto mb-12" />
      
      {/* CTA buttons skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
        <Skeleton width="w-48" height="h-12" rounded="full" variant="orange" />
        <Skeleton width="w-48" height="h-12" rounded="full" />
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="text-center">
            <Skeleton height="h-12" width="w-20" className="mx-auto mb-2" variant="orange" />
            <Skeleton height="h-5" width="w-24" className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;