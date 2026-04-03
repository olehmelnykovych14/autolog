import React, { useState, useEffect, useRef } from 'react'
import { Camera, Check, MapPin, Smartphone, User, Loader2 } from 'lucide-react'
import { Field, inp_cls, PrimaryBtn } from '../common/Common'
import { updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'

export function SettingsView({ currentUser, userProfile, setUserProfile }) {
  const ic = inp_cls()
  const [name, setName] = useState(currentUser?.displayName || '')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (userProfile) {
      setPhone(userProfile.phone || '')
      setCity(userProfile.city || '')
      setAvatar(userProfile.avatarBase64 || '')
    }
  }, [userProfile])

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
      const up = { ...userProfile, phone, city, avatarBase64: avatar }
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{name || 'Користувач'}</h3>
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

          <div className="pt-6 border-t border-gray-50 dark:border-gray-700/50 mt-8">
            <PrimaryBtn onClick={save} disabled={saving} className="w-full py-4 justify-center text-base">
              {saving ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} /> Зберегти зміни</>}
            </PrimaryBtn>
          </div>
        </div>
      </div>
    </div>
  )
}
