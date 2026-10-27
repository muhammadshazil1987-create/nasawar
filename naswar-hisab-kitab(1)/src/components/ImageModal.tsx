import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
  title?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, title = 'Payment Screenshot' }) => {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative max-h-[90vh] max-w-[95vw] sm:max-w-xl w-full bg-stone-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-stone-950/80 border-b border-stone-800 text-stone-100">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm sm:text-base">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
            aria-label="Close image modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2 sm:p-4 overflow-auto flex items-center justify-center max-h-[75vh]">
          <img
            src={imageUrl}
            alt="Payment receipt proof"
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
          />
        </div>

        <div className="p-3 bg-stone-950 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-sm"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
