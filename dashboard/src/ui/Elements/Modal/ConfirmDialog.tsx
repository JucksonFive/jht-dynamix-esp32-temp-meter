import React, { useEffect, useRef } from "react";
import { Nullable } from "../../../utils/types";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  loading,
  destructive,
  icon,
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef<Nullable<HTMLButtonElement>>(null);
  const firstFocusRef = useRef<Nullable<HTMLDivElement>>(null);

  useEffect(() => {
    if (open) {
      // focus first interactive element
      setTimeout(() => cancelRef.current?.focus(), 0);
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !loading) onCancel();
        if (e.key === "Tab") {
          // Basic focus trap inside dialog
          const nodeList = firstFocusRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const focusables: HTMLElement[] = nodeList
            ? Array.from(nodeList).filter(
                (el: HTMLElement) => !el.hasAttribute("disabled")
              )
            : [];
          if (!focusables.length) return;
          const first: HTMLElement = focusables[0];
          const last: HTMLElement = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={() => !loading && onCancel()}
    >
      <div
        ref={firstFocusRef}
        className="w-full max-w-sm bg-midnight-800 border border-white/10 rounded-xl shadow-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          className={`text-lg font-semibold mb-2 flex items-center gap-2 ${
            destructive ? "text-red-300" : "text-neon-purple"
          }`}
        >
          {icon}
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-300 mb-4 whitespace-pre-line">
            {description}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            className="px-4 py-2 text-sm rounded-md bg-gray-600/40 hover:bg-gray-500/40 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400/40 disabled:opacity-60"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm rounded-md focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              destructive
                ? "bg-red-600 hover:bg-red-500 text-white focus:ring-red-400/50"
                : "bg-neon-purple hover:bg-neon-pink text-white focus:ring-neon-purple/40"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
