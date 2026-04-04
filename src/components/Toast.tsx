import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-lg ${
        type === 'success'
          ? 'bg-[#1c1c1c] border-emerald-800 text-emerald-400'
          : 'bg-[#1c1c1c] border-red-800 text-red-400'
      }`}>
        {type === 'success' ? (
          <CheckCircle size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
        <span className="text-sm font-medium whitespace-nowrap">{message}</span>
        <button
          onClick={onClose}
          className="ml-1 text-gray-400 hover:text-white transition"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
