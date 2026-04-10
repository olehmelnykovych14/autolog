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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 py-3 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg border border-gray-100 overflow-hidden">
              <img src="/logo.png" alt="AutoLog" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-2xl font-black tracking-tight text-gray-900">AutoLog</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            <a href="#product" className="text-[11px] font-black text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">Продукт</a>
            <a href="#features" className="text-[11px] font-black text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">Можливості</a>
            <a href="#sto" className="text-[11px] font-black text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">Для СТО</a>
            <a href="#ai" className="text-[11px] font-black text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">AI Механік</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="hidden sm:block text-[11px] font-black text-gray-900 hover:text-indigo-600 py-2 px-5 transition-all uppercase tracking-widest">Увійти</button>
            <button onClick={onLogin} className="bg-gray-900 text-white px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 active:scale-95">Спробувати безкоштовно</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-40 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[60rem] h-[60rem] bg-indigo-50/50 rounded-full blur-[120px] -mr-[30rem] -mt-[20rem] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-50/50 rounded-full blur-[100px] -ml-[20rem] -mb-[10rem] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.25em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Sparkles size={12} fill="currentColor"/> Інтелектуальний гараж №1 в Україні
              </div>
              <h1 className="text-6xl lg:text-[5.5rem] font-[1000] text-gray-900 leading-[0.95] mb-10 tracking-[-0.04em] animate-in fade-in slide-in-from-bottom-8 duration-700">
                Керуй своїм авто <br/> 
                <span className="text-indigo-600">на швидкості AI.</span>
              </h1>
              <p className="text-xl text-gray-500 font-medium mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000">
                Перша екосистема, що поєднує водія, сервіс та штучний інтелект. Весь життєвий цикл вашого автомобіля в одному преміальному додатку.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <button onClick={onLogin} className="w-full sm:w-auto px-10 py-6 bg-indigo-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 group">
                  Почати зараз <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                </button>
                <div className="flex items-center gap-4 px-6 border-l border-gray-100 hidden sm:flex">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 overflow-hidden"><img src={`https://i.pravatar.cc/100?u=h${i}`} alt="user"/></div>)}
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">5,000+ водіїв <br/> вже з нами</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative animate-in fade-in zoom-in duration-1000 delay-300">
              <div className="relative group">
                <div className="absolute -inset-4 bg-indigo-500/10 rounded-[4rem] blur-2xl group-hover:bg-indigo-500/15 transition-all duration-700"></div>
                <div className="relative rounded-[3.5rem] p-5 bg-white border border-gray-100 shadow-2xl overflow-hidden aspect-[4/5] sm:aspect-square lg:aspect-[4/5] flex items-center justify-center">
                  <img 
                    src="/autolog_landing_hero.png" 
                    alt="AutoLog Experience" 
                    className="w-full h-full object-cover rounded-[2.8rem] shadow-xl"
                  />
                </div>
                {/* Floating UI Elements */}
                <div className="absolute -top-8 -right-8 bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-right-8 delay-700 duration-1000">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-inner">
                      <Shield size={24}/>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Статус авто</p>
                      <p className="text-sm font-black text-gray-900 tracking-tight">Сервіс завершено</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-10 -left-10 bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-left-8 delay-1000 duration-1000">
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 mb-1">
                         <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white"><Bot size={16}/></div>
                         <p className="text-[11px] font-black text-gray-900 uppercase">AI Mechanic</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl py-2.5 px-4 text-[11px] font-semibold text-gray-600 leading-relaxed border border-gray-100">
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
      <section id="product" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-6 underline decoration-indigo-200 decoration-4 underline-offset-8">Продукт</h2>
            <h3 className="text-4xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">Більше, ніж просто сервісна книжка</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-32">
            <div className="relative">
               <div className="absolute -inset-20 bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>
               <div className="relative bg-white rounded-[3rem] p-2 shadow-2xl border border-gray-50 overflow-hidden">
                  <div className="bg-gray-900 rounded-[2.8rem] aspect-video flex flex-col items-center justify-center p-12 text-center overflow-hidden relative">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl"></div>
                     <BarChart3 size={64} className="text-indigo-400 mb-6" />
                     <h4 className="text-2xl font-black text-white mb-4">Аналітика витрат</h4>
                     <p className="text-gray-400 font-medium">AutoLog автоматично рахує вартість володіння авто, прогнозує витрати на пальне та ремонт.</p>
                  </div>
               </div>
            </div>
            <div>
               <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-6">Економіка авто</h4>
               <h3 className="text-4xl font-black text-gray-900 mb-8 leading-tight">Контролюй кожен цент, витрачений на сервіс</h3>
               <p className="text-xl text-gray-500 font-medium mb-10 leading-relaxed">
                  Ми візуалізуємо ваші витрати у зручних графіках. Ви точно знаєте, на що йдуть кошти: пальне, запчастини чи планове ТО. Ніяких сюрпризів.
               </p>
               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { icon: MousePointer2, text: 'Прогноз витрат' },
                    { icon: FileText, text: 'Експорт звітів' },
                    { icon: Zap, text: 'Економія до 15%' },
                    { icon: CheckCircle2, text: 'Історія чеків' }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                       <item.icon size={18} className="text-indigo-500"/> {item.text}
                    </li>
                  ))}
               </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1">
               <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-6">Прозорість</h4>
               <h3 className="text-4xl font-black text-gray-900 mb-8 leading-tight">Ваш власний Carfax у один клік</h3>
               <p className="text-xl text-gray-500 font-medium mb-10 leading-relaxed">
                  При продажі авто ви просто ділитеся посиланням. Покупець бачить прозору історію, підтверджену партнерськими СТО. Це автоматично піднімає ціну вашого авто на 10-15%.
               </p>
               <button onClick={onLogin} className="flex items-center gap-3 text-sm font-black text-indigo-600 uppercase tracking-widest hover:gap-5 transition-all">
                  Дізнатися більше <ArrowRight size={16}/>
               </button>
            </div>
            <div className="order-1 lg:order-2 relative px-8 lg:px-0">
               <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-[0_40px_80px_-15px_rgba(92,62,254,0.3)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700"></div>
                  <FileText size={48} className="mb-8 opacity-50" />
                  <h4 className="text-3xl font-black mb-4">Публічний звіт</h4>
                  <div className="space-y-3 opacity-80 font-medium mb-10">
                     <p className="flex items-center gap-3 text-sm"><CheckCircle2 size={16}/> Оригінальний пробіг підтверджено</p>
                     <p className="flex items-center gap-3 text-sm"><CheckCircle2 size={16}/> Відсутність ДТП у базі</p>
                     <p className="flex items-center gap-3 text-sm"><CheckCircle2 size={16}/> Всі записи ТО з 2021 року</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between">
                     <span className="text-xs font-black uppercase tracking-widest">autolog.app/share/m5-power</span>
                     <Sparkles size={16}/>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-6">Функціонал</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">Розумні інструменти для водія</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Bell, title: 'Розумні нагадування', desc: 'AutoLog знає, коли закінчується страховка чи прийшов час міняти гальмівні колодки.' },
              { icon: Wrench, title: 'Онлайн запис', desc: 'Вибирайте вільне вікно на улюбленому СТО прямо в додатку за 30 секунд.' },
              { icon: Smartphone, title: 'Telegram Бот', desc: 'Уся статистика та керування сервісом через ваш месенджер.' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 hover:border-indigo-100 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group">
                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                  <f.icon size={28} />
                </div>
                <h4 className="text-2xl font-black text-gray-900 mb-4">{f.title}</h4>
                <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B / STO Section */}
      <section id="sto" className="py-32 bg-white relative">
         <div className="max-w-7xl mx-auto px-6">
            <div className="bg-gray-900 rounded-[4rem] p-12 lg:p-24 text-white relative overflow-hidden flex flex-col lg:flex-row items-center gap-20">
               <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[100px] -mr-[20rem] -mt-[20rem] pointer-events-none"></div>
               
               <div className="flex-1 relative z-10 text-center lg:text-left">
                  <h2 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-8">Для бізнесу</h2>
                  <h3 className="text-4xl lg:text-6xl font-black leading-none mb-10 tracking-tight">Будуй майбутнє свого СТО разом з нами</h3>
                  <div className="space-y-6 mb-12">
                     <p className="flex items-center gap-4 text-lg font-bold justify-center lg:justify-start"><CheckCircle2 className="text-indigo-400" /> CRM з розумним календарем</p>
                     <p className="flex items-center gap-4 text-lg font-bold justify-center lg:justify-start"><CheckCircle2 className="text-indigo-400" /> Автоматичні пуші клієнтам</p>
                     <p className="flex items-center gap-4 text-lg font-bold justify-center lg:justify-start"><CheckCircle2 className="text-indigo-400" /> База запчастин та аналітика</p>
                  </div>
                  <button onClick={onLogin} className="w-full sm:w-auto px-10 py-6 bg-white text-gray-900 rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">Стати партнером</button>
               </div>

               <div className="flex-1 w-full lg:w-auto">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 lg:p-12">
                     <div className="space-y-6">
                        {[1,2,3].map(i => (
                          <div key={i} className={`flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 ${i === 1 ? 'border-indigo-500/50 bg-indigo-500/10' : ''}`}>
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black">{i}</div>
                                <div>
                                   <p className="text-sm font-black">Запис #{1024 + i}</p>
                                   <p className="text-[10px] uppercase font-bold text-gray-500">BMW X5 · 14:30</p>
                                </div>
                             </div>
                             <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full">{i===1 ? 'В роботі' : 'Очікує'}</div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="py-32 relative overflow-hidden bg-[#FDFDFF]">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-24">
               <div className="flex-1 relative order-2 lg:order-1">
                  <div className="relative z-10 bg-white rounded-[3.5rem] border border-gray-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-10">
                     <div className="flex items-center gap-5 mb-10 pb-10 border-b border-gray-50">
                        <div className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100"><Bot size={30}/></div>
                        <div>
                           <p className="text-lg font-black text-gray-900 leading-none mb-1.5 tracking-tight">AI AutoMechanic</p>
                           <p className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Online · Доступний</p>
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div className="flex justify-start"><div className="bg-gray-50 px-6 py-4 rounded-[1.8rem] rounded-tl-sm text-sm font-medium text-gray-600 max-w-[85%] border border-gray-100">Чути дивний звук при гальмуванні? Скоріш за все, це знос колодок. Я вибрав найкращі варіанти для твого авто...</div></div>
                        <div className="flex justify-end"><div className="bg-indigo-600 px-6 py-4 rounded-[1.8rem] rounded-tr-sm text-sm font-bold text-white max-w-[80%] shadow-lg shadow-indigo-200">Дякую! Скільки коштуватиме заміна?</div></div>
                     </div>
                  </div>
               </div>

               <div className="flex-1 order-1 lg:order-2">
                  <h2 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-10">AI Інтелект</h2>
                  <h3 className="text-4xl lg:text-[5rem] font-[1000] text-gray-900 leading-[0.95] mb-12 tracking-tighter">Механік, <br/>який завжди <br/> поруч.</h3>
                  <p className="text-xl text-gray-500 font-medium mb-12 leading-relaxed">
                     AutoLog AI аналізує технічний стан вашого авто у реальному часі, дає поради щодо ремонту та допомагає вибрати найкращі запчастини. Це як лікар для вашого авто, тільки доступний 24/7.
                  </p>
                  <button onClick={onLogin} className="inline-flex items-center gap-4 text-sm font-black text-indigo-600 uppercase tracking-[0.2em] group">
                     Спробувати консультацію <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative group">
        <div className="absolute inset-0 bg-gray-950 overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-600/20 blur-[150px] rounded-full"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl lg:text-7xl font-black text-white leading-[0.95] mb-12 tracking-tight">Почни нову еру <br/> <span className="text-indigo-400">життя свого авто.</span></h2>
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            <button onClick={onLogin} className="w-full sm:w-auto px-12 py-7 bg-indigo-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] hover:bg-white hover:text-gray-900 transition-all shadow-3xl shadow-indigo-500/20 active:scale-95">Створити акаунт</button>
            <button onClick={onLogin} className="w-full sm:w-auto px-12 py-7 bg-white/5 border border-white/10 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95">Портал СТО</button>
          </div>
          <p className="mt-12 text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">Реєстрація займає 30 секунд. Картка не потрібна.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-gray-50">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center"><img src="/logo.png" alt="AutoLog" className="w-4 h-4 brightness-0 invert opacity-60"/></div>
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-900">AutoLog</span>
               </div>
               
               <div className="flex items-center gap-12">
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
