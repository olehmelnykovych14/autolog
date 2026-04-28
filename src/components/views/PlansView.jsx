import React, { useState, useContext } from 'react'
import { Check, Info, LayoutDashboard, Send, Wrench, ShieldCheck, Zap } from 'lucide-react'
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
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    try {
      const resp = await fetch(`${API_URL}/api/payment/create`, {
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

  const proFeatures = [
    'Unlimited Fleet Diagnostics',
    'Real-time Inventory Sync',
    'Multi-user Team Access',
    'Priority Email Support',
  ]

  const lifetimeFeatures = [
    'All Pro Features Included',
    'Advanced AI Diagnostics Beta',
    'White-label Client Reports',
    'Dedicated Account Manager',
    'Early Access to API v3',
  ]

  const badges = [
    { icon: '🔒', label: 'Enterprise Security' },
    { icon: '⚡', label: '99.9% Uptime SLA' },
    { icon: '💬', label: '24/7 Expert Support' },
  ]

  return (
    <div className="max-w-5xl mx-auto pb-16 w-full pt-8 px-4">
      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 text-[#5C3EFE] text-xs font-black uppercase tracking-widest mb-5">
          <Zap size={12} /> STO Partner Program
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
          Unlock Premium STO Features
        </h1>
        <p className="text-gray-500 dark:text-[#94A3B8] text-lg max-w-2xl mx-auto leading-relaxed">
          Take command of your entire service-to-operation workflow with professional tools designed for maximum efficiency and data-driven growth.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
        {/* Pro Subscription */}
        <div className="relative bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-8 flex flex-col hover:border-[#5C3EFE]/40 dark:hover:border-[#5C3EFE]/30 transition-all shadow-sm group">
          <div className="mb-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MONTHLY GROWTH</span>
          </div>
          <div className="mb-1">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Pro Subscription</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-1 mt-3">
            <span className="text-5xl font-black text-gray-900 dark:text-white">$29.99</span>
            <span className="text-gray-400 dark:text-gray-500 font-medium">/ month</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
            Perfect for scaling shops needing advanced diagnostic logs and inventory sync.
          </p>
          <ul className="flex-1 space-y-3.5 mb-8">
            {proFeatures.map((feat, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-5 h-5 rounded-full bg-[#5C3EFE]/10 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-[#5C3EFE]" />
                </div>
                {feat}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handlePurchase('pro')}
            disabled={loading !== null}
            className="w-full py-4 rounded-2xl font-black text-sm border-2 border-[#5C3EFE] text-[#5C3EFE] dark:text-white hover:bg-[#5C3EFE] hover:text-white transition-all flex items-center justify-center gap-2 group-hover:bg-[#5C3EFE] group-hover:text-white"
          >
            {loading === 'pro'
              ? <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              : <><Zap size={16}/> Upgrade Now</>}
          </button>
        </div>

        {/* Lifetime Access */}
        <div className="relative overflow-hidden rounded-3xl p-8 flex flex-col shadow-2xl shadow-indigo-500/20"
          style={{ background: 'linear-gradient(135deg, #1a0e3a 0%, #0e0a2a 40%, #060613 100%)', border: '1px solid rgba(92,62,254,0.4)' }}>
          {/* Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #5C3EFE 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

          <div className="relative z-10 mb-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ULTIMATE VALUE</span>
          </div>
          <div className="relative z-10 mb-1">
            <h3 className="text-2xl font-bold text-white">Lifetime Access</h3>
          </div>
          <div className="relative z-10 flex items-baseline gap-2 mb-1 mt-3">
            <span className="text-5xl font-black text-white">$299</span>
            <div>
              <span className="text-indigo-200/50 font-medium text-sm line-through">$420</span>
              <span className="block text-[10px] text-indigo-300/60">The complete command center. No recurring fees, all future updates included.</span>
            </div>
          </div>
          <p className="relative z-10 text-xs text-indigo-300/50 mb-8">The complete command center. No recurring fees, all future updates included.</p>
          
          <ul className="relative z-10 flex-1 space-y-3.5 mb-8">
            {lifetimeFeatures.map((feat, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-indigo-100/90">
                <div className="w-5 h-5 rounded-full bg-[#5C3EFE] flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/50">
                  <Check size={11} className="text-white" />
                </div>
                {feat}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handlePurchase('lifetime')}
            disabled={loading !== null}
            className="relative z-10 w-full py-4 bg-[#5C3EFE] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/40 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading === 'lifetime'
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><ShieldCheck size={16}/> Claim Lifetime License</>}
          </button>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-6">
        {badges.map((b, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
            <span className="text-base">{b.icon}</span>
            {b.label}
          </div>
        ))}
      </div>

      {/* New Service Entry */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={() => setTab('sto')}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
          + New Service Entry
        </button>
      </div>
    </div>
  )
}
