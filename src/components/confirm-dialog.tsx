import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  // Styles the confirm button red, for deleting or removing things.
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// An in-app confirmation, built on the native <dialog>: it dims the page,
// keeps keyboard focus inside, and closes on Escape or a click outside.
// Cancel is focused first, so pressing Enter by accident never confirms.
function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      // Escape key
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      // A click on the dimmed backdrop lands on the dialog element itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md border bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/60"
    >
      <div className="p-6">
        <h2 id={titleId} className="font-serif text-2xl tracking-tight">
          {title}
        </h2>

        <div id={messageId} className="mt-3 text-sm text-slate-600">
          {children}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>

          <Button
            onClick={onConfirm}
            className={
              destructive ? "bg-red-600 text-white hover:bg-red-700" : undefined
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
