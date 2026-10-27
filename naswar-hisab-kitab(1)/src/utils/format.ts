/**
 * Formats a number into Pakistani Rupee string, e.g. "Rs. 15,000"
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rs. 0';
  }
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('en-PK').format(rounded);
  return `Rs. ${formatted}`;
}

/**
 * Formats a raw number with comma separators (e.g. 5,000)
 */
export function formatQuantity(qty: number): string {
  if (isNaN(qty) || qty === null || qty === undefined) {
    return '0';
  }
  return new Intl.NumberFormat('en-PK').format(qty);
}

/**
 * Parses numeric inputs safely without allowing NaN or negative numbers
 */
export function parsePositiveNumber(value: string | number): number {
  if (typeof value === 'number') {
    return isNaN(value) || value < 0 ? 0 : value;
  }
  if (!value || typeof value !== 'string') return 0;
  const cleaned = value.trim().replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}
