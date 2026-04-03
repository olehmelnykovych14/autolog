import { Printer, Download, X, ShieldCheck, Activity, MapPin, Calendar, Layers, FileText, FileSpreadsheet, Lock, Info } from 'lucide-react'
import { Modal } from '../common/Common'
import { fmt, fmtCost } from '../../utils'
import { C, CAT, PLANS } from '../../constants'

export function CarReportModal({ car, historyList, userProfile, onClose }) {
  const records = historyList.filter(h => h.carId === car.id)
  const totalSpend = records.reduce((s, h) => s + (h.cost || 0), 0)
  
  const activePlan = PLANS.find(p => p.id === (userProfile?.plan || 'Free')) || PLANS[0]
  const isPremium = ['Premium', 'Business'].includes(activePlan.id)
  const isBusiness = activePlan.id === 'Business'

  const print = () => {
    window.print()
  }

  const exportExcel = () => {
    alert("Експорт в Excel активовано для Business плану. (Demo)")
  }

  return (
    <Modal title={isBusiness ? `Звіт: ${userProfile?.stoName || 'AutoLog Business'}` : (isPremium ? 'Carfax-AutoLog Преміум Звіт' : 'Базовий Звіт AutoLog')} onClose={onClose}>
      <div className="flex flex-col gap-6 print:p-0">
        {isBusiness && userProfile?.stoName && (
          <div className="px-6 py-3 bg-gray-900 text-white rounded-2xl flex items-center justify-between border border-gray-800">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Обслуговується в</p>
              <p className="text-sm font-black">{userProfile.stoName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Адреса</p>
              <p className="text-[10px] font-bold text-gray-400">{userProfile.stoAddress}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[#5C3EFE] shrink-0 border-2 border-indigo-100 dark:border-indigo-800/50 shadow-inner overflow-hidden">
            {car.image ? <img src={car.image} alt="" className="w-full h-full object-cover" /> : <ShieldCheck size={40}/>}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">{car.brand} {car.model}</h3>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{car.plate} • {car.year} • {fmt(car.mileage)} КМ</p>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><Activity size={14}/> {records.length} записів</div>
              {isPremium ? (
                <div className="flex items-center gap-2 text-xs font-bold text-[#5C3EFE]"><ShieldCheck size={14}/> ВЕРІФІКОВАНО</div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400"><Info size={14}/> БАЗОВИЙ ДОСТУП</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/40">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">ЗАГАЛЬНІ ВИТРАТИ</p>
            <p className="text-2xl font-black text-[#5C3EFE]">{fmt(totalSpend)} <span className="text-sm">₴</span></p>
          </div>
          <div className="p-5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/60">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">СТАТУС ЗВІТУ</p>
            <p className="text-2xl font-black text-green-500">{isPremium ? 'CLEAN' : 'BASIC'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs px-2">Історія обслуговування</h4>
          <div className="overflow-hidden border border-gray-100 dark:border-gray-700 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-400 uppercase tracking-wider">Дата / Пробіг</th>
                  <th className="px-4 py-3 font-bold text-gray-400 uppercase tracking-wider">Опис робіт</th>
                  <th className="px-4 py-3 font-bold text-gray-400 uppercase tracking-wider text-right">Вартість</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {records.sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-900 dark:text-white">{r.date?.split('-').reverse().join('.')}</p>
                      <p className="text-[10px] text-gray-400">{fmt(r.mileage)} км</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">{r.title}</p>
                      <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 text-[8px] font-black uppercase rounded-md tracking-widest border border-indigo-100 dark:border-indigo-800/20">{CAT[r.category]}</span><span className="text-[10px] text-gray-400 font-medium truncate max-w-[100px]">{r.garage}</span></div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="font-black text-gray-900 dark:text-white text-sm">{fmtCost(r.cost)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 print:hidden">
          <button onClick={print} className="flex-1 min-w-[200px] py-4 bg-gray-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-xl shadow-gray-400/20 active:scale-95">
            <Printer size={18} /> ДРУКУВАТИ ЗВІТ
          </button>
          
          {isBusiness ? (
            <button onClick={exportExcel} className="flex-1 min-w-[200px] py-4 bg-green-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-xl shadow-green-500/20 active:scale-95">
              <FileSpreadsheet size={18} /> ЕКСПОРТ В EXCEL
            </button>
          ) : (
            isPremium ? (
              <button className="flex-1 min-w-[200px] py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 active:scale-95">
                <Download size={18} /> ЗАВАНТАЖИТИ PDF
              </button>
            ) : (
              <button disabled className="flex-1 min-w-[200px] py-4 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl font-black text-sm flex items-center justify-center gap-3 border border-dashed border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-60">
                <Lock size={16} /> PDF ТІЛЬКИ В PREMIUM
              </button>
            )
          )}
        </div>
      </div>
    </Modal>
  )
}
