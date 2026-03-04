'use client';

import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const styles: Record<ToastType, string> = {
  success: 'bg-white border-green-500 text-green-700',
  error:   'bg-white border-red-500 text-red-700',
  info:    'bg-white border-blue-500 text-blue-700',
};

const iconStyles: Record<ToastType, string> = {
  success: 'bg-green-100 text-green-600',
  error:   'bg-red-100 text-red-600',
  info:    'bg-blue-100 text-blue-600',
};

export default function Toast({
  message,
  type = 'success',
  onClose,
  duration = 3500,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`
        fixed top-6 right-6 z-9999 flex items-center gap-3 min-w-[280px] max-w-sm
        px-4 py-3.5 rounded-2xl border-l-4 shadow-xl
        animate-in slide-in-from-top-2 fade-in duration-300
        ${styles[type]}
      `}
      role="alert"
    >
      {/* Icon */}
      <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${iconStyles[type]}`}>
        {icons[type]}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-gray-800">{message}</p>

      {/* Close */}
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none shrink-0"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
