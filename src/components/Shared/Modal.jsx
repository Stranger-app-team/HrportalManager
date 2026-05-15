import React from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Standardized Premium Modal
 * @param {string} title - The title of the modal
 * @param {React.ReactNode} children - Content of the modal
 * @param {function} onClose - Callback function to close the modal
 * @param {string} maxWidth - Tailwind max-width class (default: 'max-w-lg')
 */
export default function Modal({ title, children, onClose, maxWidth = 'max-w-lg', headerActions }) {
  return (
    <div className="fixed inset-0 bg-[#061633]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
        <div className={`w-full ${maxWidth} bg-white rounded-xl p-5 sm:p-6 shadow-2xl relative border border-slate-200 animate-in zoom-in-95 duration-300`}>
          {/* Action Buttons */}
          <div className="absolute top-4 right-12 flex items-center gap-3">
             {headerActions}
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-5 text-slate-400 hover:text-rose-500 transition-all duration-300 z-20 p-1 hover:bg-rose-50 rounded-md"
          >
            <FiX size={18}/>
          </button>

          {/* Header */}
          {title && (
            <div className="mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                {title}
              </h3>
            </div>
          )}

          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
       </div>
    </div>
  );
}
