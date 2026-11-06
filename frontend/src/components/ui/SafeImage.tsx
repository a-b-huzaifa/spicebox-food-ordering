import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Shows a branded gradient tile instead of a broken-image icon if the photo
// fails to load (offline, blocked host, expired URL).
export function SafeImage({ src, alt, className }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="img-fallback" role="img" aria-label={alt}>
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
