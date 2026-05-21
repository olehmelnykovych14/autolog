import React, { useState, useEffect, useRef } from 'react'
import { Camera, Check, MapPin, Smartphone, User, Loader2, Send, ExternalLink, Bell, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Field, inp_cls, PrimaryBtn, ConfirmModal } from '../common/Common'
import { updateProfile, deleteUser, signOut } from 'firebase/auth'
import { doc, updateDoc, setDoc, collection, getDocs, addDoc, deleteDoc, query, where, writeBatch, deleteField } from 'firebase/firestore'
import { db, auth } from '../../firebase'

const REMINDER_TYPES = [
  { id: 'insurance', label: '🛡️ Страховка (ОСЦПВ)', icon: '🛡️' },
  { id: 'inspection', label: '🔍 Техогляд', icon: '🔍' },
  { id: 'oil', label: '🛢️ Заміна масла', icon: '🛢️' },
  { id: 'tires', label: '🏎️ Шини (сезон)', icon: '🏎️' },
  { id: 'battery', label: '🔋 Акумулятор', icon: '🔋' },
  { id: 'custom', label: '📌 Власне', icon: '📌' },
]
const DAYS_BEFORE = [3, 7, 14, 30]

function RemindersSection({ currentUser, hasTelegram }) {
  const ic = inp_cls()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'insurance', customLabel: '', carLabel: '', date: '', daysBefore: 7, notifyViaTelegram: true })

  const colRef = currentUser ? collection(db, 'users', currentUser.uid, 'reminders') : null

  useEffect(() => {
    if (!colRef) return
    getDocs(colRef).then(snap => {
      setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [currentUser?.uid])

  const addReminder = async () => {
    if (!form.date || !colRef) return
    setSaving(true)
    try {
      const typeObj = REMINDER_TYPES.find(t => t.id === form.type)
      const label = form.type === 'custom' ? (form.customLabel || 'Нагадування') : typeObj.label
      const data = { type: form.type, label, carLabel: form.carLabel, date: form.date, daysBefore: form.daysBefore, notifyViaTelegram: form.notifyViaTelegram, enabled: true }
      const ref = await addDoc(colRef, data)
      setReminders(prev => [...prev, { id: ref.id, ...data }])
      setAdding(false)
      setForm({ type: 'insurance', customLabel: '', carLabel: '', date: '', daysBefore: 7, notifyViaTelegram: true })
    } finally {
      setSaving(false)
    }
  }

  const deleteReminder = async (id) => {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'reminders', id))
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const toggleReminder = async (id, enabled) => {
    await updateDoc(doc(db, 'users', currentUser.uid, 'reminders', id), { enabled })
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled } : r))
  }

  const daysLeft = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
    if (diff < 0) return { label: 'Минуло', color: 'text-red-500' }
    if (diff === 0) return { label: 'Сьогодні', color: 'text-orange-500' }
    if (diff <= 7) return { label: `${diff} дн.`, color: 'text-orange-400' }
    return { label: `${diff} дн.`, color: 'text-green-500' }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/60 p-8 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-500">
            <Bell size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Нагадування</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Telegram-сповіщення по даті</p>
          </div>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
          style={{ background: '#5C3EFE' }}
        >
          <Plus size={16} /> Додати
        </button>
      </div>

      {!hasTelegram && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-2xl text-xs font-semibold text-yellow-700 dark:text-yellow-400">
          ⚠️ Підключіть Telegram нижче, щоб отримувати сповіщення
        </div>
      )}

      {adding && (
        <div className="mb-5 p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
          <Field label="Тип нагадування">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={ic}>
              {REMINDER_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
          {form.type === 'custom' && (
            <Field label="Назва">
              <input value={form.customLabel} onChange={e => setForm(f => ({ ...f, customLabel: e.target.value }))} className={ic} placeholder="Наприклад: Заміна фільтра" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Авто (необов'язково)">
              <input value={form.carLabel} onChange={e => setForm(f => ({ ...f, carLabel: e.target.value }))} className={ic} placeholder="Acura ILX" />
            </Field>
            <Field label="Дата події">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={ic} />
            </Field>
          </div>
          <Field label="Сповістити за">
            <div className="flex gap-2 flex-wrap">
              {DAYS_BEFORE.map(d => (
                <button key={d} type="button"
                  onClick={() => setForm(f => ({ ...f, daysBefore: d }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.daysBefore === d ? 'bg-[#5C3EFE] text-white border-[#5C3EFE]' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-600'}`}
                >
                  {d} дн.
                </button>
              ))}
            </div>
          </Field>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm(f => ({ ...f, notifyViaTelegram: !f.notifyViaTelegram }))}>
              {form.notifyViaTelegram
                ? <ToggleRight size={28} className="text-[#5C3EFE]" />
                : <ToggleLeft size={28} className="text-gray-400" />}
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Надсилати в Telegram</span>
          </div>
          <div className="flex gap-3 pt-2">
            <PrimaryBtn onClick={addReminder} disabled={saving || !form.date} className="flex-1 py-3 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Зберегти</>}
            </PrimaryBtn>
            <button onClick={() => setAdding(false)} className="px-4 py-3 rounded-2xl text-sm font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
              Скасувати
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-300" size={24} /></div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm font-medium">
          Немає нагадувань. Додайте перше — наприклад про закінчення страховки.
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map(r => {
            const dl = daysLeft(r.date)
            return (
              <div key={r.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${r.enabled ? 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{r.label}</span>
                    {r.carLabel && <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">{r.carLabel}</span>}
                    {r.notifyViaTelegram && <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500">TG</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString('uk-UA')}</span>
                    <span className={`text-xs font-bold ${dl.color}`}>{dl.label}</span>
                    <span className="text-xs text-gray-400">за {r.daysBefore} дн.</span>
                  </div>
                </div>
                <button onClick={() => toggleReminder(r.id, !r.enabled)} className="text-gray-400 hover:text-[#5C3EFE] transition-colors">
                  {r.enabled ? <ToggleRight size={24} className="text-[#5C3EFE]" /> : <ToggleLeft size={24} />}
                </button>
                <button onClick={() => deleteReminder(r.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function SettingsView({ currentUser, userProfile, setUserProfile }) {
  const ic = inp_cls()
  const fileRef = useRef(null)
  const [name, setName] = useState(currentUser?.displayName || '')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [stoName, setStoName] = useState('')
  const [stoAddress, setStoAddress] = useState('')
  const [stoServices, setStoServices] = useState([])
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [tgLoading, setTgLoading] = useState(false)
  const [confirmDlg, setConfirmDlg] = useState(null)

  useEffect(() => {
    if (userProfile) {
      setPhone(userProfile.phone || '')
      setCity(userProfile.city || '')
      setStoName(userProfile.stoName || '')
      setStoAddress(userProfile.stoAddress || '')
      setStoServices(userProfile.services || [])
      setAvatar(userProfile.avatarBase64 || '')
    }
  }, [userProfile])

  const generateTgToken = async () => {
    if (!currentUser) return
    setTgLoading(true)
    try {
      const token = Math.random().toString(36).substring(2, 8).toUpperCase()
      const expires = Date.now() + 10 * 60 * 1000 // 10 minutes
      const tokenData = { token, expires }
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        tgLinkingToken: tokenData
      })
      
      const up = { ...userProfile, tgLinkingToken: tokenData }
      setUserProfile(up)
    } catch (e) {
      console.error("Помилка Firestore:", e)
      alert("Не вдалося зберегти код у базу")
    } finally {
      setTgLoading(false)
    }
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (re) => {
      setAvatar(re.target.result)
    }
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (!currentUser) return
    setSaving(true)
    try {
      if (name !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: name })
      }
      const up = { ...userProfile, displayName: name, phone, city, avatarBase64: avatar }
      if (userProfile?.accountType === 'sto') {
        up.stoName = stoName
        up.stoAddress = stoAddress
        up.services = stoServices
      }
      await setDoc(doc(db, 'users', currentUser.uid), up, { merge: true })
      setUserProfile(up)
      alert('Профіль оновлено!')
    } catch (e) {
      console.error(e)
      alert("Помилка збереження")
    } finally {
      setSaving(false)
    }
  }

  const isBusiness = userProfile?.plan === 'Business'

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto pb-12 w-full pt-4">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Налаштування</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">Керуйте вашою особистою інформацією та виглядом профілю.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/60 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
          <div className="relative group">
            <div className="w-28 h-28 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[#5C3EFE] text-3xl font-black border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden group-hover:scale-105 transition-all duration-500">
              {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (name[0] || 'U')}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#5C3EFE] text-white rounded-xl flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <Camera size={18} />
            </button>
            <input type="file" ref={fileRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{name || 'Користувач'}</h3>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isBusiness ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                {isBusiness ? 'Business' : 'Free'}
              </div>
            </div>
            <p className="text-sm text-gray-400 font-medium mb-4">{currentUser?.email}</p>
            {currentUser?.emailVerified && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black rounded-lg border border-green-100 dark:border-green-800/40 tracking-wider uppercase">
                Email Верифіковано
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Field label="Повне ім'я">
            <div className="relative flex items-center">
              <User className="absolute left-4 text-gray-400" size={18} />
              <input value={name} onChange={e => setName(e.target.value)} className={`${ic} !pl-12`} placeholder="Ваше ім'я" />
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Номер телефону">
              <div className="relative flex items-center">
                <Smartphone className="absolute left-4 text-gray-400" size={18} />
                <input value={phone} onChange={e => setPhone(e.target.value)} className={`${ic} !pl-12`} placeholder="+380..." />
              </div>
            </Field>
            <Field label="Місто">
              <div className="relative flex items-center">
                <MapPin className="absolute left-4 text-gray-400" size={18} />
                <input value={city} onChange={e => setCity(e.target.value)} className={`${ic} !pl-12`} placeholder="Київ" />
              </div>
            </Field>
          </div>

          {userProfile?.accountType === 'sto' && (
            <div className="space-y-6 pt-6 border-t border-gray-50 dark:border-gray-700/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 text-[#5C3EFE]">Дані СТО</h3>
              <Field label="Назва СТО">
                <input value={stoName} onChange={e => setStoName(e.target.value)} className={ic} placeholder="AutoService Group" />
              </Field>
              <Field label="Адреса СТО">
                <div className="relative flex items-center">
                  <MapPin className="absolute left-4 text-gray-400" size={18} />
                  <input value={stoAddress} onChange={e => setStoAddress(e.target.value)} className={`${ic} !pl-12`} placeholder="Київ, вул. Світла, 1" />
                </div>
              </Field>
              <Field label="Послуги">
                <div className="flex flex-wrap gap-2 mt-1">
                  {['ТО', 'Ремонт', 'Діагностика', 'Шиномонтаж', 'Мийка', 'Тюнінг'].map(s => {
                    const active = stoServices.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStoServices(prev => active ? prev.filter(x => x !== s) : [...prev, s])}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${active ? 'bg-[#5C3EFE] text-white border-[#5C3EFE]' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-[#5C3EFE] hover:text-[#5C3EFE]'}`}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </Field>
            </div>
          )}

          <div className="pt-6 border-t border-gray-50 dark:border-gray-700/50 mt-8">
            <PrimaryBtn onClick={save} disabled={saving} className="w-full py-4 justify-center text-base">
              {saving ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} /> Зберегти зміни</>}
            </PrimaryBtn>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/60 p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
            <Send size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Telegram Бот</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Отримуйте звіти та керуйте гаражем через месенджер.</p>
          </div>
        </div>

        {userProfile?.telegramId ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800/40 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <Check size={18} />
              <p className="text-sm font-bold uppercase tracking-widest text-[10px]">Акаунт підключено</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-gray-400">ID: {userProfile.telegramId}</p>
              <button
                onClick={() => setConfirmDlg({
                  title: 'Відключити Telegram?',
                  message: 'Ви більше не будете отримувати сповіщення та нагадування через бот.',
                  confirmLabel: 'Відключити',
                  onConfirm: async () => {
                    try {
                      await updateDoc(doc(db, 'users', currentUser.uid), { telegramId: deleteField(), tgLinkingToken: deleteField() })
                      setUserProfile({ ...userProfile, telegramId: null, tgLinkingToken: null })
                    } catch (e) { console.error(e) }
                  }
                })}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-800 text-red-500 border border-red-100 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                Відключити
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!userProfile?.tgLinkingToken || userProfile.tgLinkingToken.expires < Date.now() ? (
              <PrimaryBtn onClick={generateTgToken} disabled={tgLoading} className="w-full py-4 justify-center bg-blue-500 hover:bg-blue-600 shadow-blue-500/20 shadow-lg !border-none">
                {tgLoading ? <Loader2 className="animate-spin" size={20} /> : 'ПІДКЛЮЧИТИ TELEGRAM'}
              </PrimaryBtn>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ваш код підключення</p>
                  <p className="text-3xl font-black text-[#5C3EFE] tracking-[0.2em]">{userProfile.tgLinkingToken.token}</p>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Дійсний протягом 10 хвилин</p>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`https://t.me/autologGarage_bot?start=${userProfile.tgLinkingToken.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-blue-500 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                  >
                    ПЕРЕЙТИ В БОТ <ExternalLink size={18} />
                  </a>
                  <button onClick={generateTgToken} disabled={tgLoading} className="px-4 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                    НОВИЙ КОД
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <RemindersSection currentUser={currentUser} hasTelegram={!!userProfile?.telegramId} />

      <DangerZone currentUser={currentUser} />

      {confirmDlg && (
        <ConfirmModal
          title={confirmDlg.title}
          message={confirmDlg.message}
          confirmLabel={confirmDlg.confirmLabel}
          variant="danger"
          onConfirm={async () => { await confirmDlg.onConfirm(); setConfirmDlg(null) }}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
    </div>
  )
}

function DangerZone({ currentUser }) {
  const [busy, setBusy] = useState(false)

  const handleDelete = async () => {
    if (!currentUser) return
    const confirm1 = window.prompt('Видалення акаунту незворотне. Усі ваші авто, історія, записи будуть видалені.\n\nНапишіть "ВИДАЛИТИ" щоб підтвердити:')
    if (confirm1 !== 'ВИДАЛИТИ') return
    setBusy(true)
    try {
      const uid = currentUser.uid
      const collectionsToWipe = [
        ['cars', 'userId'],
        ['history', 'userId'],
        ['bookings', 'userId'],
      ]
      for (const [col, field] of collectionsToWipe) {
        const snap = await getDocs(query(collection(db, col), where(field, '==', uid)))
        for (let i = 0; i < snap.docs.length; i += 450) {
          const chunk = snap.docs.slice(i, i + 450)
          const batch = writeBatch(db)
          chunk.forEach(d => batch.delete(d.ref))
          await batch.commit()
        }
      }
      const remSnap = await getDocs(collection(db, 'users', uid, 'reminders'))
      for (const d of remSnap.docs) await deleteDoc(d.ref)
      await deleteDoc(doc(db, 'users', uid))
      try {
        await deleteUser(currentUser)
      } catch (e) {
        if (e.code === 'auth/requires-recent-login') {
          alert('Для безпеки потрібно увійти знову. Зараз вас буде вилогінено — увійдіть і повторіть видалення.')
          await signOut(auth)
          return
        }
        throw e
      }
      localStorage.clear()
    } catch (e) {
      console.error(e)
      alert('Помилка видалення акаунту: ' + (e.message || ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-red-100 dark:border-red-900/40 p-8 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500">
          <Trash2 size={22} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Видалення акаунту</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Видалить ваш профіль, авто, історію та записи. Дію не можна скасувати.</p>
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={busy}
        className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : <><Trash2 size={16} /> Видалити акаунт</>}
      </button>
    </div>
  )
}
