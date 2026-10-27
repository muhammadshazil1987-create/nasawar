import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Shield,
  Download,
  Upload,
  HardDrive,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';
import { AppSettings, StockReceiveRecord, PaymentRecord } from '../types';
import { formatDisplayDate } from '../utils/date';
import { hashPin, verifyPin } from '../utils/crypto';
import { downloadFullBackup, restoreBackupData, requestPersistentStorage } from '../utils/backup';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  stockRecords: StockReceiveRecord[];
  paymentRecords: PaymentRecord[];
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onDataRestored: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  stockRecords,
  paymentRecords,
  onUpdateSettings,
  onDataRestored,
}) => {
  // Persistent Storage State
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [storageSupported, setStorageSupported] = useState<boolean>(true);

  // PIN Form State
  const [pinMode, setPinMode] = useState<'view' | 'set' | 'change' | 'remove'>('view');
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [pinMessage, setPinMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Backup & Restore State
  const [backupSuccessDate, setBackupSuccessDate] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [pendingRestoreText, setPendingRestoreText] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persisted) {
        navigator.storage.persisted().then((persisted) => {
          setIsPersisted(persisted);
        }).catch(() => {});
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Requesting Storage Persistence
  const handleRequestPersistence = async () => {
    const res = await requestPersistentStorage();
    setIsPersisted(res.persisted);
    setStorageSupported(res.supported);
  };

  // Handle Download Backup
  const handleDownloadBackup = async () => {
    try {
      const timestamp = await downloadFullBackup(stockRecords, paymentRecords, settings);
      setBackupSuccessDate(timestamp);
      await onUpdateSettings({ lastBackupDate: timestamp });
    } catch (err) {
      console.error('Backup failed:', err);
    }
  };

  // Handle File Selection for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPendingRestoreText(content);
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore Confirmation
  const handleConfirmRestore = async () => {
    if (!pendingRestoreText) return;
    try {
      setIsRestoring(true);
      setRestoreStatus(null);
      const res = await restoreBackupData(pendingRestoreText);
      await onDataRestored();
      setRestoreStatus(`Successfully restored ${res.stocksCount} stock builties and ${res.paymentsCount} payments!`);
      setPendingRestoreText(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Restore error:', err);
      setRestoreStatus(err instanceof Error ? err.message : 'Failed to restore backup file.');
    } finally {
      setIsRestoring(false);
    }
  };

  // PIN Operations
  const handleSaveNewPin = async () => {
    setPinMessage(null);
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setPinMessage({ text: 'PIN must be exactly 4 digits (0-9).', isError: true });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinMessage({ text: 'PINs do not match. Please retype.', isError: true });
      return;
    }

    const hash = await hashPin(newPinInput);
    await onUpdateSettings({ isPinEnabled: true, pinHash: hash });
    setPinMessage({ text: '4-digit PIN enabled successfully!', isError: false });
    setPinMode('view');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  const handleChangePin = async () => {
    setPinMessage(null);
    if (!settings.pinHash) return;
    const isCurrentValid = await verifyPin(currentPinInput, settings.pinHash);
    if (!isCurrentValid) {
      setPinMessage({ text: 'Current PIN is incorrect.', isError: true });
      return;
    }
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setPinMessage({ text: 'New PIN must be exactly 4 digits.', isError: true });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinMessage({ text: 'New PINs do not match.', isError: true });
      return;
    }

    const hash = await hashPin(newPinInput);
    await onUpdateSettings({ isPinEnabled: true, pinHash: hash });
    setPinMessage({ text: 'PIN changed successfully!', isError: false });
    setPinMode('view');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  const handleRemovePin = async () => {
    setPinMessage(null);
    if (!settings.pinHash) {
      await onUpdateSettings({ isPinEnabled: false, pinHash: null });
      setPinMode('view');
      return;
    }
    const isCurrentValid = await verifyPin(currentPinInput, settings.pinHash);
    if (!isCurrentValid) {
      setPinMessage({ text: 'Current PIN is incorrect.', isError: true });
      return;
    }

    await onUpdateSettings({ isPinEnabled: false, pinHash: null });
    setPinMessage({ text: 'PIN removed. App is now open.', isError: false });
    setPinMode('view');
    setCurrentPinInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-300" />
            <h2 className="text-base sm:text-lg font-bold">Settings & Ledger Backup</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-stone-200 hover:text-white"
            aria-label="Close Settings modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Section 1: Backup & Restore */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-700" />
              Data Backup & Restore (Save Your Khata)
            </h3>
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-3">
              <p className="text-xs text-stone-600 leading-relaxed">
                All records, builties, and receipt screenshots are stored locally inside this browser. To keep your bookkeeping safe, download a backup file. You can share or save it on Google Drive, WhatsApp, or computer.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs transition active:scale-95"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  Download Backup (JSON)
                </button>

                <label className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm cursor-pointer shadow-xs transition active:scale-95">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  Restore from File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Status / feedback */}
              <div className="text-[11px] text-stone-500 pt-1 flex items-center justify-between">
                <span>
                  Last backup:{' '}
                  <strong>
                    {settings.lastBackupDate
                      ? formatDisplayDate(settings.lastBackupDate.split('T')[0])
                      : 'Never'}
                  </strong>
                </span>
                <span>
                  Total builties: <strong>{stockRecords.length}</strong> | Payments: <strong>{paymentRecords.length}</strong>
                </span>
              </div>

              {backupSuccessDate && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  Backup downloaded successfully! Keep this JSON file safe.
                </div>
              )}

              {restoreStatus && (
                <div className="text-xs font-semibold text-stone-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  {restoreStatus}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Privacy / 4-Digit PIN Lock */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              4-Digit PIN Security (Privacy Lock)
            </h3>

            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.isPinEnabled ? (
                    <Lock className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <Unlock className="w-5 h-5 text-stone-400" />
                  )}
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">
                      {settings.isPinEnabled ? 'PIN Protection Active' : 'No PIN Set (Open Access)'}
                    </span>
                    <span className="text-xs text-stone-500">
                      {settings.isPinEnabled
                        ? 'App locks when launched or refreshed'
                        : 'Set a 4-digit code to protect your ledger'}
                    </span>
                  </div>
                </div>

                {pinMode === 'view' && (
                  <div>
                    {!settings.isPinEnabled ? (
                      <button
                        onClick={() => {
                          setPinMode('set');
                          setPinMessage(null);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                      >
                        Set PIN
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setPinMode('change');
                            setPinMessage(null);
                          }}
                          className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs px-2.5 py-1.5 rounded-lg"
                        >
                          Change
                        </button>
                        <button
                          onClick={() => {
                            setPinMode('remove');
                            setPinMessage(null);
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {pinMessage && (
                <div
                  className={`text-xs p-2.5 rounded-xl font-semibold ${
                    pinMessage.isError
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {pinMessage.text}
                </div>
              )}

              {/* Form for Setting new PIN */}
              {pinMode === 'set' && (
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-3">
                  <span className="text-xs font-bold text-stone-800 block">
                    Create 4-Digit PIN
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Enter 4 digits"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      className="text-center font-bold tracking-widest text-base px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Confirm PIN"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                      className="text-center font-bold tracking-widest text-base px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNewPin}
                      className="flex-1 bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg hover:bg-emerald-800"
                    >
                      Save PIN
                    </button>
                    <button
                      onClick={() => setPinMode('view')}
                      className="bg-stone-200 text-stone-700 font-semibold text-xs px-3 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Form for Changing PIN */}
              {pinMode === 'change' && (
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-3">
                  <span className="text-xs font-bold text-stone-800 block">
                    Change Existing PIN
                  </span>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter Current 4-digit PIN"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center font-bold tracking-widest text-base px-3 py-2 border rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="New PIN"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      className="text-center font-bold tracking-widest text-base px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Confirm New PIN"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                      className="text-center font-bold tracking-widest text-base px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleChangePin}
                      className="flex-1 bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg hover:bg-emerald-800"
                    >
                      Update PIN
                    </button>
                    <button
                      onClick={() => setPinMode('view')}
                      className="bg-stone-200 text-stone-700 font-semibold text-xs px-3 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Form for Removing PIN */}
              {pinMode === 'remove' && (
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-3">
                  <span className="text-xs font-bold text-red-700 block">
                    Remove PIN Protection
                  </span>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter Current PIN to disable"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center font-bold tracking-widest text-base px-3 py-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRemovePin}
                      className="flex-1 bg-red-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-red-700"
                    >
                      Confirm Removal
                    </button>
                    <button
                      onClick={() => setPinMode('view')}
                      className="bg-stone-200 text-stone-700 font-semibold text-xs px-3 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Browser Storage Persistence */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-700" />
              Phone / Browser Storage Protection
            </h3>
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-stone-900 text-sm block">
                  {isPersisted ? 'Storage is Protected' : 'Standard Browser Storage'}
                </span>
                <span className="text-xs text-stone-500">
                  {isPersisted
                    ? 'The browser has granted permanent storage for your bookkeeping.'
                    : 'Request persistent storage so your browser never cleans out your records.'}
                </span>
              </div>

              {!isPersisted && storageSupported && (
                <button
                  type="button"
                  onClick={handleRequestPersistence}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl shrink-0"
                >
                  Protect Storage
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 px-5 py-3 border-t border-stone-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs sm:text-sm font-bold"
          >
            Close Settings
          </button>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {pendingRestoreText && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-stone-900 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-lg font-bold">Replace Current Records?</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              <strong>Warning:</strong> Restoring this backup will replace all current stock consignments and payment records in this browser with the data inside the backup file.
            </p>
            <p className="text-xs text-stone-500">
              Are you sure you want to proceed?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPendingRestoreText(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                {isRestoring ? 'Restoring...' : 'Yes, Restore Backup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
