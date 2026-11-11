"use client";

import { useEffect, useId, useRef } from "react";
import { useCraver } from "@/components/providers/CraverProviders";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useCraver();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  const effectiveConfirm = confirmLabel || t.common.confirm;
  const effectiveCancel = cancelLabel || t.common.cancel;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.returnValue = "";
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Progressive enhancement fallback where HTMLDialogElement.prototype.closedBy is unsupported
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = dialog.open && isOutside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && dialog.open && isOutside(e)) {
        dialog.close("dismiss");
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onClose = () => {
      const result = dialog.returnValue;
      dialog.returnValue = "";
      if (result !== "confirm") {
        onCancel();
      }
    };

    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onCancel]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      {...({ closedby: "any" } as Record<string, string>)}
      className="w-full"
    >
      <div className="p-6">
        <h2 id={titleId} className="font-display text-lg font-bold text-[#1C1C1C]">
          {title}
        </h2>
        <p id={descId} className="mt-2 text-sm leading-relaxed text-[#696969]">
          {description}
        </p>

        <form method="dialog" className="mt-6 flex items-center justify-end gap-3">
          <button
            type="submit"
            value="cancel"
            autoFocus
            disabled={busy}
            className="min-h-11 rounded-lg border border-[#EEEEEE] bg-white px-4 py-2 text-sm font-medium text-[#1C1C1C] transition hover:bg-[#FAFAFA] disabled:opacity-60"
          >
            {effectiveCancel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              await onConfirm();
              if (dialogRef.current?.open) {
                dialogRef.current.close("confirm");
              }
            }}
            className={
              destructive
                ? "min-h-11 rounded-lg bg-[#C91D2B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a81622] disabled:opacity-60"
                : "min-h-11 rounded-lg bg-[#E23744] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#C91D2B] disabled:opacity-60"
            }
          >
            {busy ? t.common.processing : effectiveConfirm}
          </button>
        </form>
      </div>
    </dialog>
  );
}
