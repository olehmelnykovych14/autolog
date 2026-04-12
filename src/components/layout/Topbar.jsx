import React, { useContext, useState } from 'react'
import { Sun, Moon, Bell, ChevronDown, Check, X, ShieldCheck, Clock, AlertCircle, Menu } from 'lucide-react'
import { ThemeCtx } from '../../context/ThemeContext'
import { C } from '../../constants'

export function Topbar({ isDark, setDark, incomingTransfer, onAcceptTransfer, onRejectTransfer, onLogout, currentUser, userProfile, col, setCol, pendingApprovals, bookingNotifications=[], incomingInvites=[], onAcceptInvite, onRejectInvite, onAcceptService, onRejectService, showMobileMenu, setShowMobileMenu, setTab, onMarkRead, onMarkAllRead }) {
  const [showInbox, setShowInbox] = useState(false)
  const [processingInvites, setProcessingInvites] = useState({})

  const handleInviteAction = async (id, actionFn) => {
    if (!actionFn) return
    setProcessingInvites(p => ({ ...p, [id]: true }))
    try {
      console.log(`🎫 Action started for invite: ${id}`)
      await actionFn(id)
      console.log(`✅ Action success for: ${id}`)
    } catch (e) {
      console.error(`❌ Action failed for: ${id}`, e)
      alert(`Помилка: ${e.message || 'Не вдалося виконати дію'}`)
    } finally {
      setProcessingInvites(p => ({ ...p, [id]: false }))
    }
  }

  const isSto = userProfile?.accountType === 'sto'
  const totalNotifications = pendingApprovals.length + bookingNotifications.length + incomingInvites.length

  return (
    <header className="sticky top-0 z-[50] flex items-center justify-between px-6 py-6 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <button onClick={() => setShowMobileMenu(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"><Menu size={24} /></button>
        <button onClick={() => setCol(!col)} className="hidden lg:flex p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"><Menu size={20} /></button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center p-1 shadow-sm border border-gray-100 dark:border-gray-700">
            <img src="/logo.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:flex flex-col">
            <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none mb-0.5">{isSto ? 'Кабінет партнера' : 'Мій дашборд'}</h2>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">AutoLog SaaS</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {incomingTransfer && (
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/30 rounded-2xl animate-in slide-in-from-right-4">
            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>Отримано авто</p>
            <div className="flex gap-2">
              <button onClick={onAcceptTransfer} className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"><Check size={14}/></button>
              <button onClick={onRejectTransfer} className="p-1.5 bg-white dark:bg-gray-800 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all border border-gray-200 dark:border-gray-700 shadow-sm"><X size={14}/></button>
            </div>
          </div>
        )}

        <div className="flex items-center bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
          <button onClick={() => setDark(!isDark)} className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all text-gray-400 hover:text-[#5C3EFE] shadow-sm hover:shadow-indigo-500/10 active:scale-90">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <div className="relative">
            <button onClick={() => setShowInbox(!showInbox)} className={`p-2.5 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all text-gray-400 hover:text-[#5C3EFE] shadow-sm hover:shadow-indigo-500/10 active:scale-90 ${totalNotifications > 0 ? 'text-[#5C3EFE]' : ''}`}>
              <Bell size={18} />
              {totalNotifications > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-950 animate-pulse"></span>}
            </button>
            {showInbox && (
              <div className="absolute top-full right-0 mt-4 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in slide-in-from-top-4">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900 dark:text-white">Сповіщення</h3>
                    <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full">{totalNotifications}</span>
                  </div>
                  {totalNotifications > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); onMarkAllRead(); }} className="text-[10px] font-black text-[#5C3EFE] hover:text-indigo-700 transition-colors uppercase tracking-widest">Прочитати всі</button>
                  )}
                </div>
                <div className="max-h-[22rem] overflow-y-auto custom-scrollbar">
                  {totalNotifications === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-300">
                        <Bell size={24}/>
                      </div>
                      <p className="text-sm text-gray-400 font-medium tracking-tight">Поки що немає нових сповіщень</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-700 flex flex-col">
                      {/* Team Invitations */}
                      {incomingInvites.map(inv => (
                        <div key={inv.id} className="p-4 bg-amber-50/30 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={14} className="text-amber-500" />
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Запрошення в команду</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 leading-tight">Користувач <span className="text-[#5C3EFE]">{inv.fromName}</span> запрошує вас приєднатися до гаража.</p>
                          <div className="flex gap-2">
                            <button 
                              disabled={processingInvites[inv.id]}
                              onClick={() => handleInviteAction(inv.id, onAcceptInvite)} 
                              className={`flex-1 py-1.5 bg-[#5C3EFE] text-white text-[10px] font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20 ${processingInvites[inv.id] ? 'opacity-50 cursor-wait' : 'hover:bg-indigo-600'}`}
                            >
                              {processingInvites[inv.id] ? 'ОБРОБКА...' : 'ПРИЙНЯТИ'}
                            </button>
                            <button 
                              disabled={processingInvites[inv.id]}
                              onClick={() => handleInviteAction(inv.id, onRejectInvite)} 
                              className={`flex-1 py-1.5 bg-white dark:bg-gray-800 text-gray-400 text-[10px] font-bold rounded-lg transition-all border border-gray-200 dark:border-gray-700 shadow-sm ${processingInvites[inv.id] ? 'opacity-50 cursor-wait' : 'hover:bg-red-50 hover:text-red-500'}`}
                            >
                              ВІДХИЛИТИ
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Booking Notifications */}
                      {bookingNotifications.map(b => (
                        <div key={b.id} className="group p-4 bg-indigo-50/30 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer relative" onClick={() => { setShowInbox(false); setTab(isSto ? 'sto_bookings' : 'bookings') }}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                              <p className="text-xs text-gray-500 font-medium">Нове оновлення запису</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onMarkRead(b.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 bg-white dark:bg-gray-800 text-[#5C3EFE] rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:bg-indigo-50 transition-all">
                              <Check size={12} />
                            </button>
                          </div>
                          {isSto ? (
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1"><span className="text-[#5C3EFE]">Нова заявка</span> від клієнта на авто {b.car ? `${b.car.plate}` : ''}</p>
                          ) : (
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Запис {b.status === 'confirmed' ? 'ПІДТВЕРДЖЕНО' : 'ВІДХИЛЕНО'}</p>
                          )}
                          <p className="text-xs text-gray-400">{b.date || 'unknown'} о {b.time || 'unknown'}</p>
                        </div>
                      ))}

                      {/* Approval Notifications */}
                      {pendingApprovals.map(p => (
                        <div key={p.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <p className="text-xs text-gray-500 mb-1">Новий сервіс від <span className="font-bold text-[#5C3EFE]">{p.stoName}</span></p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 tracking-tight">{p.title}</p>
                          <div className="flex gap-2">
                            <button onClick={() => onAcceptService(p.id)} className="flex-1 py-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">ПРИЙНЯТИ</button>
                            <button onClick={() => onRejectService(p.id)} className="flex-1 py-1.5 bg-white dark:bg-gray-800 text-gray-400 text-[10px] font-bold rounded-lg hover:bg-red-50 hover:text-red-500 transition-all border border-gray-200 dark:border-gray-700 shadow-sm">ВІДХИЛИТИ</button>
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

        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-100 dark:border-gray-800">
          <div className="hidden sm:flex flex-col items-end shrink-0">
            <p className="text-xs font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">{currentUser?.displayName || 'Користувач'}</p>
            <span className="text-[10px] font-bold text-[#5C3EFE] uppercase tracking-wider">{userProfile?.accountType || 'Owner'}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20 relative cursor-pointer active:scale-95 transition-transform" style={{ background: C }}>
            {userProfile?.avatarBase64 ? <img src={userProfile.avatarBase64} alt="" className="w-full h-full object-cover rounded-2xl" /> : (currentUser?.displayName?.[0]?.toUpperCase() || 'U')}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  )
}
