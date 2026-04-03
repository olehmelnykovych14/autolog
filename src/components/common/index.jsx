import React from 'react'
import { X } from 'lucide-react'
import { C } from '../../constants'

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all text-gray-400">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  )
}

export function inp_cls() {
  return 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/40 focus:border-[#5C3EFE] transition-all text-gray-900 dark:text-white placeholder-gray-400'
}

export function PrimaryBtn({ children, onClick, type = 'button', className = '', disabled = false }) {
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all hover:opacity-90 shadow-lg disabled:opacity-50 ${className}`} 
      style={{ background: C }}
    >
      {children}
    </button>
  )
}
