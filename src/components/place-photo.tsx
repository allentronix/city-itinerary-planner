import { useState } from "react";
import type { Place, PlaceCategory } from "../data/types";
import { usePlacePhoto } from "../hooks/use-place-photo";

const CATEGORY_ICONS: Record<PlaceCategory, string> = {
  attraction: "🏛️",
  restaurant: "🍽️",
  cafe: "☕",
  activity: "🎟️",
};

interface PlacePhotoProps {
  place: Place;
  // "card": full width on a place card, with the credit. "thumb": a small
  // square in the itinerary, only when there is a photo.
  variant: "card" | "thumb";
  className?: string;
}

// A Wikimedia Commons photo of the place, credited to its author. Places
// without one get a quiet placeholder rather than a stock photo.
function PlacePhoto({ place, variant, className = "" }: PlacePhotoProps) {
  const state = usePlacePhoto(place);
  const [hasFailed, setHasFailed] = useState(false);

  const photo = state.status === "ready" && !hasFailed ? state.photo : null;

  if (variant === "thumb") {
    if (!photo) {
      return null;
    }

    return (
      <a
        href={photo.pageUrl}
        target="_blank"
        rel="noreferrer"
        title={`Photo: ${photo.credit}`}
        className={`block shrink-0 ${className}`}
      >
        <img
          src={photo.url}
          alt={place.name}
          loading="lazy"
          onError={() => setHasFailed(true)}
          className="size-16 object-cover"
        />
      </a>
    );
  }

  // No w-full on the blocks below: with negative margins it would stop them
  // stretching to the card's edges.
  if (state.status === "loading") {
    return (
      <div
        className={`aspect-[3/2] animate-pulse bg-slate-100 ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (!photo) {
    return (
      <div
        className={`flex h-16 items-center justify-center bg-slate-50 text-2xl ${className}`}
        aria-hidden="true"
      >
        <span className="opacity-60">{CATEGORY_ICONS[place.category]}</span>
      </div>
    );
  }

  return (
    <figure className={`relative ${className}`}>
      <img
        src={photo.url}
        alt={place.name}
        loading="lazy"
        onError={() => setHasFailed(true)}
        className="aspect-[3/2] w-full bg-slate-100 object-cover"
      />

      {photo.credit && (
        <figcaption className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/60 to-transparent px-2 pt-4 pb-1 text-right text-[10px] text-white/90">
          <a
            href={photo.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            Photo: {photo.credit}
          </a>
        </figcaption>
      )}
    </figure>
  );
}

export default PlacePhoto;
