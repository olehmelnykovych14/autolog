import React, { useState, useMemo } from 'react'
import { Fuel, Plus, Check, Loader2, Trash2, Gauge, Droplets, TrendingUp, TrendingDown, MapPin, Info } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Field, inp_cls, PrimaryBtn } from '../common/Common'
import { fmt, fmtNum } from '../../utils'

const todayStr = () => new Date().toISOString().slice(0, 10)

export function FuelView({ carList = [], historyList = [], onAddService, onDeleteService }) {
  const ic = inp_cls()
  const [carId, setCarId] = useState(carList[0]?.id ? String(carList[0].id) : '')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: todayStr(), mileage: '', liters: '', cost: '', fullTank: true, station: '' })

  // Усі заправки (category === 'fuel')
  const fuelEntries = useMemo(
    () => historyList.filter(h => h.category === 'fuel'),
    [historyList]
  )

  const selectedCar = carList.find(c => String(c.id) === String(carId))

  // Заправки обраного авто, відсортовані за пробігом
  const carFuel = useMemo(() => {
    return fuelEntries
      .filter(h => String(h.carId) === String(carId) && h.mileage && h.liters)
      .sort((a, b) => (a.mileage - b.mileage) || (new Date(a.date) - new Date(b.date)))
  }, [fuelEntries, carId])

  // Розрахунок витрати між послідовними заправками: Л/100км та ₴/100км
  const consumption = useMemo(() => {
    const points = []
    for (let i = 1; i < carFuel.length; i++) {
      const prev = carFuel[i - 1]
      const cur = carFuel[i]
      const dist = cur.mileage - prev.mileage
      if (dist <= 0) continue
      const lPer100 = (cur.liters / dist) * 100
      const costPer100 = ((cur.cost || 0) / dist) * 100
      points.push({
        name: new Date(cur.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }),
        lPer100: Math.round(lPer100 * 10) / 10,
        costPer100: Math.round(costPer100),
        dist,
      })
    }
    return points
  }, [carFuel])

  const stats = useMemo(() => {
    const totalLiters = carFuel.reduce((s, h) => s + (h.liters || 0), 0)
    const totalCost = carFuel.reduce((s, h) => s + (h.cost || 0), 0)
    const avgL = consumption.length ? consumption.reduce((s, p) => s + p.lPer100, 0) / consumption.length : 0
    const avgCost = consumption.length ? consumption.reduce((s, p) => s + p.costPer100, 0) / consumption.length : 0
    const last = consumption.length ? consumption[consumption.length - 1].lPer100 : 0
    return { totalLiters, totalCost, avgL, avgCost, last, fills: carFuel.length }
  }, [carFuel, consumption])

  // Журнал цін — по ВСІХ заправках (ціна ₴/л не залежить від авто).
  const priceHistory = useMemo(() => {
    return fuelEntries
      .map(h => ({ ...h, _price: h.pricePerLiter || (h.liters ? (h.cost || 0) / h.liters : 0) }))
      .filter(h => h._price > 0 && h.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [fuelEntries])

  const priceChart = useMemo(() => priceHistory.map(h => ({
    name: new Date(h.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }),
    price: Math.round(h._price * 100) / 100,
  })), [priceHistory])

  const priceStats = useMemo(() => {
    if (priceHistory.length === 0) return null
    const prices = priceHistory.map(h => h._price)
    const latest = prices[prices.length - 1]
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length
    return { latest, avg, min: Math.min(...prices), trend: latest - avg }
  }, [priceHistory])

  // Найдешевші АЗС (за середньою ціною), тільки з назвою станції.
  const byStation = useMemo(() => {
    const map = {}
    priceHistory.forEach(h => {
      const s = (h.station || '').trim()
      if (!s) return
      if (!map[s]) map[s] = { station: s, sum: 0, n: 0, last: 0, lastDate: '' }
      map[s].sum += h._price
      map[s].n++
      if (h.date >= map[s].lastDate) { map[s].last = h._price; map[s].lastDate = h.date }
    })
    return Object.values(map).map(v => ({ ...v, avg: v.sum / v.n })).sort((a, b) => a.avg - b.avg)
  }, [priceHistory])

  const submit = async () => {
    const liters = parseFloat(String(form.liters).replace(',', '.'))
    const cost = parseFloat(String(form.cost).replace(',', '.')) || 0
    const mileage = parseInt(form.mileage, 10)
    if (!carId || !liters || !mileage || !form.date) return
    setSaving(true)
    try {
      await onAddService({
        category: 'fuel',
        title: form.station ? `Заправка · ${form.station}` : 'Заправка',
        date: form.date,
        carId,
        plate: selectedCar?.plate || '',
        mileage,
        liters,
        cost,
        pricePerLiter: liters ? Math.round((cost / liters) * 100) / 100 : 0,
        fullTank: form.fullTank,
        station: form.station,
      })
      setForm({ date: todayStr(), mileage: '', liters: '', cost: '', fullTank: true, station: '' })
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  if (carList.length === 0) {
    return (
      <div className="al-card text-center" style={{ padding: 48 }}>
        <Fuel size={40} className="mx-auto mb-4" style={{ color: 'var(--text-3)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>
          Спочатку додайте авто в гараж, щоб вести журнал заправок.
        </p>
      </div>
    )
  }

  const statCards = [
    { label: 'Середня витрата', val: stats.avgL ? `${fmtNum(stats.avgL)} л/100` : '—', icon: <Droplets size={20} />, color: '#EF4444' },
    { label: 'Вартість', val: stats.avgCost ? `${fmt(Math.round(stats.avgCost))} ₴/100` : '—', icon: <TrendingUp size={20} />, color: '#F59E0B' },
    { label: 'Залито всього', val: `${fmtNum(stats.totalLiters)} л`, icon: <Fuel size={20} />, color: '#5C3EFE' },
    { label: 'Витрачено', val: `${fmt(Math.round(stats.totalCost))} ₴`, icon: <Gauge size={20} />, color: '#3B82F6' },
  ]

  return (
    <div className="flex flex-col gap-5 page-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Журнал пального</h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>Облік заправок та витрата на 100 км</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={carId} onChange={e => setCarId(e.target.value)} className={ic} style={{ width: 'auto', minWidth: 160 }}>
            {carList.map(c => (
              <option key={c.id} value={String(c.id)}>{c.brand}{c.model ? ` ${c.model}` : ''}</option>
            ))}
          </select>
          <button
            onClick={() => setAdding(a => !a)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 whitespace-nowrap"
            style={{ background: '#5C3EFE' }}
          >
            <Plus size={16} /> Заправка
          </button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="al-card" style={{ padding: 24 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Дата">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={ic} />
            </Field>
            <Field label="Пробіг (км)">
              <input type="number" inputMode="numeric" value={form.mileage} onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))} className={ic} placeholder={selectedCar?.mileage ? String(selectedCar.mileage) : '120000'} />
            </Field>
            <Field label="Літрів">
              <input type="number" inputMode="decimal" value={form.liters} onChange={e => setForm(f => ({ ...f, liters: e.target.value }))} className={ic} placeholder="42.5" />
            </Field>
            <Field label="Сума (₴)">
              <input type="number" inputMode="decimal" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className={ic} placeholder="2200" />
            </Field>
            <Field label="АЗС (необов'язково)">
              <input value={form.station} onChange={e => setForm(f => ({ ...f, station: e.target.value }))} className={ic} placeholder="OKKO, WOG..." />
            </Field>
            <Field label="Повний бак">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, fullTank: !f.fullTank }))}
                className={`w-full py-3 rounded-xl text-sm font-bold border transition-all ${form.fullTank ? 'bg-[#5C3EFE] text-white border-[#5C3EFE]' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
              >
                {form.fullTank ? 'Так — повний бак' : 'Ні — частково'}
              </button>
              <p className="mt-1.5 text-xs leading-snug" style={{ color: 'var(--text-3)' }}>
                Вмикайте, якщо залили бак <b>до повного</b> — тоді витрата на 100 км рахується точно. Часткові доливки позначайте «Ні».
              </p>
            </Field>
          </div>

          <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-2xl" style={{ background: 'var(--bg-hover)' }}>
            <Info size={16} className="flex-none mt-0.5" style={{ color: 'var(--brand)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
              <b>Як рахується витрата:</b> на кожній заправці вкажіть поточний <b>пробіг</b> і <b>скільки літрів залили</b>.
              Витрата за період = залиті літри ÷ пройдені кілометри × 100. Для коректних цифр заправляйтесь
              «до повного» й вносьте заправку щоразу — графік оживе після <b>другої</b> заправки.
            </p>
          </div>
          <div className="flex gap-3 mt-5">
            <PrimaryBtn onClick={submit} disabled={saving || !form.liters || !form.mileage} className="flex-1 py-3 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Зберегти заправку</>}
            </PrimaryBtn>
            <button onClick={() => setAdding(false)} className="px-5 py-3 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
              Скасувати
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="al-card stat-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-val" style={{ fontSize: 22 }}>{s.val}</div>
              </div>
              <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Consumption chart */}
      <div className="al-card" style={{ padding: 24 }}>
        <div className="mb-5">
          <h2 className="text-base font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>Витрата пального (л/100 км)</h2>
          <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
            <Info size={12} style={{ color: 'var(--brand)' }} /> Рахується між заправками: літри ÷ пройдені км × 100. Точно — коли заправляєтесь «до повного».
          </p>
        </div>
        {consumption.length === 0 ? (
          <div className="py-12 text-center text-sm font-medium" style={{ color: 'var(--text-3)' }}>
            Додайте принаймні дві заправки з пробігом, щоб побачити динаміку витрати.
          </div>
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={consumption} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--line-2)" horizontal vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 16, color: 'var(--text)', fontSize: 13, fontWeight: 700, boxShadow: 'var(--shadow-md)' }}
                  formatter={(val, name) => name === 'lPer100' ? [`${val} л/100`, 'Витрата'] : [val, name]}
                />
                <Line type="monotone" dataKey="lPer100" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444', stroke: 'var(--bg-card)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Fuel prices journal */}
      {priceStats && (
        <div className="al-card" style={{ padding: 24 }}>
          <div className="mb-5">
            <h2 className="text-base font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>Ціни на пальне</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>По всіх ваших заправках · ₴ за літр</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="al-card stat-card" style={{ padding: 14 }}>
              <div className="stat-label">Остання</div>
              <div className="stat-val flex items-center gap-1" style={{ fontSize: 20 }}>
                {fmtNum(priceStats.latest, 2)} ₴
                {priceStats.trend < -0.01 ? <TrendingDown size={14} style={{ color: '#22C55E' }} /> : priceStats.trend > 0.01 ? <TrendingUp size={14} style={{ color: '#EF4444' }} /> : null}
              </div>
            </div>
            <div className="al-card stat-card" style={{ padding: 14 }}>
              <div className="stat-label">Середня</div>
              <div className="stat-val" style={{ fontSize: 20 }}>{fmtNum(priceStats.avg, 2)} ₴</div>
            </div>
            <div className="al-card stat-card" style={{ padding: 14 }}>
              <div className="stat-label">Мінімальна</div>
              <div className="stat-val" style={{ fontSize: 20, color: '#22C55E' }}>{fmtNum(priceStats.min, 2)} ₴</div>
            </div>
          </div>

          {priceChart.length >= 2 && (
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceChart} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" stroke="var(--line-2)" horizontal vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 16, color: 'var(--text)', fontSize: 13, fontWeight: 700, boxShadow: 'var(--shadow-md)' }} formatter={(val) => [`${val} ₴/л`, 'Ціна']} />
                  <Line type="monotone" dataKey="price" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B', stroke: 'var(--bg-card)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {byStation.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                <MapPin size={13} /> Найдешевші АЗС
              </h3>
              <div className="flex flex-col gap-2">
                {byStation.slice(0, 5).map((s, i) => (
                  <div key={s.station} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg-hover)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0" style={{ background: i === 0 ? 'rgba(34,197,94,0.15)' : 'var(--bg-input)', color: i === 0 ? '#22C55E' : 'var(--text-3)' }}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{s.station}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{s.n} {s.n === 1 ? 'заправка' : 'заправок'} · остання {fmtNum(s.last, 2)} ₴</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black" style={{ color: i === 0 ? '#22C55E' : 'var(--text)' }}>{fmtNum(s.avg, 2)} ₴</p>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>середня</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="al-card" style={{ padding: 24 }}>
        <h2 className="text-base font-bold mb-5" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>Історія заправок</h2>
        {carFuel.length === 0 ? (
          <div className="py-10 text-center text-sm font-medium" style={{ color: 'var(--text-3)' }}>Ще немає заправок для цього авто.</div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
            <table className="al-table">
              <thead>
                <tr>{['Дата', 'Пробіг', 'Літрів', '₴/л', 'Сума', ''].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[...carFuel].reverse().map(h => (
                  <tr key={h.id}>
                    <td style={{ color: 'var(--text-2)', fontWeight: 500 }}>{h.date?.split('-').reverse().join('.')}</td>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(h.mileage)} км</td>
                    <td style={{ color: 'var(--text-2)' }}>{fmtNum(h.liters)} л {h.fullTank ? '' : '(частк.)'}</td>
                    <td style={{ color: 'var(--text-3)' }}>{h.pricePerLiter ? `${fmtNum(h.pricePerLiter, 2)}` : '—'}</td>
                    <td style={{ color: 'var(--brand)', fontWeight: 800 }}>{fmt(h.cost || 0)} ₴</td>
                    <td>
                      <button onClick={() => onDeleteService(h.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
