import React, { useEffect, useState } from 'react'
import { TrendingUp, Activity, Wrench, ShieldCheck, Clock, Bell, PieChart as PieIcon } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { collection, onSnapshot } from 'firebase/firestore'
import { fmt, fmtCost, reminderStatus } from '../../utils'
import { C, CAT, CAT_CLR, CAT_HEX } from '../../constants'
import { auth, db } from '../../firebase'

export function DashboardView({ carList, historyList }) {
  // ── Reminders (real-time) ──
  const [reminders, setReminders] = useState([])
  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'reminders'),
      snap => setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('Reminders listener error:', err)
    )
    return () => unsub()
  }, [])

  const upcomingReminders = reminders
    .filter(r => r.enabled !== false && r.date)
    .map(r => ({ ...r, _s: reminderStatus(r.date) }))
    .sort((a, b) => (a._s.days ?? 1e9) - (b._s.days ?? 1e9))
    .slice(0, 4)
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const monthlyExpenses = historyList
    .filter(h => { const d = new Date(h.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear })
    .reduce((s, h) => s + (h.cost || 0), 0)

  const totalMileage = carList.reduce((s, c) => s + (c.mileage || 0), 0)
  const yearRecords = historyList.filter(h => new Date(h.date).getFullYear() === thisYear).length

  const stats = [
    { label: 'Витрати за місяць', val: monthlyExpenses > 0 ? `${fmt(monthlyExpenses)} ₴` : '0 ₴', icon: <TrendingUp size={22} />, color: '#F59E0B' },
    { label: 'Загальний пробіг',  val: `${fmt(totalMileage)} км`,  icon: <Activity size={22} />,    color: '#5C3EFE' },
    { label: 'Записів цей рік',   val: `${yearRecords}`,           icon: <Wrench size={22} />,      color: '#3B82F6', sub: `${carList.length} авто в гаражі` },
  ]

  const monthNames = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру']
  const chartData = []
  for (let i = 5; i >= 0; i--) {
    const m = new Date(thisYear, thisMonth - i, 1)
    const mIdx = m.getMonth(); const mYear = m.getFullYear()
    const total = historyList
      .filter(h => { const d = new Date(h.date); return d.getMonth() === mIdx && d.getFullYear() === mYear })
      .reduce((s, h) => s + (h.cost || 0), 0)
    chartData.push({ name: monthNames[mIdx], cost: total })
  }

  // ── Expense breakdown by category (this year) ──
  const catTotals = historyList
    .filter(h => new Date(h.date).getFullYear() === thisYear && (h.cost || 0) > 0)
    .reduce((acc, h) => {
      const key = h.category || 'other'
      acc[key] = (acc[key] || 0) + (h.cost || 0)
      return acc
    }, {})
  const catData = Object.entries(catTotals)
    .map(([key, value]) => ({ key, name: CAT[key] || 'Інше', value, hex: CAT_HEX[key] || CAT_HEX.other }))
    .sort((a, b) => b.value - a.value)
  const catTotalSum = catData.reduce((s, d) => s + d.value, 0)


  return (
    <div className="flex flex-col gap-5 page-in">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
        {stats.map((s, i) => (
          <div key={i} className="al-card al-card-hover stat-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-val" style={{ fontSize: s.val.length > 10 ? 24 : 30 }}>{s.val}</div>
                {s.sub && (
                  <div className="stat-sub">
                    <div className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: 'var(--brand)' }} />
                    {s.sub}
                  </div>
                )}
              </div>
              <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="al-card" style={{ padding: 24 }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>
              <Bell size={17} style={{ color: 'var(--brand)' }} /> Найближчі нагадування
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingReminders.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: 'var(--bg-hover)' }}>
                <div className="w-2 h-10 rounded-full flex-none" style={{ background: r._s.hex }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{r.label}</span>
                    {r.carLabel && <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'var(--bg-card)', color: 'var(--text-3)' }}>{r.carLabel}</span>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{new Date(r.date).toLocaleDateString('uk-UA')}</div>
                </div>
                <span className="text-xs font-black flex-none" style={{ color: r._s.hex }}>{r._s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="al-card lg:col-span-2" style={{ padding: 24 }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>
              Витрати за останні 6 місяців
            </h2>
            <span className="chip brand">{thisYear}</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--line-2)" horizontal={true} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 16, color: 'var(--text)', fontSize: 13, fontWeight: 700, boxShadow: 'var(--shadow-md)' }}
                  formatter={(val) => [`${fmt(val)} ₴`, 'Витрати']}
                  labelStyle={{ color: 'var(--text-3)', fontSize: 11 }}
                />
                <Line type="monotone" dataKey="cost" stroke="var(--brand)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--brand)', stroke: 'var(--bg-card)', strokeWidth: 2 }} activeDot={{ r: 6, fill: 'var(--brand)', stroke: 'var(--bg-card)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="al-card" style={{ padding: 24 }}>
          <h2 className="text-base font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>
            <PieIcon size={17} style={{ color: 'var(--brand)' }} /> Категорії витрат
          </h2>
          {catData.length === 0 ? (
            <div className="py-12 text-center text-sm font-medium" style={{ color: 'var(--text-3)' }}>Немає витрат цього року</div>
          ) : (
            <>
              <div style={{ height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2} stroke="none">
                      {catData.map(d => <Cell key={d.key} fill={d.hex} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 16, color: 'var(--text)', fontSize: 13, fontWeight: 700, boxShadow: 'var(--shadow-md)' }}
                      formatter={(val, name) => [`${fmt(val)} ₴`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-3">
                {catData.slice(0, 5).map(d => (
                  <div key={d.key} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: d.hex }} />
                    <span className="flex-1 truncate" style={{ color: 'var(--text-2)' }}>{d.name}</span>
                    <span className="font-bold" style={{ color: 'var(--text)' }}>{Math.round((d.value / catTotalSum) * 100)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="al-card" style={{ padding: 24 }}>
        <h2 className="text-base font-bold mb-5" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>Остання активність</h2>
        <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
          <table className="al-table">
            <thead>
              <tr>
                {['Авто','Послуга','Дата','Вартість','Статус'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...historyList].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(r => {
                const norm = p => p ? String(p).toUpperCase().trim() : ''
                const rPlate = norm(r.plate)
                const car = carList.find(c => String(c.id) === String(r.carId))
                         || carList.find(c => rPlate && norm(c.plate) === rPlate)
                         || carList[0]
                const carName = car ? `${car.brand}${car.model ? ' ' + car.model : ''}` : 'Авто'

                return (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{carName}</td>
                    <td>
                      <span className={`chip mr-2`}>{CAT[r.category]}</span>
                      <span style={{ color: 'var(--text-2)' }}>{r.title?.slice(0, 30)}{r.title?.length > 30 ? '…' : ''}</span>
                    </td>
                    <td style={{ color: 'var(--text-2)', fontWeight: 500 }}>{r.date?.split('-').reverse().join('.')}</td>
                    <td style={{ color: r.cost > 0 ? 'var(--brand)' : 'var(--good)', fontWeight: 800, fontSize: 14 }}>{fmtCost(r.cost)}</td>
                    <td>
                      {r.status === 'verified'
                        ? <span className="chip good" style={{ gap: 5 }}><ShieldCheck size={11} />Verified</span>
                        : <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-3)' }}><Clock size={13} />Очікується</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {historyList.length === 0 && (
            <div className="py-12 text-center" style={{ color: 'var(--text-3)' }}>
              <p className="text-sm font-medium">Немає активності. Додайте перший сервіс!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
