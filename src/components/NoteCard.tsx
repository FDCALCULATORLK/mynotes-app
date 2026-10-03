/**
 * Note Card Component - Responsive & Touch Friendly
 * 
 * - Adapts cleanly from single-column mobile to multi-column desktop
 * - Wraps long titles and continuous text strings without horizontal overflow
 * - Provides comfortable touch targets (minimum 36-38px) for buttons
 * - Visual amber pin state with clear accessible labels
 */

import React from 'react';
import { Pencil, Trash2, Pin, Loader2 } from 'lucide-react';
import { Note } from '../types/note';
import { formatNoteDate } from '../utils/date';

interface NoteCardProps {
  note: Note;
  isPinning?: boolean;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onTogglePin: (noteId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isPinning = false,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  // Approximate word count for metadata display
  const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
  const isPinned = Boolean(note.isPinned);

  return (
    <article 
      className={`group relative flex flex-col justify-between rounded-xl border p-4 sm:p-5 transition-all overflow-hidden break-words hover:shadow-sm ${
        isPinned
          ? 'border-amber-200/90 bg-amber-50/20 ring-1 ring-amber-200/60 hover:border-amber-300'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div>
        {/* Card Header: Title & Pin Action */}
        <div className="flex items-start justify-between gap-2.5 mb-2">
          <div className="flex-1 min-w-0 pr-1">
            {isPinned && (
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">
                <Pin className="h-3 w-3 fill-amber-600 text-amber-600 shrink-0" aria-hidden="true" />
                <span>Pinned Note</span>
              </div>
            )}
            <h3 
              onClick={() => onEdit(note)}
              className="text-base font-semibold text-slate-900 group-hover:text-slate-800 transition-colors line-clamp-2 sm:line-clamp-1 cursor-pointer break-words"
              title={note.title || 'Untitled Note'}
            >
              {note.title || 'Untitled Note'}
            </h3>
          </div>

          {/* Pin / Unpin Action Button with Comfortable Touch Target */}
          <button
            type="button"
            disabled={isPinning}
            onClick={() => onTogglePin(note.id)}
            title={isPinned ? 'Unpin note' : 'Pin note to top'}
            aria-label={isPinned ? `Unpin note: ${note.title || 'Untitled'}` : `Pin note to top: ${note.title || 'Untitled'}`}
            aria-pressed={isPinned}
            className={`min-h-[38px] min-w-[38px] flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
              isPinned
                ? 'text-amber-700 bg-amber-100/80 hover:bg-amber-200/80'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-75 sm:opacity-60 group-hover:opacity-100'
            }`}
          >
            {isPinning ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" aria-hidden="true" />
            ) : (
              <Pin className={`h-4 w-4 ${isPinned ? 'fill-amber-600 text-amber-600' : ''}`} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Short Content Preview (Line-clamped to 3 lines on mobile and desktop) */}
        <p 
          onClick={() => onEdit(note)}
          className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4 cursor-pointer whitespace-pre-line break-words"
        >
          {note.content.trim() || <span className="italic text-slate-400">Empty note</span>}
        </p>
      </div>

      {/* Card Footer: Metadata & Action buttons */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        
        {/* Date and word count */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 font-medium text-[11px] sm:text-xs">
          <span title={`Last updated: ${note.updatedAt || note.createdAt}`} className="truncate max-w-[130px] sm:max-w-none">
            {formatNoteDate(note.updatedAt || note.createdAt)}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="tabular-nums shrink-0">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        </div>

        {/* Action Buttons with comfortable touch paddings */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => onEdit(note)}
            title="Edit this note"
            aria-label={`Edit note: ${note.title || 'Untitled'}`}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors cursor-pointer min-h-[36px]"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(note)}
            title="Delete this note"
            aria-label={`Delete note: ${note.title || 'Untitled'}`}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-medium transition-colors cursor-pointer min-h-[36px]"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>

      </div>
    </article>
  );
};
