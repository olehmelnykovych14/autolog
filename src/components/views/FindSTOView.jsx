import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Phone, Star, Wrench, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { inp_cls } from '../common/Common'
import { CAT } from '../../constants'
import { PAGE_METADATA } from '../../constants/seo'


const SERVICES = ['ТО', 'Ремонт', 'Діагностика', 'Шиномонтаж', 'Мийка', 'Тюнінг']

export function FindSTOView({ setTab, onBookSTO, currentUser }) {
  const navigate = useNavigate()
  const ic = inp_cls()
  const [stos, setStos] = useState([])
  const [loading, setLoading] = useState(true)
  const [cityFilter, setCityFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [search, setSearch] = useState('')


  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const q = query(collection(db, 'users'), where('accountType', '==', 'sto'))
        const snap = await getDocs(q)
        setStos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const cities = [...new Set(stos.map(s => s.city).filter(Boolean))].sort()

  const filtered = stos.filter(s => {
    const matchCity = !cityFilter || s.city === cityFilter
    const matchSearch = !search ||
      s.stoName?.toLowerCase().includes(search.toLowerCase()) ||
      s.stoAddress?.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase())
    const matchService = !serviceFilter || s.services?.includes(serviceFilter)
    return matchCity && matchSearch && matchService
  })

  const meta = PAGE_METADATA['/sto-map']

  useEffect(() => {
    if (meta) {
      document.title = meta.title
      let descMeta = document.querySelector('meta[name="description"]')
      if (!descMeta) {
        descMeta = document.createElement('meta')
        descMeta.setAttribute('name', 'description')
        document.head.appendChild(descMeta)
      }
      descMeta.setAttribute('content', meta.description)
    }
  }, [meta])

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.canonical} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={meta.canonical} />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Знайти СТО</h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-3)' }}>
            {loading ? 'Завантаження...' : `${filtered.length} сервісів знайдено`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="al-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Назва або адреса СТО..."
            className={`${ic} !pl-10`}
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className={`${ic} !pl-9 min-w-[160px]`}>
            <option value="">Всі міста</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="relative">
          <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} className={`${ic} !pl-9 min-w-[160px]`}>
            <option value="">Всі послуги</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--brand)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="al-card p-12 text-center flex flex-col items-center gap-4" style={{ border: '2px dashed var(--line-2)', boxShadow: 'none' }}>
          <div className="w-16 h-16 rounded-[20px] flex items-center justify-center" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
            <Search size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>СТО не знайдено</h3>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Спробуйте змінити фільтри або пошуковий запит</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(sto => (
            <STOCard key={sto.id} sto={sto} onBook={() => onBookSTO?.(sto)} setTab={setTab} currentUser={currentUser} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}


function STOCard({ sto, onBook, currentUser, navigate }) {
  const handleBookClick = () => {
    if (!currentUser) {
      alert('Будь ласка, увійдіть або зареєструйтеся, щоб записатися на СТО.')
      navigate('/login')
      return
    }
    onBook()
  }

  return (

    <div className="al-card p-5 flex flex-col gap-4 al-card-hover cursor-default">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black flex-none"
          style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
          {sto.stoName?.[0] || 'С'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base truncate" style={{ color: 'var(--text)' }}>{sto.stoName || 'Без назви'}</h3>
          {sto.city && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={12} style={{ color: 'var(--text-3)' }} />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{sto.city}</span>
            </div>
          )}
        </div>
      </div>

      {sto.stoAddress && (
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>📍 {sto.stoAddress}</p>
      )}

      {sto.phone && (
        <div className="flex items-center gap-2">
          <Phone size={13} style={{ color: 'var(--text-3)' }} />
          <a href={`tel:${sto.phone}`} className="text-xs font-medium hover:underline" style={{ color: 'var(--brand)' }}>
            {sto.phone}
          </a>
        </div>
      )}

      {sto.services?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sto.services.map(s => (
            <span key={s} className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
              {s}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={handleBookClick}
        className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
        style={{ background: 'var(--brand)', color: '#fff' }}
      >
        <Calendar size={15} /> Записатись
      </button>

    </div>
  )
}
