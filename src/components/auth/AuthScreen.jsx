import React, { useState } from 'react'
import { Car, Mail, Lock, User, MapPin, ClipboardList, ShieldCheck, Sun, Moon, Send, LayoutDashboard } from 'lucide-react'
import { auth, db } from '../../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { C } from '../../constants'

export function AuthScreen({ isDark, setDark }) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState('owner')
  const [stoName, setStoName] = useState('')
  const [stoAddress, setStoAddress] = useState('')
  const [stoEdrpou, setStoEdrpou] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!auth || !auth.app.options.apiKey || auth.app.options.apiKey.includes('YOUR_')) {
      setErr("Firebase ще не налаштовано! Перевірте src/firebase.js.")
      return
    }
    setErr('')
    setLoading(true)
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() })
        const payload = {
          email: cred.user.email,
          displayName: name.trim(),
          phone: '',
          city: '',
          avatarBase64: '',
          accountType
        }
        if (accountType === 'sto') {
          payload.stoName = stoName
          payload.stoAddress = stoAddress
          payload.stoEdrpou = stoEdrpou
        }
        await setDoc(doc(db, 'users', cred.user.uid), payload, { merge: true })
      }
    } catch (error) {
      console.error(error)
      setErr(error.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!email) return setErr('Введіть email')
    setLoading(true)
    setErr('')
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch (error) {
      setErr(error.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  const inp_cls = "w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#5C3EFE] transition-all"

  return (
    <div className={`flex min-h-screen w-full font-sans bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white ${isDark ? 'dark' : ''}`}>
      <div className="flex-1 flex flex-col justify-center p-6 relative">
        <button onClick={() => setDark(d => !d)} className="absolute top-6 right-6 w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <img src="/logo.png" alt="AutoLog" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AutoLog</h1>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/60">
            <h2 className="text-2xl font-bold mb-2">
              {isReset ? 'Відновлення пароля' : (isLogin ? 'З поверненням' : 'Створити акаунт')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {isReset 
                ? 'Введіть email для отримання інструкцій' 
                : (isLogin ? 'Введіть свої дані для входу в систему' : 'Приєднайтеся до найзручнішого гаража')}
            </p>

            {err && <div className="p-4 mb-4 text-sm font-semibold text-red-700 bg-red-100 rounded-xl dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">{err}</div>}
            {resetSent && <div className="p-4 mb-4 text-sm font-semibold text-green-700 bg-green-100 rounded-xl dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">Інструкції надіслано на вашу пошту!</div>}

            {isReset ? (
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-gray-700 dark:text-gray-300">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@autolog.app" className={inp_cls + ' rounded-xl'} required />
                </div>
                <button disabled={loading} type="submit" className="w-full py-4 mt-2 text-white rounded-xl font-bold shadow-md shadow-indigo-500/30 flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50" style={{ background: C }}>
                  {loading ? 'Надсилаємо...' : 'Скинути пароль'}
                </button>
                <button type="button" onClick={() => { setIsReset(false); setErr(''); setResetSent(false); }} className="text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-2">
                  Повернутися до входу
                </button>
              </form>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-4">
              {!isLogin && (
                <>
                  <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl mb-2">
                    <button type="button" onClick={() => setAccountType('owner')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${accountType === 'owner' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Власник авто</button>
                    <button type="button" onClick={() => setAccountType('sto')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${accountType === 'sto' ? 'bg-white dark:bg-gray-800 text-[#5C3EFE] shadow-sm' : 'text-gray-500 hover:text-[#5C3EFE]'}`}>СТО / Партнер</button>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1 text-gray-700 dark:text-gray-300">Прізвище та Ім'я</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Іван Іванов" className={inp_cls + ' rounded-xl'} />
                  </div>
                  {accountType === 'sto' && (
                    <div className="space-y-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                      <div>
                        <label className="block text-xs font-semibold mb-1 ml-1 text-indigo-900 dark:text-indigo-200">Назва СТО *</label>
                        <input type="text" value={stoName} onChange={e => setStoName(e.target.value)} placeholder="Напр. AutoService Group" className={inp_cls + ' rounded-xl !py-2.5 !text-sm'} required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1 ml-1 text-indigo-900 dark:text-indigo-200">Адреса *</label>
                          <input type="text" value={stoAddress} onChange={e => setStoAddress(e.target.value)} placeholder="Київ, вул. Світла, 1" className={inp_cls + ' rounded-xl !py-2.5 !text-sm'} required />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 ml-1 text-indigo-900 dark:text-indigo-200">ЄДРПОУ / ІПН *</label>
                          <input type="text" value={stoEdrpou} onChange={e => setStoEdrpou(e.target.value)} placeholder="12345678" className={inp_cls + ' rounded-xl !py-2.5 !text-sm'} required />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-gray-700 dark:text-gray-300">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@autolog.app" className={inp_cls + ' rounded-xl'} required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Пароль *</label>
                  {isLogin && (
                    <button type="button" onClick={() => { setIsReset(true); setErr(''); }} className="text-xs font-bold text-[#5C3EFE] hover:underline">
                      Забули пароль?
                    </button>
                  )}
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} className={inp_cls + ' rounded-xl'} required />
              </div>

              <button disabled={loading} type="submit" className="w-full py-4 mt-2 text-white rounded-xl font-bold shadow-md shadow-indigo-500/30 flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50" style={{ background: C }}>
                {loading ? 'Зачекайте...' : (isLogin ? 'Увійти в гараж' : 'Створити акаунт')}
              </button>
            </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLogin ? 'Немає акаунту? ' : 'Вже є акаунт? '}
                <button type="button" onClick={() => { setIsLogin(!isLogin); setErr(''); }} className="font-bold text-[#5C3EFE] hover:underline">
                  {isLogin ? 'Зареєструватися' : 'Увійти'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gray-900 overflow-hidden relative items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${C} 0%, transparent 50%)` }}></div>
        <div className="relative z-10 max-w-lg text-center">
          <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
            <Car size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Ваш цифровий гараж</h2>
          <p className="text-lg text-gray-400 leading-relaxed">Керуйте всіма своїми автомобілями, відстежуйте історію обслуговування завдяки динамічним дашбордам та генеруйте Carfax-звіти в один клік.</p>
        </div>
      </div>
    </div>
  )
}
