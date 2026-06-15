import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Bell, Check, X, AlertCircle, Menu, ChevronRight } from 'lucide-react'
import { ThemeCtx } from '../../context/ThemeContext'
import { C } from '../../constants'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'

export function Topbar({ isDark, setDark, incomingTransfer, onAcceptTransfer, onRejectTransfer, currentUser, userProfile, col, setCol, pendingApprovals, bookingNotifications=[], incomingInvites=[], onAcceptInvite, onRejectInvite, onAcceptService, onRejectService, setShowMobileMenu, onMarkRead, onMarkAllRead }) {
  const [showInbox, setShowInbox] = useState(false)
  const [processingInvites, setProcessingInvites] = useState({})

  const handleInviteAction = async (id, actionFn) => {
    if (!actionFn) return
    setProcessingInvites(p => ({ ...p, [id]: true }))
    try {
      await actionFn(id)
    } catch (e) {
      alert(`Помилка: ${e.message || 'Не вдалося виконати дію'}`)
    } finally {
      setProcessingInvites(p => ({ ...p, [id]: false }))
    }
  }

  const navigate = useNavigate()
  const isSto = userProfile?.accountType === 'sto' || userProfile?.role === 'СТО' || userProfile?.role === 'sto'
  const totalNotifications = pendingApprovals.length + bookingNotifications.length + incomingInvites.length

  return (
    <header
      className="flex items-center gap-3 px-5 sm:px-7 h-16 flex-none z-[50] relative"
      style={{
        background: isDark ? '#0B1120' : 'var(--bg-card)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={() => setShowMobileMenu(true)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Menu size={20} />
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCol(!col)}
          className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl transition-all"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--brand)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
        >
          {col ? <ChevronRight size={18} /> : <Menu size={18} />}
        </button>

        {/* Brand */}
        <div className="hidden sm:flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-[0.1em] leading-none mb-0.5" style={{ color: 'var(--text)' }}>
            {isSto ? 'Кабінет партнера' : 'Мій дашборд'}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>AutoLog</span>
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Incoming transfer */}
        {incomingTransfer && (
          <div
            className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl animate-in slide-in-from-right-4"
            style={{ background: 'rgba(92,62,254,0.08)', border: '1px solid rgba(92,62,254,0.2)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-ping flex-none" />
            <span className="text-xs font-bold" style={{ color: 'var(--brand)' }}>Отримано авто</span>
            <div className="flex gap-1.5">
              <button onClick={onAcceptTransfer} className="w-7 h-7 rounded-lg bg-[var(--brand)] text-white grid place-items-center hover:bg-[var(--brand-light)] transition-colors shadow-md" style={{ boxShadow: '0 4px 10px var(--brand-shadow)' }}><Check size={12}/></button>
              <button onClick={onRejectTransfer} className="w-7 h-7 rounded-lg grid place-items-center transition-colors" style={{ background: 'var(--bg-hover)', border: '1px solid var(--line-2)', color: 'var(--text-3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--bad)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-3)' }}
              ><X size={12}/></button>
            </div>
          </div>
        )}

        {/* Controls group */}
        <div
          className="flex items-center p-1.5 rounded-2xl gap-0.5"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--line-2)' }}
        >
          {/* Theme toggle */}
          <button
            onClick={() => setDark(!isDark)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--brand)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowInbox(!showInbox)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 relative"
              style={{ color: totalNotifications > 0 ? 'var(--brand)' : 'var(--text-3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Bell size={17} />
              {totalNotifications > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: 'var(--bad)', border: '2px solid var(--bg-card)' }}
                />
              )}
            </button>

            {showInbox && (
              <div
                className="absolute top-full right-0 mt-3 w-72 sm:w-80 rounded-3xl overflow-hidden z-50 animate-in slide-in-from-top-2"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-lg)' }}
              >
                <div
                  className="px-5 py-4 flex justify-between items-center"
                  style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-hover)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Сповіщення</span>
                    {totalNotifications > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--brand)' }}>{totalNotifications}</span>
                    )}
                  </div>
                  {totalNotifications > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); onMarkAllRead() }} className="text-[10px] font-black uppercase tracking-widest transition-colors" style={{ color: 'var(--brand)' }}>
                      Прочитати всі
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {totalNotifications === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl grid place-items-center" style={{ background: 'var(--bg-hover)', color: 'var(--text-4)' }}><Bell size={22} /></div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>Поки що немає нових сповіщень</p>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--line)' }}>
                      {incomingInvites.map(inv => (
                        <div key={inv.id} className="p-4" style={{ borderBottom: '1px solid var(--line)', background: 'rgba(245,158,11,0.04)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={13} style={{ color: 'var(--warn)' }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--warn)' }}>Запрошення в команду</span>
                          </div>
                          <p className="text-sm font-semibold mb-3 leading-tight" style={{ color: 'var(--text)' }}>
                            Користувач <span style={{ color: 'var(--brand)' }}>{inv.fromName}</span> запрошує вас до гаража
                          </p>
                          <div className="flex gap-2">
                            <button
                              disabled={processingInvites[inv.id]}
                              onClick={() => handleInviteAction(inv.id, onAcceptInvite)}
                              className="flex-1 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all"
                              style={{ background: processingInvites[inv.id] ? 'var(--text-3)' : 'var(--brand)' }}
                            >
                              {processingInvites[inv.id] ? 'Обробка...' : 'Прийняти'}
                            </button>
                            <button
                              disabled={processingInvites[inv.id]}
                              onClick={() => handleInviteAction(inv.id, onRejectInvite)}
                              className="flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                              style={{ background: 'var(--bg-hover)', color: 'var(--text-2)', border: '1px solid var(--line-2)' }}
                            >
                              Відхилити
                            </button>
                          </div>
                        </div>
                      ))}

                      {bookingNotifications.map(b => (
                        <BookingNotificationItem
                          key={b.id}
                          b={b}
                          isSto={isSto}
                          onMarkRead={onMarkRead}
                          onNavigate={() => { setShowInbox(false); navigate(isSto ? '/sto/bookings' : '/bookings') }}
                        />
                      ))}

                      {pendingApprovals.map(p => (
                        <div key={p.id} className="p-4" style={{ borderBottom: '1px solid var(--line)' }}>
                          <p className="text-[11px] mb-1" style={{ color: 'var(--text-3)' }}>
                            Новий сервіс від <span className="font-bold" style={{ color: 'var(--brand)' }}>{p.stoName}</span>
                          </p>
                          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>{p.title}</p>
                          <div className="flex gap-2">
                            <button onClick={() => onAcceptService(p.id)} className="flex-1 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all" style={{ background: 'var(--brand)' }}>Прийняти</button>
                            <button onClick={() => onRejectService(p.id)} className="flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all" style={{ background: 'var(--bg-hover)', color: 'var(--text-2)', border: '1px solid var(--line-2)' }}>Відхилити</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User avatar */}
        <div
          className="flex items-center gap-3 pl-3"
          style={{ borderLeft: '1px solid var(--line)' }}
        >
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[12px] font-bold leading-none mb-0.5" style={{ color: 'var(--text)' }}>
              {currentUser?.displayName || 'Користувач'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--brand)' }}>
              {userProfile?.accountType || 'Owner'}
            </span>
          </div>
          <div
            className="w-9 h-9 rounded-[14px] flex items-center justify-center text-white font-black text-sm relative cursor-pointer active:scale-95 transition-transform flex-none"
            style={{ background: C, boxShadow: '0 4px 12px rgba(92,62,254,0.3)' }}
          >
            {userProfile?.avatarBase64
              ? <img src={userProfile.avatarBase64} alt="" className="w-full h-full object-cover rounded-[14px]" />
              : (currentUser?.displayName?.[0]?.toUpperCase() || 'U')
            }
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
              style={{ background: 'var(--good)', border: '2px solid var(--bg-card)' }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

function BookingNotificationItem({ b, isSto, onMarkRead, onNavigate }) {
  const [status, setStatus] = useState(b.status)
  const [loading, setLoading] = useState(null)

  const act = async (e, newStatus) => {
    e.stopPropagation()
    setLoading(newStatus)
    try {
      await updateDoc(doc(db, 'bookings', b.id), { status: newStatus })
      setStatus(newStatus)
      onMarkRead(b.id)
    } catch (err) { console.error(err) }
    finally { setLoading(null) }
  }

  const isPending = status === 'pending'

  return (
    <div className="group p-4 transition-colors relative" style={{ borderBottom: '1px solid var(--line)', cursor: isSto && !isPending ? 'pointer' : 'default' }}
      onClick={!isSto || !isPending ? onNavigate : undefined}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: isPending ? 'var(--brand)' : '#64748b' }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>
            {isSto ? 'Нова заявка від клієнта' : 'Оновлення запису'}
          </span>
        </div>
        <button onClick={e => { e.stopPropagation(); onMarkRead(b.id) }}
          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg grid place-items-center transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--brand)' }}>
          <Check size={11} />
        </button>
      </div>

      {isSto ? (
        <>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
            {b.car ? `Авто ${b.car.plate}` : 'Запис'} · {b.issue || '—'}
          </p>
          <p className="text-[11px] mb-2" style={{ color: 'var(--text-3)' }}>{b.date} о {b.time}</p>
          {isPending ? (
            <div className="flex gap-2">
              <button onClick={e => act(e, 'confirmed')} disabled={!!loading}
                className="flex-1 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#10B981,#34d399)' }}>
                {loading === 'confirmed' ? '...' : '✓ Підтвердити'}
              </button>
              <button onClick={e => act(e, 'rejected')} disabled={!!loading}
                className="flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-60"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                {loading === 'rejected' ? '...' : '✕ Відхилити'}
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-bold" style={{ color: status === 'confirmed' ? '#10B981' : '#ef4444' }}>
              {status === 'confirmed' ? '✓ Підтверджено' : '✕ Відхилено'}
            </span>
          )}
        </>
      ) : (
        <>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Запис {status === 'confirmed' ? <span style={{ color: '#10B981' }}>підтверджено</span> : <span style={{ color: '#ef4444' }}>відхилено</span>}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{b.date} о {b.time}</p>
        </>
      )}
    </div>
  )
}
