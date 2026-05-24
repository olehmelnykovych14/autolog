import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Mail, Lock, User, MapPin, ClipboardList, ShieldCheck, Sun, Moon, Send, LayoutDashboard, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react'
import { auth, db } from '../../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { C } from '../../constants'

export function AuthScreen({ isDark, setDark, onBack, defaultMode = 'login' }) {
  const navigate = useNavigate()
  const isLogin = defaultMode === 'login'
  const isReset = defaultMode === 'forgot'
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState('owner')
  const [stoName, setStoName] = useState('')
  const [stoAddress, setStoAddress] = useState('')
  const [stoEdrpou, setStoEdrpou] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showPass, setShowPass] = useState(false)

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
          payload.role = 'СТО'
          payload.stoName = stoName
          payload.stoAddress = stoAddress
          payload.stoEdrpou = stoEdrpou
          payload.companyName = stoName
          payload.address = stoAddress
          payload.edrpou = stoEdrpou
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

  const inp_cls = "w-full px-4 py-3.5 bg-white/5 dark:bg-white/5 border border-gray-200 dark:border-gray-700/60 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#5C3EFE] focus:ring-2 focus:ring-[#5C3EFE]/15 transition-all text-sm"

  return (
    <div className={`flex min-h-screen w-full font-sans ${isDark ? 'dark' : ''}`}>
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 relative bg-white dark:bg-[#0A0F1E]">
        {/* Theme Toggle */}
        <button
          onClick={() => setDark(d => !d)}
          className="absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all shadow-sm"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {onBack && (
          <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-1.5 text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-[#5C3EFE] transition-all">
            <ArrowRight className="rotate-180" size={16} />
            Назад
          </button>
        )}

        <div className="w-full max-w-sm mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-[#5C3EFE] flex items-center justify-center shadow-lg shadow-indigo-500/30 p-1.5 shrink-0">
              <img src="/logo.svg" alt="AutoLog" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">AutoLog</span>
              <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Automotive Ecosystem</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1.5">
              {isReset ? 'Відновлення пароля' : (isLogin ? 'З поверненням 👋' : 'Створити акаунт')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isReset
                ? 'Введіть email для отримання інструкцій'
                : (isLogin ? 'Введіть свої дані для входу в систему' : 'Приєднайтеся до найзручнішого гаража')}
            </p>
          </div>

          {/* Error / Success messages */}
          {err && (
            <div className="p-3.5 mb-5 text-sm font-semibold text-red-700 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/60 dark:text-red-400">
              {err}
            </div>
          )}
          {resetSent && (
            <div className="p-3.5 mb-5 text-sm font-semibold text-green-700 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/60 dark:text-green-400">
              ✓ Інструкції надіслано на вашу пошту!
            </div>
          )}

          {/* Reset password form */}
          {isReset ? (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-600 dark:text-gray-400 uppercase tracking-widest">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@autolog.app" className={inp_cls} required />
              </div>
              <button disabled={loading} type="submit" className="w-full py-3.5 mt-1 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20" style={{ background: C }}>
                {loading ? 'Надсилаємо...' : 'Скинути пароль'}
              </button>
              <button type="button" onClick={() => { navigate('/login'); setErr(''); setResetSent(false); }} className="text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1 text-center">
                ← Повернутися до входу
              </button>
            </form>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              {/* Account type toggle for registration */}
              {!isLogin && (
                <>
                  <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl mb-1 border border-gray-200 dark:border-gray-700/40">
                    <button type="button" onClick={() => setAccountType('owner')} className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${accountType === 'owner' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      Власник авто
                    </button>
                    <button type="button" onClick={() => setAccountType('sto')} className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${accountType === 'sto' ? 'bg-white dark:bg-gray-800 text-[#5C3EFE] shadow-sm' : 'text-gray-400 hover:text-[#5C3EFE]'}`}>
                      СТО / Партнер
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 text-gray-600 dark:text-gray-400 uppercase tracking-widest">Прізвище та Ім'я</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Іван Іванов" className={inp_cls} />
                  </div>
                  {accountType === 'sto' && (
                    <div className="space-y-3 p-4 bg-indigo-50 dark:bg-indigo-900/15 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                      <div>
                        <label className="block text-[10px] font-black mb-1.5 text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Назва СТО *</label>
                        <input type="text" value={stoName} onChange={e => setStoName(e.target.value)} placeholder="AutoService Group" className={inp_cls + ' !text-sm !py-2.5'} required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black mb-1.5 text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Адреса *</label>
                          <input type="text" value={stoAddress} onChange={e => setStoAddress(e.target.value)} placeholder="Київ, вул. Світла, 1" className={inp_cls + ' !text-sm !py-2.5'} required />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black mb-1.5 text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">ЄДРПОУ / ІПН *</label>
                          <input type="text" value={stoEdrpou} onChange={e => setStoEdrpou(e.target.value)} placeholder="12345678" className={inp_cls + ' !text-sm !py-2.5'} required />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-600 dark:text-gray-400 uppercase tracking-widest">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@autolog.app" className={inp_cls} required />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Пароль</label>
                  {isLogin && (
                    <button type="button" onClick={() => { navigate('/forgot'); setErr(''); }} className="text-xs font-bold text-[#5C3EFE] hover:underline">
                      Забули пароль?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className={inp_cls + ' pr-12'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3.5 mt-1 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                style={{ background: C }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isLogin ? 'Увійти в гараж →' : 'Створити акаунт →'
                )}
              </button>
            </form>
          )}

          {/* Switch mode */}
          {!isReset && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {isLogin ? 'Немає акаунту? ' : 'Вже є акаунт? '}
                <button
                  type="button"
                  onClick={() => { navigate(isLogin ? '/register' : '/login'); setErr(''); }}
                  className="font-black text-[#5C3EFE] hover:underline"
                >
                  {isLogin ? 'Зареєструватися' : 'Увійти'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #0A0F1E 0%, #0f0a2a 50%, #050510 100%)' }}>
        {/* Background glows */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(92,62,254,0.25) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #5C3EFE 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(92,62,254,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(92,62,254,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 max-w-md text-center">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#5C3EFE]/20 border border-[#5C3EFE]/30 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20 backdrop-blur-sm">
            <Car size={38} className="text-white" />
          </div>

          <h2 className="text-4xl font-black text-white mb-5 leading-tight">
            Ваш цифровий<br/>гараж
          </h2>
          <p className="text-base text-gray-400 leading-relaxed mb-10">
            Керуйте всіма своїми автомобілями, відстежуйте історію обслуговування та генеруйте Carfax-звіти в один клік.
          </p>

          {/* Feature badges */}
          <div className="flex flex-col gap-3 text-left max-w-xs mx-auto">
            {[
              { icon: '🚗', text: 'Цифровий журнал для кожного авто' },
              { icon: '🤖', text: 'AI Механік для діагностики' },
              { icon: '🔒', text: 'Верифіковані сервісні записи' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3 backdrop-blur-sm">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium text-gray-300">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
