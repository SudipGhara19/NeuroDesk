import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { BsExclamationTriangleFill } from 'react-icons/bs';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant?: 'danger' | 'warning' | 'primary' | 'success';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmVariant = 'danger',
}: ConfirmModalProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'primary':
      default:
        return 'bg-primary hover:bg-primary-dark text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-sm rounded-2xl p-6 shadow-xl ${
        theme === 'dark' ? 'bg-[#121212] border border-white/10' : 'bg-white border border-gray-100'
      }`}>
        <div className="flex gap-4">
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            confirmVariant === 'danger' ? 'bg-red-500/10 text-red-500' : 
            confirmVariant === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
            confirmVariant === 'success' ? 'bg-green-500/10 text-green-500' :
            'bg-primary/10 text-primary'
          }`}>
            <BsExclamationTriangleFill className="text-xl" />
          </div>
          
          <div className="flex-1">
            <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {message}
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${getConfirmButtonClass()}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
