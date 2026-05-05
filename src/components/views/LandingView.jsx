import React, { useEffect, useState } from 'react'
import { Bot, ChevronRight, CheckCircle2, Zap, ArrowRight, BarChart3, FileText, Bell, Sparkles, Wrench, Shield, Calendar, Smartphone } from 'lucide-react'

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

  .al { font-family: 'DM Sans', sans-serif; }
  .al-display { font-family: 'Syne', sans-serif !important; }

  @keyframes al-float {
    0%,100% { transform: translateY(0) }
    50%      { transform: translateY(-10px) }
  }
  @keyframes al-ticker {
    0%   { transform: translateX(0) }
    100% { transform: translateX(-50%) }
  }
  @keyframes al-reveal {
    from { opacity: 0; transform: translateY(28px) }
    to   { opacity: 1; transform: translateY(0) }
  }
  @keyframes al-glow {
    0%,100% { box-shadow: 0 0 25px rgba(92,62,254,.3), 0 0 60px rgba(92,62,254,.08) }
    50%      { box-shadow: 0 0 45px rgba(92,62,254,.5), 0 0 90px rgba(92,62,254,.18) }
  }
  @keyframes al-bounce-dot {
    0%,80%,100% { transform: translateY(0) }
    40%         { transform: translateY(-6px) }
  }

  .al-r1 { animation: al-reveal .65s ease-out .05s both }
  .al-r2 { animation: al-reveal .65s ease-out .18s both }
  .al-r3 { animation: al-reveal .65s ease-out .32s both }
  .al-r4 { animation: al-reveal .65s ease-out .46s both }

  .al-float  { animation: al-float 4s ease-in-out infinite }
  .al-float2 { animation: al-float 3.6s ease-in-out .8s infinite }
  .al-glow   { animation: al-glow 3s ease-in-out infinite }

  .al-ticker { animation: al-ticker 22s linear infinite }
  .al-ticker:hover { animation-play-state: paused }

  .al-grad {
    background: linear-gradient(130deg, #fff 0%, #b8a4ff 45%, #5C3EFE 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .al-glass {
    background: rgba(255,255,255,.03);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,.07);
  }
  .al-glass-hover { transition: all .3s ease }
  .al-glass-hover:hover {
    background: rgba(255,255,255,.05);
    border-color: rgba(92,62,254,.35);
    transform: translateY(-2px);
    box-shadow: 0 20px 60px rgba(92,62,254,.1);
  }

  .al-btn {
    position: relative; overflow: hidden;
    transition: transform .15s, box-shadow .3s;
  }
  .al-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,.12) 0%, transparent 60%);
    opacity: 0; transition: opacity .3s;
  }
  .al-btn:hover::after { opacity: 1 }
  .al-btn:active { transform: scale(.97) }

  .al-mesh {
    background:
      radial-gradient(ellipse 70% 70% at 15% 20%, rgba(92,62,254,.14) 0%, transparent 65%),
      radial-gradient(ellipse 55% 55% at 85% 75%, rgba(92,62,254,.09) 0%, transparent 65%);
  }

  .al-grid-bg {
    background-image:
      linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
    background-size: 72px 72px;
  }

  .al-dot { animation: al-bounce-dot .9s ease-in-out infinite }
  .al-dot:nth-child(2) { animation-delay: .18s }
  .al-dot:nth-child(3) { animation-delay: .36s }
