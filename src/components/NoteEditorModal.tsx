/**
 * Create/Edit Note Modal Interface - Fully Responsive
 * 
 * - Fits within mobile, tablet, and desktop viewports without clipping
 * - Uses 16px (text-base) inputs on mobile to avoid iOS Safari zoom glitches
 * - Touch-friendly buttons and scrollable inner container
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { Note } from '../types/note';

interface NoteEditorModalProps {
  isOpen: boolean;
  initialNote: Note | null; // null if creating a new note
  isSaving?: boolean;       // Loading state during Firestore write
  onClose: () => void;
  onSave: (noteData: { title: string; content: string; isPinned?: boolean }) => void;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  initialNote,
  isSaving = false,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or active note changes
  useEffect(() => {
    if (isOpen) {
      if (initialNote) {
        setTitle(initialNote.title || '');
        setContent(initialNote.content || '');
        setIsPinned(Boolean(initialNote.isPinned));
      } else {
        setTitle('');
        setContent('');
        setIsPinned(false);
      }
      setError(null);
      
      // Auto-focus title on desktop
      const timer = setTimeout(() => {
        // Only autofocus if screen is wider than mobile to prevent keyboard popping up awkwardly
        if (window.innerWidth >= 640) {
          titleInputRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialNote);

  // Handle Save Note
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return; // Prevent duplicate submissions

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle && !trimmedContent) {
      setError('Please add a title or some content for your note.');
      return;
    }

    onSave({
      title: trimmedTitle || 'Untitled Note',
      content: trimmedContent,
      isPinned,
    });
  };

  // Keyboard shortcut listener (Cmd/Ctrl + Enter to save, Escape to close)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape' && !isSaving) {
      e.preventDefault();
      onClose();
    }
  };

  const characterCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
    >
      <div 
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="pr-2">
            <h2 id="note-modal-title" className="text-base font-semibold text-slate-900 truncate">
              {isEditing ? 'Edit Note' : 'Create New Note'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 hidden xs:block">
              {isEditing ? 'Update your note in Firestore' : 'Capture your thoughts and save to Cloud Firestore'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            title="Close editor (Esc)"
            aria-label="Close note editor"
            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body / Inputs Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4">
          
          {error && (
            <div 
              role="alert" 
              aria-live="assertive" 
              className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Title Input (16px base font on mobile avoids auto-zoom in iOS Safari) */}
          <div>
            <label htmlFor="noteTitle" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Note Title
            </label>
            <input
              id="noteTitle"
              ref={titleInputRef}
              type="text"
              disabled={isSaving}
              placeholder="e.g. Weekly Planning, Grocery List..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 sm:px-4 py-2.5 text-base sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors disabled:opacity-60 disabled:bg-slate-50 min-h-[44px]"
            />
          </div>

          {/* Content Textarea */}
          <div className="flex-1 flex flex-col min-h-[160px] sm:min-h-[220px]">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="noteContent" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Content
              </label>
              <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                {wordCount} words · {characterCount} chars
              </div>
            </div>
            
            <textarea
              id="noteContent"
              rows={8}
              disabled={isSaving}
              placeholder="Write your note content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 rounded-xl border border-slate-300 p-3.5 sm:p-4 text-base sm:text-sm text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors resize-y leading-relaxed font-sans disabled:opacity-60 disabled:bg-slate-50 min-h-[160px]"
            />
          </div>

          {/* Pin Toggle with Comfortable Touch Label */}
          <div className="flex items-center gap-2.5 py-1">
            <input
              id="pinNote"
              type="checkbox"
              disabled={isSaving}
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer disabled:opacity-60"
            />
            <label htmlFor="pinNote" className="text-xs text-slate-700 font-medium cursor-pointer select-none">
              Pin this note to the top of your dashboard
            </label>
          </div>

        </form>

        {/* Modal Footer with Responsive Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/50 gap-2.5 sm:gap-3">
          <span className="hidden sm:inline-block text-[11px] text-slate-400">
            Pro tip: Press <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[10px] text-slate-600">Ctrl/Cmd + Enter</kbd> to save
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 sm:py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50 min-h-[42px] sm:min-h-[38px]"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              aria-busy={isSaving}
              onClick={() => handleSubmit()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 rounded-xl bg-slate-900 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[42px] sm:min-h-[38px]"
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5" role="status">
                  <Loader2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 animate-spin" aria-hidden="true" />
                  <span>{isEditing ? 'Saving changes...' : 'Saving...'}</span>
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                  <span>{isEditing ? 'Save Changes' : 'Create Note'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
