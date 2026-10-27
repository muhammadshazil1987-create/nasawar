import Dexie, { type Table } from 'dexie';
import { StockReceiveRecord, PaymentRecord, AppSettings } from '../types';

export class NaswarHisabDatabase extends Dexie {
  stocks!: Table<StockReceiveRecord, number>;
  payments!: Table<PaymentRecord, number>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('NaswarHisabKitabDB');
    this.version(1).stores({
      stocks: '++id, date, builtyNumber, createdAt',
      payments: '++id, date, builtyNumber, method, createdAt',
      settings: 'id',
    });
  }
}

export const db = new NaswarHisabDatabase();

// Default initial settings
export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app_settings',
  pinHash: null,
  isPinEnabled: false,
  lastBackupDate: null,
};

// Database helper operations
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const s = await db.settings.get('app_settings');
    if (!s) {
      await db.settings.put(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return s;
  } catch (err) {
    console.error('Error reading settings from IndexedDB:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...settings,
    id: 'app_settings',
  };
  await db.settings.put(updated);
  return updated;
}

export async function loadAllStockRecords(): Promise<StockReceiveRecord[]> {
  try {
    return await db.stocks.toArray();
  } catch (err) {
    console.error('Error fetching stock records:', err);
    return [];
  }
}

export async function addStockRecord(record: Omit<StockReceiveRecord, 'id'>): Promise<number> {
  return await db.stocks.add(record as StockReceiveRecord);
}

export async function updateStockRecord(id: number, record: Partial<StockReceiveRecord>): Promise<number> {
  await db.stocks.update(id, {
    ...record,
    updatedAt: Date.now(),
  });
  return id;
}

export async function deleteStockRecord(id: number): Promise<void> {
  await db.stocks.delete(id);
}

export async function loadAllPaymentRecords(): Promise<PaymentRecord[]> {
  try {
    return await db.payments.toArray();
  } catch (err) {
    console.error('Error fetching payment records:', err);
    return [];
  }
}

export async function addPaymentRecord(record: Omit<PaymentRecord, 'id'>): Promise<number> {
  return await db.payments.add(record as PaymentRecord);
}

export async function updatePaymentRecord(id: number, record: Partial<PaymentRecord>): Promise<number> {
  await db.payments.update(id, {
    ...record,
    updatedAt: Date.now(),
  });
  return id;
}

export async function deletePaymentRecord(id: number): Promise<void> {
  await db.payments.delete(id);
}
