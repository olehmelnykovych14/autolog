import React from 'react'
import { TrendingUp, Activity, Wrench, ShieldCheck, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fmt, fmtCost } from '../../utils'
import { C, CAT, CAT_CLR } from '../../constants'

export function DashboardView({ carList, historyList }) {
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

  const isDark = document.documentElement.classList.contains('dark')

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

      {/* Chart */}
      <div className="al-card" style={{ padding: 24 }}>
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
