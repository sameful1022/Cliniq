/**
 * Get current date in Korean timezone (KST, UTC+9) in YYYY-MM-DD format
 */
export function getKSTDateString(): string {
  const today = new Date();
  const kstDate = new Date(today.getTime() + (9 * 60 * 60 * 1000));
  const dateString = kstDate.toISOString().split('T')[0];
  return dateString;
}

/**
 * Get current date formatted in Korean (e.g., "4월 4일")
 */
export function getKSTFormattedDate(): string {
  const today = new Date();
  const kstDate = new Date(today.getTime() + (9 * 60 * 60 * 1000));
  const month = kstDate.getUTCMonth() + 1;
  const day = kstDate.getUTCDate();
  return `${month}월 ${day}일`;
}

/**
 * Format a date string (YYYY-MM-DD) to Korean format (e.g., "4월 4일")
 */
export function formatDateToKorean(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return `${month}월 ${day}일`;
}
