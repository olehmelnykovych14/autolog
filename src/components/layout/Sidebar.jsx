import React, { useContext } from 'react'
import { LogOut, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ThemeCtx } from '../../context/ThemeContext'
import { NAV_OWNER, NAV_STO } from '../../constants'

export function Sidebar({ tab, setTab, col, setCol, isAdmin, userProfile, showMobileMenu, setShowMobileMenu, onLogout }) {
  const isDark = useContext(ThemeCtx)
  const isSto = userProfile?.accountType === 'sto'
  const navSource = isSto ? NAV_STO : NAV_OWNER
  const links = navSource.filter(n => n.id !== 'admin' || isAdmin)

  const sidebarBg = isDark
    ? 'bg-[#0B1120] border-[rgba(30,41,59,0.9)]'
    : 'bg-white border-[rgba(226,232,240,0.8)]'

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] transition-opacity duration-300 ${showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'} lg:hidden`}
        onClick={() => setShowMobileMenu(false)}
      />

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-[60] flex flex-col h-full border-r ${sidebarBg} transition-all duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] transform ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${col ? 'w-[72px]' : 'w-[272px]'} overflow-hidden`}
        style={{ background: isDark ? '#0B1120' : 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-7 pb-5 flex-none">
          <div
            className="w-10 h-10 rounded-[14px] flex items-center justify-center p-1.5 flex-none overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line-2)',
              boxShadow: '0 4px 12px rgba(92,62,254,0.25)'
            }}
          >
            <img src="/logo.png" alt="AutoLog" className="w-full h-full object-contain" />
          </div>
          {!col && (
            <span
              className="text-[22px] font-black tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300"
              style={{ color: 'var(--text)' }}
            >
              AutoLog
            </span>
          )}
          <button
            onClick={() => setShowMobileMenu(false)}
            className="lg:hidden ml-auto p-1.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X size={20} style={{ color: 'var(--text-3)' }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto flex flex-col gap-0.5 no-scrollbar">
          {links.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setShowMobileMenu(false) }}
                className={`w-full flex items-center gap-[14px] px-3 py-[11px] rounded-2xl text-sm font-semibold transition-all duration-[250ms] ease-[cubic-bezier(.22,1,.36,1)] relative border-0 text-left ${col ? 'justify-center' : ''}`}
                style={{
                  background: active ? 'var(--brand)' : 'transparent',
                  color: active ? 'white' : 'var(--text-2)',
                  boxShadow: active ? '0 8px 24px -4px rgba(92,62,254,0.35)' : 'none',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; if (!active) e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; if (!active) e.currentTarget.style.color = 'var(--text-2)' }}
              >
                <span className="w-5 h-5 flex-none flex items-center justify-center">
                  <Icon size={20} />
                </span>
                {!col && (
                  <>
                    <span className="flex-1 truncate transition-opacity duration-300">{item.label}</span>
                    {active && (
                      <ChevronRight size={15} className="ml-auto opacity-50 flex-none" />
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="p-3 flex-none"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-[14px] px-3 py-[11px] rounded-2xl text-sm font-semibold transition-all duration-200 ${col ? 'justify-center' : ''}`}
            style={{ color: 'var(--bad)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={20} className="flex-none" />
            {!col && <span>Вийти</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
