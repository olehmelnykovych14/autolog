import React, { useState } from 'react'
import { ShieldCheck, Plus, Trash2, Pencil, Check, Loader2, Calendar } from 'lucide-react'
import { Modal, Field, inp_cls, PrimaryBtn, ConfirmModal } from '../common/Common'
import { fmtDate, docStatus } from '../../utils'
import { DOC_TYPES, DOC_TYPE_ORDER } from '../../constants'
import { db } from '../../firebase'
import { doc, updateDoc } from 'firebase/firestore'

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `d${Date.now()}${Math.random().toString(36).slice(2, 7)}`)

const blankForm = () => ({ id: null, type: 'osago', number: '', expires: '', note: '' })

export function DocumentsModal({ car, onClose }) {
  const ic = inp_cls()
  const [docs, setDocs] = useState(Array.isArray(car.documents) ? car.documents : [])
  const [form, setForm] = useState(null) // null = list view, object = add/edit form
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  // Сортуємо: спершу прострочені/ті, що скоро закінчаться.
  const sorted = [...docs].sort((a, b) => {
    const da = docStatus(a.expires).days
    const db_ = docStatus(b.expires).days
    if (da == null) return 1
    if (db_ == null) return -1
    return da - db_
  })

  const persist = async (next) => {
    setSaving(true)
    setDocs(next)
    try {
      await updateDoc(doc(db, 'cars', car.id), { documents: next })
    } catch (e) {
      console.error('Documents save error:', e)
      alert('Не вдалося зберегти. Спробуйте ще раз.')
    } finally {
      setSaving(false)
    }
  }

  const save = async () => {
    if (!form.expires) return
    const clean = { id: form.id || newId(), type: form.type, number: form.number.trim(), expires: form.expires, note: form.note.trim() }
    const next = form.id ? docs.map(d => (d.id === form.id ? clean : d)) : [...docs, clean]
    await persist(next)
    setForm(null)
  }

  const remove = async (id) => {
    await persist(docs.filter(d => d.id !== id))
    setConfirmDel(null)
  }

  return (
    <Modal title={`Документи · ${car.brand} ${car.model || ''}`.trim()} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* List view */}
        {!form && (
          <>
            {sorted.length === 0 ? (
              <div className="al-card text-center" style={{ padding: 32 }}>
                <ShieldCheck size={36} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>
                  Додайте ОСАГО, техогляд, Зелену карту чи свідоцтво ГБО — і ми нагадаємо перед закінченням.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {sorted.map(d => {
                  const s = docStatus(d.expires)
                  return (
                    <div key={d.id} className="al-card flex items-center gap-3" style={{ padding: 16 }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.hex}1a`, color: s.hex }}>
                        <ShieldCheck size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{DOC_TYPES[d.type] || 'Документ'}</p>
                        <p className="text-xs font-medium flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-3)' }}>
                          <Calendar size={11} /> до {fmtDate(d.expires)}
                          {d.number ? <span className="opacity-60">· №{d.number}</span> : null}
                        </p>
                      </div>
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0" style={{ background: `${s.hex}1a`, color: s.hex }}>{s.label}</span>
                      <button onClick={() => setForm({ ...d })} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-3)' }} title="Редагувати">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setConfirmDel(d)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 transition-colors" title="Видалити">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => setForm(blankForm())}
              className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
            >
              <Plus size={16} /> Додати документ
            </button>
          </>
        )}

        {/* Add/edit form */}
        {form && (
          <div className="flex flex-col gap-4">
            <Field label="Тип документа">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={ic}>
                {DOC_TYPE_ORDER.map(k => <option key={k} value={k}>{DOC_TYPES[k]}</option>)}
              </select>
            </Field>
            <Field label="Дійсний до">
              <input type="date" value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))} className={ic} />
            </Field>
            <Field label="Номер (необов'язково)">
              <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} className={ic} placeholder="Серія / номер поліса" />
            </Field>
            <Field label="Нотатка (необов'язково)">
              <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className={ic} placeholder="Страхова, СТО техогляду тощо" />
            </Field>
            <div className="flex gap-3 mt-1">
              <PrimaryBtn onClick={save} disabled={saving || !form.expires} className="flex-1 py-3 justify-center">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Зберегти</>}
              </PrimaryBtn>
              <button onClick={() => setForm(null)} className="px-5 py-3 rounded-xl text-sm font-bold transition-all" style={{ background: 'var(--bg-input)', color: 'var(--text-2)' }}>
                Скасувати
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmDel && (
        <ConfirmModal
          title="Видалити документ?"
          message={`${DOC_TYPES[confirmDel.type] || 'Документ'} буде видалено з сейфу.`}
          confirmLabel="Видалити"
          onConfirm={() => remove(confirmDel.id)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </Modal>
  )
}
