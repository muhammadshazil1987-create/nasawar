import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  StockReceiveRecord,
  PaymentRecord,
  BuiltyStatus,
  ProductType,
  PRODUCTS,
} from '../types';
import { formatDisplayDate, getDateFilterRange, isDateInRange } from '../utils/date';
import { formatCurrency, formatQuantity } from '../utils/format';
import { calculateOverallSummary } from '../utils/summary';
import { generateBookkeepingCSV, downloadCSVFile } from '../utils/csv';

interface SummaryTabProps {
  stockRecords: StockReceiveRecord[];
  paymentRecords: PaymentRecord[];
}

type FilterOption = 'all' | 'thisMonth' | 'lastMonth' | 'custom';

export const SummaryTab: React.FC<SummaryTabProps> = ({
  stockRecords,
  paymentRecords,
}) => {
  const [filterType, setFilterType] = useState<FilterOption>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Compute active date range
  const activeDateRange = useMemo(() => {
    if (filterType === 'custom') {
      return {
        start: customStart || undefined,
        end: customEnd || undefined,
      };
    }
    return getDateFilterRange(filterType);
  }, [filterType, customStart, customEnd]);

  // Compute summary metrics using our tested pure function
  const summary = useMemo(() => {
    return calculateOverallSummary(stockRecords, paymentRecords, activeDateRange);
  }, [stockRecords, paymentRecords, activeDateRange]);

  // Filtered builties by status dropdown
  const displayedBuilties = useMemo(() => {
    if (statusFilter === 'all') return summary.builties;
    return summary.builties.filter((b) => b.status === statusFilter);
  }, [summary.builties, statusFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    const csvContent = generateBookkeepingCSV(
      summary,
      stockRecords.filter((s) => isDateInRange(s.date, activeDateRange.start, activeDateRange.end)),
      paymentRecords.filter((p) => isDateInRange(p.date, activeDateRange.start, activeDateRange.end))
    );
    const dateTag = new Date().toISOString().split('T')[0];
    downloadCSVFile(csvContent, `naswar_hisab_kitab_${dateTag}.csv`);
  };

  const renderStatusBadge = (status: BuiltyStatus) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case 'Partially paid':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Partially paid
          </span>
        );
      case 'Unpaid':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5" />
            Unpaid
          </span>
        );
      case 'Quantity only':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-300">
            <HelpCircle className="w-3.5 h-3.5" />
            Qty only
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Date Filter & Export Header Card */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Period Filter & Reporting
            </h2>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs active:scale-95 transition"
            aria-label="Export report to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-300" />
            Export to CSV
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'custom', label: 'Custom Range' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilterType(opt.id)}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition ${
                filterType === opt.id
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {filterType === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-stone-50 p-3 rounded-xl border border-stone-200 animate-in fade-in duration-150">
            <div>
              <label htmlFor="start-date" className="block text-xs font-bold text-stone-600 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-xs font-bold text-stone-600 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 bg-white"
              />
            </div>
          </div>
        )}
      </section>

      {/* Main Financial KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Stock Received Amount */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Stock Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            {formatCurrency(summary.totalStockValue)}
          </div>
          <p className="text-xs text-stone-500">
            Total consignment value received
          </p>
        </div>

        {/* Total Payments Sent */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Payments Sent
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            {formatCurrency(summary.totalPaymentsSent)}
          </div>
          <p className="text-xs text-stone-500">
            Total cash, JazzCash & bank sent
          </p>
        </div>

        {/* Balance Due */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border shadow-xs space-y-2 ${
            summary.balanceDue > 0
              ? 'bg-amber-50/80 border-amber-300'
              : summary.balanceDue < 0
              ? 'bg-blue-50/80 border-blue-300'
              : 'bg-emerald-50/80 border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Balance Due (Baqaya)
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                summary.balanceDue > 0
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black ${
              summary.balanceDue > 0
                ? 'text-amber-950'
                : summary.balanceDue < 0
                ? 'text-blue-900'
                : 'text-emerald-900'
            }`}
          >
            {formatCurrency(Math.abs(summary.balanceDue))}
          </div>
          <p className="text-xs font-semibold text-stone-600">
            {summary.balanceDue > 0
              ? 'Amount you still owe to the company'
              : summary.balanceDue === 0
              ? 'All clear! No remaining balance due.'
              : 'Advance payment sent to company.'}
          </p>
        </div>
      </section>

      {/* Stock Quantities Received Per Product Card */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-bold text-stone-900">
              Stock Received by Product
            </h3>
          </div>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full">
            Total: {formatQuantity(summary.totalUnitsReceived)} Units
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRODUCTS.map((prod) => {
            const count = summary.totalQuantityByProduct[prod];
            return (
              <div
                key={prod}
                className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-center space-y-1 hover:bg-stone-100/80 transition"
              >
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  {prod}
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-900 block">
                  {formatQuantity(count)}
                </span>
                <span className="text-[11px] text-stone-400">units received</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Builty-by-Builty Status Breakdown */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Builty Payment Status
            </h3>
            <p className="text-xs text-stone-500">
              Consignment breakdown: Paid vs Partially Paid vs Unpaid
            </p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs font-bold text-stone-600">
              Filter:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All ({summary.builties.length})</option>
              <option value="Paid">Paid</option>
              <option value="Partially paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Quantity only">Quantity Only</option>
            </select>
          </div>
        </div>

        {displayedBuilties.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-stone-200 rounded-xl">
            <p className="text-sm font-semibold text-stone-600">
              No builties found for this selection.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {displayedBuilties.map((b) => (
              <div
                key={b.builtyNumber}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-stone-900 text-sm sm:text-base">
                      Builty #{b.builtyNumber}
                    </span>
                    <span className="text-xs text-stone-500">
                      ({formatDisplayDate(b.receiveDate)})
                    </span>
                    {renderStatusBadge(b.status)}
                  </div>

                  <p className="text-xs text-stone-600">
                    Ideal: <strong>{b.productBreakdown.Ideal}</strong> | Golden:{' '}
                    <strong>{b.productBreakdown.Golden}</strong> | Chocolate:{' '}
                    <strong>{b.productBreakdown.Chocolate}</strong> | Sample:{' '}
                    <strong>{b.productBreakdown.Sample}</strong> (Total: {b.totalQuantity} units)
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">
                      Stock Value
                    </span>
                    <span className="font-bold text-stone-800">
                      {b.totalAmount > 0 ? formatCurrency(b.totalAmount) : 'Qty only'}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">
                      Paid Sent
                    </span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(b.totalPaid)}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">
                      Due
                    </span>
                    <span
                      className={`font-black ${
                        b.remainingBalance > 0 ? 'text-amber-800' : 'text-stone-400'
                      }`}
                    >
                      {formatCurrency(b.remainingBalance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
