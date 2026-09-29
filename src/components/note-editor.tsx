import { useId, useState, type SubmitEvent } from "react";
import { Button } from "./ui/button";

export const MAX_NOTE_LENGTH = 500;

interface NoteEditorProps {
  placeName: string;
  initialNote?: string;
  // An empty note removes it.
  onSave: (note: string) => void;
  onCancel: () => void;
}

function NoteEditor({
  placeName,
  initialNote = "",
  onSave,
  onCancel,
}: NoteEditorProps) {
  const id = useId();
  const [note, setNote] = useState(initialNote);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(note.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t pt-3">
      <label
        htmlFor={id}
        className="block text-xs font-medium tracking-wider text-slate-500 uppercase"
      >
        Note for {placeName}
      </label>

      <textarea
        id={id}
        value={note}
        maxLength={MAX_NOTE_LENGTH}
        rows={3}
        autoFocus
        placeholder="e.g. Tickets booked, ref ABC123"
        onChange={(event) => setNote(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onCancel();
          }

          // Cmd/Ctrl + Enter saves; plain Enter adds a new line.
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onSave(note.trim());
          }
        }}
        className="mt-1 w-full resize-y border bg-white p-2 text-sm"
      />

      <p className="mt-1 text-right text-xs text-slate-400">
        {note.length}/{MAX_NOTE_LENGTH}
      </p>

      <div className="mt-1 flex gap-2">
        <Button type="submit" size="sm">
          Save note
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default NoteEditor;
