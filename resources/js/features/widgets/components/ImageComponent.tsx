import type { ImageConfig } from '@/features/data-sources/types/component-config';
import { ImageOff } from 'lucide-react';

// ============================================================================
// Component
// ============================================================================

interface ImageComponentProps {
  config: ImageConfig;
}

export default function ImageComponent({ config }: ImageComponentProps) {
  const safeConfig = config || {};

  const {
    src,
    alt = '',
    objectFit = 'contain',
    borderRadius = 0,
    opacity = 100,
  } = safeConfig;

  if (!src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <ImageOff className="h-8 w-8" />
        <span className="text-xs">No image URL set</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden" style={{ borderRadius }}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full"
        style={{
          objectFit,
          opacity: opacity / 100,
          borderRadius,
        }}
        onError={(e) => {
          // Hide broken image and show placeholder
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><line x1="13.5" x2="6" y1="13.5" y2="21"/><line x1="18" x2="21" y1="12" y2="15"/><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59"/><path d="M21 15V5a2 2 0 0 0-2-2H9"/></svg>
                <span class="text-xs">Failed to load image</span>
              </div>
            `;
          }
        }}
      />
    </div>
  );
}
