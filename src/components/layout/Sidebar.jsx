import React, { useContext } from 'react'
import { ChevronRight, ChevronLeft, LogOut, X, HelpCircle, Zap } from 'lucide-react'
import { ThemeCtx } from '../../context/ThemeContext'
import { NAV_OWNER, NAV_STO } from '../../constants'

export function Sidebar({ tab, setTab, col, setCol, isAdmin, userProfile, showMobileMenu, setShowMobileMenu, onLogout }) {
  const isDark = useContext(ThemeCtx)
  const isSto = userProfile?.accountType === 'sto'
  const navSource = isSto ? NAV_STO : NAV_OWNER
  const links = navSource.filter(n => n.id !== 'admin' || isAdmin)

  // STO uses a dark, sleek dark sidebar; Owner uses standard light/dark
  const isStoDark = isSto

  const sidebarBg = isStoDark
    ? 'bg-[#0A0F1E] border-[#1E293B]/80'
    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/80'

  const logoText = isStoDark ? 'text-white' : 'text-gray-900 dark:text-white'
  const logoSub = isStoDark ? 'text-indigo-400/60' : ''

  const navItemActive = isStoDark
    ? 'bg-[#5C3EFE] text-white shadow-lg shadow-indigo-500/20'
    : 'bg-[#5C3EFE] text-white shadow-xl shadow-indigo-500/25'

  const navItemInactive = isStoDark
    ? 'text-gray-400 hover:text-white hover:bg-white/5'
    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'

  const dividerClass = isStoDark
    ? 'border-gray-800/60'
    : 'border-gray-100 dark:border-gray-800'

  const logoutClass = isStoDark
    ? 'text-gray-500 hover:text-red-400 hover:bg-red-400/10'
    : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] transition-opacity duration-300 ${showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'} lg:hidden`}
        onClick={() => setShowMobileMenu(false)}
      />

      <aside className={`fixed lg:static inset-y-0 left-0 z-[60] flex flex-col h-full border-r ${sidebarBg} transition-all duration-500 ease-in-out transform ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${col ? 'w-20' : 'w-72 sm:w-80 lg:w-72'}`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center p-1.5 shadow-lg shrink-0 ${isStoDark ? 'bg-[#5C3EFE] shadow-indigo-500/30' : 'bg-white dark:bg-gray-800 shadow-indigo-500/10 border border-gray-100 dark:border-gray-700'}`}>
              <img src="/logo.png" alt="AutoLog" className="w-full h-full object-contain" />
            </div>
            {!col && (
              <div>
                <h1 className={`text-xl font-black tracking-tight transition-opacity duration-300 ${logoText}`}>
                  AutoLog{isStoDark && <span className="text-[#5C3EFE] ml-0.5"> Pro</span>}
                </h1>
                {isStoDark && (
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Partner Cabinet</p>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setShowMobileMenu(false)} className={`lg:hidden p-2 ${isStoDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <X size={24} />
          </button>
        </div>

        {/* Subscription badge for STO */}
        {isStoDark && !col && userProfile?.stoSubscription === 'active' && (
          <div className="mx-4 mb-4 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#5C3EFE]/20 to-indigo-900/20 border border-[#5C3EFE]/20 flex items-center gap-2">
            <Zap size={14} className="text-[#5C3EFE] shrink-0" />
            <div>
              <p className="text-[10px] font-black text-[#5C3EFE] uppercase tracking-widest">Pro Active</p>
              <p className="text-[10px] text-gray-500">Partner Verified</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {links.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setShowMobileMenu(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 group relative ${active ? navItemActive : navItemInactive}`}
              >
                <Icon size={19} className={active ? 'text-white' : (isStoDark ? 'group-hover:text-[#5C3EFE] transition-colors' : 'group-hover:text-[#5C3EFE] transition-colors')} />
                {!col && <span className="truncate">{item.label}</span>}
                {active && !col && <ChevronRight size={15} className="ml-auto opacity-50" />}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className={`p-4 border-t ${dividerClass} space-y-1`}>
          {isStoDark && !col && (
            <button className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200`}>
              <HelpCircle size={19} />
              <span>Help Center</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm ${logoutClass} transition-all duration-200`}
          >
            <LogOut size={19} />
            {!col && <span>{isStoDark ? 'Log Out' : 'Вийти'}</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
