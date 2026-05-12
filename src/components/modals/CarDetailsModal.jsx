import React from 'react'
import { Share2, ClipboardList, TrendingUp } from 'lucide-react'
import { Modal, PrimaryBtn } from '../common/Common'
import { fmt, getBrandLogo } from '../../utils'
import { C } from '../../constants'
import { db } from '../../firebase'
import { doc, updateDoc } from 'firebase/firestore'

export function CarDetailsModal({ car, onClose, onGoService, onGoReport, onGoTransfer }) {
  const [isCopied, setIsCopied] = React.useState(false)
  const [isSharing, setIsSharing] = React.useState(false)
  const logo = getBrandLogo(car.brand)

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${car.id}`
    
    // Копіюємо безпечно спочатку (поки контекст кліку миші активний)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = shareUrl
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 3000)
    } catch (e) {
      console.error('Clipboard error:', e)
      alert("Скопіюйте посилання вручну: " + shareUrl)
    }

    // Робимо авто публічним фоном
    if (!car.isPublic) {
      setIsSharing(true)
      try {
        await updateDoc(doc(db, 'cars', car.id), { isPublic: true })
      } catch(e) {
        console.error('DB Share update error:', e)
      }
      setIsSharing(false)
    }
  }

  return (
    <Modal title="Деталі автомобіля" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="h-56 sm:h-64 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-700/60 shadow-inner group relative">
          {car.image ? (
            <img src={car.image} alt={car.brand} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                {logo ? (
                  <img 
                    src={logo} 
                    alt={car.brand} 
                    className="w-24 h-24 object-contain opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-700" 
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div className={`w-24 h-24 rounded-3xl bg-indigo-500/5 dark:bg-white/5 flex items-center justify-center border border-indigo-500/10 dark:border-white/10 ${logo ? 'hidden' : 'flex'}`}>
                  <span className="text-5xl font-black text-indigo-400/30 dark:text-gray-600 uppercase">{car.brand?.[0] || '?'}</span>
                </div>
                <p className="text-xs font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.3em]">{car.brand}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            {logo && (
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-2 border border-gray-100 dark:border-gray-700">
                <img src={logo} alt="" className="w-full h-full object-contain opacity-80" onError={(e) => e.target.parentElement.style.display = 'none'} />
              </div>
            )}
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1">{car.brand}</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{car.model}</p>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-xl text-sm font-black text-gray-500 dark:text-gray-300 tracking-widest shadow-inner uppercase border border-gray-200 dark:border-gray-600">{car.plate}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-50 dark:border-gray-800">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">РІК ВИПУСКУ</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{car.year}</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-50 dark:border-gray-800">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ПРОБІГ</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(car.mileage)} км</p>
          </div>
          <div className="col-span-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-50 dark:border-gray-800">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">VIN НОМЕР</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest">{car.vin || 'НЕ ВКАЗАНО'}</p>
          </div>
        </div>

        {(car.fuelType || car.engineL || car.driveType || car.transmission || car.bodyClass) && (
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Технічні характеристики</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Тип палива',   v: car.fuelType },
                { l: 'Двигун',       v: car.engineL ? `${Number(car.engineL).toFixed(1)}L${car.engineCyl ? ` · ${car.engineCyl} цил.` : ''}` : '' },
                { l: 'Привід',       v: car.driveType },
                { l: 'КПП',          v: car.transmission },
                { l: 'Тип кузова',   v: car.bodyClass },
              ].filter(i => i.v).map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-50 dark:border-gray-800">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.l}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        )}


        <div className="flex flex-col gap-2 mt-4">
          <button onClick={() => { onGoService(); onClose(); }} className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-3 border border-indigo-100 dark:border-indigo-800/50 shadow-sm active:scale-95">
            <ClipboardList size={18} /> ПЕРЕГЛЯНУТИ СЕРВІСНУ ІСТОРІЮ
          </button>
          <button onClick={onGoReport} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-400/20 active:scale-95 mt-2">
            <TrendingUp size={18} /> ГЕНЕРУВАТИ ЗВІТ
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onGoTransfer} className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 active:scale-95">
              <ClipboardList size={18} /> ТРАНСФЕР АВТО
            </button>
            <button onClick={handleShare} disabled={isSharing} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 border active:scale-95 ${isCopied ? 'bg-green-500 text-white border-green-500' : 'bg-white dark:bg-gray-800 text-[#5C3EFE] border-indigo-100 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}>
              <Share2 size={18} /> {isSharing ? 'ЗАЧЕКАЙТЕ...' : (isCopied ? 'СКОПІЙОВАНО!' : 'ПОДІЛИТИСЯ')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
