/**
 * Date formatting utilities for notes
 */

export function formatNoteDate(isoString: string | undefined): string {
  if (!isoString) return 'Just now';

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}
