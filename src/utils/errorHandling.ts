/**
 * Friendly Error Message Mapper for Firebase Authentication and Firestore
 * 
 * Maps technical Firebase error codes to clear, reassuring language for users,
 * avoiding raw exception strings while logging full technical details for developers.
 */

export function getFriendlyAuthErrorMessage(error: any): string {
  // Always log full error details for developer debugging
  console.error('[Firebase Auth Error Debug]:', error);

  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = typeof error === 'string' ? error : error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'The email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Your password is too weak. Please choose a stronger password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a few moments and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled in Firebase Console.';
    default:
      if (message.includes('API key not valid') || message.includes('invalid-api-key')) {
        return 'Firebase configuration error. Please verify your API key.';
      }
      return 'Unable to sign in. Please verify your details and try again.';
  }
}

export function getFriendlyFirestoreErrorMessage(error: any, fallbackContext?: string): string {
  // Always log full error details for developer debugging
  console.error('[Cloud Firestore Error Debug]:', error);

  if (!error) return fallbackContext || 'A database error occurred. Please try again.';

  const code = typeof error === 'string' ? error : error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'permission-denied':
      return 'Access denied. You only have permission to view and edit your own notes.';
    case 'unavailable':
      return 'The database is temporarily unavailable. Please check your internet connection.';
    case 'deadline-exceeded':
      return 'The request timed out. Please check your connection and try again.';
    case 'not-found':
      return 'The requested note could not be found.';
    case 'cancelled':
      return 'The request was cancelled.';
    default:
      if (code.includes('network') || message.toLowerCase().includes('network')) {
        return 'Network error. Please check your internet connection.';
      }
      return fallbackContext || 'Unable to communicate with the database. Please try again.';
  }
}
