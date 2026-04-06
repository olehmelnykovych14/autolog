import React, { useState, useContext } from 'react'
import { Check, Info, LayoutDashboard, Send, Wrench } from 'lucide-react'
import { C, PLANS } from '../../constants'
import { ThemeCtx } from '../../context/ThemeContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'

export function PlansView({ carList, userProfile, onUpdatePlan, currentUser }) {
  const [loading, setLoading] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const currentPlan = userProfile?.plan || 'Free'


  const handleUpgrade = async (plan) => {
    setLoading(plan.id)
    try {
      const resp = await fetch('http://localhost:3000/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser?.uid, 
          email: currentUser?.email,
          planName: plan.name,
          amount: plan.price
        })
      })
      if (!resp.ok) throw new Error('Server error')
      const data = await resp.json()
      
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = 'https://secure.wayforpay.com/pay'
      form.acceptCharset = 'utf-8'

      Object.entries(data).forEach(([k, v]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = k
        input.value = v
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
    } catch (e) {
      setLoading(null)
      alert('Не вдалося створити платіж. Переконайтеся, що сервер AutoLog запущено.')
    }
  }

  const handleSelect = async (planId) => {
    if (planId === currentPlan) return
    const plan = PLANS.find(p => p.id === planId)
    if (plan && plan.price > 0) {
      return handleUpgrade(plan)
    }
    setLoading(planId)
    setTimeout(async () => {
      try {
        await onUpdatePlan(planId)
        setLoading(null)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } catch (e) {
        setLoading(null)
        alert('Помилка оновлення плану')
      }
    }, 1500)
  }

  const activePlanData = PLANS.find(p => p.id === currentPlan) || PLANS[0]

  return (
    <div className="flex flex-col gap-6 relative">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Тарифи</h1>
      {showSuccess && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <Check size={20} /> План успішно оновлено!
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Ліміти акаунту</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-0">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500 dark:text-gray-400">Автомобілі</span>
              <span className="font-medium text-gray-900 dark:text-white">{carList.length} / {activePlanData.carLimit === Infinity ? '∞' : activePlanData.carLimit}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((carList.length / (activePlanData.carLimit || 1)) * 100, 100)}%`, background: C }} />
            </div>
          </div>
          <div className="mb-0">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500 dark:text-gray-400">AI запити (місяць)</span>
              <span className="font-medium text-gray-900 dark:text-white">0 / {activePlanData.aiLimit}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `0%`, background: C }} />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(p => {
          const isCurrent = p.id === currentPlan
          const isPending = loading === p.id
          return (
            <div key={p.id} className={`rounded-2xl p-6 flex flex-col relative overflow-hidden transition-all ${isCurrent ? 'ring-2 ring-[#5C3EFE] transform scale-[1.02] shadow-xl' : 'bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60'}`}>
              {isCurrent && <div className="absolute top-0 right-0 bg-[#5C3EFE] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Поточний</div>}
              <div className="mb-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{p.name}</h3>
              </div>
              <div className="mb-5 mt-2">
                <span className="text-3xl font-black text-gray-900 dark:text-white">{p.price === 0 ? 'Безкоштовно' : p.price + ' ₴'}</span>
                {p.price > 0 && <span className="text-sm text-gray-400">/міс</span>}
              </div>
              <div className="flex-1 space-y-2 mb-6">
                {p.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Check size={14} className="text-green-500 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleSelect(p.id)}
                disabled={isCurrent || !!loading}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isCurrent ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default' : 'text-white hover:opacity-90 active:scale-95 shadow-md'}`}
                style={!isCurrent ? { background: C } : {}}
              >
                {isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isCurrent ? 'Активовано' : 'Обрати план')}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function STOPricingView({ currentUser, userProfile, setUserProfile, setTab }) {
  const isDark = useContext(ThemeCtx)
  const [loading, setLoading] = useState(null)

  const handlePurchase = async (planType) => {
    setLoading(planType)
    await new Promise(r => setTimeout(r, 1500))
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { 
          stoSubscription: 'active',
          accountType: 'sto' 
        })
      } catch (e) {
        console.error("Failed to update subscription", e)
      }
    }
    setUserProfile(p => ({ ...p, stoSubscription: 'active', accountType: 'sto' }))
    setLoading(null)
    setTab('sto')
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 w-full pt-10 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Розблокуйте можливості Partner Garage</h1>
        <p className="text-gray-500 dark:text-[#94A3B8] text-lg max-w-2xl mx-auto leading-relaxed">
          Надавайте своїм клієнтам офіційні записи про сервіс. Усі ваші роботи залишаться в історії авто назавжди.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-700 rounded-3xl p-8 flex flex-col hover:border-indigo-500/50 transition-colors shadow-sm">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Підписка Pro</h3>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900 dark:text-white">$14.99</span>
              <span className="text-gray-400 dark:text-gray-500 font-medium">/ місяць</span>
            </div>
          </div>
          <ul className="flex-1 space-y-4 mb-8 text-gray-600 dark:text-gray-300 font-medium">
            {['Безлімітне додавання верифікованих записів', 'Доступ до клієнтської бази сервісу', 'Базова аналітика вашого СТО'].map((feat, i) => (
              <li key={i} className="flex items-center gap-3"><Check size={18} className="text-[#5C3EFE] shrink-0" /> {feat}</li>
            ))}
          </ul>
          <button onClick={() => handlePurchase('pro')} disabled={loading !== null} className="w-full py-4 text-[#5C3EFE] dark:text-white rounded-xl font-bold border border-gray-200 dark:border-gray-600 hover:bg-indigo-50 transition-all flex items-center justify-center">
            {loading === 'pro' ? <span className="animate-spin mr-2"><LayoutDashboard size={18}/></span> : 'Оформити підписку'}
          </button>
        </div>

        <div className="bg-gradient-to-b from-[#1c144e] to-[#0A0F24] border border-[#5C3EFE] rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl">
          <div className="absolute -top-4 right-8 bg-[#5C3EFE] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">Оптимальний вибір</div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Назавжди (Lifetime)</h3>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">$149</span>
              <span className="text-indigo-200/50 font-medium">одноразово</span>
            </div>
          </div>
          <ul className="flex-1 space-y-4 mb-8 text-indigo-100/90">
            {['Усі можливості підписки Pro', 'Довічний доступ до платформи', 'Економія $60 щороку'].map((feat, i) => (
              <li key={i} className="flex items-center gap-3"><Check size={18} className="text-[#5C3EFE] shrink-0 bg-white rounded-full p-0.5" /> {feat}</li>
            ))}
          </ul>
          <button onClick={() => handlePurchase('lifetime')} disabled={loading !== null} className="w-full py-4 bg-[#5C3EFE] text-white rounded-xl font-black shadow-xl shadow-indigo-500/30 hover:opacity-90 transition-all flex items-center justify-center transform hover:-translate-y-1">
            {loading === 'lifetime' ? <span className="animate-spin mr-2"><LayoutDashboard size={18}/></span> : 'Придбати назавжди'}
          </button>
        </div>
      </div>
    </div>
  )
}
