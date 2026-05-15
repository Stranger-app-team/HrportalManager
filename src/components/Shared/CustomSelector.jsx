import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiCheckCircle } from 'react-icons/fi';

/**
 * Standardized Premium Custom Selector
 * @param {React.ReactNode} icon - Optional icon to display before the value
 * @param {string|number} value - Currently selected value (matching opt.id)
 * @param {Array} options - List of {id, name} objects
 * @param {function} onChange - Callback function when selection changes
 * @param {string} minWidth - Minimum width of the selector (default: 'auto')
 * @param {boolean} isLarge - Whether to use the large, padded style (default: false)
 * @param {string} placeholder - Placeholder text when no value is selected
 */
export default function CustomSelector({ 
  icon, 
  value, 
  options, 
  onChange, 
  minWidth = "auto", 
  isLarge = false,
  placeholder = "Select...",
  className = "",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const clickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.id) === String(value));

  return (
    <div className="relative" ref={dropRef} style={{ minWidth }}>
       <button 
         type="button"
         onClick={() => !disabled && setIsOpen(!isOpen)}
         className={`w-full flex items-center justify-between gap-3 px-4 transition-all duration-300 group
         ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}
         ${isLarge 
            ? 'bg-[#F8FAFC] py-4 rounded-2xl border border-transparent focus:border-indigo-500/20' 
            : 'py-2 rounded-xl hover:bg-slate-50'
         } ${className}`}
       >
          <div className="flex items-center gap-2.5 overflow-hidden">
             {icon && (
               <span className={`transition-colors duration-300 ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`}>
                 {icon}
               </span>
             )}
             <span className={`text-[11px] font-[900] truncate tracking-tight transition-colors duration-300 
               ${isOpen ? 'text-indigo-600' : (selectedOption ? 'text-slate-700' : 'text-slate-400')}`}>
                {selectedOption?.name || placeholder}
             </span>
          </div>
          <FiChevronDown 
            size={14} 
            className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : 'group-hover:text-slate-400'}`} 
          />
       </button>

       {isOpen && (
         <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-60 overflow-y-auto no-scrollbar">
               {options.length === 0 && (
                 <p className="px-4 py-6 text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center italic">
                   No options available
                 </p>
               )}
               {options.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id); setIsOpen(false); }}
                    className={`w-full text-left px-4 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between group/item
                    ${String(value) === String(opt.id) ? 'bg-indigo-50/50' : ''}`}
                  >
                     <span className={`text-[11px] font-[800] tracking-tight transition-colors
                       ${String(value) === String(opt.id) ? 'text-indigo-600' : 'text-slate-600 group-hover/item:text-indigo-500'}`}>
                        {opt.name}
                     </span>
                     {String(value) === String(opt.id) && <FiCheckCircle size={12} className="text-indigo-500 animate-in zoom-in duration-300" />}
                  </button>
               ))}
            </div>
         </div>
       )}

       <style>{`
         .no-scrollbar::-webkit-scrollbar { display: none; }
         .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
       `}</style>
    </div>
  );
}
