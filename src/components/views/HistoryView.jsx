import React, { useState } from 'react'
import { Filter, Search, Plus, Calendar, Activity, MapPin, Layers, FileText, Check, Clock, ShieldCheck, AlertCircle } from 'lucide-react'
import { PrimaryBtn } from '../common/Common'
import { fmtCost, fmt } from '../../utils'
import { C, CAT, CAT_CLR } from '../../constants'
import { ServiceModal } from '../modals/ServiceModal'

export function HistoryView({ historyList, carList, onAddService, onUpdateService, onDeleteService }) {
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [filterCar, setFilterCar] = useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [sortOrder, setSortOrder] = useState('desc')
  const [search, setSearch] = useState('')

  const filtered = historyList.filter(h => {
    // If carId is broken/NaN, the Edit Modal defaults to carList[0]. 
    // We should do the exactly same here so the user sees consistent behavior.
    const effectiveCarId = (h.carId && String(h.carId) !== 'NaN') 
                           ? String(h.carId) 
                           : String(carList[0]?.id || '')
    
    const mCar = filterCar === 'all' || effectiveCarId === String(filterCar)
    const mCat = filterCat === 'all' || String(h.category) === String(filterCat)
    
    const searchLow = search.trim().toLowerCase()
    const mSch = searchLow === '' || 
      (h.title && h.title.toLowerCase().includes(searchLow)) || 
      (h.garage && h.garage.toLowerCase().includes(searchLow))
    
    let mDate = true
    const recDate = new Date(h.date || h.createdAt || 0)
    const now = new Date()
    if (filterDate === 'month') {
      const msInMonth = 30 * 24 * 60 * 60 * 1000
      mDate = (now - recDate) <= msInMonth
    } else if (filterDate === 'year') {
      const msInYear = 365 * 24 * 60 * 60 * 1000
      mDate = (now - recDate) <= msInYear
    }

    return mCar && mCat && mSch && mDate
  }).sort((a, b) => {
    const dA = new Date(a.date || a.createdAt || 0).getTime()
    const dB = new Date(b.date || b.createdAt || 0).getTime()
    return sortOrder === 'desc' ? dB - dA : dA - dB
  })

  const handleEdit = (rec) => {
    setEditingRecord(rec)
    setShowModal(true)
  }

  const handleSave = (svc) => {
    if (editingRecord) onUpdateService(svc)
    else onAddService(svc)
    setShowModal(false)
    setEditingRecord(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Сервісна історія</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Всього {filtered.length} зафіксовано записів</p>
        </div>
        <PrimaryBtn onClick={() => setShowModal(true)} className="sm:self-center">
          <Plus size={18} /> Додати сервіс
        </PrimaryBtn>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Пошук за назвою або СТО..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/20 transition-all text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select 
            value={sortOrder} 
            onChange={e => setSortOrder(e.target.value)}
            className="flex-1 min-w-[140px] px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/20 text-gray-700 dark:text-white appearance-none"
          >
            <option value="desc">Спочатку нові</option>
            <option value="asc">Спочатку старі</option>
          </select>
          <select 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)}
            className="flex-1 min-w-[140px] px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/20 text-gray-700 dark:text-white appearance-none"
          >
            <option value="all">Усі дати</option>
            <option value="month">За 30 днів</option>
            <option value="year">За рік</option>
          </select>
          <select 
            value={filterCar} 
            onChange={e => setFilterCar(e.target.value)}
            className="flex-1 min-w-[140px] px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/20 text-gray-700 dark:text-white appearance-none"
          >
            <option value="all">Усі авто</option>
            {carList.map(c => <option key={c.id} value={c.id}>{c.brand} ({c.plate})</option>)}
          </select>
          <select 
            value={filterCat} 
            onChange={e => setFilterCat(e.target.value)}
            className="flex-1 min-w-[140px] px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/20 text-gray-700 dark:text-white appearance-none"
          >
            <option value="all">Усі категорії</option>
            {Object.entries(CAT).map(([id, lbl]) => <option key={id} value={id}>{lbl}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4 pb-12">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-[2rem] text-center border-2 border-dashed border-gray-100 dark:border-gray-700 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-300">
              <Filter size={32} />
            </div>
            <p className="text-gray-500 font-medium">Нічого не знайдено за вашим запитом</p>
          </div>
        ) : (
          filtered.map(rec => (
            <div 
              key={rec.id} 
              onClick={() => handleEdit(rec)}
              className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
            >
              <div className="flex sm:flex-col items-center justify-center w-full sm:w-24 px-4 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-50 dark:border-gray-800 gap-2 shrink-0">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{new Date(rec.date).toLocaleDateString('uk-UA', { month: 'short' })}</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{new Date(rec.date).getDate()}</span>
                <span className="hidden sm:block text-[10px] font-bold text-gray-400">{new Date(rec.date).getFullYear()}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${CAT_CLR[rec.category] || 'bg-gray-100 text-gray-600'}`}>
                    {CAT[rec.category] || 'Інше'}
                  </span>
                  {rec.status === 'verified' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md border border-blue-100 dark:border-blue-800/40 tracking-wider uppercase"><ShieldCheck size={12}/>Verified</span>}
                  {rec.status === 'pending_approval' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-md border border-amber-100 dark:border-amber-800/40 tracking-wider uppercase"><Clock size={12}/>Очікує</span>}
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-[#5C3EFE] transition-colors">{rec.title}</h4>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Activity size={14} className="text-gray-400" />
                    {fmt(rec.mileage || 0)} км
                  </div>
                  {rec.garage && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <MapPin size={14} className="text-gray-400" />
                      {rec.garage}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <FileText size={14}/>
                    ID: {rec.id?.toString().slice(-6)}
                  </div>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 px-4 py-3 sm:p-0 bg-indigo-50/50 dark:bg-indigo-900/10 sm:bg-transparent rounded-2xl border border-indigo-100/50 dark:border-indigo-800/50 sm:border-0 shrink-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest sm:hidden">ВАРТІСТЬ</p>
                <span className="text-xl font-black tracking-tight" style={{ color: rec.cost === 0 ? '#10B981' : C }}>{fmtCost(rec.cost)}</span>
                {rec.cost > 0 && <span className="hidden sm:block text-[10px] font-black text-indigo-300 uppercase tracking-widest">ПОВНА ОПЛАТА</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <ServiceModal
          onClose={() => { setShowModal(false); setEditingRecord(null) }}
          onSave={handleSave}
          carList={carList}
          historyList={historyList}
          initialData={editingRecord}
          onDelete={onDeleteService}
        />
      )}
    </div>
  )
}
