import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  secondaryActionLabel?: string;
  destructive?: boolean;
  isBusy?: boolean;
  onConfirm: () => void;
  onSecondaryAction?: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  secondaryActionLabel,
  destructive = true,
  isBusy = false,
  onConfirm,
  onSecondaryAction,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-[#343238] bg-[#1D1D21] p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          {destructive && (
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-[#E06A6A]"
              aria-hidden="true"
            />
          )}
          <div>
            <h2
              id="confirm-dialog-title"
              className="font-display text-lg font-semibold text-[#F7F5EF]"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#AAA69C]">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-md border border-[#343238] bg-[#151518] px-4 py-2 text-sm font-medium text-[#F7F5EF] transition-colors hover:border-[#AAA69C]/60 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {cancelLabel}
          </button>
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              disabled={isBusy}
              className="rounded-md border border-[#D4AF37] bg-[#151518] px-4 py-2 text-sm font-semibold text-[#E7CB78] transition-colors hover:bg-[#D4AF37] hover:text-[#0B0B0D] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {secondaryActionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 ${
              destructive
                ? 'bg-[#E06A6A] text-[#0B0B0D] hover:bg-[#e88484]'
                : 'bg-[#D4AF37] text-[#0B0B0D] hover:bg-[#E7CB78]'
            }`}
          >
            {isBusy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
