import React, { useState, useRef } from 'react';
import {
  CreditCard,
  Camera,
  Image as ImageIcon,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Calendar,
  DollarSign,
  FileText,
  X,
  ExternalLink
} from 'lucide-react';
import { PaymentRecord, PaymentMethod, StockReceiveRecord } from '../types';
import { formatDisplayDate, getTodayDateString } from '../utils/date';
import { formatCurrency, parsePositiveNumber } from '../utils/format';
import { compressImage } from '../utils/image';

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'JazzCash', 'Easypaisa', 'Bank'];

interface PaymentTabProps {
  records: PaymentRecord[];
  stockRecords: StockReceiveRecord[];
  onSavePayment: (record: Omit<PaymentRecord, 'id'>, editId?: number) => Promise<void>;
  onDeletePayment: (id: number) => Promise<void>;
  onViewImage: (imageUrl: string, title: string) => void;
}

export const PaymentTab: React.FC<PaymentTabProps> = ({
  records,
  stockRecords,
  onSavePayment,
  onDeletePayment,
  onViewImage,
}) => {
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [amount, setAmount] = useState<string>('');
  const [builtyNumber, setBuiltyNumber] = useState<string>('General');
  const [method, setMethod] = useState<PaymentMethod>('JazzCash');
  const [screenshotBase64, setScreenshotBase64] = useState<string | undefined>(undefined);
  const [note, setNote] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Delete Confirmation State
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Extract unique received builty numbers for the dropdown
  const uniqueBuilties = Array.from(
    new Set(stockRecords.map((s) => s.builtyNumber.trim()))
  ).filter(Boolean);

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setDate(getTodayDateString());
    setAmount('');
    setBuiltyNumber('General');
    setMethod('JazzCash');
    setScreenshotBase64(undefined);
    setNote('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start editing
  const handleEditClick = (pay: PaymentRecord) => {
    setEditingId(pay.id || null);
    setDate(pay.date);
    setAmount(pay.amount > 0 ? String(pay.amount) : '');
    setBuiltyNumber(pay.builtyNumber || 'General');
    setMethod(pay.method || 'Cash');
    setScreenshotBase64(pay.screenshotBase64);
    setNote(pay.note || '');
    setErrorMessage(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // File change handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setErrorMessage(null);
      const compressed = await compressImage(file, 1024, 0.72);
      setScreenshotBase64(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
      setErrorMessage('Could not process selected image. Please try another file.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!date) {
      setErrorMessage('Please pick a payment date.');
      return;
    }

    const numAmount = parsePositiveNumber(amount);
    if (numAmount <= 0) {
      setErrorMessage('Please enter a payment amount greater than zero.');
      return;
    }

    const recordData: Omit<PaymentRecord, 'id'> = {
      date,
      amount: numAmount,
      builtyNumber: builtyNumber || 'General',
      method,
      screenshotBase64,
      note: note.trim() || undefined,
      createdAt: editingId ? undefined! : Date.now(),
      updatedAt: Date.now(),
    };

    await onSavePayment(recordData, editingId || undefined);
    resetForm();
  };

  // Filtered payments list
  const filteredRecords = records
    .filter((p) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.builtyNumber.toLowerCase().includes(term) ||
        p.method.toLowerCase().includes(term) ||
        formatDisplayDate(p.date).toLowerCase().includes(term) ||
        String(p.amount).includes(term) ||
        (p.note && p.note.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 pb-12">
      {/* Payment Form Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="bg-emerald-800 text-white px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-300" />
            <h2 className="text-base sm:text-lg font-bold">
              {editingId ? 'Edit Payment Record' : 'Record Payment Sent (Adaigi)'}
            </h2>
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-xs bg-emerald-900/80 hover:bg-emerald-950 px-2.5 py-1 rounded-md text-emerald-100 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Payment Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pay-date" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                Payment Date * (Any past date allowed)
              </label>
              <input
                id="pay-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-base px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                Record will be saved strictly under this date.
              </span>
            </div>

            <div>
              <label htmlFor="pay-amount" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                Amount Sent (Rs.) *
              </label>
              <input
                id="pay-amount"
                type="number"
                min="1"
                step="any"
                placeholder="e.g. 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full text-base px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold text-emerald-950"
              />
              {parsePositiveNumber(amount) > 0 && (
                <span className="text-xs font-bold text-emerald-700 mt-1 block">
                  {formatCurrency(parsePositiveNumber(amount))}
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Against Builty & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="against-builty" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Against Which Builty?
              </label>
              <select
                id="against-builty"
                value={builtyNumber}
                onChange={(e) => setBuiltyNumber(e.target.value)}
                className="w-full text-sm sm:text-base px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
              >
                <option value="General">General payment (Account Khata)</option>
                {uniqueBuilties.map((b) => (
                  <option key={b} value={b}>
                    Builty #{b}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-stone-500 mt-1 block">
                Choose a specific builty or General payment.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Payment Method *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition ${
                      method === m
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Screenshot Upload / Capture Section */}
          <div className="p-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-700" />
                Payment Screenshot / Receipt Slip (Optional)
              </label>
              {isCompressing && (
                <span className="text-xs text-emerald-700 font-medium animate-pulse">
                  Compressing image...
                </span>
              )}
            </div>

            {screenshotBase64 ? (
              <div className="flex items-center gap-4 bg-white p-2.5 rounded-xl border border-stone-200">
                <div
                  className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden border border-stone-300 cursor-pointer shrink-0 relative group"
                  onClick={() => onViewImage(screenshotBase64, `Payment Receipt - ${formatCurrency(parsePositiveNumber(amount))}`)}
                  title="Click to expand"
                >
                  <img
                    src={screenshotBase64}
                    alt="Receipt thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-emerald-800 block truncate">
                    Screenshot Attached
                  </span>
                  <p className="text-[11px] text-stone-500">
                    Compressed & stored securely in IndexedDB
                  </p>
                  <button
                    type="button"
                    onClick={() => onViewImage(screenshotBase64, `Payment Receipt`)}
                    className="text-xs text-emerald-700 font-semibold underline hover:text-emerald-900 mt-0.5 inline-block"
                  >
                    Tap to preview full slip
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setScreenshotBase64(undefined);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"
                  title="Remove screenshot"
                  aria-label="Remove screenshot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  id="screenshot-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="screenshot-input"
                  className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900 cursor-pointer font-bold text-xs sm:text-sm text-center transition"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span>Tap to choose receipt from Camera or Gallery</span>
                </label>
              </div>
            )}
          </div>

          {/* Note (Optional) */}
          <div>
            <label htmlFor="pay-note" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700" />
              Note / Reference (Optional)
            </label>
            <input
              id="pay-note"
              type="text"
              placeholder="e.g. Sent via TID: 0987654321 / Paid via shop cash"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={isCompressing}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 active:scale-98 text-white font-bold py-3.5 px-6 rounded-xl text-base shadow-md flex items-center justify-center gap-2 transition"
            >
              <CheckCircle className="w-5 h-5 text-amber-300" />
              {editingId ? 'Update Payment' : 'Save Payment Record'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold px-5 py-3.5 rounded-xl text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Saved Payments List */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-stone-900">
              Payments History
            </h3>
            <span className="text-xs bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-full">
              {records.length}
            </span>
          </div>

          {/* Search bar */}
          {records.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search amount, method, builty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          )}
        </div>

        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-stone-300 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-700">
              {records.length === 0 ? 'No payments recorded yet.' : 'No matching payment found.'}
            </p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {records.length === 0
                ? 'Fill out the form above to record your money transfers sent to the naswar company.'
                : 'Try clearing your search query.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRecords.map((pay) => (
              <div
                key={pay.id}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs hover:border-emerald-300 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-black text-emerald-900">
                        {formatCurrency(pay.amount)}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                        {pay.method}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {pay.builtyNumber === 'General' ? 'General Payment' : `Builty #${pay.builtyNumber}`}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 font-medium">
                      Date: <strong className="text-stone-700">{formatDisplayDate(pay.date)}</strong>
                    </p>

                    {pay.note && (
                      <p className="text-xs text-stone-600 italic">
                        Note: {pay.note}
                      </p>
                    )}
                  </div>

                  {/* Screenshot thumbnail on the right */}
                  {pay.screenshotBase64 && (
                    <div
                      className="shrink-0 flex flex-col items-center cursor-pointer group"
                      onClick={() =>
                        onViewImage(
                          pay.screenshotBase64!,
                          `Receipt: ${formatCurrency(pay.amount)} on ${formatDisplayDate(pay.date)}`
                        )
                      }
                    >
                      <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-300 overflow-hidden shadow-xs group-hover:ring-2 group-hover:ring-emerald-500 transition">
                        <img
                          src={pay.screenshotBase64}
                          alt="Slip thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold mt-0.5">
                        View Slip
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions footer */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 text-xs">
                  <button
                    onClick={() => handleEditClick(pay)}
                    className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition active:scale-95"
                    aria-label={`Edit payment of ${formatCurrency(pay.amount)}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setPaymentToDelete(pay)}
                    className="flex items-center gap-1 font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition active:scale-95"
                    aria-label={`Delete payment of ${formatCurrency(pay.amount)}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-stone-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600 mb-2">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-lg font-bold">Delete Payment Record?</h4>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Are you sure you want to delete payment of{' '}
              <strong className="text-stone-900">{formatCurrency(paymentToDelete.amount)}</strong> sent on{' '}
              <strong className="text-stone-900">{formatDisplayDate(paymentToDelete.date)}</strong>?
              {paymentToDelete.screenshotBase64 && ' Attached screenshot will also be deleted.'}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (paymentToDelete.id) {
                    await onDeletePayment(paymentToDelete.id);
                  }
                  setPaymentToDelete(null);
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Delete Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
