import React, { useState, useEffect } from 'react'
import { Calendar as CalIcon, User, Car, Plus, Search, Info, Loader2, Edit3, ChevronLeft, ChevronRight, Wrench, X, CheckCircle2 } from 'lucide-react'
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { Modal, Field, inp_cls, PrimaryBtn } from '../common/Common'

const STATUS_COLOR = {
  confirmed:    '#10B981',
  pending:      '#F59E0B',
  'in-progress':'#5C3EFE',
  completed:    '#64748b',
  done:         '#64748b',
  rejected:     '#ef4444',
}
const STATUS_LABEL = {
  confirmed: 'Підтверджено',
  pending: 'Очікує',
  'in-progress': 'В роботі',
  completed: 'Завершено',
  done: 'Завершено',
  rejected: 'Відхилено',
}

const HOURS = [8,9,10,11,12,13,14,15,16,17,18]
const SLOT_H = 64

function getClientName(b) {
  if (b.isOffline) return b.offlineData?.clientName || 'Клієнт'
  return b.driver?.displayName || b.driver?.name || 'Клієнт'
}
function getCarLabel(b) {
  if (b.isOffline) return `${b.offlineData?.brand || '—'} · ${b.offlineData?.plate || '—'}`
  return `${b.carBrand || b.car?.brand || ''} ${b.carModel || b.car?.model || ''}`.trim() || 'Автомобіль'
}
function getPlate(b) {
  return b.isOffline ? b.offlineData?.plate : b.car?.plate
}

