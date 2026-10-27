import React, { useState } from 'react';
import { AlertCircle, Download, X } from 'lucide-react';
import { isBackupOlderThan7Days, formatDisplayDate } from '../utils/date';

interface BackupReminderBannerProps {
  lastBackupDate?: string | null;
  hasRecords: boolean;
  onTriggerBackup: () => void;
}

export const BackupReminderBanner: React.FC<BackupReminderBannerProps> = ({
  lastBackupDate,
  hasRecords,
  onTriggerBackup,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !hasRecords) {
    return null;
  }

  const isOld = isBackupOlderThan7Days(lastBackupDate);
  if (!isOld) {
    return null;
  }

  const lastDateFormatted = lastBackupDate
    ? formatDisplayDate(lastBackupDate.split('T')[0])
    : 'Never';

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2.5 border-b border-amber-600 shadow-xs">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-950" />
          <span>
            <strong>Backup Reminder:</strong> Your data is stored only in this browser. Last backup:{' '}
            <strong>{lastDateFormatted}</strong>. Save a copy to stay safe!
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={onTriggerBackup}
            className="flex items-center gap-1.5 bg-amber-950 text-amber-100 hover:bg-black font-bold px-3 py-1.5 rounded-lg text-xs transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Backup Now
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-amber-600/40 rounded text-amber-950"
            title="Dismiss reminder"
            aria-label="Dismiss reminder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
