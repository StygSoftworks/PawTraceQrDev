// src/components/HeroImage.tsx
import * as React from "react";

type HeroImageProps = {
  /** Root of your generated images */
  root?: string;                      // default: "/images/hero"
  /** Base filename (e.g., "cat" -> cat-480.avif, cat-768.webp, cat-1440.jpg) */
  base: string;
  /** Width breakpoints you generated */
  widths?: number[];                  // default: [480, 768, 1024, 1440, 1920]
  /** <picture> sizes attribute */
  sizes?: string;                     // default: "(max-width: 768px) 100vw, 70vw"
  /** Fallback image width to use for the <img src> (should match one of `widths`) */
  fallbackWidth?: number;             // default: 1440
  /** Natural dimensions (so the browser can reserve space & avoid CLS) */
  naturalWidth?: number;              // default: 1440
  naturalHeight?: number;             // default: 810  (16:9)
  /** Alt text (required for a11y) */
  alt: string;
  /** Image element className */
  imgClassName?: string;              // e.g., "h-[520px] w-full object-cover"
  /** Add a dark/brand gradient overlay over the image */
  gradientOverlayClassName?: string;  // e.g., "from-black/50 via-black/30 to-transparent"
  /** If true, eager-load & prioritize (use for LCP hero only) */
  priority?: boolean;                 // default: true
  /** Left overlay panel; pass any React tree */
  panel?: React.ReactNode;
  /** Width classes for the left overlay panel container */
  panelWidthClassName?: string;       // default: "w-[min(640px,90vw)]"
  /** Section wrapper className */
  sectionClassName?: string;          // default: "relative"
  /** Optional children (rendered above the image, like buttons/badges) */
  children?: React.ReactNode;
};

function buildSrcSet(root: string, base: string, fmt: "avif" | "webp" | "jpg", widths: number[]) {
  return widths.map((w) => `${root}/${fmt}/${base}-${w}.${fmt} ${w}w`).join(", ");
}

export function HeroImage({
  root = "/images/hero",
  base,
  widths = [480, 768, 1024, 1440, 1920],
  sizes = "(max-width: 768px) 100vw, 70vw",
  fallbackWidth = 1440,
  naturalWidth = 1440,
  naturalHeight = 810,
  alt,
  imgClassName = "h-[520px] w-full object-cover",
  gradientOverlayClassName = "from-black/50 via-black/30 to-transparent",
  priority = true,
  panel,
  panelWidthClassName = "w-[min(640px,90vw)]",
  sectionClassName = "relative",
  children,
}: HeroImageProps) {
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? ("high" as const) : ("auto" as const);

  return (
    <section className={sectionClassName}>
      {/* Base image */}
      <picture>
        <source
          type="image/avif"
          srcSet={buildSrcSet(root, base, "avif", widths)}
          sizes={sizes}
        />
        <source
          type="image/webp"
          srcSet={buildSrcSet(root, base, "webp", widths)}
          sizes={sizes}
        />
        {/* Fallback JPG at chosen width */}
        <img
          src={`${root}/jpg/${base}-${fallbackWidth}.jpg`}
          width={naturalWidth}
          height={naturalHeight}
          alt={alt}
          decoding="async"
          loading={loading}
          fetchPriority={fetchPriority}
          className={imgClassName}
          style={{ background: "rgba(0,0,0,0.06)" }} // subtle skeleton color
        />
      </picture>

      {/* Optional gradient overlay for legibility */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${gradientOverlayClassName}`} />

      {/* Left overlay panel */}
      {panel && (
        <div className="absolute inset-y-0 left-0 flex">
          <div className={`h-full ${panelWidthClassName} text-white`}>
            {panel}
          </div>
        </div>
      )}

      {/* Any other absolutely-positioned children (e.g., floating buttons) */}
      {children}
    </section>
  );
}