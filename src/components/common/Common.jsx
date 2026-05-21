import React from 'react'
import { X } from 'lucide-react'
import { C } from '../../constants'

export function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', animation: 'bgFade 250ms ease both' }}
    >
      <div
        className="w-full max-w-lg flex flex-col overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--line)',
          borderRadius: '2rem',
          boxShadow: 'var(--shadow-lg)',
          animation: 'modalSpring 400ms cubic-bezier(.34,1.56,.64,1) both'
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <X size={18} />
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
      <label className="al-label">{label}</label>
      {children}
    </div>
  )
}

export function inp_cls() {
  return 'al-input'
}

export function PrimaryBtn({ children, onClick, type = 'button', className = '', disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-brand disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({ title, sub, icon, children, className = '' }) {
  return (
    <div className={`al-card p-6 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center justify-between mb-5">
          <div>
            {title && <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</h3>}
            {sub && <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-3)' }}>{sub}</p>}
          </div>
          {icon && (
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center stat-icon">{icon}</div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

export function ConfirmModal({ title, message, confirmLabel = 'Підтвердити', variant = 'danger', onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', animation: 'bgFade 200ms ease both' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm flex flex-col overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--line)',
          borderRadius: '1.75rem',
          boxShadow: 'var(--shadow-lg)',
          animation: 'modalSpring 350ms cubic-bezier(.34,1.56,.64,1) both'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex flex-col items-center px-7 pt-8 pb-5 gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: variant === 'danger' ? 'rgba(239,68,68,0.12)' : 'var(--brand-soft)',
              color: variant === 'danger' ? '#ef4444' : 'var(--brand)'
            }}
          >
            {variant === 'danger' ? '🗑' : '⚠️'}
          </div>
          <div className="text-center">
            <h3 className="text-base font-black mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</h3>
            {message && <p className="text-sm font-medium" style={{ color: 'var(--text-3)', lineHeight: 1.5 }}>{message}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
            style={{ background: 'var(--bg-input)', color: 'var(--text-2)' }}
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{
              background: variant === 'danger' ? '#ef4444' : 'var(--brand)',
              color: '#fff'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

