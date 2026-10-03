/**
 * Cloud Firestore Service for MyNotes
 * 
 * Handles all real-time CRUD operations under:
 * users/{userId}/notes/{noteId}
 * 
 * SECURITY:
 * All operations require the authenticated user's Firebase UID.
 * The path is scoped directly to users/{userId}/notes, ensuring users
 * only interact with their own documents.
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { Note } from '../types/note';

/**
 * Subscribes to real-time updates for notes belonging to the specified user.
 * Path: users/{userId}/notes
 * 
 * @param userId - The authenticated Firebase user's UID
 * @param onNotesChange - Callback receiving the updated array of notes
 * @param onError - Error handler callback
 * @returns Unsubscribe function to stop listening on unmount/logout
 */
export function subscribeToUserNotes(
  userId: string,
  onNotesChange: (notes: Note[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    throw new Error('A valid authenticated user UID is required to subscribe to notes.');
  }

  const notesCollectionRef = collection(db, 'users', userId, 'notes');

  return onSnapshot(
    notesCollectionRef,
    (snapshot) => {
      const notesList: Note[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        // Convert Firestore Timestamp to ISO string
        let createdAtIso = new Date().toISOString();
        if (data.createdAt?.toDate) {
          createdAtIso = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAtIso = data.createdAt;
        }

        let updatedAtIso = createdAtIso;
        if (data.updatedAt?.toDate) {
          updatedAtIso = data.updatedAt.toDate().toISOString();
        } else if (typeof data.updatedAt === 'string') {
          updatedAtIso = data.updatedAt;
        }

        return {
          id: docSnap.id,
          title: data.title || '',
          content: data.content || '',
          createdAt: createdAtIso,
          updatedAt: updatedAtIso,
          isPinned: Boolean(data.isPinned),
          userId: data.userId || userId,
        };
      });

      onNotesChange(notesList);
    },
    (firestoreError) => {
      console.error('Firestore onSnapshot error:', firestoreError);
      onError(firestoreError);
    }
  );
}

/**
 * Creates a new note in Firestore under users/{userId}/notes
 */
export async function createNoteInFirestore(
  userId: string,
  data: { title: string; content: string; isPinned?: boolean }
): Promise<string> {
  if (!userId) {
    throw new Error('Authentication required: Cannot create a note without a valid user UID.');
  }

  const notesCollectionRef = collection(db, 'users', userId, 'notes');

  const newDocRef = await addDoc(notesCollectionRef, {
    title: data.title.trim(),
    content: data.content.trim(),
    isPinned: Boolean(data.isPinned),
    userId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newDocRef.id;
}

/**
 * Updates an existing note in Firestore under users/{userId}/notes/{noteId}
 */
export async function updateNoteInFirestore(
  userId: string,
  noteId: string,
  data: { title?: string; content?: string; isPinned?: boolean }
): Promise<void> {
  if (!userId || !noteId) {
    throw new Error('User UID and Note ID are required to update a note.');
  }

  const noteDocRef = doc(db, 'users', userId, 'notes', noteId);

  const updatePayload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (data.title !== undefined) updatePayload.title = data.title.trim();
  if (data.content !== undefined) updatePayload.content = data.content.trim();
  if (data.isPinned !== undefined) updatePayload.isPinned = data.isPinned;

  await updateDoc(noteDocRef, updatePayload);
}

/**
 * Deletes a note from Firestore under users/{userId}/notes/{noteId}
 */
export async function deleteNoteFromFirestore(
  userId: string,
  noteId: string
): Promise<void> {
  if (!userId || !noteId) {
    throw new Error('User UID and Note ID are required to delete a note.');
  }

  const noteDocRef = doc(db, 'users', userId, 'notes', noteId);
  await deleteDoc(noteDocRef);
}

/**
 * Toggles the pinned status of a note in Firestore
 */
export async function togglePinInFirestore(
  userId: string,
  noteId: string,
  currentPinnedStatus: boolean
): Promise<void> {
  return updateNoteInFirestore(userId, noteId, {
    isPinned: !currentPinnedStatus,
  });
}
