import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { ReceiveTab } from './components/ReceiveTab';
import { PaymentTab } from './components/PaymentTab';
import { SummaryTab } from './components/SummaryTab';
import { PinLockModal } from './components/PinLockModal';
import { SettingsModal } from './components/SettingsModal';
import { ImageModal } from './components/ImageModal';
import { BackupReminderBanner } from './components/BackupReminderBanner';
import {
  getAppSettings,
  saveAppSettings,
  loadAllStockRecords,
  addStockRecord,
  updateStockRecord,
  deleteStockRecord,
  loadAllPaymentRecords,
  addPaymentRecord,
  updatePaymentRecord,
  deletePaymentRecord,
  DEFAULT_SETTINGS,
} from './db';
import { StockReceiveRecord, PaymentRecord, AppSettings } from './types';
import { downloadFullBackup, requestPersistentStorage } from './utils/backup';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'receive' || tab === 'payment' || tab === 'summary') {
        return tab;
      }
    }
    return 'receive';
  });
  const [stocks, setStocks] = useState<StockReceiveRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Full Image Modal State
  const [activeImage, setActiveImage] = useState<{ url: string; title: string } | null>(null);

  // Load initial data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [appSettings, stockList, paymentList] = await Promise.all([
        getAppSettings(),
        loadAllStockRecords(),
        loadAllPaymentRecords(),
      ]);
      setSettings(appSettings);
      setStocks(stockList);
      setPayments(paymentList);

      if (appSettings.isPinEnabled && appSettings.pinHash) {
        setIsLocked(true);
      }
    } catch (err) {
      console.error('Failed to load local IndexedDB data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    // Silently request browser persistent storage on start
    requestPersistentStorage().catch(() => {});
  }, [refreshData]);

  // Stock Handlers
  const handleSaveStock = async (
    record: Omit<StockReceiveRecord, 'id'>,
    editId?: number
  ) => {
    if (editId) {
      await updateStockRecord(editId, record);
    } else {
      await addStockRecord(record);
    }
    const updated = await loadAllStockRecords();
    setStocks(updated);
  };

  const handleDeleteStock = async (id: number) => {
    await deleteStockRecord(id);
    const updated = await loadAllStockRecords();
    setStocks(updated);
  };

  // Payment Handlers
  const handleSavePayment = async (
    record: Omit<PaymentRecord, 'id'>,
    editId?: number
  ) => {
    if (editId) {
      await updatePaymentRecord(editId, record);
    } else {
      await addPaymentRecord(record);
    }
    const updated = await loadAllPaymentRecords();
    setPayments(updated);
  };

  const handleDeletePayment = async (id: number) => {
    await deletePaymentRecord(id);
    const updated = await loadAllPaymentRecords();
    setPayments(updated);
  };

  // Settings Handlers
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await saveAppSettings(newSettings);
    setSettings(updated);
  };

  // Trigger quick backup from banner
  const handleTriggerQuickBackup = async () => {
    try {
      const timestamp = await downloadFullBackup(stocks, payments, settings);
      await handleUpdateSettings({ lastBackupDate: timestamp });
    } catch (err) {
      console.error('Backup trigger failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center animate-bounce shadow-lg">
          <span className="font-black text-xl">NH</span>
        </div>
        <p className="mt-4 text-sm font-bold text-stone-700">Loading Hisab Kitab...</p>
      </div>
    );
  }

  // If PIN lock is active, show the PIN lock modal
  if (isLocked && settings.isPinEnabled && settings.pinHash) {
    return (
      <PinLockModal
        pinHash={settings.pinHash}
        onUnlocked={() => setIsLocked(false)}
      />
    );
  }

  const hasRecords = stocks.length > 0 || payments.length > 0;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900 font-sans selection:bg-emerald-600 selection:text-white">
      {/* App Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLockApp={() => setIsLocked(true)}
        isPinEnabled={settings.isPinEnabled}
      />

      {/* Backup Reminder Banner (Shows if > 7 days or never backed up and records exist) */}
      <BackupReminderBanner
        lastBackupDate={settings.lastBackupDate}
        hasRecords={hasRecords}
        onTriggerBackup={handleTriggerQuickBackup}
      />

      {/* Main Tabs Navigation */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        receiveCount={stocks.length}
        paymentCount={payments.length}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-xl w-full mx-auto px-3.5 pt-3 pb-28 sm:pb-32">
        {activeTab === 'receive' && (
          <ReceiveTab
            records={stocks}
            onSaveRecord={handleSaveStock}
            onDeleteRecord={handleDeleteStock}
          />
        )}

        {activeTab === 'payment' && (
          <PaymentTab
            records={payments}
            stockRecords={stocks}
            onSavePayment={handleSavePayment}
            onDeletePayment={handleDeletePayment}
            onViewImage={(url, title) => setActiveImage({ url, title })}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryTab
            stockRecords={stocks}
            paymentRecords={payments}
          />
        )}
      </main>

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        stockRecords={stocks}
        paymentRecords={payments}
        onUpdateSettings={handleUpdateSettings}
        onDataRestored={async () => {
          await refreshData();
        }}
      />

      {/* Fullscreen Image Preview Modal */}
      <ImageModal
        imageUrl={activeImage?.url || null}
        title={activeImage?.title}
        onClose={() => setActiveImage(null)}
      />
    </div>
  );
}
