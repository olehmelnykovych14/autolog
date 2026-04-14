import React, { useEffect, useState } from 'react'
import { 
  Car, Wrench, Shield, Bot, ChevronRight, CheckCircle2, 
  Zap, Calendar, Users, ArrowRight, Smartphone, 
  BarChart3, FileText, Bell, Sparkles, MousePointer2, ClipboardList
} from 'lucide-react'

export function LandingView({ onLogin }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 py-3 shadow-sm' : 'bg-transparent py-4 sm:py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center shadow-lg border border-gray-100 overflow-hidden shrink-0">
              <img src="/logo.png" alt="AutoLog" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">AutoLog</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            <a href="#product" className="text-[11px] font-black text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">Продукт</a>
            <a href="#features" className="text-[11px] font-black text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">Можливості</a>
            <a href="#sto" className="text-[11px] font-black text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">Для СТО</a>
            <a href="#ai" className="text-[11px] font-black text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">AI Механік</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onLogin} className="hidden sm:block text-[11px] font-black text-gray-900 hover:text-indigo-600 py-2 px-5 transition-all uppercase tracking-widest">Увійти</button>
            <button onClick={onLogin} className="bg-gray-900 text-white px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-[0.15em] hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 active:scale-95 whitespace-nowrap">Спробувати безкоштовно</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-56 lg:pb-40 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[40rem] sm:w-[60rem] h-[40rem] sm:h-[60rem] bg-indigo-50/50 rounded-full blur-[80px] sm:blur-[120px] sm:-mr-[30rem] -mt-[10rem] sm:-mt-[20rem] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] sm:w-[40rem] h-[30rem] sm:h-[40rem] bg-blue-50/50 rounded-full blur-[60px] sm:blur-[100px] -ml-[10rem] sm:-ml-[20rem] -mb-[5rem] sm:-mb-[10rem] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left mt-8 lg:mt-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Sparkles size={12} fill="currentColor"/> Інтелектуальний гараж №1 в Україні
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[5.5rem] font-[1000] text-gray-900 leading-[0.95] mb-6 lg:mb-10 tracking-[-0.04em] animate-in fade-in slide-in-from-bottom-8 duration-700">
                Керуй своїм авто <br className="hidden sm:block"/> 
                <span className="text-indigo-600">на швидкості AI.</span>
              </h1>
              <p className="text-base sm:text-xl text-gray-500 font-medium mb-8 lg:mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 px-2 sm:px-0">
                Перша екосистема, що поєднує водія, сервіс та штучний інтелект. Весь життєвий цикл вашого автомобіля в одному преміальному додатку.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-12 duration-1000 w-full sm:w-auto px-4 sm:px-0">
                <button onClick={onLogin} className="w-full sm:w-auto px-6 py-4 sm:px-10 sm:py-6 bg-indigo-600 text-white rounded-[1.5rem] sm:rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 group">
                  Почати зараз <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                </button>
                <div className="flex items-center gap-4 px-6 border-none sm:border-l sm:border-gray-100 mt-4 sm:mt-0 opacity-80 sm:opacity-100">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => <div key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white bg-gray-100 overflow-hidden"><img src={`https://i.pravatar.cc/100?u=h${i}`} alt="user"/></div>)}
                   </div>
                   <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight text-left">5,000+ водіїв <br/> вже з нами</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative animate-in fade-in zoom-in duration-1000 delay-300 px-2 sm:px-0 w-full max-w-md lg:max-w-none mx-auto">
              <div className="relative group">
                <div className="absolute -inset-2 sm:-inset-4 bg-indigo-500/10 rounded-[3rem] sm:rounded-[4rem] blur-xl sm:blur-2xl group-hover:bg-indigo-500/15 transition-all duration-700"></div>
                <div className="relative rounded-3xl sm:rounded-[3.5rem] p-3 sm:p-5 bg-white border border-gray-100 shadow-2xl overflow-hidden aspect-[4/5] flex items-center justify-center">
                  <img 
                    src="/autolog_landing_hero.png" 
                    alt="AutoLog Experience" 
                    className="w-full h-full object-cover rounded-2xl sm:rounded-[2.8rem] shadow-xl"
                  />
                </div>
                {/* Floating UI Elements */}
                <div className="absolute -top-4 -right-2 sm:-top-8 sm:-right-8 bg-white/95 backdrop-blur-md p-3 sm:p-5 rounded-xl sm:rounded-3xl shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-right-8 delay-700 duration-1000">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-inner shrink-0">
                      <Shield size={20} className="sm:w-6 sm:h-6"/>
                    </div>
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Статус авто</p>
                      <p className="text-xs sm:text-sm font-black text-gray-900 tracking-tight">Сервіс завершено</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -left-2 sm:-bottom-10 sm:-left-10 bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-left-8 delay-1000 duration-1000 max-w-[85%] sm:max-w-none">
                   <div className="flex flex-col gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1">
                         <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0"><Bot size={14}/></div>
                         <p className="text-[9px] sm:text-[11px] font-black text-gray-900 uppercase">AI Mechanic</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl sm:rounded-2xl py-2 px-3 sm:py-2.5 sm:px-4 text-[9px] sm:text-[11px] font-semibold text-gray-600 leading-relaxed border border-gray-100">
                         Наступне ТО через **452 км**. <br/> Записати вас на сервіс?
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Deep Dive */}
      <section id="product" className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 lg:mb-24 max-w-3xl mx-auto px-4 text-balance">
            <h2 className="text-[10px] sm:text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] lg:tracking-[0.4em] mb-4 sm:mb-6 underline decoration-indigo-200 decoration-4 underline-offset-8">Продукт</h2>
            <h3 className="text-3xl sm:text-4xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">Більше, ніж просто сервісна книжка</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center mb-24 lg:mb-32">
            <div className="relative px-4 sm:px-8 lg:px-0">
               <div className="absolute -inset-10 lg:-inset-20 bg-blue-50/50 rounded-full blur-[60px] lg:blur-[100px] pointer-events-none"></div>
               <div className="relative bg-white rounded-[2rem] lg:rounded-[3rem] p-2 shadow-2xl border border-gray-50 overflow-hidden">
                  <div className="bg-gray-900 rounded-[1.8rem] lg:rounded-[2.8rem] aspect-video flex flex-col items-center justify-center p-6 lg:p-12 text-center overflow-hidden relative">
                     <div className="absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 bg-indigo-500/20 blur-3xl"></div>
                     <BarChart3 size={48} className="text-indigo-400 mb-4 lg:mb-6 sm:w-16 sm:h-16" />
                     <h4 className="text-xl sm:text-2xl font-black text-white mb-2 lg:mb-4">Аналітика витрат</h4>
                     <p className="text-xs sm:text-sm lg:text-base text-gray-400 font-medium">AutoLog автоматично рахує вартість володіння авто, прогнозує витрати на пальне та ремонт.</p>
                  </div>
               </div>
            </div>
            <div className="px-4 sm:px-0 text-center sm:text-left">
               <h4 className="text-[10px] sm:text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 lg:mb-6">Економіка авто</h4>
               <h3 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6 lg:mb-8 leading-tight">Контролюй кожен цент, витрачений на сервіс</h3>
               <p className="text-base sm:text-lg lg:text-xl text-gray-500 font-medium mb-8 lg:mb-10 leading-relaxed">
                  Ми візуалізуємо ваші витрати у зручних графіках. Ви точно знаєте, на що йдуть кошти: пальне, запчастини чи планове ТО. Ніяких сюрпризів.
               </p>
               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
                  {[
                    { icon: MousePointer2, text: 'Прогноз витрат' },
                    { icon: FileText, text: 'Експорт звітів' },
                    { icon: Zap, text: 'Економія до 15%' },
                    { icon: CheckCircle2, text: 'Історія чеків' }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                       <item.icon size={18} className="text-indigo-500 shrink-0"/> {item.text}
                    </li>
                  ))}
               </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center px-4 sm:px-0">
            <div className="order-2 lg:order-1 text-center sm:text-left">
               <h4 className="text-[10px] sm:text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 lg:mb-6">Прозорість</h4>
               <h3 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6 lg:mb-8 leading-tight">Ваш власний Carfax у один клік</h3>
               <p className="text-base sm:text-lg lg:text-xl text-gray-500 font-medium mb-8 lg:mb-10 leading-relaxed">
                  При продажі авто ви просто ділитеся посиланням. Покупець бачить прозору історію, підтверджену партнерськими СТО. Це автоматично піднімає ціну вашого авто на 10-15%.
               </p>
               <button onClick={onLogin} className="inline-flex items-center justify-center w-full sm:w-auto gap-3 text-sm font-black text-indigo-600 uppercase tracking-widest hover:gap-5 transition-all bg-indigo-50 sm:bg-transparent py-4 sm:py-0 rounded-2xl sm:rounded-none">
                  Дізнатися більше <ArrowRight size={16}/>
               </button>
            </div>
            <div className="order-1 lg:order-2 relative px-4 sm:px-8 lg:px-0">
               <div className="bg-indigo-600 rounded-3xl lg:rounded-[3rem] p-8 lg:p-12 text-white shadow-[0_20px_40px_-10px_rgba(92,62,254,0.3)] lg:shadow-[0_40px_80px_-15px_rgba(92,62,254,0.3)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 lg:w-48 lg:h-48 bg-white/10 rounded-full -mr-16 -mt-16 lg:-mr-24 lg:-mt-24 group-hover:scale-110 transition-transform duration-700"></div>
                  <FileText size={40} className="mb-6 lg:mb-8 opacity-50 sm:w-12 sm:h-12" />
                  <h4 className="text-2xl sm:text-3xl font-black mb-4">Публічний звіт</h4>
                  <div className="space-y-3 opacity-80 font-medium mb-8 lg:mb-10">
                     <p className="flex items-center gap-3 text-xs sm:text-sm"><CheckCircle2 size={16} className="shrink-0"/> Оригінальний пробіг підтверджено</p>
                     <p className="flex items-center gap-3 text-xs sm:text-sm"><CheckCircle2 size={16} className="shrink-0"/> Відсутність ДТП у базі</p>
                     <p className="flex items-center gap-3 text-xs sm:text-sm"><CheckCircle2 size={16} className="shrink-0"/> Всі записи ТО з 2021 року</p>
                  </div>
                  <div className="bg-white/10 p-3 lg:p-4 rounded-xl lg:rounded-2xl flex items-center justify-between">
                     <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest break-all">autolog.app/share/m5</span>
                     <Sparkles size={16} className="shrink-0 ml-2"/>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 lg:py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 lg:mb-24 px-4 text-balance">
            <h2 className="text-[10px] sm:text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] lg:tracking-[0.4em] mb-4 lg:mb-6">Функціонал</h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">Розумні інструменти для водія</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8 px-4 sm:px-0">
            {[
              { icon: Bell, title: 'Розумні нагадування', desc: 'AutoLog знає, коли закінчується страховка чи прийшов час міняти гальмівні колодки.' },
              { icon: Wrench, title: 'Онлайн запис', desc: 'Вибирайте вільне вікно на улюбленому СТО прямо в додатку за 30 секунд.' },
              { icon: Smartphone, title: 'Telegram Бот', desc: 'Уся статистика та керування сервісом через ваш месенджер.' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-6 sm:p-8 lg:p-10 rounded-3xl lg:rounded-[3rem] border border-gray-100 hover:border-indigo-100 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group">
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[1.2rem] lg:rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 lg:mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                  <f.icon size={24} className="lg:w-7 lg:h-7" />
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-gray-900 mb-3 lg:mb-4">{f.title}</h4>
                <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B / STO Section */}
      <section id="sto" className="py-20 lg:py-32 bg-white relative">
         <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-gray-900 rounded-3xl sm:rounded-[3rem] lg:rounded-[4rem] p-8 sm:p-12 lg:p-24 text-white relative overflow-hidden flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
               <div className="absolute top-0 right-0 w-[20rem] sm:w-[40rem] h-[20rem] sm:h-[40rem] bg-indigo-600/20 rounded-full blur-[60px] lg:blur-[100px] -mr-[10rem] lg:-mr-[20rem] -mt-[10rem] lg:-mt-[20rem] pointer-events-none"></div>
               
               <div className="flex-1 relative z-10 text-center lg:text-left">
                  <h2 className="text-[10px] sm:text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] lg:tracking-[0.4em] mb-6 lg:mb-8">Для бізнесу</h2>
                  <h3 className="text-3xl sm:text-4xl lg:text-6xl font-black leading-none mb-8 lg:mb-10 tracking-tight text-balance">Будуй майбутнє свого СТО разом з нами</h3>
                  <div className="space-y-4 sm:space-y-6 mb-10 lg:mb-12">
                     <p className="flex items-center gap-3 sm:gap-4 text-base sm:text-lg font-bold justify-center lg:justify-start"><CheckCircle2 className="text-indigo-400 shrink-0" /> CRM з розумним календарем</p>
                     <p className="flex items-center gap-3 sm:gap-4 text-base sm:text-lg font-bold justify-center lg:justify-start"><CheckCircle2 className="text-indigo-400 shrink-0" /> Автоматичні пуші клієнтам</p>
                     <p className="flex items-center gap-3 sm:gap-4 text-base sm:text-lg font-bold justify-center lg:justify-start"><CheckCircle2 className="text-indigo-400 shrink-0" /> База запчастин та аналітика</p>
                  </div>
                  <button onClick={onLogin} className="w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-6 bg-white text-gray-900 rounded-2xl sm:rounded-3xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-xl">Стати партнером</button>
               </div>

               <div className="flex-1 w-full lg:w-auto relative z-10">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-[3rem] p-6 sm:p-8 lg:p-12">
                     <div className="space-y-4 sm:space-y-6">
                        {[1,2,3].map(i => (
                          <div key={i} className={`flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 ${i === 1 ? 'border-indigo-500/50 bg-indigo-500/10' : ''}`}>
                             <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">{i}</div>
                                <div>
                                   <p className="text-xs sm:text-sm font-black">Запис #{1024 + i}</p>
                                   <p className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400">BMW X5 · 14:30</p>
                                </div>
                             </div>
                             <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 bg-white/10 rounded-full whitespace-nowrap">{i===1 ? 'В роботі' : 'Очікує'}</div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="py-20 lg:py-32 relative overflow-hidden bg-[#FDFDFF]">
         <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
               <div className="flex-1 relative order-2 lg:order-1 w-full">
                  <div className="relative z-10 bg-white rounded-3xl lg:rounded-[3.5rem] border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] lg:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-6 sm:p-8 lg:p-10">
                     <div className="flex items-center gap-4 sm:gap-5 mb-8 sm:mb-10 pb-6 sm:pb-10 border-b border-gray-50">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0"><Bot size={24} className="sm:w-8 sm:h-8"/></div>
                        <div>
                           <p className="text-base sm:text-lg font-black text-gray-900 leading-none mb-1.5 tracking-tight">AI AutoMechanic</p>
                           <p className="text-[9px] sm:text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Online · Доступний</p>
                        </div>
                     </div>
                     <div className="space-y-4 sm:space-y-6">
                        <div className="flex justify-start"><div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-[1.2rem] sm:rounded-[1.8rem] rounded-tl-sm text-xs sm:text-sm font-medium text-gray-600 max-w-[90%] sm:max-w-[85%] border border-gray-100">Чути дивний звук при гальмуванні? Скоріш за все, це знос колодок. Я вибрав найкращі варіанти для твого авто...</div></div>
                        <div className="flex justify-end"><div className="bg-indigo-600 px-4 sm:px-6 py-3 sm:py-4 rounded-[1.2rem] sm:rounded-[1.8rem] rounded-tr-sm text-xs sm:text-sm font-bold text-white max-w-[85%] sm:max-w-[80%] shadow-lg shadow-indigo-200">Дякую! Скільки коштуватиме заміна?</div></div>
                     </div>
                  </div>
               </div>

               <div className="flex-1 order-1 lg:order-2 text-center lg:text-left">
                  <h2 className="text-[10px] sm:text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] lg:tracking-[0.4em] mb-6 lg:mb-10">AI Інтелект</h2>
                  <h3 className="text-4xl sm:text-5xl lg:text-[5rem] font-[1000] text-gray-900 leading-[0.95] mb-8 lg:mb-12 tracking-tighter text-balance">Механік, <br className="hidden sm:block"/>який завжди поруч.</h3>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-500 font-medium mb-8 lg:mb-12 leading-relaxed">
                     AutoLog AI аналізує технічний стан вашого авто у реальному часі, дає поради щодо ремонту та допомагає вибрати найкращі запчастини. Це як лікар для вашого авто, тільки доступний 24/7.
                  </p>
                  <button onClick={onLogin} className="inline-flex items-center gap-3 text-xs sm:text-sm font-black text-indigo-600 uppercase tracking-[0.1em] sm:tracking-[0.2em] group bg-indigo-50 sm:bg-transparent py-4 px-6 sm:p-0 rounded-2xl w-full sm:w-auto justify-center">
                     Спробувати консультацію <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 lg:py-32 relative group">
        <div className="absolute inset-0 bg-gray-950 overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px', '@media (min-width: 640px)': {backgroundSize: '40px 40px'}}}></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] sm:w-full h-full bg-indigo-600/20 blur-[100px] sm:blur-[150px] rounded-full"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[0.95] mb-10 sm:mb-12 tracking-tight text-balance">Почни нову еру <br className="hidden sm:block"/> <span className="text-indigo-400">життя свого авто.</span></h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center w-full">
            <button onClick={onLogin} className="w-full sm:w-auto px-8 py-5 sm:px-12 sm:py-7 bg-indigo-600 text-white rounded-2xl sm:rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-[0.2em] hover:bg-white hover:text-gray-900 transition-all shadow-2xl sm:shadow-3xl shadow-indigo-500/20 active:scale-95">Створити акаунт</button>
            <button onClick={onLogin} className="w-full sm:w-auto px-8 py-5 sm:px-12 sm:py-7 bg-white/5 border border-white/10 text-white rounded-2xl sm:rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95">Портал СТО</button>
          </div>
          <p className="mt-8 sm:mt-12 text-gray-400 sm:text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em]">Реєстрація займає 30 секунд. Картка не потрібна.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 bg-white border-t border-gray-50">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 text-center md:text-left">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center shrink-0"><img src="/logo.png" alt="AutoLog" className="w-4 h-4 brightness-0 invert opacity-60"/></div>
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-900">AutoLog</span>
               </div>
               
               <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 sm:gap-12">
                  <a href="#" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Політика</a>
                  <a href="#" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Контакти</a>
                  <a href="#" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">API</a>
               </div>
               
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest underline decoration-indigo-200 underline-offset-4">AutoLog © 2026</p>
            </div>
         </div>
      </footer>
    </div>
  )
}
