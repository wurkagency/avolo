"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      onClose();
    }
  };

  return (
    <>
      {/* Custom backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink opacity-40 anim-fade"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <dialog
        ref={dialogRef}
        className={cn(
          "relative z-50 bg-surface rounded-lg shadow-xl p-6 w-full max-w-md anim-modal",
          "focus-visible:outline-none",
          className,
        )}
        onClick={handleBackdropClick}
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        <div className="flex items-start justify-between mb-4">
          <h2
            id="modal-title"
            style={{ fontFamily: "var(--font-editorial)", fontSize: "32px", lineHeight: "1.2", fontWeight: 500 }}
            className="text-ink"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-steel hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
