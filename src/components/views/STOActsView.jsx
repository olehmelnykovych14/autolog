import React, { useState, useEffect } from 'react'
import { FileText, Download, Search, Loader2, ChevronRight, Printer, Plus, X } from 'lucide-react'
import { collection, query, where, getDocs, addDoc, disableNetwork } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { inp_cls, Field, Modal, PrimaryBtn } from '../common/Common'
import { fmt } from '../../utils'
import { CAT } from '../../constants'

const ACT_PRINT_STYLE = `
  @media print {
    body * { visibility: hidden !important; }
    #act-print-area, #act-print-area * { visibility: visible !important; }
    #act-print-area { position: fixed; inset: 0; padding: 32px; background: white; }
    @page { margin: 20mm; }
  }
`

export function STOActsView({ userProfile }) {
  const ic = inp_cls()
  const [acts, setActs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [historyItems, setHistoryItems] = useState([])
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    if (!loading && typeof window !== 'undefined' && window.navigator.webdriver) {
      disableNetwork(db).catch(console.error)
    }
  }, [loading])

  useEffect(() => { fetchActs() }, [])

  const fetchActs = async () => {
    if (!auth.currentUser) return
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'acts'), where('stoId', '==', auth.currentUser.uid)))
      setActs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openCreate = async () => {
    setShowCreate(true)
    setHistLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'history'), where('stoId', '==', auth.currentUser.uid)))
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.date) - new Date(a.date))
      setHistoryItems(items)
    } catch (e) { console.error(e) }
    finally { setHistLoading(false) }
  }

  const filtered = acts.filter(a => {
    const q = search.toLowerCase()
    return !q || a.clientName?.toLowerCase().includes(q) || a.carPlate?.toLowerCase().includes(q) || a.actNumber?.includes(q)
  })

  return (
    <div className="flex flex-col gap-6">
      <style>{ACT_PRINT_STYLE}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Акти виконаних робіт</h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-3)' }}>
            {loading ? 'Завантаження...' : `${filtered.length} актів`}
          </p>
        </div>
        <button className="btn-brand sm:self-center" onClick={openCreate}>
          <Plus size={16} /> Новий акт
        </button>
      </div>

      <div className="al-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук по клієнту, номеру авто або акту..." className={`${ic} !pl-10`} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} style={{ color: 'var(--brand)' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="al-card p-12 text-center" style={{ border: '2px dashed var(--line-2)' }}>
          <FileText size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-3)' }} />
          <p className="font-bold" style={{ color: 'var(--text)' }}>Актів ще немає</p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-3)' }}>Створіть перший акт на основі сервісних записів</p>
          <button className="btn-brand mx-auto" onClick={openCreate}><Plus size={16} /> Створити акт</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(act => (
            <div key={act.id} className="al-card al-card-hover p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Акт №{act.actNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>{act.carPlate}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {act.clientName} · {new Date(act.createdAt).toLocaleDateString('uk-UA')}
                </div>
              </div>
              <div className="text-base font-black flex-none" style={{ color: 'var(--text)' }}>{fmt(act.totalCost)} ₴</div>
              <button onClick={() => setPreview(act)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                <Printer size={14} /> PDF
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateActModal
          onClose={() => setShowCreate(false)}
          historyItems={historyItems}
          histLoading={histLoading}
          userProfile={userProfile}
          onCreated={(act) => { setActs(prev => [act, ...prev]); setShowCreate(false) }}
        />
      )}

      {preview && (
        <ActPreviewModal act={preview} stoProfile={userProfile} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}

function CreateActModal({ onClose, historyItems, histLoading, userProfile, onCreated }) {
  const ic = inp_cls()
  const [selected, setSelected] = useState([])
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [carPlate, setCarPlate] = useState('')
  const [carBrand, setCarBrand] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const toggle = (item) => {
    setSelected(prev => prev.find(s => s.id === item.id)
      ? prev.filter(s => s.id !== item.id)
      : [...prev, item]
    )
    if (!carPlate && item.plate) setCarPlate(item.plate)
    if (!carBrand && item.carBrand) setCarBrand(item.carBrand)
  }

  const totalCost = selected.reduce((s, i) => s + (i.cost || 0), 0)

  const save = async () => {
    if (!selected.length || !clientName) return
    setSaving(true)
    try {
      const actNumber = `${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
      const act = {
        stoId: auth.currentUser.uid,
        stoName: userProfile?.stoName || 'AutoService',
        stoAddress: userProfile?.stoAddress || '',
        actNumber,
        clientName,
        clientPhone,
        carPlate,
        carBrand,
        notes,
        items: selected.map(i => ({ title: i.title, category: i.category, cost: i.cost, date: i.date })),
        totalCost,
        createdAt: Date.now(),
      }
      const ref = await addDoc(collection(db, 'acts'), act)
      onCreated({ id: ref.id, ...act })
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <Modal title="Новий акт виконаних робіт" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Клієнт *">
            <input value={clientName} onChange={e => setClientName(e.target.value)} className={ic} placeholder="Іван Іванов" />
          </Field>
          <Field label="Телефон">
            <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className={ic} placeholder="+380..." />
          </Field>
          <Field label="Держ. номер">
            <input value={carPlate} onChange={e => setCarPlate(e.target.value)} className={ic} placeholder="AA 0000 BB" />
          </Field>
          <Field label="Авто">
            <input value={carBrand} onChange={e => setCarBrand(e.target.value)} className={ic} placeholder="Acura ILX 2022" />
          </Field>
        </div>

        <div>
          <div className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: 'var(--brand)' }}>
            Вибрати роботи зі сервісної históрії
          </div>
          {histLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin" style={{ color: 'var(--brand)' }} size={24} /></div>
          ) : historyItems.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>Сервісних записів ще немає</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
              {historyItems.map(item => {
                const isSelected = selected.find(s => s.id === item.id)
                return (
                  <button key={item.id} type="button" onClick={() => toggle(item)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? 'border-[#5C3EFE] bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'}`}
                    style={{ background: isSelected ? undefined : 'var(--bg)' }}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-none transition-all ${isSelected ? 'bg-[#5C3EFE] border-[#5C3EFE]' : 'border-gray-300'}`}>
                      {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.title}</div>
                      <div className="text-xs" style={{ color: 'var(--text-3)' }}>{CAT[item.category] || item.category} · {item.date}</div>
                    </div>
                    <div className="text-sm font-bold flex-none" style={{ color: 'var(--brand)' }}>{fmt(item.cost)} ₴</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <Field label="Примітки">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className={ic} rows={2} placeholder="Додаткові коментарі..." />
        </Field>

        {selected.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: 'var(--brand-soft)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Разом ({selected.length} поз.):</span>
            <span className="text-lg font-black" style={{ color: 'var(--brand)' }}>{fmt(totalCost)} ₴</span>
          </div>
        )}

        <PrimaryBtn onClick={save} disabled={saving || !selected.length || !clientName} className="w-full py-4 justify-center">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <><FileText size={18} /> Створити акт</>}
        </PrimaryBtn>
      </div>
    </Modal>
  )
}

function ActPreviewModal({ act, stoProfile, onClose }) {
  const print = () => {
    const html = `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8"/>
<title>Акт №${act.actNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; color: #111; padding: 32px; font-size: 14px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 2px solid #111; }
  .sto-name { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; }
  .sto-addr { font-size: 12px; color: #555; margin-top: 4px; }
  .act-num { font-size: 18px; font-weight: 900; text-align: right; }
  .act-date { font-size: 12px; color: #555; margin-top: 4px; text-align: right; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .box { padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; }
  .box-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 6px; }
  .box-title { font-size: 15px; font-weight: 700; }
  .box-sub { font-size: 12px; color: #555; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; padding: 8px 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #555; border-bottom: 2px solid #111; }
  th:last-child { text-align: right; }
  td { padding: 9px 4px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
  td:last-child { text-align: right; font-weight: 700; }
  .total-row td { border-top: 2px solid #111; border-bottom: none; font-weight: 900; font-size: 15px; padding-top: 10px; }
  .notes { margin-bottom: 24px; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 10px; }
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .sig-label { font-size: 12px; font-weight: 700; color: #555; margin-bottom: 28px; }
  .sig-line { border-top: 1px solid #aaa; padding-top: 5px; font-size: 12px; color: #888; }
</style>
</head>
<body>
<div class="header">
  <div><div class="sto-name">${act.stoName}</div>${act.stoAddress ? `<div class="sto-addr">${act.stoAddress}</div>` : ''}</div>
  <div><div class="act-num">АКТ №${act.actNumber}</div><div class="act-date">Дата: ${new Date(act.createdAt).toLocaleDateString('uk-UA')}</div></div>
</div>
<div class="grid2">
  <div class="box"><div class="box-label">Замовник</div><div class="box-title">${act.clientName}</div>${act.clientPhone ? `<div class="box-sub">${act.clientPhone}</div>` : ''}</div>
  <div class="box"><div class="box-label">Автомобіль</div><div class="box-title">${act.carBrand || '—'}</div>${act.carPlate ? `<div class="box-sub">Держ. номер: <strong>${act.carPlate}</strong></div>` : ''}</div>
</div>
<table>
  <thead><tr><th>№</th><th>Найменування роботи</th><th>Категорія</th><th>Дата</th><th>Сума</th></tr></thead>
  <tbody>${act.items.map((item, i) => `<tr><td style="color:#888">${i+1}</td><td style="font-weight:600">${item.title}</td><td style="color:#555">${item.category}</td><td style="color:#555">${item.date||''}</td><td>${new Intl.NumberFormat('uk-UA').format(item.cost||0)} ₴</td></tr>`).join('')}</tbody>
  <tfoot><tr class="total-row"><td colspan="4" style="text-align:right;padding-right:12px">РАЗОМ:</td><td>${new Intl.NumberFormat('uk-UA').format(act.totalCost)} ₴</td></tr></tfoot>
</table>
${act.notes ? `<div class="notes"><div class="box-label">Примітки</div><div style="font-size:13px;color:#444;margin-top:4px">${act.notes}</div></div>` : ''}
<div class="sigs">
  <div><div class="sig-label">Виконавець:</div><div class="sig-line">${act.stoName}</div></div>
  <div><div class="sig-label">Замовник:</div><div class="sig-line">${act.clientName}</div></div>
</div>
</body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--line-2)' }}>
          <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>Акт №{act.actNumber}</h2>
          <div className="flex gap-2">
            <button onClick={print}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: '#5C3EFE' }}>
              <Printer size={15} /> Друк / PDF
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-all" style={{ color: 'var(--text-3)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable area */}
        <div id="act-print-area" className="p-8" style={{ background: 'white', color: '#111', fontFamily: 'sans-serif' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 20, borderBottom: '2px solid #111' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>{act.stoName}</div>
              {act.stoAddress && <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{act.stoAddress}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>АКТ №{act.actNumber}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Дата: {new Date(act.createdAt).toLocaleDateString('uk-UA')}</div>
            </div>
          </div>

          {/* Client & Car */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
            <div style={{ padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 8 }}>Замовник</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{act.clientName}</div>
              {act.clientPhone && <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{act.clientPhone}</div>}
            </div>
            <div style={{ padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 8 }}>Автомобіль</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{act.carBrand || '—'}</div>
              {act.carPlate && <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Держ. номер: <strong>{act.carPlate}</strong></div>}
            </div>
          </div>

          {/* Works table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #111' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>№</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>Найменування роботи</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>Категорія</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>Дата</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>Сума</th>
              </tr>
            </thead>
            <tbody>
              {act.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 0', fontSize: 13, color: '#888' }}>{i + 1}</td>
                  <td style={{ padding: '10px 0', fontSize: 14, fontWeight: 600 }}>{item.title}</td>
                  <td style={{ padding: '10px 0', fontSize: 13, color: '#555' }}>{CAT[item.category] || item.category}</td>
                  <td style={{ padding: '10px 0', fontSize: 13, color: '#555' }}>{item.date}</td>
                  <td style={{ padding: '10px 0', fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{fmt(item.cost)} ₴</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #111' }}>
                <td colSpan={4} style={{ padding: '12px 0', fontSize: 15, fontWeight: 900, textAlign: 'right', paddingRight: 16 }}>РАЗОМ:</td>
                <td style={{ padding: '12px 0', fontSize: 18, fontWeight: 900, textAlign: 'right' }}>{fmt(act.totalCost)} ₴</td>
              </tr>
            </tfoot>
          </table>

          {act.notes && (
            <div style={{ marginBottom: 28, padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>Примітки</div>
              <div style={{ fontSize: 13, color: '#444' }}>{act.notes}</div>
            </div>
          )}

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 48 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 32 }}>Виконавець:</div>
              <div style={{ borderTop: '1px solid #aaa', paddingTop: 6, fontSize: 12, color: '#888' }}>{act.stoName}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 32 }}>Замовник:</div>
              <div style={{ borderTop: '1px solid #aaa', paddingTop: 6, fontSize: 12, color: '#888' }}>{act.clientName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
