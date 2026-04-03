import React, { useState, useEffect, useContext } from 'react'
import { Search, Loader2, Shield, Eye, Trash2, CheckCircle2, ChevronRight, Mail, Phone, Calendar, Edit } from 'lucide-react'
import { ThemeCtx } from '../../context/ThemeContext'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'

export function AdminView() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const isDark = useContext(ThemeCtx)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  }, [])

  const filtered = users.filter(u => 
    (u.email || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.stoName || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12 w-full pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight uppercase tracking-tighter">Панель керування</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">Управління користувачами платформи та моніторинг активності.</p>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Пошук за email або назвою..." 
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-bold uppercase tracking-widest text-[10px] border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-8 py-5">Користувач</th>
                <th className="px-6 py-5">Тіп акаунту</th>
                <th className="px-6 py-5">Контакти</th>
                <th className="px-6 py-5">Підписка</th>
                <th className="px-8 py-5 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-500 font-black text-sm border border-indigo-100 dark:border-indigo-800/50 shrink-0">
                        {u.avatarBase64 ? <img src={u.avatarBase64} alt="" className="w-full h-full object-cover rounded-2xl" /> : (u.displayName?.[0] || 'U')}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white mb-0.5 tracking-tight">{u.displayName || 'Невідомо'}</p>
                        <p className="text-[11px] text-gray-400 font-medium lowercase tracking-tight">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${u.accountType === 'sto' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'}`}>
                      {u.accountType === 'sto' ? 'СТО Партнер' : 'Власник авто'}
                    </span>
                    {u.stoName && <p className="text-[10px] font-bold text-gray-400 mt-1 ml-1 truncate max-w-[150px]">{u.stoName}</p>}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1 text-[11px] font-medium text-gray-500">
                      <div className="flex items-center gap-2"><Phone size={12} className="text-gray-300"/> {u.phone || '—'}</div>
                      <div className="flex items-center gap-2"><Calendar size={12} className="text-gray-300"/> {u.city || '—'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight ${u.plan === 'Premium' || u.plan === 'Business' || u.stoSubscription === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {u.accountType === 'sto' ? (u.stoSubscription === 'active' ? 'ACTIVE' : 'INACTIVE') : (u.plan || 'Free')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all"><Edit size={16}/></button>
                      <button className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


