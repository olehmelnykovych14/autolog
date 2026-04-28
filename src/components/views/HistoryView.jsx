import React, { useState } from 'react'
import { Filter, Search, Plus, Calendar, Activity, MapPin, ShieldCheck, Clock, X, CheckCircle, XCircle, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { PrimaryBtn } from '../common/Common'
import { fmtCost, fmt } from '../../utils'
import { C, CAT, CAT_CLR } from '../../constants'
import { ServiceModal } from '../modals/ServiceModal'

const STATUS_CONFIG = {
  verified: {
    label: 'Verified',
    icon: CheckCircle,
    cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  pending_approval: {
    label: 'Pending',
    icon: Clock,
    cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
    dot: 'bg-amber-500',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    cls: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
    dot: 'bg-red-500',
  },
}

export function HistoryView({ historyList, carList, onAddService, onUpdateService, onDeleteService }) {
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [filterCar, setFilterCar] = useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [sortOrder, setSortOrder] = useState('desc')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = historyList.filter(h => {
    const isValidCar = carList.some(c => String(c.id) === String(h.carId))
    const effectiveCarId = isValidCar ? String(h.carId) : String(carList[0]?.id || '')
    const mCar = filterCar === 'all' || effectiveCarId === String(filterCar)
    const mCat = filterCat === 'all' || String(h.category) === String(filterCat)
    const searchLow = search.trim().toLowerCase()
    const mSch = searchLow === '' ||
      (h.title && h.title.toLowerCase().includes(searchLow)) ||
      (h.garage && h.garage.toLowerCase().includes(searchLow))
    let mDate = true
    const recDate = new Date(h.date || h.createdAt || 0)
    const now = new Date()
    if (filterDate === 'month') mDate = (now - recDate) <= 30 * 24 * 60 * 60 * 1000
    else if (filterDate === 'year') mDate = (now - recDate) <= 365 * 24 * 60 * 60 * 1000
    return mCar && mCat && mSch && mDate
  }).sort((a, b) => {
    const dA = new Date(a.date || a.createdAt || 0).getTime()
    const dB = new Date(b.date || b.createdAt || 0).getTime()
    return sortOrder === 'desc' ? dB - dA : dA - dB
  })

  const handleEdit = (rec) => { setEditingRecord(rec); setShowModal(true) }
  const handleSave = (svc) => {
    if (editingRecord) onUpdateService(svc)
    else onAddService(svc)
    setShowModal(false)
    setEditingRecord(null)
  }

  // Summary stats
  const totalCost = filtered.reduce((s, r) => s + (r.cost || 0), 0)
  const verifiedCount = filtered.filter(r => r.status === 'verified').length
  const pendingCount = filtered.filter(r => r.status === 'pending_approval').length

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Сервісна історія</h1>
          <p className="text-gray-400 dark:text-gray-500 font-medium mt-1">
            {filtered.length} записів · Верифіковано: {verifiedCount} · Очікують: {pendingCount}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#5C3EFE] text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus size={18} /> Додати сервіс
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-gray-900 dark:text-white">{filtered.length}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Всього</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{verifiedCount}</div>
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Verified</div>
        </div>
        <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-[#5C3EFE]">{fmtCost(totalCost)}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Витрачено</div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Пошук за назвою або СТО..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/20 focus:border-[#5C3EFE] transition-all text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border transition-all ${showFilters ? 'bg-[#5C3EFE] text-white border-[#5C3EFE]' : 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700/60 hover:border-indigo-300'}`}
          >
            <SlidersHorizontal size={16} />
            Фільтри
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200">
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="flex-1 min-w-[130px] px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/20">
              <option value="desc">Спочатку нові</option>
              <option value="asc">Спочатку старі</option>
            </select>
            <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="flex-1 min-w-[130px] px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/20">
              <option value="all">Усі дати</option>
              <option value="month">За 30 днів</option>
              <option value="year">За рік</option>
            </select>
            <select value={filterCar} onChange={e => setFilterCar(e.target.value)} className="flex-1 min-w-[130px] px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/20">
              <option value="all">Усі авто</option>
              {carList.map(c => <option key={c.id} value={c.id}>{c.brand} ({c.plate})</option>)}
            </select>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="flex-1 min-w-[130px] px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/20">
              <option value="all">Усі категорії</option>
              {Object.entries(CAT).map(([id, lbl]) => <option key={id} value={id}>{lbl}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Records List */}
      <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800/80 rounded-2xl overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <span>Послуга</span>
          <span>Авто</span>
          <span>Дата</span>
          <span>Вартість</span>
          <span>Статус</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Filter size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="font-bold text-gray-900 dark:text-white">Нічого не знайдено</p>
            <p className="text-sm text-gray-400 mt-1">Спробуйте змінити фільтри або додайте перший запис</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {filtered.map((rec, idx) => {
              const car = carList.find(c => String(c.id) === String(rec.carId)) || carList[0]
              const statusCfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG['pending_approval']
              const StatusIcon = statusCfg?.icon || Clock
              const recDate = new Date(rec.date || rec.createdAt || 0)
              const dateStr = recDate.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })

              return (
                <div
                  key={rec.id}
                  onClick={() => handleEdit(rec)}
                  className="flex flex-col sm:grid sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-3 sm:gap-4 px-5 sm:px-6 py-4 hover:bg-indigo-50/40 dark:hover:bg-white/2 transition-colors cursor-pointer group items-start sm:items-center"
                >
                  {/* Service info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${CAT_CLR[rec.category] || 'bg-gray-100 text-gray-600'}`}>
                        {CAT[rec.category] || 'Інше'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-[#5C3EFE] transition-colors">{rec.title}</h4>
                    {rec.garage && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-400 truncate">{rec.garage}</span>
                      </div>
                    )}
                  </div>

                  {/* Car */}
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md">{car?.plate || '—'}</span>
                    <span className="truncate text-xs">{car ? `${car.brand} ${car.model}` : '—'}</span>
                  </div>

                  {/* Date + Tech ID */}
                  <div className="text-right sm:text-left">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{dateStr}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Tech ID: #{rec.id?.toString().slice(-4)}</p>
                  </div>

                  {/* Cost */}
                  <div className="text-sm font-black tabular-nums" style={{ color: rec.cost === 0 ? '#10B981' : C }}>
                    {fmtCost(rec.cost)}
                  </div>

                  {/* Status badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-black whitespace-nowrap ${statusCfg?.cls || ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusCfg?.dot || 'bg-gray-400'}`} />
                    {statusCfg?.label || 'Unknown'}
                  </div>
                </div>
              )
            })}
          </div>
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