`

const BRAND = '#5C3EFE'
const BG    = '#07070E'

export function LandingView({ onLogin }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className="al min-h-screen overflow-x-hidden text-white" style={{ background: BG }}>
      <style>{STYLE}</style>

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={scrolled ? { background: 'rgba(7,7,14,.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.06)' } : {}}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: BRAND, boxShadow: '0 0 20px rgba(92,62,254,.45)' }}>
              <img src="/logo.png" alt="AutoLog" className="w-6 h-6 object-contain brightness-0 invert" />
            </div>
            <span className="al-display text-lg font-bold tracking-tight">AutoLog</span>
          </div>

          <div className="hidden lg:flex items-center gap-9">
            {[['#product','Продукт'],['#features','Можливості'],['#sto','Для СТО'],['#ai','AI Механік']].map(([href, label]) => (
              <a key={href} href={href} className="text-[11px] font-semibold uppercase tracking-[.18em] transition-colors"
                style={{ color: 'rgba(255,255,255,.38)' }}
                onMouseEnter={e => e.target.style.color='rgba(255,255,255,.9)'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,.38)'}>{label}</a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onLogin} className="hidden sm:block text-[11px] font-semibold uppercase tracking-widest px-4 py-2 transition-colors"
              style={{ color: 'rgba(255,255,255,.4)' }}>Увійти</button>
            <button onClick={onLogin} className="al-btn text-[10px] sm:text-[11px] font-bold uppercase tracking-[.14em] px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-white"
              style={{ background: BRAND, boxShadow: '0 0 28px rgba(92,62,254,.35)' }}>
              Спробувати
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 al-mesh pointer-events-none" />
        <div className="absolute inset-0 al-grid-bg pointer-events-none opacity-100" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(92,62,254,.1) 0%, transparent 70%)', filter: 'blur(50px)' }} />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full py-24 lg:py-0">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="al-r1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
                style={{ border: '1px solid rgba(92,62,254,.35)', background: 'rgba(92,62,254,.08)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BRAND }} />
                <span className="text-[10px] font-bold uppercase tracking-[.22em]" style={{ color: 'rgba(255,255,255,.55)' }}>
                  Інтелектуальний гараж №1 в Україні
                </span>
              </div>

              <h1 className="al-r2 al-display text-[3.2rem] sm:text-[4.5rem] lg:text-[6.2rem] font-extrabold leading-[.9] tracking-[-0.03em] mb-7">
                Керуй авто<br/>
                <span className="al-grad">на швидкості<br/>AI.</span>
              </h1>

              <p className="al-r3 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 mb-10"
                style={{ color: 'rgba(255,255,255,.42)' }}>
                Перша екосистема, що поєднує водія, сервіс та штучний інтелект. Весь життєвий цикл вашого авто — в одному преміальному додатку.
              </p>

              <div className="al-r4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-10">
                <button onClick={onLogin} className="al-btn al-glow w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 sm:py-5 rounded-2xl text-sm font-bold uppercase tracking-[.12em]"
                  style={{ background: BRAND }}>
                  Почати безкоштовно <ArrowRight size={16} />
                </button>
                <button onClick={onLogin} className="al-btn al-glass w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 sm:py-5 rounded-2xl text-sm font-semibold"
                  style={{ color: 'rgba(255,255,255,.55)' }}>
                  Переглянути demo <ChevronRight size={16} />
                </button>
              </div>

              <div className="al-r4 flex items-center gap-5 justify-center lg:justify-start">
                <div className="flex -space-x-2.5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 overflow-hidden shrink-0" style={{ borderColor: BG }}>
                      <img src={`https://i.pravatar.cc/80?u=al${i}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-xs">★</span>)}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.3)' }}>
                    5 000+ водіїв вже з нами
                  </p>
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="flex-1 relative w-full max-w-md lg:max-w-none mx-auto">
              <div className="al-float relative">
                <div className="rounded-[2.5rem] overflow-hidden"
                  style={{ border: '1px solid rgba(92,62,254,.25)', boxShadow: '0 40px 100px rgba(92,62,254,.18), 0 0 0 1px rgba(92,62,254,.12)' }}>
                  <img src="/autolog_landing_hero.png" alt="AutoLog" className="w-full h-auto block" />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(7,7,14,.45) 0%, transparent 55%)' }} />
                </div>

                {/* Status badge */}
                <div className="al-float2 absolute -top-4 -right-4 sm:-top-6 sm:-right-8 al-glass rounded-2xl p-3 sm:p-4"
                  style={{ border: '1px solid rgba(92,62,254,.2)', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,.15)' }}>
                      <Shield size={16} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,.38)' }}>Статус авто</p>
                      <p className="text-xs font-bold text-white">Сервіс завершено ✓</p>
                    </div>
                  </div>
                </div>

                {/* AI badge */}
                <div className="absolute -bottom-6 -left-3 sm:-bottom-8 sm:-left-8 al-glass rounded-2xl p-4 max-w-[250px]"
                  style={{ border: '1px solid rgba(92,62,254,.2)', boxShadow: '0 20px 50px rgba(0,0,0,.4)', animation: 'al-float 4.5s ease-in-out 1.2s infinite' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: BRAND }}>
                      <Bot size={12} className="text-white" />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,.45)' }}>AI Механік</p>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,.7)' }}>
                    Наступне ТО через <span className="text-white font-bold">452 км</span>. Записати вас?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TICKER ─── */}
      <div className="py-7 overflow-hidden border-y" style={{ borderColor: 'rgba(255,255,255,.05)', background: 'rgba(255,255,255,.015)' }}>
        <div className="al-ticker flex whitespace-nowrap gap-14">
          {[0,1].map(r => (
            <div key={r} className="flex items-center gap-14 shrink-0">
              {[
                ['5 000+','Активних водіїв'],['120+','Партнерських СТО'],['98%','Задоволених клієнтів'],
                ['24/7','AI підтримка'],['3×','Швидше за конкурентів'],['₴0','Безкоштовний старт'],
              ].map(([num, lbl], i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="al-display text-xl sm:text-2xl font-bold text-white">{num}</span>
                  <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.28)' }}>{lbl}</span>
                  <span className="text-xl ml-6" style={{ color: 'rgba(255,255,255,.08)' }}>·</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── BENTO FEATURES ─── */}
      <section id="product" className="py-24 lg:py-36">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <p className="text-[10px] font-bold uppercase tracking-[.35em] mb-4" style={{ color: 'rgba(255,255,255,.28)' }}>Можливості</p>
            <h2 className="al-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Все що потрібно<br/><span className="al-grad">сучасному водію</span>
            </h2>
          </div>

          <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">

            {/* AI Chat — wide */}
            <div className="sm:col-span-2 al-glass al-glass-hover rounded-3xl p-8 lg:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, rgba(92,62,254,.14), transparent 70%)' }} />
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: BRAND }}>
                  <Bot size={19} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">AI Механік</p>
                  <p className="text-[10px] font-bold text-green-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" /> Online
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm max-w-[88%] text-[13px] leading-relaxed"
                  style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.7)' }}>
                  Аналізую Ford Bronco… Знос передніх колодок до <span className="text-white font-semibold">20%</span>. Рекомендую замінити протягом 500 км.
                </div>
                <div className="ml-auto px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] text-[13px] font-medium text-white"
                  style={{ background: BRAND }}>
                  Скільки коштуватиме заміна?
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm max-w-[88%] text-[13px] leading-relaxed"
                  style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.7)' }}>
                  Заміна колодок: <span className="text-white font-semibold">800–1 200 ₴</span>. Знайшов 3 партнерських СТО поруч. Записати?
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 w-fit"
                  style={{ background: 'rgba(255,255,255,.05)' }}>
                  {[0,150,300].map(d => <div key={d} className="al-dot w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.3)', animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="al-glass al-glass-hover rounded-3xl p-8 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(92,62,254,.18)' }}>
                <BarChart3 size={19} style={{ color: '#9D85FF' }} />
              </div>
              <h3 className="al-display text-xl font-bold text-white mb-3">Аналітика витрат</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,.38)' }}>
                Візуалізуємо всі витрати. Ніяких сюрпризів.
              </p>
              <div className="flex items-end gap-1 h-14">
                {[38,60,42,78,52,68,88,56,82,72,95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm transition-all"
                    style={{ height: `${h}%`, background: i === 10 ? BRAND : `rgba(92,62,254,${.12 + h * .004})` }} />
                ))}
              </div>
            </div>

            {/* Sharing */}
            <div className="al-glass al-glass-hover rounded-3xl p-8 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(92,62,254,.18)' }}>
                <FileText size={19} style={{ color: '#9D85FF' }} />
              </div>
              <h3 className="al-display text-xl font-bold text-white mb-3">Публічний звіт</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,.38)' }}>
                Поділіться прозорою історією при продажі. +10–15% до ціни.
              </p>
              {['Оригінальний пробіг підтверджено','Відсутність ДТП','Всі записи ТО'].map((t, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={13} style={{ color: '#9D85FF' }} />
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,.5)' }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Reminders */}
            <div className="al-glass al-glass-hover rounded-3xl p-8 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(92,62,254,.18)' }}>
                <Bell size={19} style={{ color: '#9D85FF' }} />
              </div>
              <h3 className="al-display text-xl font-bold text-white mb-3">Розумні нагадування</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,.38)' }}>
                AutoLog знає, коли закінчується страховка або час міняти масло.
              </p>
              <div className="space-y-2">
                {[['#5C3EFE','Заміна масла через 1 200 км'],['#f59e0b','Страховка спливає за 14 днів']].map(([c, t], i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,.04)' }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,.55)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking CTA */}
            <div className="al-glass al-glass-hover rounded-3xl p-8 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(92,62,254,.18)' }}>
                <Wrench size={19} style={{ color: '#9D85FF' }} />
              </div>
              <h3 className="al-display text-xl font-bold text-white mb-3">Онлайн запис</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,.38)' }}>
                Вибирайте вільне вікно на СТО за 30 секунд прямо в додатку.
              </p>
              <button onClick={onLogin} className="al-btn w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white"
                style={{ background: 'rgba(92,62,254,.25)', border: '1px solid rgba(92,62,254,.35)' }}>
                Записатись зараз
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STO SECTION ─── */}
      <section id="sto" className="py-24 lg:py-36 relative overflow-hidden">
        <div className="absolute right-0 inset-y-0 w-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 70% at 80% 50%, rgba(92,62,254,.09) 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.35em] mb-6" style={{ color: 'rgba(255,255,255,.28)' }}>Для бізнесу</p>
              <h2 className="al-display text-4xl sm:text-5xl lg:text-[3.8rem] font-extrabold tracking-[-0.02em] leading-[.93] mb-8">
                Будуй майбутнє<br/><span className="al-grad">свого СТО</span><br/>разом з нами
              </h2>
              <p className="text-lg leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,.4)' }}>
                Підключіть ваше СТО до мережі AutoLog і отримайте CRM, потік клієнтів та аналітику в одному місці.
              </p>
              <div className="space-y-4 mb-10">
                {['CRM з розумним календарем записів','Автоматичні push-сповіщення клієнтам','База запчастин та аналітика доходів'].map((t, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(92,62,254,.2)' }}>
                      <CheckCircle2 size={13} style={{ color: '#9D85FF' }} />
                    </div>
                    <span className="text-base font-medium" style={{ color: 'rgba(255,255,255,.6)' }}>{t}</span>
                  </div>
                ))}
              </div>
              <button onClick={onLogin} className="al-btn al-glow inline-flex items-center gap-3 px-8 py-4 sm:py-5 rounded-2xl text-sm font-bold uppercase tracking-widest text-white"
                style={{ background: BRAND }}>
                Стати партнером <ArrowRight size={15} />
              </button>
            </div>

            <div className="al-glass rounded-3xl p-6 sm:p-8 relative overflow-hidden"
              style={{ border: '1px solid rgba(92,62,254,.18)', boxShadow: '0 30px 80px rgba(92,62,254,.1)' }}>
              <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(92,62,254,.14), transparent 70%)' }} />
              <p className="text-[10px] font-bold uppercase tracking-widest mb-6" style={{ color: 'rgba(255,255,255,.28)' }}>CRM · Сьогодні</p>
              <div className="space-y-3">
                {[
                  { id:'#1024', car:'BMW X5',      time:'10:00', active: true },
                  { id:'#1025', car:'Toyota Camry', time:'12:30', active: false },
                  { id:'#1026', car:'Audi Q5',      time:'14:00', active: false },
                  { id:'#1027', car:'Ford Focus',   time:'16:30', active: false },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl"
                    style={{ background: row.active ? 'rgba(92,62,254,.15)' : 'rgba(255,255,255,.03)', border: `1px solid ${row.active ? 'rgba(92,62,254,.35)' : 'rgba(255,255,255,.05)'}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.35)' }}>{row.id}</div>
                      <div>
                        <p className="text-sm font-bold text-white">{row.car}</p>
                        <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,.3)' }}>{row.time}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl"
                      style={{ background: row.active ? 'rgba(92,62,254,.3)' : 'rgba(255,255,255,.05)', color: row.active ? '#b8a4ff' : 'rgba(255,255,255,.28)' }}>
                      {row.active ? 'В роботі' : 'Очікує'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
                <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.22)' }}>Записів сьогодні</p>
                <p className="al-display text-2xl font-bold text-white">12</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI SECTION ─── */}
      <section id="ai" className="py-24 lg:py-36 relative overflow-hidden">
        <div className="absolute left-0 inset-y-0 w-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 70% at 10% 50%, rgba(92,62,254,.08) 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Chat mock */}
            <div className="order-2 lg:order-1 al-glass rounded-3xl p-6 sm:p-8"
              style={{ border: '1px solid rgba(92,62,254,.18)', boxShadow: '0 30px 80px rgba(92,62,254,.08)' }}>
              <div className="flex items-center gap-3 pb-6 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: BRAND }}>
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">AI AutoMechanic</p>
                  <p className="text-[10px] font-bold text-green-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" /> Online · 24/7
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { r:'bot',  t:'Доброго дня! Аналізую телеметрію вашого авто. Виявив потенційну проблему з гальмівною системою.' },
                  { r:'user', t:'Що саме не так?' },
                  { r:'bot',  t:'Знос передніх гальмівних колодок до 20%. Рекомендую замінити протягом 500–700 км. Вартість: 800–1 200 ₴.' },
                ].map((m, i) => (
                  <div key={i} className={`flex ${m.r === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[88%] px-4 py-3 text-[13px] leading-relaxed"
                      style={{
                        background: m.r === 'user' ? BRAND : 'rgba(255,255,255,.06)',
                        color: m.r === 'user' ? '#fff' : 'rgba(255,255,255,.7)',
                        borderRadius: m.r === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        fontWeight: m.r === 'user' ? 500 : 400
                      }}>
                      {m.t}
                    </div>
                  </div>
                ))}
                <div className="flex gap-1.5 px-4 py-3 w-fit" style={{ background: 'rgba(255,255,255,.05)', borderRadius: '18px 18px 18px 4px' }}>
                  {[0,1,2].map(i => <div key={i} className="al-dot w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,.28)', animationDelay: `${i*160}ms` }} />)}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p className="text-[10px] font-bold uppercase tracking-[.35em] mb-6" style={{ color: 'rgba(255,255,255,.28)' }}>AI Інтелект</p>
              <h2 className="al-display text-4xl sm:text-5xl lg:text-[3.8rem] font-extrabold tracking-[-0.02em] leading-[.93] mb-8">
                Механік,<br/><span className="al-grad">який завжди</span><br/>поруч.
              </h2>
              <p className="text-lg leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,.4)' }}>
                AutoLog AI аналізує технічний стан вашого авто в реальному часі, дає поради та допомагає вибрати найкращі запчастини. Як лікар для авто, але 24/7.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [Zap,'Миттєва діагностика','Відповідь за секунди'],
                  [Shield,'Надійні поради','Перевірені рекомендації'],
                  [Calendar,'Планування ТО','Авто-нагадування'],
                  [Smartphone,'Telegram бот','Завжди в месенджері'],
                ].map(([Icon, title, desc], i) => (
                  <div key={i} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                    <Icon size={17} style={{ color: '#9D85FF' }} className="mb-2.5" />
                    <p className="text-sm font-bold text-white mb-0.5">{title}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.3)' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-28 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0 al-mesh opacity-70 pointer-events-none" />
        <div className="absolute inset-0 al-grid-bg pointer-events-none opacity-60" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(92,62,254,.6), transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(92,62,254,.35), transparent)' }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(92,62,254,.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative z-10">
          <h2 className="al-display text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-[-0.03em] leading-[.9] mb-8">
            Почни нову еру<br/><span className="al-grad">життя свого авто.</span>
          </h2>
          <p className="text-lg mb-12 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,.38)' }}>
            Безкоштовна реєстрація за 30 секунд. Картка не потрібна.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onLogin} className="al-btn al-glow px-10 py-5 rounded-2xl text-sm font-bold uppercase tracking-[.15em] text-white"
              style={{ background: BRAND }}>
              Створити акаунт
            </button>
            <button onClick={onLogin} className="al-btn al-glass px-10 py-5 rounded-2xl text-sm font-bold uppercase tracking-[.15em] text-white/55 hover:text-white transition-colors">
              Портал СТО
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-10" style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0" style={{ background: BRAND }}>
              <img src="/logo.png" alt="" className="w-5 h-5 object-contain brightness-0 invert" />
            </div>
            <span className="al-display text-sm font-bold" style={{ color: 'rgba(255,255,255,.5)' }}>AutoLog</span>
          </div>
          <div className="flex gap-8">
            {['Політика','Контакти','API'].map(t => (
              <a key={t} href="#" className="text-[10px] font-semibold uppercase tracking-widest transition-colors"
                style={{ color: 'rgba(255,255,255,.22)' }}
                onMouseEnter={e => e.target.style.color='rgba(255,255,255,.6)'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,.22)'}>{t}</a>
            ))}
          </div>
          <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.18)' }}>© 2026 AutoLog</p>
        </div>
      </footer>
    </div>
  )
}