function BookingCard({ bk, onClick, style = {} }) {
  const color = STATUS_COLOR[bk.status] || '#94a3b8'
  return (
    <div
      onClick={() => onClick(bk)}
      style={{
        ...style,
        background: bk.status === 'completed' || bk.status === 'done'
          ? 'var(--bg-input)'
          : `linear-gradient(135deg, ${color}18, ${color}06)`,
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        padding: '8px 10px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 200ms',
        display: 'flex', flexDirection: 'column', gap: 3,
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px ${color}25`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color, whiteSpace: 'nowrap' }}>{bk.time}</span>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
          background: `${color}18`, color,
        }}>{STATUS_LABEL[bk.status] || bk.status}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {bk.issue || getCarLabel(bk)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {getClientName(bk)} · {getCarLabel(bk)}
      </div>
    </div>
  )
}

export function STOBookingsView({ userProfile }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createInitial, setCreateInitial] = useState(null)
  const [editingBooking, setEditingBooking] = useState(null)
  const [selBk, setSelBk] = useState(null)

  const [viewMode, setViewMode] = useState('day') // 'day' | 'week' | 'kanban'
  const [weekOffset, setWeekOffset] = useState(0)
  const [selDay, setSelDay] = useState(() => {
    const t = new Date()
    const tz = t.getTimezoneOffset() * 60000
    return new Date(t.getTime() - tz).toISOString().split('T')[0]
  })

  const getWeekDays = () => {
    const today = new Date()
    today.setHours(0,0,0,0)
    const day = today.getDay() || 7
    today.setDate(today.getDate() - day + 1 + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      return d
    })
  }
  const weekDays = getWeekDays()

  const todayStr = (() => {
    const t = new Date()
    const tz = t.getTimezoneOffset() * 60000
    return new Date(t.getTime() - tz).toISOString().split('T')[0]
  })()

  const toDateStr = (d) => {
    const tz = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tz).toISOString().split('T')[0]
  }

  useEffect(() => { fetchBookings() }, [weekOffset])

  const fetchBookings = async () => {
    if (!auth.currentUser) return
    try {
      const snap = await getDocs(query(collection(db, 'bookings'), where('stoId', '==', auth.currentUser.uid)))
      const list = []
      for (const d of snap.docs) {
        const b = { id: d.id, ...d.data() }
        if (b.userId && b.userId !== 'offline') {
          try { const s = await getDoc(doc(db, 'users', b.userId)); if (s.exists()) b.driver = s.data() } catch {}
        }
        if (b.carId && b.carId !== 'offline') {
          try { const s = await getDoc(doc(db, 'cars', b.carId)); if (s.exists()) b.car = s.data() } catch {}
        }
        list.push(b)
      }
      list.sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1)
      setBookings(list)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const updateStatus = async (bookingId, status) => {
    try {
      setBookings(p => p.map(b => b.id === bookingId ? { ...b, status } : b))
      await updateDoc(doc(db, 'bookings', bookingId), { status })
    } catch (e) { console.error(e); fetchBookings() }
  }

  const onDragStart = (e, id) => e.dataTransfer.setData('text/plain', id)
  const onDragOver = (e) => e.preventDefault()
  const onDrop = (e, targetStatus) => {
    const id = e.dataTransfer.getData('text/plain')
    if (id) updateStatus(id, targetStatus)
  }

  const selDayBookings = bookings.filter(b => b.date === selDay)
  const todayBookings  = bookings.filter(b => b.date === todayStr)
  const pendingCount   = todayBookings.filter(b => b.status === 'pending').length
  const inProgCount    = todayBookings.filter(b => b.status === 'in-progress').length
  const confirmedCount = todayBookings.filter(b => b.status === 'confirmed').length

  const nowHour = new Date().getHours() + new Date().getMinutes() / 60
  const timeLineTop = selDay === todayStr ? (nowHour - 8) * SLOT_H : null

  return (
    <div className="flex flex-col gap-5 max-w-[90rem] mx-auto w-full pt-4 px-4 sm:px-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Календар записів</h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-3)' }}>
            {weekDays[0].getDate()} {weekDays[0].toLocaleString('uk', { month: 'short' })} — {weekDays[6].getDate()} {weekDays[6].toLocaleString('uk', { month: 'short' })} {weekDays[0].getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-input)', border: '1px solid var(--line-2)', borderRadius: 12, padding: 3, gap: 2 }}>
            {[{ k: 'day', l: 'День' }, { k: 'week', l: 'Тиждень' }, { k: 'kanban', l: 'Дошка' }].map(v => (
              <button key={v.k} onClick={() => setViewMode(v.k)} style={{
                padding: '7px 14px', borderRadius: 9, border: 'none', fontFamily: 'inherit',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                background: viewMode === v.k ? 'var(--brand)' : 'transparent',
                color: viewMode === v.k ? 'white' : 'var(--text-2)',
                transition: 'all 250ms',
                boxShadow: viewMode === v.k ? '0 2px 8px rgba(92,62,254,0.35)' : 'none',
              }}>{v.l}</button>
            ))}
          </div>
          <button
            onClick={() => { setCreateInitial(null); setShowCreateModal(true) }}
            className="flex items-center gap-2 px-5 py-2.5 font-black text-sm text-white rounded-xl transition-all hover:opacity-90"
            style={{ background: 'var(--brand)', boxShadow: '0 4px 16px rgba(92,62,254,0.35)' }}
          >
            <Plus size={16} /> Створити запис
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Записів сьогодні', val: todayBookings.length, color: 'var(--brand)' },
          { label: 'В роботі зараз',    val: inProgCount,          color: '#5C3EFE' },
          { label: 'Очікують підтвердж.', val: pendingCount,       color: '#F59E0B' },
          { label: 'Підтверджено',       val: confirmedCount,      color: '#10B981' },
        ].map((s, i) => (
          <div key={i} className="al-card p-4 flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}12`, border: `1px solid ${s.color}25`, display: 'grid', placeItems: 'center', flexShrink: 0, color: s.color }}>
              <CalIcon size={18} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Week strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
        {weekDays.map(d => {
          const ds = toDateStr(d)
          const isToday = ds === todayStr
          const isSel   = ds === selDay
          const dots    = bookings.filter(b => b.date === ds)
          return (
            <button key={ds}
              onClick={() => { setSelDay(ds); setViewMode('day'); setSelBk(null) }}
              style={{
                all: 'unset', cursor: 'pointer', textAlign: 'center',
                padding: '12px 8px', borderRadius: 16,
                background: isSel ? 'var(--brand)' : isToday ? 'rgba(92,62,254,0.08)' : 'var(--bg-card)',
                border: isSel ? '1px solid var(--brand)' : isToday ? '1px solid rgba(92,62,254,0.25)' : '1px solid var(--line)',
                transition: 'all 250ms',
                boxShadow: isSel ? '0 4px 16px rgba(92,62,254,0.35)' : 'none',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, color: isSel ? 'rgba(255,255,255,0.7)' : isToday ? 'var(--brand)' : 'var(--text-3)' }}>
                {d.toLocaleString('uk', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: isSel ? 'white' : isToday ? 'var(--brand)' : 'var(--text)' }}>
                {d.getDate()}
              </div>
              {dots.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 7 }}>
                  {dots.slice(0, 4).map((_, i) => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.6)' : 'var(--brand)', opacity: isSel ? 0.8 : 0.5 }} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-2">
        <button onClick={() => setWeekOffset(p => p - 1)} className="p-2 al-card hover:border-[var(--brand)] transition-colors rounded-xl"><ChevronLeft size={15} style={{ color: 'var(--text-2)' }} /></button>
        <button onClick={() => { setWeekOffset(0); setSelDay(todayStr) }} className="px-4 py-2 text-sm font-bold al-card hover:border-[var(--brand)] rounded-xl transition-colors" style={{ color: 'var(--text-2)' }}>Поточний тиждень</button>
        <button onClick={() => setWeekOffset(p => p + 1)} className="p-2 al-card hover:border-[var(--brand)] transition-colors rounded-xl"><ChevronRight size={15} style={{ color: 'var(--text-2)' }} /></button>
      </div>

      {/* Main area */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} style={{ color: 'var(--brand)' }} /></div>
      ) : viewMode === 'day' ? (
        <div style={{ display: 'grid', gridTemplateColumns: selBk ? '1fr 340px' : '1fr', gap: 16, alignItems: 'start', transition: 'all 400ms' }}>
          {/* Day calendar */}
          <div className="al-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Day header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setSelDay(p => { const d = new Date(p); d.setDate(d.getDate()-1); return toDateStr(d) })}
                className="al-card p-1.5 hover:border-[var(--brand)] rounded-lg transition-colors">
                <ChevronLeft size={14} style={{ color: 'var(--text-2)' }} />
              </button>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                {new Date(selDay + 'T00:00:00').toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <button onClick={() => setSelDay(p => { const d = new Date(p); d.setDate(d.getDate()+1); return toDateStr(d) })}
                className="al-card p-1.5 hover:border-[var(--brand)] rounded-lg transition-colors">
                <ChevronRight size={14} style={{ color: 'var(--text-2)' }} />
              </button>
              {/* Legend */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
                {[['#10B981','Підтверджено'],['#F59E0B','Очікує'],['#5C3EFE','В роботі']].map(([c,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', maxHeight: 520, overflowY: 'auto' }}>
              {/* Time labels */}
              <div>
                {HOURS.map(h => (
                  <div key={h} style={{ height: SLOT_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 12, paddingTop: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{String(h).padStart(2,'0')}:00</span>
                  </div>
                ))}
              </div>
              {/* Slots */}
              <div style={{ position: 'relative', borderLeft: '1px solid var(--line)' }}>
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h}
                    onClick={() => { setCreateInitial({ date: selDay, time: `${String(h).padStart(2,'0')}:00` }); setShowCreateModal(true) }}
                    className="cursor-pointer transition-colors"
                    style={{ position: 'absolute', top: (h-8)*SLOT_H, left: 0, right: 0, height: SLOT_H, borderTop: '1px dashed var(--line)', zIndex: 0 }}
                  />
                ))}
                {/* Current time */}
                {timeLineTop !== null && timeLineTop >= 0 && timeLineTop <= HOURS.length * SLOT_H && (
                  <div style={{ position: 'absolute', top: timeLineTop, left: 0, right: 0, zIndex: 3, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', marginLeft: -4, flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 1.5, background: '#ef4444', opacity: 0.6 }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', marginRight: 8, background: 'var(--bg-card)', padding: '1px 6px', borderRadius: 4 }}>
                      {String(new Date().getHours()).padStart(2,'0')}:{String(new Date().getMinutes()).padStart(2,'0')}
                    </span>
                  </div>
                )}
                {/* Booking cards */}
                <div style={{ position: 'relative', height: HOURS.length * SLOT_H }}>
                  {selDayBookings.map(bk => {
                    const [hh, mm] = (bk.time || '09:00').split(':').map(Number)
                    const topPos = (hh + mm/60 - 8) * SLOT_H
                    if (topPos < 0 || topPos > HOURS.length * SLOT_H) return null
                    return (
                      <div key={bk.id} style={{ position: 'absolute', top: topPos + 2, height: SLOT_H - 4, left: 4, right: 4, zIndex: 2 }}>
                        <BookingCard bk={bk} onClick={b => setSelBk(b === selBk ? null : b)} />
                      </div>
                    )
                  })}
                  {selDayBookings.length === 0 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                      <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                        <CalIcon size={32} style={{ margin: '0 auto' }} />
                        <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>Немає записів на цей день</div>
                        <button onClick={() => { setCreateInitial({ date: selDay }); setShowCreateModal(true) }}
                          className="flex items-center gap-2 mx-auto mt-3 px-4 py-2 font-bold text-sm rounded-xl text-white"
                          style={{ background: 'var(--brand)' }}>
                          <Plus size={14} /> Додати запис
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detail side panel */}
          {selBk && (
            <div className="al-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)', background: `linear-gradient(135deg,${STATUS_COLOR[selBk.status] || '#5C3EFE'}10,transparent)`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: `${STATUS_COLOR[selBk.status]}18`, color: STATUS_COLOR[selBk.status] }}>
                      {STATUS_LABEL[selBk.status] || selBk.status}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>#{selBk.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)' }}>{selBk.issue || 'Запис'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>{selBk.time} · {selBk.date}</div>
                </div>
                <button onClick={() => setSelBk(null)} className="al-card p-1.5 rounded-lg hover:border-[var(--brand)] transition-colors">
                  <X size={14} style={{ color: 'var(--text-3)' }} />
                </button>
              </div>

              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Client */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8 }}>Клієнт</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 14, border: '1px solid var(--line)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand),#7C5CFF)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                      {getClientName(selBk)[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{getClientName(selBk)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{getCarLabel(selBk)}</div>
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Дата', v: selBk.date },
                    { l: 'Час', v: selBk.time },
                    { l: 'Номер авто', v: getPlate(selBk) || '—' },
                    { l: 'Телефон', v: (selBk.isOffline ? selBk.offlineData?.phone : selBk.driver?.phone) || '—' },
                  ].map((f, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 4 }}>{f.l}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{f.v}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {selBk.status === 'pending' && (
                    <button onClick={() => updateStatus(selBk.id, 'confirmed')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm text-white rounded-xl transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#10B981,#34d399)' }}>
                      <CheckCircle2 size={15} /> Підтвердити запис
                    </button>
                  )}
                  {selBk.status === 'confirmed' && (
                    <button onClick={() => updateStatus(selBk.id, 'in-progress')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm text-white rounded-xl transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#5C3EFE,#7C5CFF)' }}>
                      <Wrench size={15} /> Розпочати роботу
                    </button>
                  )}
                  {selBk.status === 'in-progress' && (
                    <button onClick={() => { setEditingBooking(selBk); setSelBk(null) }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm text-white rounded-xl transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#10B981,#34d399)' }}>
                      <CheckCircle2 size={15} /> Завершити запис
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditingBooking(selBk)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold al-card hover:border-[var(--brand)] rounded-xl transition-colors"
                      style={{ color: 'var(--text-2)' }}>
                      <Edit3 size={14} /> Редагувати
                    </button>
                    <button onClick={() => updateStatus(selBk.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold al-card rounded-xl transition-colors"
                      style={{ color: '#ef4444' }}>
                      <X size={14} /> Скасувати
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      ) : viewMode === 'week' ? (
        /* Week view */
        <div className="al-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,1fr)', borderBottom: '1px solid var(--line)' }}>
            <div />
            {weekDays.map(d => {
              const ds = toDateStr(d)
              const isToday = ds === todayStr
              return (
                <div key={ds} style={{ padding: '12px 8px', textAlign: 'center', borderLeft: '1px solid var(--line)', background: isToday ? 'rgba(92,62,254,0.04)' : 'transparent' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isToday ? 'var(--brand)' : 'var(--text-3)' }}>{d.toLocaleString('uk', { weekday: 'short' })}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: isToday ? 'var(--brand)' : 'var(--text)', lineHeight: 1.2 }}>{d.getDate()}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,1fr)', maxHeight: 480, overflowY: 'auto' }}>
            {HOURS.map(h => (
              <React.Fragment key={h}>
                <div style={{ height: SLOT_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 10, paddingTop: 6, borderTop: '1px dashed var(--line)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>{String(h).padStart(2,'0')}:00</span>
                </div>
                {weekDays.map(d => {
                  const ds = toDateStr(d)
                  const isToday = ds === todayStr
                  const slotBks = bookings.filter(b => b.date === ds && b.time?.startsWith(String(h).padStart(2,'0') + ':'))
                  return (
                    <div key={ds} onClick={() => { if (!slotBks.length) { setCreateInitial({ date: ds, time: `${String(h).padStart(2,'0')}:00` }); setShowCreateModal(true) } }}
                      style={{ height: SLOT_H, borderLeft: '1px solid var(--line)', borderTop: '1px dashed var(--line)', padding: '2px 3px', background: isToday ? 'rgba(92,62,254,0.02)' : 'transparent', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', cursor: slotBks.length ? 'default' : 'pointer' }}>
                      {slotBks.map(bk => {
                        const color = STATUS_COLOR[bk.status] || '#94a3b8'
                        return (
                          <div key={bk.id} onClick={e => { e.stopPropagation(); setSelDay(ds); setViewMode('day'); setSelBk(bk) }}
                            style={{ padding: '2px 6px', borderRadius: 6, background: `${color}18`, borderLeft: `2px solid ${color}`, cursor: 'pointer', overflow: 'hidden' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bk.issue || getCarLabel(bk)}</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

      ) : (
        /* Kanban */
        <div className="flex flex-col md:flex-row gap-5 overflow-x-auto pb-8">
          {[
            { id: 'pending',     label: 'Нові заявки',       color: '#F59E0B' },
            { id: 'confirmed',   label: 'Сплановані',         color: '#10B981' },
            { id: 'in-progress', label: 'В роботі',           color: '#5C3EFE' },
            { id: 'rejected',    label: 'Архів / Відхилені',  color: '#64748b' },
          ].map(col => {
            const items = bookings.filter(b => b.status === col.id || (col.id === 'pending' && b.status === 'updating'))
            return (
              <div key={col.id}
                className="flex-1 min-w-[280px] flex flex-col gap-3 p-4 rounded-2xl"
                style={{ background: `${col.color}08`, border: `1px solid ${col.color}20` }}
                onDragOver={onDragOver}
                onDrop={e => onDrop(e, col.id)}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: col.color }}>{col.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'var(--bg-card)', color: 'var(--text)' }}>{items.length}</span>
                </div>
                <div className="flex flex-col gap-2 min-h-[160px]">
                  {items.map(b => (
                    <div key={b.id} draggable onDragStart={e => onDragStart(e, b.id)} onClick={() => setEditingBooking(b)}
                      className="al-card p-4 cursor-grab active:cursor-grabbing hover:border-[var(--brand)] transition-all"
                      style={{ borderLeft: `3px solid ${col.color}` }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: col.color, marginBottom: 6 }}>{b.date} {b.time}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{b.issue || getCarLabel(b)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{getClientName(b)} · {getCarLabel(b)}</div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="flex-1 flex items-center justify-center rounded-xl" style={{ border: '2px dashed var(--line)', minHeight: 80 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Порожньо</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreateModal && <CreateBookingBySTOModal userProfile={userProfile} initialParams={createInitial} onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchBookings() }} />}
      {editingBooking && <ViewEditBookingModal booking={editingBooking} userProfile={userProfile} onClose={() => setEditingBooking(null)} onSuccess={() => { setEditingBooking(null); fetchBookings() }} />}
    </div>
  )
}

function CreateBookingBySTOModal({ userProfile, onClose, onSuccess, initialParams }) {
  const [mode, setMode] = useState('online')
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [foundCar, setFoundCar] = useState(null)
  const [f, setF] = useState({ date: initialParams?.date || new Date().toISOString().split('T')[0], time: initialParams?.time || '10:00', issue: '' })
  const [off, setOff] = useState({ plate: '', brand: '', clientName: '', phone: '' })
  const ic = inp_cls()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!search.trim()) return
    setLoading(true); setErr('')
    try {
      const snap = await getDocs(query(collection(db, 'cars'), where('plate', '==', search.trim().toUpperCase())))
      if (snap.empty) { setErr('Авто не знайдено або закрито власником.'); setFoundCar(null) }
      else { setFoundCar({ id: snap.docs[0].id, ...snap.docs[0].data() }); setStep(2) }
    } catch(e) { console.error(e); setErr('Помилка пошуку.') }
    finally { setLoading(false) }
  }

  const submitOnline = async (e) => {
    e.preventDefault()
    if (!f.issue || !foundCar) return
    setLoading(true)
    try {
      await addDoc(collection(db, 'bookings'), { stoId: auth.currentUser.uid, userId: foundCar.userId || 'unclaimed', carId: foundCar.id, carBrand: foundCar.brand || '', carModel: foundCar.model || '', date: f.date, time: f.time, issue: f.issue, status: 'confirmed', creator: 'sto', isOffline: false, createdAt: Date.now() })
      onSuccess()
    } catch(e) { console.error(e); alert('Помилка'); setLoading(false) }
  }

  const submitOffline = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addDoc(collection(db, 'bookings'), { stoId: auth.currentUser.uid, userId: 'offline', carId: 'offline', date: f.date, time: f.time, issue: f.issue, status: 'confirmed', creator: 'sto', isOffline: true, offlineData: off, createdAt: Date.now() })
      onSuccess()
    } catch(e) { console.error(e); alert('Помилка'); setLoading(false) }
  }

  return (
    <Modal title="Створити запис" onClose={onClose}>
      <div className="flex al-card p-1 rounded-xl mb-4 text-sm font-bold w-full gap-1" style={{ background: 'var(--bg-input)' }}>
        <button onClick={() => setMode('online')} className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg transition-colors" style={{ background: mode === 'online' ? 'var(--bg-card)' : 'transparent', color: mode === 'online' ? 'var(--brand)' : 'var(--text-2)' }}><User size={15}/> В AutoLog</button>
        <button onClick={() => setMode('offline')} className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg transition-colors" style={{ background: mode === 'offline' ? 'var(--bg-card)' : 'transparent', color: mode === 'offline' ? 'var(--brand)' : 'var(--text-2)' }}><Edit3 size={15}/> Офлайн</button>
      </div>

      {mode === 'online' && step === 1 && (
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <Field label="Номер автомобіля">
            <div className="al-input-wrap">
              <Search size={15} className="al-input-icon" />
              <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="AA0000AA" className="al-input-inner uppercase font-mono" maxLength={12} required />
            </div>
          </Field>
          {err && <p className="text-xs font-bold p-3 rounded-xl flex items-center gap-2" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}><Info size={14}/> {err}</p>}
          <PrimaryBtn type="submit" disabled={loading} className="w-full py-4 justify-center text-base mt-2">{loading ? <Loader2 className="animate-spin" size={20}/> : 'Знайти і далі'}</PrimaryBtn>
        </form>
      )}

      {mode === 'online' && step === 2 && foundCar && (
        <form onSubmit={submitOnline} className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--brand-soft)', border: '1px solid rgba(92,62,254,0.2)' }}>
            <div className="flex items-center gap-3">
              <Car size={20} style={{ color: 'var(--brand)' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{foundCar.brand} {foundCar.model}</p>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{foundCar.plate}</p>
              </div>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-xs font-bold" style={{ color: 'var(--brand)' }}>Змінити</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Дата *"><input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className={ic} required/></Field>
            <Field label="Час *"><input type="time" value={f.time} onChange={e => setF({...f, time: e.target.value})} className={ic} required/></Field>
          </div>
          <Field label="Опис робіт *"><textarea value={f.issue} onChange={e => setF({...f, issue: e.target.value})} className={`${ic} resize-none h-24`} placeholder="Заміна ГРМ та помпи" required /></Field>
          <PrimaryBtn type="submit" disabled={loading} className="w-full py-4 justify-center mt-2">{loading ? <Loader2 className="animate-spin" size={20}/> : 'Підтвердити та забронювати'}</PrimaryBtn>
        </form>
      )}

      {mode === 'offline' && (
        <form onSubmit={submitOffline} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Марка та модель *"><input value={off.brand} onChange={e => setOff({...off, brand: e.target.value})} className={ic} placeholder="VW Golf" required/></Field>
            <Field label="Номер авто *"><input value={off.plate} onChange={e => setOff({...off, plate: e.target.value.toUpperCase()})} className={`${ic} uppercase font-mono`} placeholder="AA0000AA" required/></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ім'я клієнта *"><input value={off.clientName} onChange={e => setOff({...off, clientName: e.target.value})} className={ic} placeholder="Андрій" required/></Field>
            <Field label="Телефон"><input value={off.phone} onChange={e => setOff({...off, phone: e.target.value})} className={ic} placeholder="+380..."/></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Дата *"><input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className={ic} required/></Field>
            <Field label="Час *"><input type="time" value={f.time} onChange={e => setF({...f, time: e.target.value})} className={ic} required/></Field>
          </div>
          <Field label="Опис *"><textarea value={f.issue} onChange={e => setF({...f, issue: e.target.value})} className={`${ic} resize-none h-20`} placeholder="Заміна мастила" required /></Field>
          <PrimaryBtn type="submit" disabled={loading} className="w-full py-4 justify-center mt-2">{loading ? <Loader2 className="animate-spin" size={20}/> : 'Зберегти офлайн запис'}</PrimaryBtn>
        </form>
      )}
    </Modal>
  )
}

function ViewEditBookingModal({ booking, userProfile, onClose, onSuccess }) {
  const [f, setF] = useState({ date: booking.date || '', time: booking.time || '', issue: booking.issue || '' })
  const [loading, setLoading] = useState(false)
  const [completeMode, setCompleteMode] = useState(false)
  const [cost, setCost] = useState('')
  const [mileage, setMileage] = useState('')
  const ic = inp_cls()

  const submitEdit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await updateDoc(doc(db, 'bookings', booking.id), { date: f.date, time: f.time, issue: f.issue }); onSuccess() }
    catch(e) { console.error(e); alert('Помилка'); setLoading(false) }
  }

  const completeOrder = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!booking.isOffline && booking.carId && booking.userId) {
        await addDoc(collection(db, 'history'), { title: f.issue || 'Сервісні роботи', cost: Number(cost) || 0, mileage: Number(mileage) || 0, category: 'maintenance', date: f.date || new Date().toISOString().split('T')[0], garage: userProfile?.stoName || 'СТО AutoLog', carId: booking.carId, userId: booking.userId, createdAt: Date.now(), status: 'verified', source: 'sto_booking_completion', stoId: auth.currentUser.uid })
      }
      await updateDoc(doc(db, 'bookings', booking.id), { status: 'completed' })
      onSuccess()
    } catch(e) { console.error(e); alert('Помилка'); setLoading(false) }
  }

  if (completeMode) return (
    <Modal title="Завершити замовлення" onClose={onClose}>
      <form onSubmit={completeOrder} className="flex flex-col gap-4">
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>Введіть суму та пробіг. {booking.isOffline ? 'Запис буде закрито.' : 'Ці дані додадуться в сервісну історію авто.'}</p>
        <Field label="Вартість (₴)"><input type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} className={ic} placeholder="1500" required/></Field>
        <Field label="Пробіг (км)"><input type="number" min="0" value={mileage} onChange={e => setMileage(e.target.value)} className={ic} placeholder="125000" required/></Field>
        <div className="flex gap-3 mt-2">
          <button type="button" onClick={() => setCompleteMode(false)} className="flex-1 py-3 font-bold rounded-xl transition-colors" style={{ background: 'var(--bg-input)', color: 'var(--text-2)' }}>Назад</button>
          <PrimaryBtn type="submit" disabled={loading} className="flex-1 py-3 justify-center" style={{ background: 'linear-gradient(135deg,#10B981,#34d399)' }}>
            {loading ? <Loader2 className="animate-spin" size={20}/> : 'Підтвердити'}
          </PrimaryBtn>
        </div>
      </form>
    </Modal>
  )

  return (
    <Modal title="Редагувати запис" onClose={onClose}>
      <form onSubmit={submitEdit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Дата *"><input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className={ic} required/></Field>
          <Field label="Час *"><input type="time" value={f.time} onChange={e => setF({...f, time: e.target.value})} className={ic} required/></Field>
        </div>
        <Field label="Опис робіт *">
          <textarea value={f.issue} onChange={e => setF({...f, issue: e.target.value})} className={`${ic} resize-none h-24`} placeholder="Наприклад: Заміна ГРМ та помпи" required />
        </Field>
        <div className="flex gap-3 mt-2">
          <button type="button" onClick={() => setCompleteMode(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm rounded-xl transition-colors"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle2 size={15}/> Завершити
          </button>
          <PrimaryBtn type="submit" disabled={loading} className="flex-1 py-3 justify-center">
            {loading ? <Loader2 className="animate-spin" size={20}/> : 'Зберегти'}
          </PrimaryBtn>
        </div>
      </form>
    </Modal>
  )
}
