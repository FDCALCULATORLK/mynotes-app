/**
 * EmptyState Component - Responsive & Touch Friendly
 */

import React from 'react';
import { BookOpen, Search, Pin, Plus, X, ArrowLeft } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-notes' | 'search' | 'pinned';
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
  secondaryAction,
}) => {
  // Render domain-appropriate icon with subtle background
  const renderIcon = () => {
    switch (type) {
      case 'no-notes':
        return (
          <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs">
            <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
          </div>
        );
      case 'search':
        return (
          <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Search className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
          </div>
        );
      case 'pinned':
        return (
          <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Pin className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
          </div>
        );
    }
  };

  return (
    <div 
      className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 sm:p-12 text-center my-4 sm:my-6 shadow-xs animate-in fade-in duration-150 overflow-hidden"
      role="region"
      aria-label={title}
    >
      {renderIcon()}

      <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-bold tracking-tight text-slate-900 break-words">
        {title}
      </h3>

      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed break-words">
        {description}
      </p>

      {/* Action buttons: Stack on small mobile, row on tablet/desktop */}
      <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs sm:max-w-none mx-auto">
        <button
          type="button"
          onClick={onAction}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer min-h-[42px] sm:min-h-[38px]"
        >
          {type === 'no-notes' && <Plus className="h-4 w-4" aria-hidden="true" />}
          {type === 'search' && <X className="h-4 w-4" aria-hidden="true" />}
          {type === 'pinned' && <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          <span>{actionText}</span>
        </button>

        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer min-h-[42px] sm:min-h-[38px]"
          >
            <span>{secondaryAction.text}</span>
          </button>
        )}
      </div>
    </div>
  );
};
