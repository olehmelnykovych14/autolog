import React, { useState, useEffect, useRef } from 'react'
import { Camera, Check, MapPin, Smartphone, User, Loader2, Send, ExternalLink, CreditCard, Star, Zap } from 'lucide-react'
import { Field, inp_cls, PrimaryBtn } from '../common/Common'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'

export function SettingsView({ currentUser, userProfile, setUserProfile }) {
  const ic = inp_cls()
  const [name, setName] = useState(currentUser?.displayName || '')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [stoName, setStoName] = useState('')
  const [stoAddress, setStoAddress] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [tgLoading, setTgLoading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (userProfile) {
      setPhone(userProfile.phone || '')
      setCity(userProfile.city || '')
      setStoName(userProfile.stoName || '')
      setStoAddress(userProfile.stoAddress || '')
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
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black rounded-lg border border-green-100 dark:border-green-800/40 tracking-wider uppercase">
              Акаунт Верифіковано
            </div>
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
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <Check size={18} />
              <p className="text-sm font-bold uppercase tracking-widest text-[10px]">Акаунт підключено</p>
            </div>
            <p className="text-xs font-medium text-gray-400">ID: {userProfile.telegramId}</p>
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
    </div>
  )
}
