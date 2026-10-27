import { StockReceiveRecord, PaymentRecord, OverallSummary } from '../types';
import { formatDisplayDate } from './date';

/**
 * Escapes CSV field
 */
function escapeCSV(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates formatted CSV text containing summary, stock receipts, and payment transactions
 */
export function generateBookkeepingCSV(
  summary: OverallSummary,
  stockRecords: StockReceiveRecord[],
  paymentRecords: PaymentRecord[]
): string {
  const lines: string[] = [];

  // 1. Header & Summary Overview
  lines.push('=== NASWAR HISAB KITAB - SUMMARY REPORT ===');
  lines.push(`Generated On,"${formatDisplayDate(new Date().toISOString().split('T')[0])}"`);
  lines.push('');
  lines.push('OVERALL FINANCIALS');
  lines.push(`Total Stock Value (Rs.),${summary.totalStockValue}`);
  lines.push(`Total Payments Sent (Rs.),${summary.totalPaymentsSent}`);
  lines.push(`Balance Due (Rs.),${summary.balanceDue}`);
  lines.push('');

  lines.push('STOCK QUANTITY SUMMARY (UNITS)');
  lines.push(`Ideal,${summary.totalQuantityByProduct.Ideal}`);
  lines.push(`Golden,${summary.totalQuantityByProduct.Golden}`);
  lines.push(`Chocolate,${summary.totalQuantityByProduct.Chocolate}`);
  lines.push(`Sample,${summary.totalQuantityByProduct.Sample}`);
  lines.push(`Total Units Received,${summary.totalUnitsReceived}`);
  lines.push('');

  // 2. Stock Received Records
  lines.push('=== STOCK RECEIVED (BUILTY CONSIGNMENTS) ===');
  lines.push([
    'Date',
    'Builty Number',
    'Ideal Qty',
    'Golden Qty',
    'Chocolate Qty',
    'Sample Qty',
    'Total Units',
    'Total Value (Rs.)',
    'Notes'
  ].map(escapeCSV).join(','));

  const sortedStock = [...stockRecords].sort((a, b) => b.date.localeCompare(a.date));
  for (const item of sortedStock) {
    const ideal = item.items?.Ideal?.quantity || 0;
    const golden = item.items?.Golden?.quantity || 0;
    const chocolate = item.items?.Chocolate?.quantity || 0;
    const sample = item.items?.Sample?.quantity || 0;
    const totalUnits = ideal + golden + chocolate + sample;

    lines.push([
      formatDisplayDate(item.date),
      item.builtyNumber,
      ideal,
      golden,
      chocolate,
      sample,
      totalUnits,
      item.totalAmount,
      item.note || ''
    ].map(escapeCSV).join(','));
  }

  lines.push('');

  // 3. Payments Sent Records
  lines.push('=== PAYMENTS SENT ===');
  lines.push([
    'Payment Date',
    'Amount (Rs.)',
    'Method',
    'Against Builty',
    'Has Screenshot',
    'Notes'
  ].map(escapeCSV).join(','));

  const sortedPayments = [...paymentRecords].sort((a, b) => b.date.localeCompare(a.date));
  for (const pay of sortedPayments) {
    lines.push([
      formatDisplayDate(pay.date),
      pay.amount,
      pay.method,
      pay.builtyNumber || 'General',
      pay.screenshotBase64 ? 'Yes' : 'No',
      pay.note || ''
    ].map(escapeCSV).join(','));
  }

  return lines.join('\r\n');
}

/**
 * Triggers browser download of CSV string
 */
export function downloadCSVFile(csvContent: string, filename = 'Naswar_Hisab_Kitab.csv'): void {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
