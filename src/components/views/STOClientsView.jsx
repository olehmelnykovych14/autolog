import React, { useState, useEffect } from 'react'
import { Search, Users, TrendingUp, BarChart2, ChevronRight, Loader2, Plus, Download, Phone, Mail, Car, FileText, X, Calendar, ShieldCheck } from 'lucide-react'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { useNavigate } from 'react-router-dom'

const CV_REF = 'YOUR_REF_CODE'
const cvLink = vin => `https://www.carvertical.com/uk/get-report?referralCode=${CV_REF}${vin ? `&vin=${vin}` : ''}`

const fmt = n => Number(n || 0).toLocaleString('uk-UA')

const AC = ['#5C3EFE','#10B981','#F59E0B','#ef4444','#8B5CF6','#06b6d4','#f97316','#ec4899','#14b8a6','#a855f7']

const TAG = {
  new:     { label: 'Новий',    bg: 'rgba(16,185,129,0.1)',  color: '#10B981', border: 'rgba(16,185,129,0.25)' },
  regular: { label: 'Постійний',bg: 'rgba(92,62,254,0.08)',  color: '#5C3EFE', border: 'rgba(92,62,254,0.25)'  },
  top:     { label: 'Топ',      bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
}

function getTag(visits) {
  if (visits >= 5) return 'top'
  if (visits >= 2) return 'regular'
  return 'new'
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

export function STOClientsView() {
  const navigate = useNavigate()
  const [clients, setClients]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [seg, setSeg]                 = useState('all')
  const [sortBy, setSortBy]           = useState('spent')
  const [sel, setSel]                 = useState(null)
  const [selDetail, setSelDetail]     = useState(null) // { cars, history }
  const [detailLoading, setDetailLoading] = useState(false)
  const [newBookingModal, setNewBookingModal] = useState(null) // client obj

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    if (!auth.currentUser) return
    setLoading(true)
    try {
      const uid = auth.currentUser.uid

      const [histSnap, bookSnap] = await Promise.all([
        getDocs(query(collection(db, 'history'), where('stoId', '==', uid))),
        getDocs(query(collection(db, 'bookings'), where('stoId', '==', uid))),
      ])

      const hist  = histSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const books = bookSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      // Collect real userIds
      const allUserIds = [...new Set([
        ...hist.map(h => h.userId),
        ...books.map(b => b.userId),
      ].filter(id => id && id !== 'offline' && id !== 'unclaimed'))]

      // Fetch user profiles in batches of 10 (Firestore IN limit)
      const userMap = {}
      for (let i = 0; i < allUserIds.length; i += 10) {
        const batch = allUserIds.slice(i, i + 10)
        const snap = await getDocs(query(collection(db, 'users'), where('__name__', 'in', batch)))
        snap.docs.forEach(d => { userMap[d.id] = { id: d.id, ...d.data() } })
      }

      // Add offline clients — group by phone (fallback to plate) so repeat visits aggregate
      const offlineBooks = books.filter(b => b.isOffline || b.userId === 'offline' || b.userId === 'unclaimed')
      const offlineMap = {}
      offlineBooks.forEach(b => {
        const phone = b.offlineData?.phone || ''
        const plate = b.offlineData?.plate || ''
        const key = phone || plate || `offline_${b.id}`
        const id = `offline:${key}`
        if (!offlineMap[id]) {
          offlineMap[id] = {
            id,
            displayName: b.offlineData?.clientName || phone || plate || 'Офлайн клієнт',
            phone, email: '',
            _offline: true,
          }
          // Attach matching offline bookings under a synthetic userId for stats aggregation
        }
        b.userId = id
      })
      Object.assign(userMap, offlineMap)

      if (!Object.keys(userMap).length) { setClients([]); setLoading(false); return }

      // Build client stats
      const result = Object.values(userMap).map(u => {
        const userHist  = hist.filter(h => h.userId === u.id)
        const userBooks = books.filter(b => b.userId === u.id)
        const totalSpent = userHist.reduce((s, h) => s + (Number(h.cost) || 0), 0)
        const visits     = userBooks.filter(b => ['completed','done','confirmed','in-progress'].includes(b.status)).length || userHist.length
        const lastDates  = [...userBooks.map(b => b.date), ...userHist.map(h => h.date)].filter(Boolean).sort().reverse()
        const cars       = [...new Set(userBooks.map(b => b.carBrand && b.carModel ? `${b.carBrand} ${b.carModel}` : b.offlineData?.plate || '').filter(Boolean))]
        const phone      = u.phone || userBooks.find(b => b.offlineData?.phone)?.offlineData?.phone || '—'
        const email      = u.email || '—'
        const name       = u.displayName || u.name || u.fullName || (u.phone ? u.phone : 'Без імені')
        return {
          id: u.id, name, phone, email, cars,
          visits, totalSpent,
          last: lastDates[0] || '',
          tag: getTag(visits),
          src: initials(name),
        }
      })

      setClients(result.sort((a, b) => b.totalSpent - a.totalSpent))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openClient = async (c) => {
    if (sel === c.id) { setSel(null); setSelDetail(null); return }
    setSel(c.id)
    setSelDetail(null)
    setDetailLoading(true)
    try {
      const uid = auth.currentUser.uid
      const [carsSnap, histSnap, booksSnap] = await Promise.all([
        getDocs(query(collection(db, 'cars'), where('userId', '==', c.id))),
        getDocs(query(collection(db, 'history'), where('userId', '==', c.id), where('stoId', '==', uid))),
        getDocs(query(collection(db, 'bookings'), where('userId', '==', c.id), where('stoId', '==', uid))),
      ])
      const cars    = carsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const history = histSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1)
      const bookings = booksSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => ['completed','done'].includes(b.status)).sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1)
      setSelDetail({ cars, history, bookings })
    } catch (e) {
      console.error(e)
    } finally {
      setDetailLoading(false)
    }
  }

  const segs = [
    { k: 'all',     l: 'Усі',      n: clients.length },
    { k: 'top',     l: 'Топ',      n: clients.filter(c => c.tag === 'top').length },
    { k: 'regular', l: 'Постійні', n: clients.filter(c => c.tag === 'regular').length },
    { k: 'new',     l: 'Нові',     n: clients.filter(c => c.tag === 'new').length },
  ]

  const filtered = clients
    .filter(c => seg === 'all' || c.tag === seg)
    .filter(c => !search || (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search) || (c.cars||[]).some(car => car.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => sortBy === 'spent' ? b.totalSpent - a.totalSpent : sortBy === 'visits' ? b.visits - a.visits : (b.last > a.last ? 1 : -1))

  const totalSpent = clients.reduce((s, c) => s + c.totalSpent, 0)
  const avgSpent   = clients.length ? Math.round(totalSpent / clients.length) : 0
  const topCount   = clients.filter(c => c.tag === 'top').length

  const selC  = sel ? clients.find(c => c.id === sel) : null
  const selAc = selC ? AC[clients.indexOf(selC) % AC.length] : '#5C3EFE'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>CRM Клієнти</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>{clients.length} клієнтів у базі</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="al-card flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors hover:border-[var(--brand)]"
            style={{ color: 'var(--text-2)' }}>
            <Download size={14} /> Експорт
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { l: 'Клієнтів',       v: clients.length,    suf: '',  icon: Users,       c: 'var(--brand)' },
          { l: 'Загальний дохід',v: fmt(totalSpent),   suf: '₴', icon: TrendingUp,  c: '#10B981' },
          { l: 'Середній чек',   v: fmt(avgSpent),     suf: '₴', icon: BarChart2,   c: '#fbbf24' },
          { l: 'Топ клієнти',    v: topCount,          suf: '',  icon: Users,        c: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} className="al-card" style={{ padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.c}15`, border: `1px solid ${s.c}25`, display: 'grid', placeItems: 'center', flexShrink: 0, color: s.c }}>
              <s.icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: s.c, lineHeight: 1 }}>
                {s.v}<span style={{ fontSize: 13, marginLeft: 3, opacity: .6, fontWeight: 500 }}>{s.suf}</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginTop: 4 }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        {/* Segments */}
        <div className="al-card" style={{ display: 'inline-flex', padding: 3, gap: 2, borderRadius: 14 }}>
          {segs.map(s => (
            <button key={s.k} onClick={() => setSeg(s.k)} style={{
              padding: '7px 14px', borderRadius: 11, border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: seg === s.k ? 'var(--brand)' : 'transparent',
              color: seg === s.k ? 'white' : 'var(--text-2)',
              transition: 'all 200ms', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {s.l}
              <span style={{ minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px', background: seg === s.k ? 'rgba(255,255,255,0.2)' : 'var(--bg-input)', color: seg === s.k ? 'white' : 'var(--text-3)', fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{s.n}</span>
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="al-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', minWidth: 240, borderRadius: 12 }}>
            <Search size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input placeholder="Ім'я, телефон, авто..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)' }} />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="al-card"
            style={{ padding: '9px 14px', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer', borderRadius: 12, background: 'var(--bg-card)' }}>
            <option value="spent">За витратами</option>
            <option value="visits">За візитами</option>
            <option value="last">За датою</option>
          </select>
        </div>
      </div>

      {/* Table + Detail */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--brand)' }} />
        </div>
      ) : clients.length === 0 ? (
        <div className="al-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
          <Users size={40} style={{ margin: '0 auto 12px', opacity: .4 }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-2)' }}>Клієнтів ще немає</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Клієнти з'являться після завершення перших записів</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selC ? '1fr 340px' : '1fr', gap: 16, alignItems: 'start' }}>

          {/* Table */}
          <div className="al-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--line)', background: 'var(--bg-input)' }}>
              <div style={{ width: 40, flexShrink: 0 }} />
              <div style={{ flex: '1 1 180px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>Клієнт</div>
              <div style={{ flex: '0 0 150px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>Контакти</div>
              <div style={{ flex: '0 0 70px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>Візити</div>
              <div style={{ flex: '0 0 110px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>Витрачено</div>
              <div style={{ flex: '0 0 90px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>Останній</div>
              <div style={{ width: 20, flexShrink: 0 }} />
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>Нічого не знайдено</div>
            ) : filtered.map((c, i) => {
              const tc   = TAG[c.tag]
              const cidx = clients.indexOf(c)
              const ac   = AC[cidx % AC.length]
              const isSel = sel === c.id
              return (
                <div key={c.id} onClick={() => openClient(c)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px',
                  borderLeft: isSel ? `3px solid ${ac}` : '3px solid transparent',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none',
                  background: isSel ? `${ac}08` : 'transparent',
                  cursor: 'pointer', transition: 'all 200ms',
                }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}>

                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg,${ac},${ac}99)`, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 13, boxShadow: `0 2px 8px ${ac}40` }}>
                    {c.src}
                  </div>

                  {/* Name + cars */}
                  <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: 9, fontWeight: 800, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>{tc.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.cars.slice(0, 2).map((car, ci) => (
                        <span key={ci} style={{ fontSize: 10, color: 'var(--text-2)', background: 'var(--bg-input)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{car}</span>
                      ))}
                      {c.cars.length > 2 && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>+{c.cars.length - 2}</span>}
                    </div>
                  </div>

                  {/* Contacts */}
                  <div style={{ flex: '0 0 150px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.phone}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{c.email}</div>
                  </div>

                  {/* Visits */}
                  <div style={{ flex: '0 0 70px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: ac, lineHeight: 1 }}>{c.visits}</div>
                  </div>

                  {/* Spent */}
                  <div style={{ flex: '0 0 110px', textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>{fmt(c.totalSpent)} ₴</div>
                  </div>

                  {/* Last */}
                  <div style={{ flex: '0 0 90px', textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                      {c.last ? c.last.split('-').reverse().join('.') : '—'}
                    </div>
                  </div>

                  <ChevronRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selC && (
            <div className="al-card" style={{ padding: 0, overflow: 'hidden', border: `1px solid ${selAc}30`, boxShadow: `0 8px 32px ${selAc}12` }}>
              {/* Top */}
              <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid var(--line)', background: `linear-gradient(160deg,${selAc}12,transparent)`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                <button onClick={() => { setSel(null); setSelDetail(null) }}
                  style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg-input)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
                  <X size={13} />
                </button>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg,${selAc},${selAc}99)`, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, fontSize: 20, boxShadow: `0 8px 24px ${selAc}50`, marginBottom: 12 }}>
                  {selC.src}
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em', color: 'var(--text)' }}>{selC.name}</div>
                <div style={{ marginTop: 7 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 7, fontSize: 10, fontWeight: 800, background: TAG[selC.tag].bg, color: TAG[selC.tag].color, border: `1px solid ${TAG[selC.tag].border}` }}>
                    {TAG[selC.tag].label}
                  </span>
                </div>
              </div>

              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 600, overflowY: 'auto' }}>
                {/* Contacts */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>Контакти</div>
                  {[
                    { icon: Phone, v: selC.phone },
                    { icon: Mail,  v: selC.email },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 6 }}>
                      <r.icon size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{r.v}</span>
                    </div>
                  ))}
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Візитів',   v: selC.visits,             c: selAc },
                    { l: 'Витрачено', v: `${fmt(selC.totalSpent)} ₴`, c: '#10B981' },
                    { l: 'Останній',  v: selC.last ? selC.last.split('-').reverse().join('.') : '—', c: 'var(--text)' },
                    { l: 'Авто',      v: selC.cars.length,        c: 'var(--text)' },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 4 }}>{s.l}</div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Cars */}
                {detailLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                    <Loader2 className="animate-spin" size={20} style={{ color: 'var(--brand)' }} />
                  </div>
                ) : selDetail && (
                  <>
                    {selDetail.cars.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>Автомобілі</div>
                        {selDetail.cars.map((car, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 6 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${selAc}18`, border: `1px solid ${selAc}30`, display: 'grid', placeItems: 'center', flexShrink: 0, color: selAc, fontWeight: 800, fontSize: 10 }}>
                              {car.brand?.slice(0, 2).toUpperCase() || <Car size={13} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{car.brand} {car.model}</div>
                              {car.plate && <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace', marginTop: 2 }}>{car.plate}</div>}
                            </div>
                            <a href={cvLink(car.vin)} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              title="Перевірити історію авто на CarVertical"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 7, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', flexShrink: 0 }}>
                              <ShieldCheck size={11} style={{ color: '#4ade80' }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap' }}>VIN check</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {selDetail.history.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>Сервісна історія</div>
                        {selDetail.history.slice(0, 5).map((h, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 6 }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{h.title}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{h.date}</div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: selAc, flexShrink: 0 }}>{fmt(h.cost)} ₴</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selDetail.bookings.length > 0 && selDetail.history.length === 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>Записи</div>
                        {selDetail.bookings.slice(0, 5).map((b, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 6 }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{b.issue || 'Запис'}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{b.date} о {b.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,var(--brand),#7C5CFF)' }}
                    onClick={() => setNewBookingModal(selC)}>
                    <Calendar size={13} /> Новий запис
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm al-card transition-colors hover:border-[var(--brand)]"
                    style={{ color: 'var(--text-2)' }}
                    onClick={() => navigate('/sto/bookings')}>
                    <FileText size={13} /> Деталі
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick booking modal */}
      {newBookingModal && (
        <QuickBookingModal client={newBookingModal} onClose={() => setNewBookingModal(null)} />
      )}
    </div>
  )
}

function QuickBookingModal({ client, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate]     = useState(today)
  const [time, setTime]     = useState('09:00')
  const [service, setService] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)

  const save = async () => {
    if (!service.trim() || !date) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'bookings'), {
        stoId: auth.currentUser.uid,
        userId: client.id,
        clientName: client.name,
        clientPhone: client.phone || '',
        service,
        date,
        time,
        status: 'confirmed',
        createdAt: serverTimestamp(),
      })
      setDone(true)
      setTimeout(onClose, 1200)
    } catch (e) {
      console.error('QuickBooking save error:', e)
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'grid', placeItems: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="al-card" style={{ width: 400, padding: 28, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Новий запис — {client.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Послуга</label>
            <input className="al-input" style={{ width: '100%' }} placeholder="Напр. Заміна масла"
              value={service} onChange={e => setService(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Дата</label>
              <input className="al-input" type="date" style={{ width: '100%' }} min={today}
                value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Час</label>
              <input className="al-input" type="time" style={{ width: '100%' }}
                value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving || done || !service.trim()}
          style={{ width: '100%', marginTop: 20, padding: '12px 0', borderRadius: 12, border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: 'white', background: done ? '#10B981' : 'linear-gradient(135deg,var(--brand),#7C5CFF)', opacity: (!service.trim() && !saving) ? 0.5 : 1, transition: 'all 300ms' }}>
          {done ? '✓ Збережено' : saving ? 'Збереження...' : 'Зберегти запис'}
        </button>
      </div>
    </div>
  )
}
