import React, { useState, useMemo } from 'react'
import { Fuel, Plus, Check, Loader2, Trash2, Gauge, Droplets, TrendingUp } from 'lucide-react'
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
            </Field>
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
        <h2 className="text-base font-bold mb-5" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>Витрата пального (л/100 км)</h2>
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
