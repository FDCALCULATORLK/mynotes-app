/**
 * Top Navigation Bar - Authenticated User Account & Responsive Edition
 * 
 * - Displays authenticated Firebase user email directly in navigation account area
 * - Smooth text truncation to prevent horizontal overflow on narrow screens
 * - Firebase signOut() support with loading and duplicate-submission prevention
 */

import React from 'react';
import { BookOpen, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { UserProfile } from '../types/note';

interface NavbarProps {
  user: UserProfile;
  totalNotes: number;
  isLoggingOut?: boolean;
  onLogout: () => void;
  onNewNote: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  totalNotes,
  isLoggingOut = false,
  onLogout,
  onNewNote,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-sm transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
        
        {/* Zone 1: Wordmark & Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none">
              MyNotes ✨
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-normal mt-0.5 hidden xs:inline-block">
              Personal notes
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation & Quick Summary (Hidden on small tablets & mobile) */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 text-xs text-slate-500 font-medium">
          <span className="tabular-nums">
            {totalNotes} {totalNotes === 1 ? 'note' : 'notes'}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Cloud Firestore</span>
        </div>

        {/* Zone 3: Primary Actions, User Info & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Top New Note button on tablets/desktop */}
          <button
            onClick={onNewNote}
            type="button"
            className="hidden sm:inline-flex items-center justify-center rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 whitespace-nowrap cursor-pointer"
          >
            + New Note
          </button>

          {/* User Account Area with Authenticated Email */}
          <div className="flex items-center gap-1.5 sm:gap-2 sm:pl-2.5 sm:border-l sm:border-slate-200">
            <div 
              title={`Signed in as ${user.email}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-semibold ring-1 ring-slate-200/80 shrink-0 select-none"
            >
              {user.avatarInitial || <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />}
            </div>
            
            {/* Authenticated user email display - responsive & truncated to prevent horizontal overflow */}
            <div className="flex flex-col text-left max-w-[105px] xs:max-w-[145px] sm:max-w-[190px] md:max-w-[260px]">
              <span 
                className="text-[11px] sm:text-xs font-semibold text-slate-800 truncate leading-tight" 
                title={`Signed in as ${user.email}`}
              >
                {user.email}
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block leading-tight">
                Account
              </span>
            </div>

            {/* Logout button with loading indicator and duplicate prevention */}
            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              type="button"
              title="Log out of your Firebase session"
              aria-label={isLoggingOut ? 'Logging out...' : 'Log out'}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 animate-spin text-slate-600" aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
