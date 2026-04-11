import React from 'react'
import { TrendingUp, Activity, Wrench, ShieldCheck, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fmt, fmtCost } from '../../utils'
import { C, CAT, CAT_CLR } from '../../constants'

export function DashboardView({ carList, historyList }) {
  console.log("🛠 DASHBOARD DEBUG:", { 
    carsCount: carList.length, 
    historyCount: historyList.length,
    firstCar: carList[0],
    firstHistory: historyList[0] 
  })
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  // Calculate real monthly expenses
  const monthlyExpenses = historyList
    .filter(h => { const d = new Date(h.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear })
    .reduce((s, h) => s + (h.cost || 0), 0)

  // Calculate total mileage
  const totalMileage = carList.reduce((s, c) => s + (c.mileage || 0), 0)

  // Calculate number of service records this year
  const yearRecords = historyList.filter(h => new Date(h.date).getFullYear() === thisYear).length

  const stats = [
    { label: 'ВИТРАТИ ЗА МІСЯЦЬ', val: monthlyExpenses > 0 ? `${fmt(monthlyExpenses)} ₴` : '0 ₴', icon: <TrendingUp size={24} className="text-orange-500" /> },
    { label: 'ЗАГАЛЬНИЙ ПРОБІГ', val: `${fmt(totalMileage)} КМ`, icon: <Activity size={24} className="text-[#5C3EFE]" /> },
    { label: 'ЗАПИСІВ ЦЕЙ РІК', val: `${yearRecords}`, sub: `${carList.length} авто в гаражі`, icon: <Wrench size={24} className="text-blue-500" /> },
  ]

  // Build chart data for last 6 months
  const chartData = []
  const monthNames = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру']
  for (let i = 5; i >= 0; i--) {
    const m = new Date(thisYear, thisMonth - i, 1)
    const mIdx = m.getMonth()
    const mYear = m.getFullYear()
    const total = historyList
      .filter(h => { const d = new Date(h.date); return d.getMonth() === mIdx && d.getFullYear() === mYear })
      .reduce((s, h) => s + (h.cost || 0), 0)
    chartData.push({ name: monthNames[mIdx], cost: total })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-200/50 dark:border-gray-700/60 shadow-md shadow-gray-200/50 dark:shadow-none flex flex-col justify-between min-h-[160px] hover:border-indigo-200 transition-all group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">{s.val}</h3>
                {s.sub && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <p className="text-xs font-bold text-gray-500">{s.sub}</p>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-800/50 group-hover:scale-110 transition-transform">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Spending Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/50 dark:border-gray-700/60 p-6 shadow-md shadow-gray-200/50 dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Витрати за останні 6 місяці</h2>
          <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-[10px] font-bold text-[#5C3EFE] uppercase tracking-wider border border-indigo-100 dark:border-indigo-800/50">{thisYear}</div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 700 }}
                formatter={(val) => [`${fmt(val)} ₴`, 'Витрати']}
                labelStyle={{ color: '#94A3B8', fontSize: '11px', marginBottom: '4px' }}
              />
              <Line type="monotone" dataKey="cost" stroke="#5C3EFE" strokeWidth={3} dot={{ r: 5, fill: '#5C3EFE', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#5C3EFE', stroke: '#fff', strokeWidth: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/50 dark:border-gray-700/60 p-6 shadow-md shadow-gray-200/50 dark:shadow-none">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Остання активність</h2>
        <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
          <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wide">
              {['Авто', 'Послуга', 'Дата', 'Вартість', 'Статус'].map(h => <th key={h} className="text-left pb-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...historyList].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(r => {
              const car = carList.find(c => String(c.id).toLowerCase() === String(r.carId).toLowerCase())
                       || carList.find(c => r.plate && String(c.plate).trim().toLowerCase() === String(r.plate).trim().toLowerCase())
                       || carList[0] // ГАРАНТОВАНИЙ FALLBACK: беремо першу машину, якщо іншу не знайдено
              return (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="py-3 font-medium text-gray-900 dark:text-white">
                    {car ? `${car.brand}${car.model ? ' ' + car.model : ''}` : <span className="text-gray-300 dark:text-gray-600">не знайдено</span>}
                  </td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mr-2 ${CAT_CLR[r.category] || 'bg-gray-100 text-gray-600'}`}>{CAT[r.category]}</span>
                    <span className="text-gray-700 dark:text-gray-300">{r.title}</span>
                  </td>
                  <td className="py-4 text-gray-500 dark:text-gray-400 font-medium">{r.date?.split('-').reverse().join('.')}</td>
                  <td className="py-4 font-bold text-base" style={{ color: r.cost > 0 ? C : '#10B981' }}>{fmtCost(r.cost)}</td>
                  <td className="py-4">
                    {r.status === 'verified'
                      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-100 dark:border-blue-800/50 whitespace-nowrap"><ShieldCheck size={14} />Verified</span>
                      : <span className="text-gray-400 text-xs font-medium flex items-center gap-1"><Clock size={14} />Очікується</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
