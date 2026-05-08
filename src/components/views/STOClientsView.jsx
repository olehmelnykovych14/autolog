import React, { useState, useEffect } from 'react'
import { Search, User, Car, Phone, Mail, ChevronRight, X, Loader2, ClipboardList, TrendingUp } from 'lucide-react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { inp_cls } from '../common/Common'
import { fmt } from '../../utils'
import { CAT, CAT_CLR } from '../../constants'

export function STOClientsView({ setTab }) {
  const ic = inp_cls()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null) // { user, cars, history }
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    if (!auth.currentUser) return
    setLoading(true)
    try {
      // Get all history records created by this STO
      const histSnap = await getDocs(query(collection(db, 'history'), where('stoId', '==', auth.currentUser.uid)))
      const hist = histSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      // Get unique userIds
      const userIds = [...new Set(hist.map(h => h.userId).filter(Boolean))]

      // Fetch user profiles
      const userDocs = await Promise.all(
        userIds.map(uid => getDocs(query(collection(db, 'users'), where('__name__', '==', uid))).then(s => s.docs[0] ? { id: s.docs[0].id, ...s.docs[0].data() } : null))
      )
      const usersMap = Object.fromEntries(userDocs.filter(Boolean).map(u => [u.id, u]))

      // Also check bookings for clients not yet in history
      const bookSnap = await getDocs(query(collection(db, 'bookings'), where('stoId', '==', auth.currentUser.uid)))
      const bookUserIds = [...new Set(bookSnap.docs.map(d => d.data().userId).filter(Boolean))]
      const allUserIds = [...new Set([...userIds, ...bookUserIds])]

      const extraDocs = await Promise.all(
        bookUserIds.filter(uid => !usersMap[uid]).map(uid =>
          getDocs(query(collection(db, 'users'), where('__name__', '==', uid))).then(s => s.docs[0] ? { id: s.docs[0].id, ...s.docs[0].data() } : null)
        )
      )
      extraDocs.filter(Boolean).forEach(u => { usersMap[u.id] = u })

      // Build client list with stats
      const result = Object.values(usersMap).map(u => {
        const userHist = hist.filter(h => h.userId === u.id)
        const totalSpent = userHist.reduce((s, h) => s + (h.cost || 0), 0)
        const lastVisit = userHist.sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date || null
        return { ...u, histCount: userHist.length, totalSpent, lastVisit }
      })

      setClients(result.sort((a, b) => b.histCount - a.histCount))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openClient = async (client) => {
    setDetailLoading(true)
    setSelected({ user: client, cars: [], history: [] })
    try {
      const [carsSnap, histSnap] = await Promise.all([
        getDocs(query(collection(db, 'cars'), where('userId', '==', client.id))),
        getDocs(query(collection(db, 'history'), where('userId', '==', client.id), where('stoId', '==', auth.currentUser.uid)))
      ])
      const cars = carsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const history = histSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      setSelected({ user: client, cars, history })
    } catch (e) {
      console.error(e)
    } finally {
      setDetailLoading(false)
    }
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return !q || c.displayName?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)
  })

  if (selected) return <ClientDetail client={selected} loading={detailLoading} onBack={() => setSelected(null)} setTab={setTab} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>CRM Клієнти</h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-3)' }}>
            {loading ? 'Завантаження...' : `${filtered.length} клієнтів`}
          </p>
        </div>
      </div>

      <div className="al-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук по імені, телефону або email..." className={`${ic} !pl-10`} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} style={{ color: 'var(--brand)' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="al-card p-12 text-center" style={{ border: '2px dashed var(--line-2)' }}>
          <User size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-3)' }} />
          <p className="font-bold" style={{ color: 'var(--text)' }}>Клієнтів не знайдено</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Клієнти з'являться після додавання верифікованих записів</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(c => (
            <button key={c.id} onClick={() => openClient(c)}
              className="al-card al-card-hover p-5 flex items-center gap-4 w-full text-left transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black flex-none"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                {c.avatarBase64 ? <img src={c.avatarBase64} className="w-full h-full object-cover rounded-2xl" /> : ((c.displayName || c.name)?.[0] || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base" style={{ color: 'var(--text)' }}>{c.displayName || c.name || c.phone || 'Без імені'}</div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {c.phone && <span className="text-xs" style={{ color: 'var(--text-3)' }}>{c.phone}</span>}
                  {c.email && <span className="text-xs" style={{ color: 'var(--text-3)' }}>{c.email}</span>}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-6 flex-none">
                <div className="text-center">
                  <div className="text-lg font-black" style={{ color: 'var(--brand)' }}>{c.histCount}</div>
                  <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-3)' }}>Записів</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black" style={{ color: 'var(--text)' }}>{fmt(c.totalSpent)} ₴</div>
                  <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-3)' }}>Витрачено</div>
                </div>
                {c.lastVisit && (
                  <div className="text-center">
                    <div className="text-sm font-bold" style={{ color: 'var(--text-2)' }}>{new Date(c.lastVisit).toLocaleDateString('uk-UA')}</div>
                    <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-3)' }}>Останній візит</div>
                  </div>
                )}
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-3)' }} className="flex-none" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ClientDetail({ client, loading, onBack, setTab }) {
  const { user, cars, history } = client

  const totalSpent = history.reduce((s, h) => s + (h.cost || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-all" style={{ color: 'var(--text-3)' }}>
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text)' }}>{user.displayName || user.name || user.phone || 'Клієнт'}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} style={{ color: 'var(--brand)' }} /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Записів', value: history.length, color: 'var(--brand)' },
              { label: 'Витрачено', value: `${fmt(totalSpent)} ₴`, color: 'var(--text)' },
              { label: 'Авто', value: cars.length, color: 'var(--text)' },
            ].map(s => (
              <div key={s.label} className="al-card p-4 text-center">
                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] font-bold uppercase mt-1" style={{ color: 'var(--text-3)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div className="al-card p-5 flex flex-col gap-3">
            <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'var(--brand)' }}>Контакти</div>
            {user.phone && <div className="flex items-center gap-3"><Phone size={15} style={{ color: 'var(--text-3)' }} /><span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.phone}</span></div>}
            {user.email && <div className="flex items-center gap-3"><Mail size={15} style={{ color: 'var(--text-3)' }} /><span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.email}</span></div>}
            {user.city && <div className="flex items-center gap-3"><span style={{ color: 'var(--text-3)', fontSize: 15 }}>📍</span><span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.city}</span></div>}
          </div>

          {/* Cars */}
          {cars.length > 0 && (
            <div className="al-card p-5">
              <div className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: 'var(--brand)' }}>Автомобілі</div>
              <div className="flex flex-col gap-3">
                {cars.map(car => (
                  <div key={car.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg)', border: '1px solid var(--line-2)' }}>
                    <Car size={18} style={{ color: 'var(--text-3)' }} />
                    <div className="flex-1">
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{car.brand} {car.model}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--text-3)' }}>{car.year}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>{car.plate}</span>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{fmt(car.mileage)} км</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service history */}
          <div className="al-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--brand)' }}>Сервісна історія ({history.length})</div>
              {history.length > 0 && (
                <button onClick={() => setTab?.('sto_acts')} className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                  Створити акт
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>Записів від вашого СТО ще немає</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map(h => (
                  <div key={h.id} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--line-2)' }}>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${CAT_CLR[h.category] || 'bg-gray-100 text-gray-600'}`}>{CAT[h.category] || h.category}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{h.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{h.date ? new Date(h.date).toLocaleDateString('uk-UA') : ''}</div>
                    </div>
                    <div className="text-sm font-black flex-none" style={{ color: 'var(--brand)' }}>{fmt(h.cost)} ₴</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
