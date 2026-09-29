import type { ReactNode } from "react";

interface PageBannerProps {
  eyebrow?: string;
  title: string;
  image?: string;
  // Full credit line, e.g. "Ervin Lukacs / Unsplash".
  photoCredit?: string;
  children?: ReactNode;
}

function PageBanner({
  eyebrow,
  title,
  image,
  photoCredit,
  children,
}: PageBannerProps) {
  return (
    <header
      className="relative bg-linear-to-br from-slate-900 to-slate-700 bg-cover bg-center text-white"
      style={image ? { backgroundImage: `url('${image}')` } : undefined}
    >
      {image && (
        <div
          className="absolute inset-0 bg-linear-to-r from-slate-900/85 via-slate-900/60 to-slate-900/30"
          aria-hidden="true"
        />
      )}

      <div className="relative mx-auto max-w-6xl px-6 py-12 sm:py-20">
        {eyebrow && (
          <p className="text-xs font-medium tracking-wider text-white/70 uppercase">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">
          {title}
        </h1>

        {children && <div className="mt-6">{children}</div>}
      </div>

      {photoCredit && (
        <p className="absolute right-3 bottom-2 text-[11px] text-white/60">
          Photo: {photoCredit}
        </p>
      )}
    </header>
  );
}

export default PageBanner;
