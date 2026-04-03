import React from 'react'
import { Plus, UserPlus, Shield, Eye, Trash2 } from 'lucide-react'
import { C } from '../../constants'

export function TeamView({ teamMembers, limit, onRemove, onInvite }) {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12 w-full pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Ваша команда</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">Керуйте доступом до вашого гаража для родини або співвласників.</p>
        </div>
        <button 
          onClick={onInvite} 
          className="flex items-center justify-center gap-3 px-8 py-4 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-center"
          style={{ background: C }}
        >
          <UserPlus size={20} /> Запросити
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/60 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs">Учасники ({teamMembers.length} з {limit})</h3>
          </div>
          <div className="h-1.5 w-32 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(teamMembers.length / limit) * 100}%` }}></div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {teamMembers.map(m => (
            <div key={m.id} className="group flex items-center justify-between p-4 bg-[#F8FAFC] dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm" style={{ background: C }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                    {m.status === 'pending' && (
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-bold rounded-md border border-amber-100 dark:border-amber-800/40 tracking-wider">Очікує</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{m.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm tracking-wide">
                  {m.role === 'owner' ? <Shield size={12} className="text-indigo-500" /> : <Eye size={12} className="text-gray-400" />}
                  <span className="text-[10px] font-black uppercase text-gray-400">{m.role === 'owner' ? 'Власник' : m.role === 'admin' ? 'Адмін' : 'Перегляд'}</span>
                </div>
                {m.role !== 'owner' && (
                  <button onClick={() => onRemove(m.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={18} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Shield size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Адміністратор</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Повний доступ до всіх функцій та керування командою.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
              <Eye size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Спостерігач</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Лише перегляд автомобілів без права внесення змін.</p>
        </div>
      </div>
    </div>
  )
}
