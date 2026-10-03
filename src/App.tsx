/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ============================================================================
 * MyNotes - Firebase & Cloud Firestore Edition
 * ============================================================================
 * 
 * ARCHITECTURE & ERROR HANDLING:
 * ------------------------------
 * 1. AUTHENTICATION LOADING:
 *    - Displays a clean, accessible centered "Loading MyNotes..." screen while
 *      Firebase initializes to prevent any flash of the login screen.
 * 
 * 2. NOTES LOADING & REAL-TIME DATA:
 *    - Displays "Loading your notes..." with accessible loading feedback.
 *    - Never flashes "No notes" before Firestore responds.
 * 
 * 3. RESILIENT NETWORK & DATABASE ERROR HANDLING:
 *    - If Firestore drops connection, existing in-memory notes are PRESERVED
 *      rather than cleared from view.
 *    - Friendly user notifications paired with detailed console.error logs for developers.
 *    - Operation-specific loading indicators prevent duplicate network requests.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  X, 
  Check, 
  AlertCircle,
  Loader2,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

import { Note, UserProfile } from './types/note';
import { auth } from './firebase';
import { 
  subscribeToUserNotes, 
  createNoteInFirestore, 
  updateNoteInFirestore, 
  deleteNoteFromFirestore, 
  togglePinInFirestore 
} from './services/notesService';
import { getFriendlyFirestoreErrorMessage } from './utils/errorHandling';

import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { NoteCard } from './components/NoteCard';
import { NoteEditorModal } from './components/NoteEditorModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { EmptyState } from './components/EmptyState';

