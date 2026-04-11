import React, { useState } from 'react'
import { Car, Layers, FileText, Calendar, Activity, MapPin, Trash2 } from 'lucide-react'
import { Modal, Field, inp_cls } from '../common/Common'
import { C, CAT } from '../../constants'
import { fmt } from '../../utils'

export function ServiceModal({ onClose, onSave, carList, historyList, initialData, onDelete }) {
  const isEdit = !!initialData

  const getMinMileage = (cid) => {
    const selCar = carList.find(c => String(c.id) === String(cid))
    let max = selCar?.mileage || 0
    const hist = historyList.filter(h => String(h.carId) === String(cid) && h.mileage && h.id !== initialData?.id)
    if (hist.length > 0) {
      max = Math.max(max, ...hist.map(h => h.mileage))
    }
    return max
  }

  const [f, setF] = useState(() => {
    const initCarId = initialData?.carId || carList[0]?.id || ''
    return {
      carId: initCarId,
      category: initialData?.category || 'maintenance',
      title: initialData?.title || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      cost: initialData?.cost != null ? String(initialData.cost) : '',
      garage: initialData?.garage || '',
      status: initialData?.status || 'verified',
      mileage: initialData?.mileage || (initCarId ? getMinMileage(initCarId) : ''),
    }
  })

  const set = k => v => {
    setF(p => {
      const next = { ...p, [k]: v }
      if (k === 'carId' && !isEdit) {
        next.mileage = getMinMileage(v)
      }
      return next
    })
  }

  const minM = f.carId ? getMinMileage(f.carId) : 0
  const submit = e => {
    e.preventDefault()
    if (!f.title || !f.carId) return
    onSave({
      id: initialData?.id || Date.now(),
      carId: String(f.carId),
      category: f.category,
      title: f.title,
      date: f.date,
      cost: f.cost ? parseInt(f.cost) : 0,
      garage: f.garage,
      status: f.status,
      mileage: f.mileage ? parseInt(f.mileage) : null,
    })
  }
  const ic = inp_cls()
  const fieldCls = `${ic} flex items-center gap-2`
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setIsDeleting(true)
    const success = await onDelete(initialData.id)
    if (success) {
      onClose()
    } else {
      setIsDeleting(false)
      setConfirmDelete(false)
      alert("Не вдалося видалити запис. Спробуйте пізніше.")
    }
  }

  return (
    <Modal title={isEdit ? 'Редагувати запис' : 'Додати сервіс'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* ... form fields remain the same ... */}
        <Field label="Автомобіль *">
          <div className={fieldCls}><Car size={16} className="text-gray-400 shrink-0" />
            <select value={f.carId} onChange={e => set('carId')(e.target.value)} className="flex-1 bg-transparent focus:outline-none text-sm dark:text-white" required>
              {carList.map(c => <option key={c.id} value={c.id}>{c.brand} ({c.plate})</option>)}
            </select>
          </div>
        </Field>
        <Field label="Категорія *">
          <div className={fieldCls}><Layers size={16} className="text-gray-400 shrink-0" />
            <select value={f.category} onChange={e => set('category')(e.target.value)} className="flex-1 bg-transparent focus:outline-none text-sm dark:text-white">
              {Object.entries(CAT).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Що було зроблено? *">
          <div className={fieldCls}><FileText size={16} className="text-gray-400 shrink-0" />
            <input value={f.title} onChange={e => set('title')(e.target.value)} placeholder="Напр. Заміна масла" className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" required />
          </div>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Дата">
            <div className={`${fieldCls} relative`}>
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <input type="date" value={f.date} onChange={e => set('date')(e.target.value)} className="flex-1 w-full bg-transparent focus:outline-none text-sm dark:text-white appearance-none" style={{ minHeight: '20px' }} />
            </div>
          </Field>
          <Field label="Вартість (₴)">
            <div className={fieldCls}>
              <span className="text-gray-400 text-sm font-bold">₴</span>
              <input type="number" value={f.cost} onChange={e => set('cost')(e.target.value)} placeholder="0" className="flex-1 w-full bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" />
            </div>
          </Field>
          <Field label="Пробіг *">
            <div className={fieldCls}>
              <Activity size={16} className="text-[#5C3EFE] shrink-0" />
              <input type="number" min={minM} value={f.mileage} onChange={e => set('mileage')(e.target.value)} placeholder={`Від ${fmt(minM)} км`} required className="flex-1 w-full bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" />
            </div>
          </Field>
        </div>
        <Field label="СТО / Майстерня">
          <div className={fieldCls}><MapPin size={16} className="text-gray-400 shrink-0" />
            <input value={f.garage} onChange={e => set('garage')(e.target.value)} placeholder="Назва СТО" className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" />
          </div>
        </Field>
        <Field label="Статус">
          <div className="flex gap-3">
            {[['verified', '✅ Виконано'], ['pending', '🕐 Заплановано']].map(([val, lbl]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input type="radio" name="status" value={val} checked={f.status === val} onChange={e => set('status')(e.target.value)} className="accent-[#5C3EFE]" />
                {lbl}
              </label>
            ))}
          </div>
        </Field>
        <button type="submit" disabled={isDeleting} className="w-full py-4 text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50" style={{ background: C }}>
          {isEdit ? 'Зберегти зміни' : 'Додати в історію'}
        </button>
        {isEdit && onDelete && (
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            onMouseLeave={() => setConfirmDelete(false)}
            className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 border-2 ${confirmDelete ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20 animate-pulse' : 'text-red-500 bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
          >
            {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              confirmDelete ? 'Ви впевнені? Видалити назавжди' : <><Trash2 size={18} /> Видалити запис</>
            )}
          </button>
        )}
      </form>
    </Modal>
  )
}
