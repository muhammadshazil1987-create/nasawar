export const PRODUCTS = ['Ideal', 'Golden', 'Chocolate', 'Sample'] as const;
export type ProductType = (typeof PRODUCTS)[number];

export interface ProductQuantityRate {
  quantity: number; // e.g. 50
  rate?: number; // optional, e.g. 250
}

export interface StockReceiveRecord {
  id?: number;
  date: string; // ISO date string YYYY-MM-DD
  builtyNumber: string; // e.g. "123" or "B-405"
  items: Record<ProductType, ProductQuantityRate>;
  totalAmount: number; // calculated sum of quantity * rate (0 if no rates)
  note?: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export type PaymentMethod = 'Cash' | 'JazzCash' | 'Easypaisa' | 'Bank';

export interface PaymentRecord {
  id?: number;
  date: string; // ISO date string YYYY-MM-DD (can be any past or present date)
  amount: number; // in Rs.
  builtyNumber: string; // "General" or specific builtyNumber
  method: PaymentMethod;
  screenshotBase64?: string; // compressed image data URL
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  id: string; // 'app_settings'
  pinHash?: string | null; // SHA-256 hash of 4-digit PIN
  isPinEnabled: boolean;
  lastBackupDate?: string | null; // ISO timestamp
}

export type BuiltyStatus = 'Paid' | 'Partially paid' | 'Unpaid' | 'Quantity only';

export interface BuiltyStatusSummary {
  builtyNumber: string;
  receiveDate: string;
  totalQuantity: number;
  productBreakdown: Record<ProductType, number>;
  totalAmount: number; // in Rs.
  totalPaid: number; // in Rs.
  remainingBalance: number; // in Rs.
  status: BuiltyStatus;
}

export interface OverallSummary {
  totalQuantityByProduct: Record<ProductType, number>;
  totalUnitsReceived: number;
  totalStockValue: number;
  totalPaymentsSent: number;
  balanceDue: number; // totalStockValue - totalPaymentsSent
  builties: BuiltyStatusSummary[];
}
