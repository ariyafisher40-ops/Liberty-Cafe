import { useState } from 'react';
import { resolveStorageUrl } from '../../lib/supabase';
import type { StorageBucket } from '../../types/database';

interface ProductImageProps {
  src: string | null | undefined;
  bucket?: Exclude<StorageBucket, 'payment-proofs'>;
  alt: string;
  className?: string;
  aspectClassName?: string;
  lazy?: boolean;
  placeholderType?: 'product' | 'category';
}

export function ProductImage({
  src,
  bucket = 'product-images',
  alt,
  className = '',
  aspectClassName = 'aspect-[4/3]',
  lazy = true,
  placeholderType = 'product',
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  const resolvedUrl = !hasError ? resolveStorageUrl(bucket, src) : null;
  const fallbackSrc =
    placeholderType === 'category'
      ? '/images/placeholders/category-placeholder.svg'
      : '/images/placeholders/product-placeholder.svg';

  return (
    <div
      className={`relative overflow-hidden bg-[#151518] ${aspectClassName} ${className}`}
    >
      <img
        src={resolvedUrl ?? fallbackSrc}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        referrerPolicy="no-referrer"
        onError={() => {
          if (!hasError) setHasError(true);
        }}
        className="h-full w-full object-cover object-center transition-transform duration-300 ease-out"
      />
    </div>
  );
}
