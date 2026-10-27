const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats a YYYY-MM-DD date string into "28 Aug 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
      return `${day} ${MONTHS_SHORT[monthIdx]} ${year}`;
    }
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD for standard <input type="date" />
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a date falls within a given start and end range (inclusive, YYYY-MM-DD)
 */
export function isDateInRange(dateStr: string, startDate?: string, endDate?: string): boolean {
  if (!dateStr) return false;
  if (startDate && dateStr < startDate) return false;
  if (endDate && dateStr > endDate) return false;
  return true;
}

/**
 * Returns the start and end dates for quick filter options: 'all', 'thisMonth', 'lastMonth', 'custom'
 */
export function getDateFilterRange(type: 'all' | 'thisMonth' | 'lastMonth'): { start?: string; end?: string } {
  if (type === 'all') {
    return { start: undefined, end: undefined };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  if (type === 'thisMonth') {
    const startMonth = String(currentMonth + 1).padStart(2, '0');
    const start = `${currentYear}-${startMonth}-01`;
    // Last day of current month:
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const end = `${currentYear}-${startMonth}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }

  if (type === 'lastMonth') {
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const yr = lastMonthDate.getFullYear();
    const m = lastMonthDate.getMonth();
    const startMonth = String(m + 1).padStart(2, '0');
    const start = `${yr}-${startMonth}-01`;
    const lastDay = new Date(yr, m + 1, 0).getDate();
    const end = `${yr}-${startMonth}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }

  return { start: undefined, end: undefined };
}

/**
 * Checks if the last backup date is older than 7 days (or missing)
 */
export function isBackupOlderThan7Days(lastBackupIso?: string | null): boolean {
  if (!lastBackupIso) return true;
  const backupTime = new Date(lastBackupIso).getTime();
  if (isNaN(backupTime)) return true;
  const diffMs = Date.now() - backupTime;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return diffMs > sevenDaysMs;
}
