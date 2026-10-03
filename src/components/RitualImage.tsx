import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';

interface RitualImageProps {
  imageUrl: string | null | undefined;
  alt: string;
  className?: string;
}

export function RitualImage({ imageUrl, alt, className = '' }: RitualImageProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        onError={() => setImageFailed(true)}
        className={`h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${alt} image placeholder`}
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 ${className}`}
    >
      <BookOpen className="h-8 w-8 opacity-70" aria-hidden="true" />
      <span className="text-sm font-medium">Add a puja image</span>
    </div>
  );
}
