/**
 * Delete Confirmation Dialog - Responsive & Touch Friendly
 */

import React from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Note } from '../types/note';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  note: Note | null;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: (noteId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  note,
  isDeleting = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !note) return null;

  const handleConfirmClick = () => {
    if (isDeleting) return; // Prevent repeated delete requests
    onConfirm(note.id);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="delete-dialog-title" className="text-base font-semibold text-slate-900">
              Delete this note?
            </h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed break-words">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{note.title || 'Untitled Note'}"</span>? This will permanently remove it from your Cloud Firestore database.
            </p>
          </div>
        </div>

        {/* Action Buttons: Responsive layout with touch-friendly heights */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px] sm:min-h-[38px] text-center"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={isDeleting}
            aria-busy={isDeleting}
            onClick={handleConfirmClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[42px] sm:min-h-[38px] text-center"
          >
            {isDeleting ? (
              <span className="flex items-center gap-1.5" role="status">
                <Loader2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 animate-spin" aria-hidden="true" />
                <span>Deleting...</span>
              </span>
            ) : (
              <>
                <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                <span>Delete Note</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
