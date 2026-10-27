import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDisplayDate, getTodayDateString, isDateInRange, isBackupOlderThan7Days } from './date';
import { formatCurrency, parsePositiveNumber } from './format';
import { calculateOverallSummary } from './summary';
import { hashPin, verifyPin } from './crypto';
import { StockReceiveRecord, PaymentRecord } from '../types';

test('Date utilities: formatDisplayDate works accurately', () => {
  assert.equal(formatDisplayDate('2026-08-28'), '28 Aug 2026');
  assert.equal(formatDisplayDate('2026-09-16'), '16 Sep 2026');
  assert.equal(formatDisplayDate('2026-01-05'), '5 Jan 2026');
  assert.equal(formatDisplayDate(''), '');
});

test('Date utilities: isDateInRange boundary checks', () => {
  assert.equal(isDateInRange('2026-08-28', '2026-08-01', '2026-08-31'), true);
  assert.equal(isDateInRange('2026-09-01', '2026-08-01', '2026-08-31'), false);
  assert.equal(isDateInRange('2026-07-31', '2026-08-01', '2026-08-31'), false);
  assert.equal(isDateInRange('2026-08-15', undefined, undefined), true);
});

test('Format utilities: formatCurrency and parsePositiveNumber', () => {
  assert.equal(formatCurrency(15000), 'Rs. 15,000');
  assert.equal(formatCurrency(0), 'Rs. 0');
  assert.equal(parsePositiveNumber(' 1,500 '), 1500);
  assert.equal(parsePositiveNumber('-50'), 0);
  assert.equal(parsePositiveNumber('abc'), 0);
});

test('Crypto utilities: hashPin and verifyPin', async () => {
  const hash = await hashPin('1234');
  assert.ok(hash.length === 64, 'SHA-256 output is 64 hex characters');
  assert.equal(await verifyPin('1234', hash), true);
  assert.equal(await verifyPin('9999', hash), false);
});

test('Summary calculation: calculates totals, balances, and builty statuses correctly', () => {
  const stockRecords: StockReceiveRecord[] = [
    {
      id: 1,
      date: '2026-08-28',
      builtyNumber: 'B-101',
      items: {
        Ideal: { quantity: 50, rate: 100 },      // 5,000
        Golden: { quantity: 30, rate: 200 },     // 6,000
        Chocolate: { quantity: 20, rate: 150 },  // 3,000
        Sample: { quantity: 10, rate: 0 },       // 0
      },
      totalAmount: 14000,
      note: 'First lot',
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 2,
      date: '2026-09-10',
      builtyNumber: 'B-102',
      items: {
        Ideal: { quantity: 20, rate: 100 },      // 2,000
        Golden: { quantity: 10, rate: 200 },     // 2,000
        Chocolate: { quantity: 0, rate: 0 },
        Sample: { quantity: 5, rate: 0 },
      },
      totalAmount: 4000,
      createdAt: 2000,
      updatedAt: 2000,
    },
  ];

  const paymentRecords: PaymentRecord[] = [
    {
      id: 1,
      date: '2026-09-02',
      amount: 14000, // fully pays B-101
      builtyNumber: 'B-101',
      method: 'JazzCash',
      createdAt: 1500,
      updatedAt: 1500,
    },
    {
      id: 2,
      date: '2026-09-15',
      amount: 1500, // partial payment against B-102 (total is 4,000)
      builtyNumber: 'B-102',
      method: 'Bank',
      createdAt: 2500,
      updatedAt: 2500,
    },
  ];

  const summary = calculateOverallSummary(stockRecords, paymentRecords);

  // Total stock quantities
  assert.equal(summary.totalQuantityByProduct.Ideal, 70);
  assert.equal(summary.totalQuantityByProduct.Golden, 40);
  assert.equal(summary.totalQuantityByProduct.Chocolate, 20);
  assert.equal(summary.totalQuantityByProduct.Sample, 15);
  assert.equal(summary.totalUnitsReceived, 145);

  // Financials
  assert.equal(summary.totalStockValue, 18000);
  assert.equal(summary.totalPaymentsSent, 15500);
  assert.equal(summary.balanceDue, 2500); // 18000 - 15500

  // Per-builty status
  const b101 = summary.builties.find((b) => b.builtyNumber === 'B-101');
  assert.ok(b101);
  assert.equal(b101?.status, 'Paid');
  assert.equal(b101?.totalPaid, 14000);
  assert.equal(b101?.remainingBalance, 0);

  const b102 = summary.builties.find((b) => b.builtyNumber === 'B-102');
  assert.ok(b102);
  assert.equal(b102?.status, 'Partially paid');
  assert.equal(b102?.totalPaid, 1500);
  assert.equal(b102?.remainingBalance, 2500);
});

test('Backup reminder: flags backups older than 7 days', () => {
  assert.equal(isBackupOlderThan7Days(null), true);
  assert.equal(isBackupOlderThan7Days(undefined), true);
  
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  assert.equal(isBackupOlderThan7Days(yesterday), false);

  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(isBackupOlderThan7Days(eightDaysAgo), true);
});
