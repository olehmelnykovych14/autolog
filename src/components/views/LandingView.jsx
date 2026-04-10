import React from 'react'
import { Car, Wrench, Shield, Bot, ChevronRight, CheckCircle2, Star, Zap, Calendar, Users, ArrowRight, Smartphone } from 'lucide-react'
import { C } from '../../constants'

export function LandingView({ onLogin, onRegister }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <img src="/logo.png" alt="AutoLog" className="w-6 h-6 object-contain brightness-0 invert" />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">AutoLog</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#drivers" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Для водіїв</a>
            <a href="#sto" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Для СТО</a>
            <a href="#ai" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">AI Механік</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="hidden sm:block text-sm font-black text-gray-900 hover:text-indigo-600 py-2 px-4 transition-all">Увійти</button>
            <button onClick={onLogin} className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95">Спробувати безкоштовно</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Zap size={14} fill="currentColor"/> Майбутнє автосервісу вже тут
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-8 tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
                Твій автомобіль. <br/> 
                <span className="text-indigo-600">Твої правила.</span> <br/>
                Твій AutoLog.
              </h1>
              <p className="text-lg text-gray-500 font-medium mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000">
                Перша в Україні екосистема, де твій автомобіль має свій цифровий інтелект. Від автоматичної історії ТО до AI-діагностики прямо у твоїй кишені.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <button onClick={onLogin} className="w-full sm:w-auto px-8 py-5 bg-indigo-600 text-white rounded-2xl text-base font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3">
                  Почати драйв <ChevronRight size={20}/>
                </button>
                <button onClick={onLogin} className="w-full sm:w-auto px-8 py-5 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl text-base font-black uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all flex items-center justify-center gap-3">
                  Для партнерів <ArrowRight size={20}/>
                </button>
              </div>
            </div>
            
            <div className="flex-1 relative animate-in fade-in zoom-in duration-1000 delay-300">
              <div className="relative rounded-[3rem] p-4 bg-gray-50 border border-gray-100 shadow-3xl overflow-hidden aspect-square flex items-center justify-center">
                <img 
                  src="/autolog_landing_hero.png" 
                  alt="AutoLog Dashboard" 
                  className="w-full h-full object-cover rounded-[2.5rem] shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-transparent"></div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-2xl border border-gray-50 animate-bounce duration-[3000ms]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-xl font-black">
                    <CheckCircle2 size={24}/>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Діагностика</p>
                    <p className="text-sm font-black text-gray-900">Усі системи в нормі</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features for Drivers */}
      <section id="drivers" className="py-24 bg-gray-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-indigo-500 uppercase tracking-[0.3em] mb-4">Для автовласників</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">Твій Garage, тільки цифровий</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Car, title: 'Цифрова Гараж', desc: 'Усі твої авто в одному місці. Повна історія, специфікація та нагадування про страховку.' },
              { icon: ClipboardList, title: 'Автоматична Історія', desc: 'Забудь про паперові чеки. СТО додає записи за одну секунду прямо у твій профіль.' },
              { icon: Smartphone, title: 'Telegram Пуші', desc: 'Миттєві сповіщення про готовність авто, записи на сервіс та важливі нагадування.' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 hover:border-indigo-100 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                  <f.icon size={32} />
                </div>
                <h4 className="text-2xl font-black text-gray-900 mb-4">{f.title}</h4>
                <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B Section - FOR STO */}
      <section id="sto" className="py-24 bg-indigo-600 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-white/5 rounded-full -mr-[25rem] -mt-[25rem]"></div>
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-black/5 rounded-full -ml-[20rem] -mb-[20rem]"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-white">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                 B2B ПАРТНЕРСТВО
              </div>
              <h2 className="text-4xl lg:text-6xl font-black leading-tight mb-8 tracking-tight">
                Твоє СТО заслуговує <br/> <span className="opacity-50 tracking-tighter italic">на кращий софт</span>
              </h2>
              <ul className="space-y-6 mb-10">
                {[
                  { icon: Calendar, text: 'Розумний календар з Drag & Drop для записів' },
                  { icon: Users, text: 'Автоматичне завантаження історії в профіль клієнта' },
                  { icon: Zap, text: 'Миттєве сповіщення водіїв про статус ремонту' }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4 text-lg font-bold">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <item.icon size={20}/>
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
              <button onClick={onLogin} className="bg-white text-indigo-600 px-10 py-5 rounded-2xl text-base font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-2xl flex items-center gap-3">
                Стати партнером <ChevronRight size={20}/>
              </button>
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-4">
               <div className="space-y-4 pt-12">
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                     <div className="text-3xl font-black mb-1">98%</div>
                     <div className="text-xs font-bold uppercase tracking-widest opacity-60">Лояльність клієнтів</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-xl">
                     <p className="text-indigo-600 font-black text-sm mb-4 uppercase tracking-widest">Новий запис</p>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">O</div>
                        <div>
                           <div className="text-gray-900 font-black text-sm lowercase leading-none">Олександр К.</div>
                           <div className="text-indigo-600 font-bold text-[10px] uppercase">Porsche Taycan</div>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                     <div className="text-3xl font-black mb-1">+40%</div>
                     <div className="text-xs font-bold uppercase tracking-widest opacity-60">Економія часу</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 aspect-square flex flex-col items-center justify-center text-center">
                     <CheckCircle2 size={48} className="mb-4 opacity-30" />
                     <div className="text-xs font-black uppercase tracking-widest opacity-60">Авто-звіти</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 order-2 lg:order-1 relative">
               <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full"></div>
               <div className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-3xl">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Bot size={24}/>
                     </div>
                     <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">AutoLog AI Mechanic</p>
                        <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Професійна консультація</p>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="flex justify-start">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-sm text-sm font-medium max-w-[80%]">
                           Я помітив, що у вашому **BMW M5** залишилося 500 км до заміни масла. Бажаєте записатися на сервіс?
                        </div>
                     </div>
                     <div className="flex justify-end">
                        <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm text-sm font-bold max-w-[80%] shadow-lg shadow-indigo-200">
                           Так, будь ласка! Знайди вільне вікно на завтра.
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex-1 order-1 lg:order-2">
              <h2 className="text-sm font-black text-indigo-500 uppercase tracking-[0.3em] mb-4">Штучний Інтелект</h2>
              <h3 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-8 tracking-tight">Персональний <br/> механік 24/7</h3>
              <p className="text-xl text-gray-500 font-medium mb-8 leading-relaxed">
                Запитуйте AI про будь-яку проблему, отримуйте персональні рекомендації на основі вашої історії обслуговування та плануйте ТО за лічені секунди.
              </p>
              <div className="flex items-center gap-6">
                 <div className="flex -space-x-3">
                    {[1,2,3].map(i => <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg"><img src={`https://i.pravatar.cc/100?u=${i}`} alt="user"/></div>)}
                    <div className="w-12 h-12 rounded-full border-4 border-white bg-indigo-600 flex items-center justify-center text-white text-xs font-black">+1k</div>
                 </div>
                 <p className="text-sm font-bold text-gray-400">Вже задають питання</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/10 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-8 tracking-tight">Готові до нового формату <br/> <span className="text-indigo-400">життя вашого авто?</span></h2>
          <p className="text-xl text-gray-400 font-medium mb-12">Приєднуйтесь до тисяч водіїв, які вже обрали цифрову свободу та надійність.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <button onClick={onLogin} className="w-full sm:w-auto px-10 py-6 bg-indigo-600 text-white rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-3xl shadow-indigo-500/20 active:scale-95">Спробувати безкоштовно</button>
            <button onClick={onLogin} className="w-full sm:w-auto px-10 py-6 bg-white/5 border border-white/10 text-white rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">Увійти в кабінет</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100 uppercase tracking-widest text-[10px] font-black text-gray-400">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center"><img src="/logo.png" alt="AutoLog" className="w-4 h-4 grayscale opacity-50"/></div>
               <span>AutoLog © 2026. Усі права захищені.</span>
            </div>
            <div className="flex items-center gap-8">
               <a href="#" className="hover:text-indigo-600 transition-colors">Політика конфіденційності</a>
               <a href="#" className="hover:text-indigo-600 transition-colors">Розробникам</a>
               <a href="#" className="hover:text-indigo-600 transition-colors">Про нас</a>
            </div>
         </div>
      </footer>
    </div>
  )
}
