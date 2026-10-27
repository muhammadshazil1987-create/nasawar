import React, { useState } from 'react';
import {
  PackagePlus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Calendar,
  FileText,
  Tag,
  Plus
} from 'lucide-react';
import { StockReceiveRecord, ProductType, PRODUCTS } from '../types';
import { formatDisplayDate, getTodayDateString } from '../utils/date';
import { formatCurrency, formatQuantity, parsePositiveNumber } from '../utils/format';

interface ReceiveTabProps {
  records: StockReceiveRecord[];
  onSaveRecord: (record: Omit<StockReceiveRecord, 'id'>, editId?: number) => Promise<void>;
  onDeleteRecord: (id: number) => Promise<void>;
}

export const ReceiveTab: React.FC<ReceiveTabProps> = ({
  records,
  onSaveRecord,
  onDeleteRecord,
}) => {
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [builtyNumber, setBuiltyNumber] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<ProductType, string>>({
    Ideal: '',
    Golden: '',
    Chocolate: '',
    Sample: '',
  });
  const [rates, setRates] = useState<Record<ProductType, string>>({
    Ideal: '',
    Golden: '',
    Chocolate: '',
    Sample: '',
  });
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Delete Confirmation State
  const [recordToDelete, setRecordToDelete] = useState<StockReceiveRecord | null>(null);

  // Calculate live total amount
  const calculatedTotalAmount = PRODUCTS.reduce((sum, prod) => {
    const q = parsePositiveNumber(quantities[prod]);
    const r = parsePositiveNumber(rates[prod]);
    return sum + q * r;
  }, 0);

  const totalUnits = PRODUCTS.reduce((sum, prod) => {
    return sum + parsePositiveNumber(quantities[prod]);
  }, 0);

  // Form Reset
  const resetForm = () => {
    setEditingId(null);
    setDate(getTodayDateString());
    setBuiltyNumber('');
    setQuantities({ Ideal: '', Golden: '', Chocolate: '', Sample: '' });
    setRates({ Ideal: '', Golden: '', Chocolate: '', Sample: '' });
    setNote('');
    setErrorMessage(null);
  };

  // Start Editing
  const handleEditClick = (rec: StockReceiveRecord) => {
    setEditingId(rec.id || null);
    setDate(rec.date);
    setBuiltyNumber(rec.builtyNumber);

    const newQ: Record<ProductType, string> = { Ideal: '', Golden: '', Chocolate: '', Sample: '' };
    const newR: Record<ProductType, string> = { Ideal: '', Golden: '', Chocolate: '', Sample: '' };

    for (const p of PRODUCTS) {
      const item = rec.items?.[p];
      newQ[p] = item && item.quantity > 0 ? String(item.quantity) : '';
      newR[p] = item && item.rate && item.rate > 0 ? String(item.rate) : '';
    }

    setQuantities(newQ);
    setRates(newR);
    setNote(rec.note || '');
    setErrorMessage(null);

    // Smooth scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!date) {
      setErrorMessage('Please select a valid date.');
      return;
    }
    const cleanBuilty = builtyNumber.trim();
    if (!cleanBuilty) {
      setErrorMessage('Please enter a Builty number.');
      return;
    }

    if (totalUnits <= 0) {
      setErrorMessage('Please enter a quantity for at least one product (Ideal, Golden, Chocolate, or Sample).');
      return;
    }

    const items: StockReceiveRecord['items'] = {
      Ideal: {
        quantity: parsePositiveNumber(quantities.Ideal),
        rate: parsePositiveNumber(rates.Ideal) || undefined,
      },
      Golden: {
        quantity: parsePositiveNumber(quantities.Golden),
        rate: parsePositiveNumber(rates.Golden) || undefined,
      },
      Chocolate: {
        quantity: parsePositiveNumber(quantities.Chocolate),
        rate: parsePositiveNumber(rates.Chocolate) || undefined,
      },
      Sample: {
        quantity: parsePositiveNumber(quantities.Sample),
        rate: parsePositiveNumber(rates.Sample) || undefined,
      },
    };

    const recordData: Omit<StockReceiveRecord, 'id'> = {
      date,
      builtyNumber: cleanBuilty,
      items,
      totalAmount: calculatedTotalAmount,
      note: note.trim() || undefined,
      createdAt: editingId ? undefined! : Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveRecord(recordData, editingId || undefined);
    resetForm();
  };

  // Filtered records for search
  const filteredRecords = records
    .filter((r) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.builtyNumber.toLowerCase().includes(term) ||
        formatDisplayDate(r.date).toLowerCase().includes(term) ||
        (r.note && r.note.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 pb-12">
      {/* Receive Form Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="bg-emerald-800 text-white px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-amber-300" />
            <h2 className="text-base sm:text-lg font-bold">
              {editingId ? `Edit Builty #${builtyNumber}` : 'Receive Stock (Aamad Mal)'}
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

          {/* Top Row: Date & Builty Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="receive-date" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                Date Received *
              </label>
              <input
                id="receive-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-base px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
              />
            </div>

            <div>
              <label htmlFor="receive-builty" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-700" />
                Builty Number (Bilty #) *
              </label>
              <input
                id="receive-builty"
                type="text"
                placeholder="e.g. 101 or B-450"
                value={builtyNumber}
                onChange={(e) => setBuiltyNumber(e.target.value)}
                required
                className="w-full text-base px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
              />
            </div>
          </div>

          {/* Product Quantities & Rates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Products (Quantity & Optional Rate)
              </span>
              <span className="text-xs text-stone-500 font-medium">
                Total Units: <strong className="text-emerald-800">{formatQuantity(totalUnits)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRODUCTS.map((prod) => {
                const q = parsePositiveNumber(quantities[prod]);
                const r = parsePositiveNumber(rates[prod]);
                const subtotal = q * r;

                return (
                  <div
                    key={prod}
                    className="p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/70 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        {prod}
                      </span>
                      {subtotal > 0 && (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {formatCurrency(subtotal)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor={`qty-${prod}`} className="block text-[11px] font-semibold text-stone-500 mb-0.5">
                          Quantity
                        </label>
                        <input
                          id={`qty-${prod}`}
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={quantities[prod]}
                          onChange={(e) =>
                            setQuantities({ ...quantities, [prod]: e.target.value })
                          }
                          className="w-full text-sm font-semibold px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div>
                        <label htmlFor={`rate-${prod}`} className="block text-[11px] font-semibold text-stone-500 mb-0.5">
                          Rate (Rs./unit)
                        </label>
                        <input
                          id={`rate-${prod}`}
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Optional"
                          value={rates[prod]}
                          onChange={(e) =>
                            setRates({ ...rates, [prod]: e.target.value })
                          }
                          className="w-full text-sm font-semibold px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Calculation Display Card */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Calculated Total Amount
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-950">
                {formatCurrency(calculatedTotalAmount)}
              </span>
            </div>
            {calculatedTotalAmount === 0 && (
              <span className="text-xs text-emerald-700 italic">
                (Quantity-only tracking if rates are left empty)
              </span>
            )}
          </div>

          {/* Note (optional) */}
          <div>
            <label htmlFor="receive-note" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700" />
              Note (Optional)
            </label>
            <input
              id="receive-note"
              type="text"
              placeholder="e.g. Received via Al-Madina Cargo, driver Aslam"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold py-3.5 px-6 rounded-xl text-base shadow-md flex items-center justify-center gap-2 transition"
            >
              <CheckCircle className="w-5 h-5 text-amber-300" />
              {editingId ? 'Update Builty Record' : 'Save Builty Record'}
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

      {/* Saved Records List */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-stone-900">
              Stock Consignments History
            </h3>
            <span className="text-xs bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-full">
              {records.length}
            </span>
          </div>

          {/* Search Bar */}
          {records.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search builty # or date..."
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
              <PackagePlus className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-700">
              {records.length === 0
                ? 'No stock consignments received yet.'
                : 'No matching builty found.'}
            </p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {records.length === 0
                ? 'Fill out the form above to record your first received stock builty from the company.'
                : 'Try clearing your search term.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRecords.map((rec) => {
              const idealQty = rec.items?.Ideal?.quantity || 0;
              const goldenQty = rec.items?.Golden?.quantity || 0;
              const chocoQty = rec.items?.Chocolate?.quantity || 0;
              const sampleQty = rec.items?.Sample?.quantity || 0;
              const totalPieces = idealQty + goldenQty + chocoQty + sampleQty;

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs hover:border-emerald-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-stone-900 text-base sm:text-lg">
                          Builty #{rec.builtyNumber}
                        </span>
                        <span className="text-xs bg-stone-100 text-stone-600 font-medium px-2 py-0.5 rounded-md">
                          {formatDisplayDate(rec.date)}
                        </span>
                      </div>
                      {rec.note && (
                        <p className="text-xs text-stone-500 mt-1 italic">
                          Note: {rec.note}
                        </p>
                      )}
                    </div>

                    {/* Total Amount Badge */}
                    <div className="text-right shrink-0">
                      <span className="block text-xs font-semibold text-stone-500">
                        Total Amount
                      </span>
                      <span className="text-base sm:text-lg font-black text-emerald-800">
                        {rec.totalAmount > 0 ? formatCurrency(rec.totalAmount) : 'Quantity only'}
                      </span>
                    </div>
                  </div>

                  {/* Product breakdown line */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                      <span className="text-stone-500 font-semibold block">Ideal</span>
                      <span className="font-bold text-stone-800 text-sm">
                        {formatQuantity(idealQty)} {rec.items?.Ideal?.rate ? `@ Rs. ${rec.items.Ideal.rate}` : ''}
                      </span>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                      <span className="text-stone-500 font-semibold block">Golden</span>
                      <span className="font-bold text-stone-800 text-sm">
                        {formatQuantity(goldenQty)} {rec.items?.Golden?.rate ? `@ Rs. ${rec.items.Golden.rate}` : ''}
                      </span>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                      <span className="text-stone-500 font-semibold block">Chocolate</span>
                      <span className="font-bold text-stone-800 text-sm">
                        {formatQuantity(chocoQty)} {rec.items?.Chocolate?.rate ? `@ Rs. ${rec.items.Chocolate.rate}` : ''}
                      </span>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                      <span className="text-stone-500 font-semibold block">Sample</span>
                      <span className="font-bold text-stone-800 text-sm">
                        {formatQuantity(sampleQty)} {rec.items?.Sample?.rate ? `@ Rs. ${rec.items.Sample.rate}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-1 text-xs text-stone-500 border-t border-stone-100">
                    <span>Total Units: <strong className="text-stone-800">{formatQuantity(totalPieces)}</strong></span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(rec)}
                        className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition active:scale-95"
                        aria-label={`Edit Builty ${rec.builtyNumber}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setRecordToDelete(rec)}
                        className="flex items-center gap-1 font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition active:scale-95"
                        aria-label={`Delete Builty ${rec.builtyNumber}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-stone-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600 mb-2">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-lg font-bold">Delete Builty?</h4>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-stone-900">Builty #{recordToDelete.builtyNumber}</strong> from{' '}
              <strong className="text-stone-900">{formatDisplayDate(recordToDelete.date)}</strong>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (recordToDelete.id) {
                    await onDeleteRecord(recordToDelete.id);
                  }
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
