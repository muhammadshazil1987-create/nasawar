import React from 'react';
import { PackagePlus, CreditCard, PieChart } from 'lucide-react';

export type TabType = 'receive' | 'payment' | 'summary';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  receiveCount: number;
  paymentCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  receiveCount,
  paymentCount,
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-md mx-auto px-4 py-1.5 flex items-center justify-around">
        {/* Tab 1: Receive */}
        <button
          onClick={() => {
            triggerHaptic();
            onChangeTab('receive');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 relative select-none active:scale-95 ${
            activeTab === 'receive'
              ? 'text-emerald-800 font-extrabold'
              : 'text-stone-500 hover:text-stone-800 font-semibold'
          }`}
          role="tab"
          aria-selected={activeTab === 'receive'}
        >
          <div
            className={`relative p-1.5 rounded-xl transition-all duration-200 ${
              activeTab === 'receive'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 scale-105'
                : 'text-stone-500'
            }`}
          >
            <PackagePlus className="w-5 h-5" />
            {receiveCount > 0 && (
              <span
                className={`absolute -top-1 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black rounded-full px-1 border-2 border-white ${
                  activeTab === 'receive'
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-emerald-700 text-white'
                }`}
              >
                {receiveCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-1">Receive</span>
        </button>

        {/* Tab 2: Payment */}
        <button
          onClick={() => {
            triggerHaptic();
            onChangeTab('payment');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 relative select-none active:scale-95 ${
            activeTab === 'payment'
              ? 'text-emerald-800 font-extrabold'
              : 'text-stone-500 hover:text-stone-800 font-semibold'
          }`}
          role="tab"
          aria-selected={activeTab === 'payment'}
        >
          <div
            className={`relative p-1.5 rounded-xl transition-all duration-200 ${
              activeTab === 'payment'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 scale-105'
                : 'text-stone-500'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            {paymentCount > 0 && (
              <span
                className={`absolute -top-1 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black rounded-full px-1 border-2 border-white ${
                  activeTab === 'payment'
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-emerald-700 text-white'
                }`}
              >
                {paymentCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-1">Payment</span>
        </button>

        {/* Tab 3: Summary */}
        <button
          onClick={() => {
            triggerHaptic();
            onChangeTab('summary');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 relative select-none active:scale-95 ${
            activeTab === 'summary'
              ? 'text-emerald-800 font-extrabold'
              : 'text-stone-500 hover:text-stone-800 font-semibold'
          }`}
          role="tab"
          aria-selected={activeTab === 'summary'}
        >
          <div
            className={`p-1.5 rounded-xl transition-all duration-200 ${
              activeTab === 'summary'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 scale-105'
                : 'text-stone-500'
            }`}
          >
            <PieChart className="w-5 h-5" />
          </div>
          <span className="text-[11px] tracking-tight mt-1">Summary</span>
        </button>
      </div>
    </nav>
  );
};
