import React, { useState } from 'react'
import { Search, Car, ClipboardList, Zap, ShieldCheck, Mail, Send, Activity, Bookmark, Info, ChevronRight, Loader2 } from 'lucide-react'
import { Field, inp_cls, PrimaryBtn } from '../common/Common'
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { C } from '../../constants'
import { AddVerifiedServiceModal } from '../modals/Modals'

export function STODashboardView({ userProfile, setTab }) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [foundCar, setFoundCar] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [err, setErr] = useState('')

  const isInactive = userProfile?.stoSubscription !== 'active'

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!search.trim()) return
    setLoading(true)
    setErr('')
    setFoundCar(null)
    try {
      const q = query(collection(db, 'cars'), where('plate', '==', search.trim().toUpperCase()))
      const snap = await getDocs(q)
      if (snap.empty) {
        const qv = query(collection(db, 'cars'), where('vin', '==', search.trim().toUpperCase()))
        const snapv = await getDocs(qv)
        if (snapv.empty) {
          setErr('Автомобіль не знайдено в системі AutoLog.')
        } else {
          setFoundCar({ id: snapv.docs[0].id, ...snapv.docs[0].data() })
        }
      } else {
        setFoundCar({ id: snap.docs[0].id, ...snap.docs[0].data() })
      }
    } catch (e) {
      console.error(e)
      setErr('Помилка пошуку.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12 w-full pt-4 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Кабінет партнера</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">Верифікація сервісних робіт та пошук автомобілів у базі.</p>
        </div>
        {isInactive && (
          <button onClick={() => setTab('sto_plans')} className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-xs shadow-sm hover:bg-amber-200 transition-all border border-amber-200">
             <Zap size={14}/> Підписка неактивна
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/60 p-6 sm:p-10 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Знайти автомобіль клієнта</h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value.toUpperCase().slice(0, 17))} 
              placeholder="Введіть номер або VIN..." 
              maxLength={17}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-gray-900 dark:text-white uppercase font-mono tracking-wider"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="px-10 py-4 bg-[#5C3EFE] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 min-w-[160px]"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <><Car size={20}/> Пошук</>}
          </button>
        </form>
        {err && <p className="mt-4 text-sm font-bold text-red-500 ml-4 flex items-center gap-2 animate-in slide-in-from-top-2"><Info size={14}/> {err}</p>}
      </div>

      {foundCar && (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border-2 border-[#5C3EFE] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[#5C3EFE] border-2 border-indigo-100 dark:border-indigo-800/50 shadow-inner">
                {foundCar.image ? <img src={foundCar.image} alt="" className="w-full h-full object-cover rounded-[2rem]" /> : <Car size={28}/>}
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{foundCar.brand} {foundCar.model}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-black rounded-md tracking-widest">{foundCar.plate}</span>
                  <p className="text-xs text-gray-400 font-medium">VIN: <span className="text-gray-700 dark:text-gray-300 font-bold uppercase">{foundCar.vin || '—'}</span></p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(true)} disabled={isInactive} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all disabled:opacity-50">
                <ShieldCheck size={20}/> Верифікувати ТО
              </button>
            </div>
          </div>
          
          <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/40 flex items-start gap-4">
             <div className="mt-1"><Info size={18} className="text-blue-500"/></div>
             <p className="text-sm text-blue-900 dark:text-blue-200 font-medium leading-relaxed italic opacity-80">
               "Верифіковані записи проходять обов'язкову перевірку користувачем. Після підтвердження, цей запис назавжди залишиться у звіті Carfax-AutoLog як перевірений вашим СТО."
             </p>
          </div>
        </div>
      )}

      {showModal && (
        <AddVerifiedServiceModal 
          car={foundCar} 
          userProfile={userProfile}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setFoundCar(null); setErr('Запис надіслано клієнту!'); }}
        />
      )}
    </div>
  )
}
