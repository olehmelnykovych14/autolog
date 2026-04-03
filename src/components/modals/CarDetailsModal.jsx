import React from 'react'
import { Info, FileText, Share2, ClipboardList, TrendingUp, X } from 'lucide-react'
import { Modal, PrimaryBtn } from '../common/Common'
import { fmt, getBrandLogo } from '../../utils'
import { C } from '../../constants'

export function CarDetailsModal({ car, onClose, onGoService, onGoReport, onGoTransfer }) {
  return (
    <Modal title="Деталі автомобіля" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="h-48 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-700 shadow-inner group">
          {car.image ? (
            <img src={car.image} alt={car.brand} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-300"><FileText size={48}/></div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getBrandLogo(car.brand) && <img src={getBrandLogo(car.brand)} alt="" className="w-6 h-6 grayscale opacity-80" />}
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{car.brand} {car.model}</h3>
          </div>
          <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-black text-gray-500 dark:text-gray-300 tracking-wider shadow-inner uppercase">{car.plate}</div>
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

        <div className="flex flex-col gap-2 mt-4">
          <button onClick={() => { onGoService(); onClose(); }} className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-3 border border-indigo-100 dark:border-indigo-800/50 shadow-sm active:scale-95">
            <ClipboardList size={18} /> ПЕРЕГЛЯНУТИ СЕРВІСНУ ІСТОРІЮ
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onGoReport} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-400/20 active:scale-95">
              <TrendingUp size={18} /> ГЕНЕРУВАТИ ЗВІТ
            </button>
            <button onClick={onGoTransfer} className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 active:scale-95">
              <Share2 size={18} /> ПЕРЕДАТИ АВТО
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
