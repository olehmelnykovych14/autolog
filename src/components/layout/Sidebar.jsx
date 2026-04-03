import React, { useContext } from 'react'
import { ChevronRight, ChevronLeft, LogOut, X } from 'lucide-react'
import { ThemeCtx } from '../../context/ThemeContext'
import { NAV_OWNER, NAV_STO } from '../../constants'

export function Sidebar({ tab, setTab, col, setCol, isAdmin, userProfile, showMobileMenu, setShowMobileMenu, onLogout }) {
  const isDark = useContext(ThemeCtx)
  const isSto = userProfile?.accountType === 'sto'
  const navSource = isSto ? NAV_STO : NAV_OWNER
  const links = navSource.filter(n => n.id !== 'admin' || isAdmin)
  
  const bgClass = isSto 
    ? (isDark ? "bg-[#0F172A] border-[#1E293B]" : "bg-white border-gray-200") 
    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] transition-opacity duration-300 ${showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'} lg:hidden`}
        onClick={() => setShowMobileMenu(false)}
      />

      <aside className={`fixed lg:static inset-y-0 left-0 z-[60] flex flex-col h-full border-r ${bgClass} transition-all duration-500 ease-in-out transform ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${col ? 'w-20' : 'w-72 sm:w-80 lg:w-72'}`}>
        <div className="flex items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center p-1.5 shadow-lg shadow-indigo-500/10 shrink-0 border border-gray-100 dark:border-gray-700">
              <img src="/logo.png" alt="AutoLog" className="w-full h-full object-contain" />
            </div>
            {!col && <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white transition-opacity duration-300">AutoLog</h1>}
          </div>
          <button onClick={() => setShowMobileMenu(false)} className="lg:hidden p-2 text-gray-400">
            <X size={24} />
          </button>
        </div>


        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          {links.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setShowMobileMenu(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 group relative ${active ? 'bg-[#5C3EFE] text-white shadow-xl shadow-indigo-500/25' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Icon size={20} className={active ? 'text-white' : 'group-hover:text-[#5C3EFE] transition-colors'} />
                {!col && <span className="truncate">{item.label}</span>}
                {active && !col && <ChevronRight size={16} className="ml-auto opacity-50" />}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
          >
            <LogOut size={20} />
            {!col && <span>Вийти</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
