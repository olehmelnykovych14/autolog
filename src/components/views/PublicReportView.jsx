import React, { useState, useEffect } from 'react'
import { ShieldCheck, Activity } from 'lucide-react'
import { db } from '../../firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { fmt, fmtCost, getBrandLogo } from '../../utils'
import { CAT } from '../../constants'

export function PublicReportView({ carId }) {
  const [car, setCar] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const carRef = doc(db, 'cars', carId)
        const carSnap = await getDoc(carRef)
        
        if (!carSnap.exists()) {
          setError(`АВТО З ID [${carId}] ТРАНЗИТОМ ЧЕРЕЗ FIREBASE НЕ ЗНАЙДЕНО`)
          setLoading(false)
          return
        }

        const carData = { id: carSnap.id, ...carSnap.data() }
        
        if (!carData.isPublic) {
          setError('Цей звіт є приватним і доступний лише власнику.')
          setLoading(false)
          return
        }

        setCar(carData)

        // Fetch history
        const historyQ = query(collection(db, 'history'), where('carId', '==', carId))
        const histSnap = await getDocs(historyQ)
        const hList = histSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        
        hList.sort((a, b) => {
          const dA = new Date(a.date).getTime()
          const dB = new Date(b.date).getTime()
          if (dA === dB) return (b.createdAt || 0) - (a.createdAt || 0)
          return dB - dA
        })
        
        setHistoryList(hList)
        setLoading(false)
      } catch (e) {
        console.error("Помилка завантаження публічного звіту:", e)
        setError(`FIREBASE PERMISSION ERROR: ${e.message}`)
        setLoading(false)
      }
    }
    fetchData()
  }, [carId])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Збираємо дані...</p>
        </div>
      </div>
    )
  }

  if (error || !car) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-xl">
          <ShieldCheck size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">ДОСТУП ОБМЕЖЕНО</h2>
          <p className="text-sm font-medium text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  const logo = getBrandLogo(car.brand)
  const totalSpend = historyList.reduce((s, h) => s + (h.cost || 0), 0)

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 text-gray-900 dark:text-white pb-20">
      <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="AutoLog" className="w-8 h-8 rounded-xl object-contain drop-shadow-md" />
             <span className="font-black text-lg tracking-tight uppercase">AutoLog Report</span>
          </div>
          <a href="/" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black uppercase hover:bg-gray-200 dark:hover:bg-gray-700 transition">
             Створити свій гараж
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-8 px-4 sm:px-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[#5C3EFE] shrink-0 border-2 border-indigo-100 dark:border-indigo-800/50 overflow-hidden relative">
            {logo && (
              <img 
                src={logo} 
                alt={car.brand} 
                className="w-16 h-16 object-contain opacity-80" 
                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
              />
            )}
            <div className={`w-full h-full items-center justify-center ${logo ? 'hidden' : 'flex'}`}>
              <span className="text-4xl font-black text-indigo-400/50 dark:text-indigo-400/30 uppercase">{car.brand?.[0] || '?'}</span>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{car.brand} {car.model}</h3>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{car.plate} • {car.year} • {fmt(car.mileage)} КМ</p>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><Activity size={14}/> {historyList.length} записів</div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#5C3EFE]"><ShieldCheck size={14}/> ПІДТВЕРДЖЕНО AUTOLOG</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/40">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">ЗАГАЛЬНІ ВИТРАТИ</p>
            <p className="text-2xl font-black text-[#5C3EFE]">{fmtCost(totalSpend)} <span className="text-sm">₴</span></p>
          </div>
          <div className="p-5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/60">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">СТАТУС ЗВІТУ</p>
            <p className="text-2xl font-black text-green-500">PUBLIC</p>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs px-2 mb-4">Історія обслуговування</h4>
          <div className="overflow-hidden border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Дата / Пробіг</th>
                  <th className="px-5 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Опис робіт</th>
                  <th className="px-5 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-right">Вартість</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {historyList.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-5 py-5 whitespace-nowrap">
                      <p className="font-bold text-gray-900 dark:text-white">{r.date?.split('-').reverse().join('.')}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{r.mileage ? `${fmt(r.mileage)} км` : '—'}</p>
                    </td>
                    <td className="px-5 py-5">
                      <p className="font-bold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight">{r.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 text-[9px] font-black uppercase rounded-md tracking-widest border border-indigo-100 dark:border-indigo-800/20">{CAT[r.category] || 'ІНШЕ'}</span>
                        <span className="text-[10px] text-gray-500 font-medium">{r.garage}</span>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-right whitespace-nowrap">
                      <p className="font-black text-gray-900 dark:text-white">{fmtCost(r.cost)}</p>
                    </td>
                  </tr>
                ))}
                {historyList.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-5 py-8 text-center text-gray-500 text-sm font-medium">Історія порожня.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
