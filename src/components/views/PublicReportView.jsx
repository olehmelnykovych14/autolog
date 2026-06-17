import React, { useState, useEffect, useRef } from 'react'
import { ShieldCheck, Activity, Download, Loader2 } from 'lucide-react'
import { db } from '../../firebase'
import { doc, getDoc, collection, query, where, getDocs, disableNetwork } from 'firebase/firestore'
import { fmt, fmtCost, fmtDate, getBrandLogo, docStatus } from '../../utils'
import { CAT, DOC_TYPES } from '../../constants'

export function PublicReportView({ carId }) {
  const [car, setCar] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const reportRef = useRef(null)

  const downloadPdf = async () => {
    if (!reportRef.current) return
    setPdfLoading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf().set({
        margin: 8,
        filename: `AutoLog-${car?.brand || 'auto'}-${car?.plate || car?.id || ''}.pdf`.replace(/\s+/g, '-'),
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(reportRef.current).save()
    } catch (e) {
      console.error('PDF export error:', e)
      alert('Не вдалося згенерувати PDF. Спробуйте ще раз.')
    } finally {
      setPdfLoading(false)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const carRef = doc(db, 'cars', carId)
        const carSnap = await getDoc(carRef)
        
        if (!carSnap.exists()) {
          setNotFound(true)
          setLoading(false)
          if (typeof window !== 'undefined' && window.navigator.webdriver) {
            disableNetwork(db).catch(console.error)
          }
          return
        }

        const carData = { id: carSnap.id, ...carSnap.data() }
        
        if (!carData.isPublic) {
          setError('Цей звіт є приватним і доступний лише власнику.')
          setLoading(false)
          if (typeof window !== 'undefined' && window.navigator.webdriver) {
            disableNetwork(db).catch(console.error)
          }
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
        if (typeof window !== 'undefined' && window.navigator.webdriver) {
          disableNetwork(db).catch(console.error)
        }
      } catch (e) {
        console.error("Помилка завантаження публічного звіту:", e)
        setNotFound(true)
        setLoading(false)
        if (typeof window !== 'undefined' && window.navigator.webdriver) {
          disableNetwork(db).catch(console.error)
        }
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

  if (notFound) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 text-center text-gray-900 dark:text-white">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl animate-in fade-in duration-300">
          <ShieldCheck size={48} className="mx-auto text-red-500 mb-4 animate-pulse" />
          <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Звіт не знайдено</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">Можливо, посилання застаріло або власник видалив авто.</p>
          <a href="/" className="inline-block px-6 py-3 bg-[#5C3EFE] text-white rounded-xl text-sm font-black uppercase hover:opacity-90 transition shadow-lg shadow-indigo-500/20">На головну</a>
        </div>
      </div>
    )
  }

  if (error || !car) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 text-center text-gray-900 dark:text-white">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl animate-in fade-in duration-300">
          <ShieldCheck size={48} className="mx-auto text-red-500 mb-4 animate-pulse" />
          <h2 className="text-xl font-black uppercase tracking-tight mb-2 text-red-500">Доступ обмежено</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
            На жаль, звіт не знайдено, доступ обмежено або автомобіль було видалено.
          </p>
          <a href="/" className="inline-block px-6 py-3 bg-[#5C3EFE] text-white rounded-xl text-sm font-black uppercase hover:opacity-90 transition shadow-lg shadow-indigo-500/20">На головну</a>
        </div>
      </div>
    )
  }

  const logo = getBrandLogo(car.brand)
  const totalSpend = historyList.reduce((s, h) => s + (h.cost || 0), 0)

  const specs = [
    { l: 'VIN', v: car.vin },
    { l: 'Рік', v: car.year },
    { l: 'Пробіг', v: car.mileage ? `${fmt(car.mileage)} км` : '' },
    { l: 'Тип палива', v: car.fuelType },
    { l: 'Двигун', v: car.engineL ? `${Number(car.engineL).toFixed(1)}L${car.engineCyl ? ` · ${car.engineCyl} цил.` : ''}` : '' },
    { l: 'Привід', v: car.driveType },
    { l: 'КПП', v: car.transmission },
    { l: 'Кузов', v: car.bodyClass },
  ].filter(s => s.v)

  // Документи: тільки тип + дійсність (без номерів), дійсні першими.
  const passportDocs = (Array.isArray(car.documents) ? car.documents : [])
    .filter(d => d.expires)
    .map(d => ({ type: d.type, expires: d.expires, _s: docStatus(d.expires) }))
    .sort((a, b) => (b._s.days ?? -1e9) - (a._s.days ?? -1e9))

  return (
    <div className="h-screen overflow-y-auto bg-[#F8FAFC] dark:bg-gray-950 text-gray-900 dark:text-white pb-20">
      <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src="/logo.svg" alt="AutoLog" className="w-8 h-8 rounded-xl object-contain drop-shadow-md" />
             <span className="font-black text-lg tracking-tight uppercase">AutoLog Report</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="px-4 py-2 bg-[#5C3EFE] text-white rounded-xl text-xs font-black uppercase hover:opacity-90 transition flex items-center gap-2 disabled:opacity-60"
            >
              {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">{pdfLoading ? 'Готуємо…' : 'Завантажити PDF'}</span>
            </button>
            <a href="/" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black uppercase hover:bg-gray-200 dark:hover:bg-gray-700 transition">
               <span className="hidden sm:inline">Створити свій гараж</span>
               <span className="sm:hidden">Гараж</span>
            </a>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="max-w-3xl mx-auto mt-8 px-4 sm:px-6">
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

        {specs.length > 0 && (
          <div className="mt-6">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs px-2 mb-4">Характеристики</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              {specs.map((s, i) => (
                <div key={i}>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.l}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white break-words">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {passportDocs.length > 0 && (
          <div className="mt-6">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs px-2 mb-4">Документи</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {passportDocs.map((d, i) => (
                <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${d._s.hex}1a`, color: d._s.hex }}>
                    <ShieldCheck size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{DOC_TYPES[d.type] || 'Документ'}</p>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">до {fmtDate(d.expires)}</p>
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0" style={{ background: `${d._s.hex}1a`, color: d._s.hex }}>{d._s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
