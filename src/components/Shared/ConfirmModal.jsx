import React from 'react';
import Modal from './Modal';
import { Trash2, AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Deletion", 
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  variant = "danger" // danger, warning
}) => {
  if (!isOpen) return null;

  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-md">
      <div className="p-1">
        <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {variant === 'danger' ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">{title}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Action Confirmation Required</p>
          </div>
        </div>

        <div className="px-1 mb-8">
          <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 ${
              variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-amber-600 hover:bg-amber-700'
            } disabled:opacity-70`}
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                {variant === 'danger' ? <Trash2 size={12} /> : <AlertTriangle size={12} />}
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
