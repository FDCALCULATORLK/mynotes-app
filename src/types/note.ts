/**
 * Types definition for MyNotes application with Cloud Firestore support.
 */

export interface Note {
  id: string;             // Firestore document ID
  title: string;          // Note title
  content: string;        // Full body text
  createdAt: string;      // ISO string representation of creation date
  updatedAt: string;      // ISO string representation of last updated date
  isPinned: boolean;      // Whether note is pinned to top
  userId: string;         // The Firebase UID of the owner
}

export interface UserProfile {
  uid: string;            // Firebase Authentication UID
  email: string;          // User's verified email address
  name?: string;          // Optional display name
  avatarInitial: string;  // Initial letter for the avatar
}
