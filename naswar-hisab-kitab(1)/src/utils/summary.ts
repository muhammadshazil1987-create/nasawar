import {
  StockReceiveRecord,
  PaymentRecord,
  OverallSummary,
  BuiltyStatusSummary,
  BuiltyStatus,
  ProductType,
  PRODUCTS,
} from '../types';
import { isDateInRange } from './date';

/**
 * Calculates total summary and per-builty breakdowns based on given date filter range
 */
export function calculateOverallSummary(
  stockRecords: StockReceiveRecord[],
  paymentRecords: PaymentRecord[],
  dateRange?: { start?: string; end?: string }
): OverallSummary {
  // Filter stock records by date range if provided
  const filteredStock = dateRange && (dateRange.start || dateRange.end)
    ? stockRecords.filter((s) => isDateInRange(s.date, dateRange.start, dateRange.end))
    : stockRecords;

  // Filter payment records by date range if provided
  const filteredPayments = dateRange && (dateRange.start || dateRange.end)
    ? paymentRecords.filter((p) => isDateInRange(p.date, dateRange.start, dateRange.end))
    : paymentRecords;

  // 1. Calculate Product Quantities and Total Units
  const totalQuantityByProduct: Record<ProductType, number> = {
    Ideal: 0,
    Golden: 0,
    Chocolate: 0,
    Sample: 0,
  };

  let totalUnitsReceived = 0;
  let totalStockValue = 0;

  for (const stock of filteredStock) {
    totalStockValue += stock.totalAmount || 0;
    for (const prod of PRODUCTS) {
      const qty = stock.items?.[prod]?.quantity || 0;
      totalQuantityByProduct[prod] += qty;
      totalUnitsReceived += qty;
    }
  }

  // 2. Calculate Total Payments
  let totalPaymentsSent = 0;
  const paymentByBuiltyMap = new Map<string, number>();

  for (const payment of filteredPayments) {
    totalPaymentsSent += payment.amount || 0;
    if (payment.builtyNumber && payment.builtyNumber !== 'General') {
      const existing = paymentByBuiltyMap.get(payment.builtyNumber) || 0;
      paymentByBuiltyMap.set(payment.builtyNumber, existing + (payment.amount || 0));
    }
  }

  // 3. Calculate Balance Due
  const balanceDue = totalStockValue - totalPaymentsSent;

  // 4. Per Builty Summary
  // Sort builties by date descending (newest first)
  const sortedStock = [...filteredStock].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return (b.id || 0) - (a.id || 0);
  });

  const builties: BuiltyStatusSummary[] = sortedStock.map((stock) => {
    const totalPaid = paymentByBuiltyMap.get(stock.builtyNumber) || 0;
    const remainingBalance = Math.max(0, stock.totalAmount - totalPaid);

    let status: BuiltyStatus = 'Unpaid';
    if (stock.totalAmount <= 0) {
      status = 'Quantity only';
    } else if (totalPaid >= stock.totalAmount) {
      status = 'Paid';
    } else if (totalPaid > 0) {
      status = 'Partially paid';
    } else {
      status = 'Unpaid';
    }

    let totalQuantity = 0;
    const productBreakdown: Record<ProductType, number> = {
      Ideal: stock.items?.Ideal?.quantity || 0,
      Golden: stock.items?.Golden?.quantity || 0,
      Chocolate: stock.items?.Chocolate?.quantity || 0,
      Sample: stock.items?.Sample?.quantity || 0,
    };
    for (const prod of PRODUCTS) {
      totalQuantity += productBreakdown[prod];
    }

    return {
      builtyNumber: stock.builtyNumber,
      receiveDate: stock.date,
      totalQuantity,
      productBreakdown,
      totalAmount: stock.totalAmount || 0,
      totalPaid,
      remainingBalance,
      status,
    };
  });

  return {
    totalQuantityByProduct,
    totalUnitsReceived,
    totalStockValue,
    totalPaymentsSent,
    balanceDue,
    builties,
  };
}