export default function App() {
  // 1. Firebase Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 2. Real-time Firestore Notes State
  const [notes, setNotes] = useState<Note[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // 3. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pinned'>('all');

  // 4. Modal & Operation Loading States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  // Set of note IDs currently being pinned/unpinned to prevent duplicate operations
  const [pinningNoteIds, setPinningNoteIds] = useState<Set<string>>(new Set());

  // Logout operation loading state to prevent duplicate requests
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 5. Toast Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // ============================================================================
  // Lifecycle: Listen for Firebase Authentication changes
  // ============================================================================
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setIsAuthLoading(false);
      },
      (error) => {
        console.error('[Firebase Auth Error]:', error);
        setIsAuthLoading(false);
        showToast('Authentication check failed. Please refresh the page.', 'error');
      }
    );

    return () => unsubscribeAuth();
  }, []);

  // ============================================================================
  // Lifecycle: Real-time onSnapshot subscription to users/{userId}/notes
  // ============================================================================
  useEffect(() => {
    if (!currentUser) {
      setNotes([]);
      setIsNotesLoading(false);
      setSyncError(null);
      return;
    }

    setIsNotesLoading(true);
    setSyncError(null);

    // SECURITY: Authenticated user's UID obtained strictly from Firebase Auth
    const unsubscribeNotes = subscribeToUserNotes(
      currentUser.uid,
      (fetchedNotes) => {
        setNotes(fetchedNotes);
        setIsNotesLoading(false);
        setSyncError(null);
      },
      (firestoreError) => {
        setIsNotesLoading(false);
        const friendlyMessage = getFriendlyFirestoreErrorMessage(
          firestoreError,
          'Unable to load your notes. Please check your internet connection.'
        );
        // Do NOT delete existing notes from state if a transient sync failure occurs
        setSyncError(friendlyMessage);
        showToast(friendlyMessage, 'error');
      }
    );

    return () => unsubscribeNotes();
  }, [currentUser]);

  // Convert Firebase User to clean UserProfile representation for Navbar
  const userProfile: UserProfile | null = useMemo(() => {
    if (!currentUser) return null;
    const email = currentUser.email || 'User';
    const name = currentUser.displayName || email.split('@')[0];
    const initial = name.charAt(0).toUpperCase() || 'U';

    return {
      uid: currentUser.uid,
      email,
      name,
      avatarInitial: initial,
    };
  }, [currentUser]);

  // ============================================================================
  // Actions: Logout via Firebase Authentication signOut()
  // ============================================================================
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent duplicate concurrent logout calls
    setIsLoggingOut(true);

    try {
      // 1. Terminate Firebase Authentication session
      await signOut(auth);

      // 2. Clear user state and unmount private user notes
      setCurrentUser(null);
      setNotes([]);
      setSyncError(null);
      setSearchQuery('');
      setFilterMode('all');

      showToast('Logged out successfully');
    } catch (err: any) {
      // Log technical error details to console for developer debugging
      console.error('[Firebase Auth signOut Error]:', err);
      // Keep user in application and show friendly error feedback
      showToast('Unable to log out. Please check your connection and try again.', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Open note editor for creating a new note
  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  // Open note editor for updating existing note
  const handleOpenEditModal = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  // ============================================================================
  // Actions: Save Note (Create or Update in Firestore)
  // ============================================================================
  const handleSaveNote = async (data: { title: string; content: string; isPinned?: boolean }) => {
    if (!currentUser) {
      showToast('You must be signed in to save notes.', 'error');
      return;
    }

    if (isSavingNote) return; // Prevent duplicate requests
    setIsSavingNote(true);

    const isEditing = Boolean(editingNote);

    try {
      if (editingNote) {
        // Update existing Firestore note
        await updateNoteInFirestore(currentUser.uid, editingNote.id, {
          title: data.title,
          content: data.content,
          isPinned: data.isPinned,
        });
        showToast('Note updated successfully!');
      } else {
        // Create new Firestore note
        await createNoteInFirestore(currentUser.uid, {
          title: data.title,
          content: data.content,
          isPinned: data.isPinned,
        });
        showToast('Note saved successfully!');
      }

      setIsEditorOpen(false);
      setEditingNote(null);
    } catch (err: any) {
      const fallback = isEditing
        ? 'Unable to update your note. Please check your connection and try again.'
        : 'Unable to save your note. Please check your connection and try again.';
      showToast(getFriendlyFirestoreErrorMessage(err, fallback), 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  // ============================================================================
  // Actions: Delete Note from Firestore
  // ============================================================================
  const handleConfirmDelete = async (noteId: string) => {
    if (!currentUser) return;
    if (isDeletingNote) return; // Prevent repeated delete requests

    setIsDeletingNote(true);

    try {
      await deleteNoteFromFirestore(currentUser.uid, noteId);
      setDeletingNote(null);
      showToast('Note deleted successfully!');
    } catch (err: any) {
      showToast(
        getFriendlyFirestoreErrorMessage(
          err, 
          'Unable to delete your note. Please check your connection and try again.'
        ), 
        'error'
      );
    } finally {
      setIsDeletingNote(false);
    }
  };

  // ============================================================================
  // Actions: Pin / Unpin Note in Firestore with Duplicate Prevention
  // ============================================================================
  const handleTogglePin = async (noteId: string) => {
    if (!currentUser) return;
    if (pinningNoteIds.has(noteId)) return; // Prevent duplicate concurrent operations

    const targetNote = notes.find((n) => n.id === noteId);
    if (!targetNote) return;

    // Track active operation on this note
    setPinningNoteIds((prev) => new Set(prev).add(noteId));
    const nextPinnedStatus = !targetNote.isPinned;

    try {
      await togglePinInFirestore(currentUser.uid, noteId, targetNote.isPinned);
      showToast(nextPinnedStatus ? 'Note pinned to top' : 'Note unpinned');
    } catch (err: any) {
      console.error('[Pin/Unpin Error]:', err);
      showToast(
        getFriendlyFirestoreErrorMessage(err, 'Unable to update pin status. Please try again.'), 
        'error'
      );
    } finally {
      // Clear active operation lock
      setPinningNoteIds((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
    }
  };

  // ============================================================================
  // Filter & Sort Notes
  // CLIENT-SIDE FILTERING & DETERMINISTIC SORTING:
  // 1. Applies search query and tab filter
  // 2. Sort priority 1: Pinned notes first
  // 3. Sort priority 2: Within the same pin status, sort by updatedAt newest first (fallback to createdAt)
  // ============================================================================
  const filteredNotes = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();

    return notes
      .filter((note) => {
        // 1. If pinned filter is active, exclude unpinned notes
        if (filterMode === 'pinned' && !note.isPinned) {
          return false;
        }

        // 2. If no search term is entered, note passes filter
        if (!trimmedQuery) {
          return true;
        }

        // 3. Case-insensitive substring matching against title and content
        const safeTitle = (note.title || '').toLowerCase();
        const safeContent = (note.content || '').toLowerCase();

        return safeTitle.includes(trimmedQuery) || safeContent.includes(trimmedQuery);
      })
      .sort((a, b) => {
        // Priority 1: Pinned notes always come before unpinned notes
        const aPinned = Boolean(a.isPinned);
        const bPinned = Boolean(b.isPinned);

        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;

        // Priority 2: Within the same pin status, sort by updatedAt newest first (falling back to createdAt)
        const parseTime = (dateStr?: string) => {
          if (!dateStr) return 0;
          const t = new Date(dateStr).getTime();
          return isNaN(t) ? 0 : t;
        };

        const timeA = parseTime(a.updatedAt) || parseTime(a.createdAt);
        const timeB = parseTime(b.updatedAt) || parseTime(b.createdAt);

        return timeB - timeA;
      });
  }, [notes, searchQuery, filterMode]);

  // ============================================================================
  // 1. AUTHENTICATION LOADING SCREEN:
  // Simple centered loading screen while checking Firebase Auth state.
  // Prevents any brief flash of the login screen before Firebase determines auth state.
  // ============================================================================
  if (isAuthLoading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6"
        role="status"
        aria-live="polite"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm mb-4">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
          <Loader2 className="h-5 w-5 animate-spin text-slate-900" aria-hidden="true" />
          <span>Loading MyNotes...</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Verifying your secure session
        </p>
      </div>
    );
  }

  // ============================================================================
  // Screen: AuthScreen if not authenticated
  // ============================================================================
  if (!currentUser || !userProfile) {
    return <AuthScreen />;
  }

  const pinnedCount = notes.filter((n) => n.isPinned).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white overflow-x-hidden">
      
      {/* 1. Header with Navbar */}
      <Navbar
        user={userProfile}
        totalNotes={notes.length}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
        onNewNote={handleOpenCreateModal}
      />

      {/* 2. Main Dashboard Content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
        
        {/* Offline / Sync Issue Alert Banner */}
        {syncError && (
          <div 
            role="alert" 
            aria-live="assertive" 
            className="mb-5 sm:mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold text-amber-950">Connection Notice</span>
                <p className="text-amber-800/90 mt-0.5">{syncError}</p>
                <p className="text-[11px] text-amber-700/80 mt-1">
                  Your notes currently on screen are preserved. Changes will resume once connection is restored.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSyncError(null);
                setIsNotesLoading(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-amber-300 bg-white text-amber-900 font-medium hover:bg-amber-50 text-xs shrink-0 cursor-pointer min-h-[36px] sm:min-h-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Dashboard Title & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4 pb-5 sm:pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                My Notes
              </h1>
              {!isNotesLoading && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 tabular-nums">
                  {searchQuery.trim()
                    ? `${filteredNotes.length} of ${notes.length} notes`
                    : `${filteredNotes.length} ${filteredNotes.length === 1 ? 'note' : 'notes'}`}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {searchQuery.trim()
                ? `Showing notes filtered by "${searchQuery.trim()}"`
                : 'Synchronized securely with Cloud Firestore in real-time.'}
            </p>
          </div>

          {/* New Note Button (Full width on small mobile, auto on tablet/desktop) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer min-h-[42px] sm:min-h-[38px]"
            >
              <Plus className="h-4 w-4" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Search, Filter Bar and Controls */}
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search notes by title or content"
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 py-2.5 sm:py-2 text-base sm:text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors shadow-xs min-h-[42px] sm:min-h-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear search query"
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer min-w-[36px] justify-center"
              >
                <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </button>
            )}
          </div>

          {/* Filter tabs: All Notes vs Pinned */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Notes ({notes.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('pinned')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                filterMode === 'pinned'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pinned ({pinnedCount})
            </button>
          </div>

        </div>

        {/* Clear Visual Indicator that Search Filter is Active */}
        {searchQuery.trim() && (
          <div 
            role="status"
            aria-live="polite"
            className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-100/90 border border-slate-200 px-3.5 py-2.5 sm:py-2 rounded-xl text-slate-700 animate-in fade-in duration-150"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-2 w-2 rounded-full bg-slate-900 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Showing{' '}
                <strong className="font-semibold text-slate-900 tabular-nums">
                  {filteredNotes.length}
                </strong>{' '}
                {filteredNotes.length === 1 ? 'match' : 'matches'} for &ldquo;
                <strong className="font-semibold text-slate-900">{searchQuery.trim()}</strong>
                &rdquo;
                {filterMode === 'pinned' && (
                  <span className="text-slate-500"> (within Pinned notes)</span>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="self-end sm:self-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950 underline underline-offset-2 shrink-0 cursor-pointer min-h-[32px] sm:min-h-0"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear search</span>
            </button>
          </div>
        )}

        {/* 3. NOTES LOADING STATE OR NOTES GRID */}
        <section className="mt-6 sm:mt-8" aria-label="Notes Collection">
          {isNotesLoading ? (
            // Dedicated Accessible Notes Loading State
            <div 
              className="py-10 sm:py-12 flex flex-col items-center justify-center text-center space-y-4"
              role="status"
              aria-live="polite"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <Loader2 className="h-6 w-6 animate-spin text-slate-800" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Loading your notes...</h3>
                <p className="text-xs text-slate-500 mt-1">Connecting to Cloud Firestore</p>
              </div>

              {/* Skeleton cards grid for smooth visual continuity */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-4" aria-hidden="true">
                {[1, 2, 3].map((idx) => (
                  <div 
                    key={idx} 
                    className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse space-y-4 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-4 w-4 bg-slate-100 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-full"></div>
                      <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                      <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : syncError && notes.length === 0 ? (
            // Database Error State (Explicitly separated from empty states)
            <div 
              className="rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 p-6 sm:p-12 text-center my-4 sm:my-6"
              role="alert"
              aria-live="assertive"
            >
              <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
              </div>
              <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-bold tracking-tight text-slate-900">
                Unable to load notes
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                {syncError || 'We could not connect to Cloud Firestore to retrieve your notes. Please check your connection and retry.'}
              </p>
              <div className="mt-5 sm:mt-6 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setSyncError(null);
                    setIsNotesLoading(true);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer min-h-[42px] sm:min-h-[38px]"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry Connection</span>
                </button>
              </div>
            </div>
          ) : notes.length === 0 ? (
            // EMPTY STATE 1 — NO NOTES (First-time user or empty database)
            <EmptyState
              type="no-notes"
              title="Your notes are waiting"
              description="Create your first note and start organizing your thoughts."
              actionText="+ Create Your First Note"
              onAction={handleOpenCreateModal}
            />
          ) : filteredNotes.length === 0 ? (
            // User has notes, but search or filter yielded zero results
            searchQuery.trim() ? (
              // EMPTY STATE 2 — SEARCH HAS NO RESULTS
              <EmptyState
                type="search"
                title="No notes found"
                description="Try a different search term or clear your search."
                actionText="Clear Search"
                onAction={() => setSearchQuery('')}
                secondaryAction={
                  filterMode === 'pinned' && notes.some(n => ((n.title || '') + (n.content || '')).toLowerCase().includes(searchQuery.trim().toLowerCase()))
                    ? {
                        text: "Search in All Notes",
                        onClick: () => setFilterMode('all'),
                      }
                    : {
                        text: "+ Create Note Instead",
                        onClick: handleOpenCreateModal,
                      }
                }
              />
            ) : (
              // EMPTY STATE 3 — PINNED FILTER
              <EmptyState
                type="pinned"
                title="No pinned notes yet"
                description="Pin important notes to keep them easy to find."
                actionText="View All Notes"
                onAction={() => setFilterMode('all')}
                secondaryAction={{
                  text: "+ New Note",
                  onClick: handleOpenCreateModal,
                }}
              />
            )
          ) : (
            // POPULATED NOTES GRID: 1 col on mobile, 2 on tablet, 3 on desktop
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isPinning={pinningNoteIds.has(note.id)}
                  onEdit={handleOpenEditModal}
                  onDelete={(noteToDelete) => setDeletingNote(noteToDelete)}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-200/80 bg-white py-5 sm:py-6 mt-auto">
        <div className="mx-auto max-w-6xl px-3.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">MyNotes</span>
            <span aria-hidden="true">·</span>
            <span>Cloud Firestore Real-Time Sync</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-xs">
            <span className="text-slate-400">Account:</span>
            <span className="text-slate-700 font-medium truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none" title={currentUser.email || ''}>
              {currentUser.email}
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-slate-400">UID:</span>
            <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
              {currentUser.uid}
            </span>
          </div>
        </div>
      </footer>

      {/* 4. Create / Edit Note Modal with Loading State */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        initialNote={editingNote}
        isSaving={isSavingNote}
        onClose={() => {
          if (!isSavingNote) {
            setIsEditorOpen(false);
            setEditingNote(null);
          }
        }}
        onSave={handleSaveNote}
      />

      {/* 5. Delete Confirmation Dialog with Loading State */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingNote)}
        note={deletingNote}
        isDeleting={isDeletingNote}
        onClose={() => {
          if (!isDeletingNote) {
            setDeletingNote(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* 6. Accessible Toast Notification */}
      {toastMessage && (
        <div 
          role={toastMessage.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`fixed bottom-4 sm:bottom-6 right-3.5 sm:right-6 left-3.5 sm:left-auto z-50 flex items-center justify-center sm:justify-start gap-2.5 rounded-xl text-white px-4 py-3 shadow-lg text-xs font-medium animate-in slide-in-from-bottom-3 duration-200 max-w-md ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 border border-rose-700'
              : 'bg-slate-900 border border-slate-800'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-200 shrink-0" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
          )}
          <span className="break-words">{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
}
