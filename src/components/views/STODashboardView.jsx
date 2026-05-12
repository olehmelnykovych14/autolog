import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Car, ShieldCheck, Info, Loader2, TrendingUp, ClipboardCheck, ChevronRight, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Field, inp_cls, PrimaryBtn } from '../common/Common'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { C } from '../../constants'
import { AddVerifiedServiceModal } from '../modals/Modals'

export function STODashboardView({ userProfile }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [foundCar, setFoundCar] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [err, setErr] = useState('')
  const [recentLogs, setRecentLogs] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({ income: 0, carsServiced: 0, pendingApprovals: 0 })

  const isInactive = false

  useEffect(() => {
    fetchStats()
    fetchRecentLogs()
  }, [])

  const fetchStats = async () => {
    if (!auth.currentUser) return
    setStatsLoading(true)
    try {
      const bookingsQ = query(collection(db, 'bookings'), where('stoId', '==', auth.currentUser.uid))
      const bookingsSnap = await getDocs(bookingsQ)
      const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      const pendingApprovals = bookings.filter(b => b.status === 'pending').length
      const carsServiced = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length

      const historyQ = query(collection(db, 'history'), where('stoId', '==', auth.currentUser.uid))
      const historySnap = await getDocs(historyQ)
      const income = historySnap.docs.reduce((sum, d) => sum + (d.data().cost || 0), 0)

      setStats({ income, carsServiced, pendingApprovals })
    } catch (e) {
      console.error(e)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchRecentLogs = async () => {
    if (!auth.currentUser) return
    try {
      const q = query(
        collection(db, 'history'),
        where('stoId', '==', auth.currentUser.uid)
      )
      const snap = await getDocs(q)
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5)
      setRecentLogs(logs)
    } catch (e) {
      console.error(e)
    }
  }

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

  const fmt = (n) => new Intl.NumberFormat('uk-UA').format(n)

  const statCards = [
    {
      label: 'ДОХІД ЗА МІСЯЦЬ',
      value: `₴${fmt(stats.income)}`,
      growth: '+12%',
      growthPositive: true,
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
    },
    {
      label: 'АВТО ОБСЛУГОВАНО',
      value: fmt(stats.carsServiced),
      growth: '+8%',
      growthPositive: true,
      icon: Car,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: 'ОЧІКУЮТЬ ПІДТВЕРДЖЕННЯ',
      value: fmt(stats.pendingApprovals),
      tag: stats.pendingApprovals > 0 ? 'Терміново' : null,
      icon: ClipboardCheck,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10',
    },
  ]

  const statusIcon = (status) => {
    if (status === 'verified') return <CheckCircle size={14} className="text-emerald-400" />
    if (status === 'pending') return <Clock size={14} className="text-amber-400" />
    return <XCircle size={14} className="text-gray-500" />
  }

  const statusLabel = (status) => {
    if (status === 'verified') return <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest">Верифіковано</span>
    if (status === 'pending') return <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest">Очікує</span>
    return <span className="text-[10px] font-black text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-md uppercase tracking-widest">Відхилено</span>
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 w-full pt-4 px-4 sm:px-0">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
            Кабінет партнера
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            З поверненням, {userProfile?.displayName || userProfile?.name || 'Партнер'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sto/bookings')} className="flex items-center gap-2 px-5 py-2.5 bg-[#5C3EFE] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all">
            <ClipboardCheck size={16}/> Записи
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 flex flex-col gap-3 hover:border-indigo-500/30 transition-all shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{s.label}</span>
                <div className="flex items-center gap-2">
                  {s.tag && (
                    <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest border border-red-500/20">{s.tag}</span>
                  )}
                  {s.growth && (
                    <span className={`text-[10px] font-black ${s.growthPositive ? 'text-emerald-500' : 'text-red-400'} flex items-center gap-0.5`}>
                      <TrendingUp size={10}/> {s.growth}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                  <Icon size={22} className={s.iconColor} />
                </div>
                <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                  {statsLoading ? '—' : s.value}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Global Registry Verification */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800/60 shadow-xl">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 dark:from-[#1a0e3a] dark:via-[#0d0d1e] dark:to-[#0a0a18]"/>
        <div className="absolute inset-0 opacity-20 dark:opacity-30" style={{ backgroundImage: 'radial-gradient(ellipse at 70% 50%, rgba(92, 62, 254, 0.4) 0%, transparent 60%)' }}/>
        {/* Subtle car silhouette effect */}
        <div className="absolute right-0 bottom-0 w-80 h-48 opacity-5" style={{ backgroundImage: 'url(/logo.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom' }} />

        <div className="relative z-10 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Перевірка глобального реєстру</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              Введіть держ. номер або 17-значний VIN для пошуку авто та додавання верифікованих сервісних записів.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value.toUpperCase())}
                placeholder="АА1234АА або WBA3B31000K2XXXXX"
                maxLength={20}
                className="w-full pl-12 pr-6 py-4 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/30 transition-all uppercase font-mono tracking-wider text-sm"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--line-2)', color: 'var(--text)' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-[#5C3EFE] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/30 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[160px]"
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : <><Search size={18}/> Пошук</>}
            </button>
          </form>

          {err && (
            <p className="mt-4 text-sm font-bold text-red-400 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
              <Info size={14}/> {err}
            </p>
          )}
        </div>

        {/* Found Car Result */}
        {foundCar && (
          <div className="relative z-10 border-t border-white/5 bg-white/3 backdrop-blur-sm mx-4 mb-6 rounded-2xl p-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#5C3EFE]/20 border border-[#5C3EFE]/30 flex items-center justify-center text-[#5C3EFE]">
                  {foundCar.image
                    ? <img src={foundCar.image} alt="" className="w-full h-full object-cover rounded-2xl" />
                    : <Car size={26}/>
                  }
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{foundCar.brand} {foundCar.model}</h3>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest border border-emerald-500/20">Перевірена історія</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="font-mono font-black text-gray-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">{foundCar.plate}</span>
                    {foundCar.vin && <span>VIN: <span className="text-gray-300 font-mono">{foundCar.vin}</span></span>}
                  </div>
                  {foundCar.year || foundCar.mileage ? (
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      {foundCar.year && <span>ENGINE • {foundCar.year}</span>}
                      {foundCar.mileage && <span>MILEAGE • {fmt(foundCar.mileage)} км</span>}
                    </div>
                  ) : null}
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                disabled={isInactive}
                className="flex items-center gap-2 px-6 py-3.5 bg-[#5C3EFE] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/30 hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
              >
                <ShieldCheck size={18}/> Додати верифікований запис
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Service Logs */}
      <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-black text-gray-900 dark:text-white">Останні сервісні записи</h2>
          <button onClick={() => navigate('/sto/bookings')} className="text-[#5C3EFE] text-xs font-black hover:underline flex items-center gap-1">
            Всі записи <ChevronRight size={14}/>
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
              <ClipboardCheck size={24} className="text-[#5C3EFE]" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Записів ще немає</p>
            <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Верифіковані записи з'являться тут після першої сесії</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between px-6 py-4 transition-colors"
                style={{ cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover, rgba(255,255,255,0.03))'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <Car size={16} className="text-[#5C3EFE]"/>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{log.title || log.service || log.work || log.description || 'Сервісний запис'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{log.date?.split('-').reverse().join('.')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {log.cost > 0 && (
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      ₴{fmt(log.cost)}
                    </span>
                  )}
                  {statusLabel(log.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddVerifiedServiceModal
          car={foundCar}
          userProfile={userProfile}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setFoundCar(null); fetchRecentLogs(); setErr('✓ Запис успішно надіслано клієнту!'); }}
        />
      )}
    </div>
  )
}
