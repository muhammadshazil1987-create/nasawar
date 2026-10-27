import React, { useState } from 'react';
import { Lock, Delete, Shield, AlertCircle } from 'lucide-react';
import { verifyPin } from '../utils/crypto';

interface PinLockModalProps {
  pinHash: string;
  onUnlocked: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ pinHash, onUnlocked }) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleDigit = async (digit: string) => {
    if (isVerifying || enteredPin.length >= 4) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setError(false);

    if (nextPin.length === 4) {
      setIsVerifying(true);
      const isMatch = await verifyPin(nextPin, pinHash);
      if (isMatch) {
        onUnlocked();
      } else {
        setError(true);
        setIsVerifying(false);
        setTimeout(() => {
          setEnteredPin('');
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    if (isVerifying) return;
    setEnteredPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    if (isVerifying) return;
    setEnteredPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950 p-4 select-none">
      <div className="w-full max-w-xs text-center space-y-6">
        {/* Header Icon */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-emerald-900/80 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Naswar Hisab Kitab
          </h2>
          <p className="text-xs text-stone-400 font-medium">
            Enter your 4-digit PIN to open ledger
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  error
                    ? 'bg-red-500 ring-4 ring-red-500/20 animate-shake'
                    : isFilled
                    ? 'bg-amber-400 ring-4 ring-amber-400/20 scale-110'
                    : 'bg-stone-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-bold text-red-400 flex items-center justify-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Incorrect PIN. Try again.
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-16 rounded-2xl bg-stone-900/90 hover:bg-stone-800 active:bg-emerald-900/70 border border-stone-800 text-white font-bold text-2xl transition active:scale-95 flex items-center justify-center shadow-xs"
            >
              {num}
            </button>
          ))}

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="h-16 rounded-2xl bg-stone-900/40 hover:bg-stone-800 text-stone-400 font-semibold text-xs transition active:scale-95 flex items-center justify-center"
          >
            Clear
          </button>

          {/* 0 Button */}
          <button
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-stone-900/90 hover:bg-stone-800 active:bg-emerald-900/70 border border-stone-800 text-white font-bold text-2xl transition active:scale-95 flex items-center justify-center shadow-xs"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            onClick={handleBackspace}
            className="h-16 rounded-2xl bg-stone-900/40 hover:bg-stone-800 text-stone-400 hover:text-white transition active:scale-95 flex items-center justify-center"
            aria-label="Delete last digit"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <p className="text-[11px] text-stone-600">
          Local cryptographic check • No internet required
        </p>
      </div>
    </div>
  );
};
