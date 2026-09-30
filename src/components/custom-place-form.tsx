import { useId, useState, type SubmitEvent } from "react";
import type { Place, PlaceCategory } from "../data/types";
import { BEST_TIME_OPTIONS } from "../utils/best-time";
import {
  MAX_PLACE_ADDRESS_LENGTH,
  MAX_PLACE_DESCRIPTION_LENGTH,
  MAX_PLACE_NAME_LENGTH,
  type CustomPlaceFields,
} from "../utils/custom-places";
import { CATEGORY_LABELS } from "../utils/places";
import { Button } from "./ui/button";

const LABEL_CLASS =
  "block text-xs font-medium tracking-wider text-slate-500 uppercase";

const INPUT_CLASS = "mt-1 w-full border bg-white p-2 text-sm";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as PlaceCategory[];

interface CustomPlaceFormProps {
  cityName: string;
  // Set when editing one of your places; empty when adding a new one.
  place?: Place;
  // Returns an error message, or null once saved.
  onSave: (fields: CustomPlaceFields) => string | null;
  onCancel: () => void;
}

function CustomPlaceForm({
  cityName,
  place,
  onSave,
  onCancel,
}: CustomPlaceFormProps) {
  const id = useId();

  const [fields, setFields] = useState<CustomPlaceFields>({
    name: place?.name ?? "",
    category: place?.category ?? "attraction",
    bestTime: place?.bestTime ?? "Morning",
    description: place?.description ?? "",
    address: place?.address ?? "",
  });

  const [error, setError] = useState("");

  function update(changes: Partial<CustomPlaceFields>) {
    setFields((current) => ({ ...current, ...changes }));
    setError("");
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fields.name.trim()) {
      setError("Give your place a name.");
      return;
    }

    setError(onSave(fields) ?? "");
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => event.key === "Escape" && onCancel()}
      className="grid gap-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <label className={LABEL_CLASS} htmlFor={`${id}-name`}>
          Name
        </label>
        <input
          id={`${id}-name`}
          type="text"
          value={fields.name}
          maxLength={MAX_PLACE_NAME_LENGTH}
          placeholder={`e.g. A bakery you love in ${cityName}`}
          autoFocus
          required
          onChange={(event) => update({ name: event.target.value })}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor={`${id}-category`}>
          Type
        </label>
        <select
          id={`${id}-category`}
          value={fields.category}
          onChange={(event) =>
            update({ category: event.target.value as PlaceCategory })
          }
          className={INPUT_CLASS}
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor={`${id}-best-time`}>
          Best time
        </label>
        <select
          id={`${id}-best-time`}
          value={fields.bestTime}
          onChange={(event) => update({ bestTime: event.target.value })}
          className={INPUT_CLASS}
        >
          {BEST_TIME_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <p className="-mt-2 text-xs text-slate-500 sm:col-span-2">
        {fields.category === "restaurant" || fields.category === "cafe"
          ? "Restaurants and coffee shops can be added once a day."
          : "Sights and things to do can be added once per trip."}
      </p>

      <div className="sm:col-span-2">
        <label className={LABEL_CLASS} htmlFor={`${id}-description`}>
          Description <span className="normal-case">(optional)</span>
        </label>
        <textarea
          id={`${id}-description`}
          value={fields.description}
          maxLength={MAX_PLACE_DESCRIPTION_LENGTH}
          rows={2}
          placeholder="What's it like, and why go?"
          onChange={(event) => update({ description: event.target.value })}
          className={`${INPUT_CLASS} resize-y`}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={LABEL_CLASS} htmlFor={`${id}-address`}>
          Address <span className="normal-case">(optional)</span>
        </label>
        <input
          id={`${id}-address`}
          type="text"
          value={fields.address}
          maxLength={MAX_PLACE_ADDRESS_LENGTH}
          onChange={(event) => update({ address: event.target.value })}
          className={INPUT_CLASS}
        />
      </div>

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit">{place ? "Save changes" : "Add place"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default CustomPlaceForm;
