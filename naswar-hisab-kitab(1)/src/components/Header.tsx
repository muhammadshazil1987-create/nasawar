import React, { useState } from 'react';
import { Settings, Lock, Download, ShieldCheck, WifiOff, BookOpen } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  onOpenSettings: () => void;
  onLockApp: () => void;
  isPinEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onLockApp,
  isPinEnabled,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md border-b border-emerald-900 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-4xl mx-auto px-3.5 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center border border-amber-400/40 shadow-inner">
              <BookOpen className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                Naswar Hisab Kitab
              </h1>
              <p className="text-xs text-emerald-200">Personal Ledger & Builty Record</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Offline badge */}
            {!isOnline && (
              <span className="hidden xs:inline-flex items-center gap-1 bg-amber-500/90 text-amber-950 font-semibold text-xs px-2.5 py-1 rounded-full shadow-xs">
                <WifiOff className="w-3.5 h-3.5" />
                Offline
              </span>
            )}

            {/* PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition"
                aria-label="Install App"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Install</span> App
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-2.5 py-1.5 rounded-lg border border-emerald-600"
                aria-label="Install App on iOS"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add to</span> Home
              </button>
            )}

            {/* Lock button if PIN is enabled */}
            {isPinEnabled && (
              <button
                onClick={onLockApp}
                className="p-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-emerald-100 hover:text-white transition active:scale-95"
                title="Lock App with PIN"
                aria-label="Lock App"
              >
                <Lock className="w-5 h-5 text-amber-300" />
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-emerald-100 hover:text-white transition active:scale-95"
              title="Settings & Backup"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* iOS Installation Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-stone-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-3 text-emerald-800">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-bold">Install on iPhone / iPad</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              To use this app offline directly from your home screen like a mobile app:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-stone-700 font-medium bg-stone-50 p-3 rounded-xl border border-stone-200">
              <li>Tap the <strong className="text-emerald-700">Share</strong> button at bottom of Safari.</li>
              <li>Scroll down the list and tap <strong className="text-emerald-700">Add to Home Screen</strong>.</li>
              <li>Tap <strong className="text-emerald-700">Add</strong> at top right.</li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 py-3 text-sm font-bold text-white transition active:scale-98"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
