import React, { useState } from 'react'
import { Share2, Mail, Send, Check, UserPlus, Shield, Eye, Wrench, Calendar, Activity, MapPin, Layers, FileText, ShieldCheck } from 'lucide-react'
import { Modal, Field, inp_cls, PrimaryBtn } from '../common/Common'
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { C, CAT } from '../../constants'

// --- TransferCarModal ---
export function TransferCarModal({ car, onClose, onTransfer }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const ic = inp_cls()

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await onTransfer(email.trim().toLowerCase())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Передати автомобіль" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex gap-4">
          <div className="shrink-0 text-amber-500"><Share2 size={24}/></div>
          <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
            <strong>Увага!</strong> Після передачі автомобіля ви втратите до нього доступ. Новий власник отримає всю історію обслуговування.
          </p>
        </div>
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700/60 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            {car.image ? <img src={car.image} alt="" className="w-full h-full object-cover" /> : <Share2 size={18}/>}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{car.brand} {car.model}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{car.plate}</p>
          </div>
        </div>
        <Field label="Email нового власника *">
          <div className="relative flex items-center">
            <Mail className="absolute left-4 text-gray-400" size={18} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" className={`${ic} !pl-12`} required />
          </div>
        </Field>
        <PrimaryBtn type="submit" disabled={loading} className="w-full py-4 justify-center text-base">
          {loading ? 'Надсилання...' : <><Send size={18}/> ПЕРЕДАТИ ПРАВА</>}
        </PrimaryBtn>
      </form>
    </Modal>
  )
}

// --- InviteMemberModal ---
export function InviteMemberModal({ limit, currentCount, onClose, onInvite }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('viewer')
  const ic = inp_cls()

  const submit = e => {
    e.preventDefault()
    if (!email.trim() || !name.trim()) return
    onInvite({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status: 'pending'
    })
    onClose()
  }

  return (
    <Modal title="Запросити учасника" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5C3EFE] flex items-center justify-center text-white"><UserPlus size={16}/></div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Доступно місць</p>
            </div>
            <span className="text-lg font-black text-[#5C3EFE]">{limit - currentCount} <span className="text-[10px] text-gray-400">з {limit}</span></span>
        </div>
        <Field label="Ім'я учасника *">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Іван Іванов" className={ic} required />
        </Field>
        <Field label="Email *">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@autolog.app" className={ic} required />
        </Field>
        <Field label="Роль доступу">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRole('admin')} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-[#5C3EFE] text-[#5C3EFE]' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
              <Shield size={20} className={role === 'admin' ? 'text-[#5C3EFE]' : 'text-gray-300'} />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider">Адмін</p>
                <p className="text-[10px] opacity-70">Повний доступ</p>
              </div>
            </button>
            <button type="button" onClick={() => setRole('viewer')} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${role === 'viewer' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-[#5C3EFE] text-[#5C3EFE]' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
              <Eye size={20} className={role === 'viewer' ? 'text-[#5C3EFE]' : 'text-gray-300'} />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider">Перегляд</p>
                <p className="text-[10px] opacity-70">Лише історія</p>
              </div>
            </button>
          </div>
        </Field>
        <PrimaryBtn type="submit" className="w-full py-4 justify-center text-base mt-2 shadow-indigo-500/20">
          Надіслати запрошення
        </PrimaryBtn>
      </form>
    </Modal>
  )
}

// --- AddVerifiedServiceModal ---
export function AddVerifiedServiceModal({ car, userProfile, onClose, onSuccess }) {
  const [f, setF] = useState({ category: 'maintenance', title: '', date: new Date().toISOString().split('T')[0], cost: '', garage: userProfile?.stoName || '', mileage: '' })
  const [loading, setLoading] = useState(false)
  const ic = inp_cls()
  const fieldCls = `${ic} flex items-center gap-2`

  const submit = async (e) => {
    e.preventDefault()
    if (!f.title || !f.mileage) return
    setLoading(true)
    try {
      const newMileage = Number(f.mileage) || 0
      await addDoc(collection(db, 'history'), {
        title: f.title,
        cost: Number(f.cost) || 0,
        mileage: newMileage,
        category: f.category || 'other',
        date: f.date || new Date().toISOString().split('T')[0],
        garage: userProfile?.stoName || 'AutoLog Partner',
        carId: car.id,
        userId: car.userId,
        createdAt: Date.now(),
        status: 'verified',
        source: 'sto_push',
        stoId: userProfile?.userId || auth.currentUser?.uid
      });
      if (newMileage > (car.mileage || 0)) {
        await updateDoc(doc(db, 'cars', car.id), { mileage: newMileage })
      }
      onSuccess()
    } catch (e) {
      console.error(e)
      alert('Помилка надсилання: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Верифікувати сервіс" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-100 dark:border-indigo-800 shadow-sm">
              <Wrench size={20}/>
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Партнер АвтоЛог</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{userProfile?.stoName || 'Ваше СТО'}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Категорія *">
            <div className={fieldCls}>
              <Layers size={16} className="text-gray-400 shrink-0" />
              <select value={f.category} onChange={e => setF({...f, category: e.target.value})} className="flex-1 bg-transparent focus:outline-none text-sm dark:text-white">
                {Object.entries(CAT).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Дата *">
            <div className={fieldCls}>
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className="flex-1 bg-transparent focus:outline-none text-sm dark:text-white appearance-none" />
            </div>
          </Field>
        </div>

        <Field label="Назва робіт *">
          <div className={fieldCls}>
            <FileText size={16} className="text-gray-400 shrink-0" />
            <input value={f.title} onChange={e => setF({...f, title: e.target.value})} placeholder="Напр. Заміна масла та фільтрів" className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" required />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Пробіг (км) *">
            <div className={fieldCls}>
              <Activity size={16} className="text-[#5C3EFE] shrink-0" />
              <input type="number" value={f.mileage} onChange={e => setF({...f, mileage: e.target.value})} placeholder={`Від ${car.mileage} км`} required className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" />
            </div>
          </Field>
          <Field label="Вартість (₴) *">
            <div className={fieldCls}>
              <span className="text-gray-400 text-sm font-bold">₴</span>
              <input type="number" value={f.cost} onChange={e => setF({...f, cost: e.target.value})} placeholder="0" className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" required />
            </div>
          </Field>
        </div>

        <PrimaryBtn type="submit" disabled={loading} className="w-full py-4 justify-center text-base mt-2 shadow-indigo-500/20">
          {loading ? 'Надсилання клієнту...' : <><ShieldCheck size={20}/> ПІДТВЕРДИТИ ТА НАДІСЛАТИ</>}
        </PrimaryBtn>
      </form>
    </Modal>
  )
}
