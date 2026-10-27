import { db, saveAppSettings } from '../db';
import { StockReceiveRecord, PaymentRecord, AppSettings } from '../types';

export interface BackupPayload {
  app: 'NaswarHisabKitab';
  version: number;
  exportedAt: string; // ISO date
  stocks: StockReceiveRecord[];
  payments: PaymentRecord[];
  settings?: Partial<AppSettings>;
}

/**
 * Creates full backup payload and triggers mobile native share or browser download
 */
export async function downloadFullBackup(
  stocks: StockReceiveRecord[],
  payments: PaymentRecord[],
  settings: AppSettings
): Promise<string> {
  const timestamp = new Date().toISOString();
  const backupData: BackupPayload = {
    app: 'NaswarHisabKitab',
    version: 1,
    exportedAt: timestamp,
    stocks,
    payments,
    settings: {
      isPinEnabled: settings.isPinEnabled,
      pinHash: settings.pinHash,
    },
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const dateFormatted = timestamp.split('T')[0];
  const filename = `naswar_hisab_kitab_backup_${dateFormatted}.json`;

  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const file = new File([blob], filename, { type: 'application/json' });

  // On mobile phone, attempt Web Share API (WhatsApp, Drive, Gmail, etc.)
  let sharedViaNativeSheet = false;
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Naswar Hisab Kitab Backup',
          text: `Naswar Hisab Kitab Ledger Backup (${dateFormatted})`,
          files: [file],
        });
        sharedViaNativeSheet = true;
      }
    } catch (err: unknown) {
      // User canceled share sheet or browser blocked; proceed with normal download
      if (err instanceof Error && err.name !== 'AbortError') {
        console.warn('Native share failed, falling back to download:', err);
      }
    }
  }

  // Fallback to standard browser file download
  if (!sharedViaNativeSheet) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Update last backup date
  await saveAppSettings({ lastBackupDate: timestamp });
  return timestamp;
}

/**
 * Validates and restores a backup JSON file into IndexedDB
 */
export async function restoreBackupData(
  jsonText: string
): Promise<{ stocksCount: number; paymentsCount: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid JSON format. Please select a valid backup file.');
  }

  const payload = parsed as Partial<BackupPayload>;
  if (!payload || payload.app !== 'NaswarHisabKitab' || !Array.isArray(payload.stocks) || !Array.isArray(payload.payments)) {
    throw new Error('Unrecognized backup format. This file does not appear to be a Naswar Hisab Kitab backup.');
  }

  const restoredStocks: StockReceiveRecord[] = payload.stocks;
  const restoredPayments: PaymentRecord[] = payload.payments;
  const restoredSettings = payload.settings;

  // Clear existing database and bulk insert in a transaction
  await db.transaction('rw', db.stocks, db.payments, db.settings, async () => {
    await db.stocks.clear();
    await db.payments.clear();

    if (restoredStocks.length > 0) {
      await db.stocks.bulkAdd(restoredStocks);
    }
    if (restoredPayments.length > 0) {
      await db.payments.bulkAdd(restoredPayments);
    }

    if (restoredSettings) {
      await db.settings.put({
        id: 'app_settings',
        isPinEnabled: !!restoredSettings.isPinEnabled,
        pinHash: restoredSettings.pinHash || null,
        lastBackupDate: new Date().toISOString(),
      });
    }
  });

  return {
    stocksCount: restoredStocks.length,
    paymentsCount: restoredPayments.length,
  };
}

/**
 * Requests browser persistent storage (navigator.storage.persist)
 */
export async function requestPersistentStorage(): Promise<{ persisted: boolean; supported: boolean }> {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return { persisted: false, supported: false };
  }
  try {
    const isAlreadyPersisted = await navigator.storage.persisted();
    if (isAlreadyPersisted) {
      return { persisted: true, supported: true };
    }
    const persisted = await navigator.storage.persist();
    return { persisted, supported: true };
  } catch (err) {
    console.warn('Storage persist request failed:', err);
    return { persisted: false, supported: true };
  }
}
