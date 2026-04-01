import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { LayoutDashboard, Car, ClipboardList, Bot, CreditCard, Settings, Users, Bell, Moon, Sun, ChevronRight, ChevronLeft, ChevronDown, Plus, X, ShieldCheck, MapPin, Send, LogOut, Sparkles, Filter, Check, FileText, Layers, Calendar, Pencil, Trash2, Download, Lock, UserPlus, Shield, Eye, Mail, Activity, Search, Info, Clock, AlertCircle, Wrench } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BRANDS_MODELS } from './data/cars'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore"
import { auth, db } from './firebase'
import { askGemini } from './lib/ai'
import ReactMarkdown from 'react-markdown'

const C = '#5C3EFE'
const ThemeCtx = createContext(false)
const CAT = { maintenance: 'ТО', repair: 'Ремонт', diagnostic: 'Діагностика', tires: 'Шиномонтаж', washing: 'Мийка', tuning: 'Тюнінг', insurance: 'Страховка', fuel: 'Паливо', parts: 'Запчастини', other: 'Інше' }
const CAT_CLR = { maintenance: 'bg-blue-100 text-blue-700', repair: 'bg-orange-100 text-orange-700', diagnostic: 'bg-purple-100 text-purple-700', tires: 'bg-gray-100 text-gray-600', washing: 'bg-cyan-100 text-cyan-700', tuning: 'bg-yellow-100 text-yellow-700', insurance: 'bg-green-100 text-green-700', fuel: 'bg-red-100 text-red-700', parts: 'bg-indigo-100 text-indigo-700', other: 'bg-gray-100 text-gray-600' }
const NAV_OWNER = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'garage', label: 'Мій гараж', icon: Car },
  { id: 'service', label: 'Сервіс', icon: ClipboardList },
  { id: 'ai', label: 'AI Механік', icon: Bot },
  { id: 'team', label: 'Команда', icon: Users },
  { id: 'plans', label: 'Тарифи', icon: CreditCard },
  { id: 'settings', label: 'Налаштування', icon: Settings },
  { id: 'admin', label: 'Адмін панель', icon: Users },
]
const NAV_STO = [
  { id: 'sto', label: 'Кабінет партнера', icon: Wrench },
  { id: 'sto_plans', label: 'Тарифи', icon: CreditCard },
  { id: 'settings', label: 'Налаштування', icon: Settings },
  { id: 'admin', label: 'Адмін панель', icon: Users },
]
const MONTHS = ['Квіт', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру', 'Січ', 'Лют', 'Бер']
const CHART = [2400, 1200, 3800, 8900, 2100, 4500, 6200, 1800, 9100, 3300, 5700, 4800]
const AI_REPLIES = [
  'Проаналізував ваш запит. Рекомендую звернутися до офіційного СТО для детальної діагностики.',
  'На основі пробігу вашого автомобіля, настав час для планового ТО. Перевірте масло та фільтри.',
  'Це типова проблема. Зазвичай вирішується заміною вузла. Вартість: 2 000–5 000 грн.',
  'Можливі проблеми з гальмівною системою. Рекомендую термінову перевірку.',
  'Найчастіше допомагає промивка форсунок або заміна свічок запалювання.',
]

const fmt = n => new Intl.NumberFormat('uk-UA').format(n)
const fmtCost = n => n === 0 ? 'Безкоштовно' : `${fmt(n)} грн`

function getBrandLogo(brand) {
  const b = (brand || '').toLowerCase()
  if (b.includes('bmw')) return 'https://cdn.simpleicons.org/bmw/1C69D4'
  if (b.includes('toyota')) return 'https://cdn.simpleicons.org/toyota/EB0A1E'
  if (b.includes('tesla')) return 'https://cdn.simpleicons.org/tesla/CC0000'
  if (b.includes('mercedes')) return 'https://cdn.simpleicons.org/mercedes/333333'
  if (b.includes('audi')) return 'https://cdn.simpleicons.org/audi/888888'
  if (b.includes('volkswagen') || b.includes('vw')) return 'https://cdn.simpleicons.org/volkswagen/001F5E'
  if (b.includes('honda')) return 'https://cdn.simpleicons.org/honda/CC0001'
  if (b.includes('hyundai')) return 'https://cdn.simpleicons.org/hyundai/002C5F'
  if (b.includes('kia')) return 'https://cdn.simpleicons.org/kia/05141F'
  return null
}

// ─── Shared UI ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${wide ? 'max-w-lg' : 'max-w-md'}`}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 transition-all"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
function Field({ label, children }) {
  return <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>{children}</div>
}
function inp_cls() {
  return 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3EFE]/40 focus:border-[#5C3EFE] transition-all text-gray-900 dark:text-white placeholder-gray-400'
}
function PrimaryBtn({ children, onClick, type = 'button', className = '' }) {
  return <button type={type} onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all hover:opacity-90 shadow-lg ${className}`} style={{ background: C }}>{children}</button>
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, col, setCol, isAdmin, userProfile }) {
  const isSto = userProfile?.accountType === 'sto'
  const navSource = isSto ? NAV_STO : NAV_OWNER
  const links = navSource.filter(n => n.id !== 'admin' || isAdmin)
  const bgClass = isSto ? "bg-[#0F172A] border-[#1E293B]" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
  return (
    <aside className={`flex flex-col h-full shrink-0 transition-all duration-300 print:hidden border-r ${bgClass}`} style={{ width: col ? 72 : 260 }}>
      <div className={`flex flex-col items-center justify-center ${col ? 'py-10' : 'px-4 py-8'} border-b border-gray-200 dark:border-gray-700 min-h-[7rem] relative overflow-hidden`}>
        {!col ? (
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-base shadow-xl shadow-indigo-500/30" style={{ background: isSto ? '#3B82F6' : C }}>AL</div>
              <div className="transition-all duration-300">
                <p className={`font-bold leading-tight text-lg ${isSto ? 'text-white' : 'text-gray-900 dark:text-white'}`}>AutoLog</p>
                <p className={`text-[11px] uppercase tracking-widest leading-none mt-1 ${isSto ? 'text-[#94A3B8]' : 'text-gray-400'}`}>Premium Garage</p>
              </div>
            </div>
            <button onClick={() => setCol(true)} className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-all hover:text-indigo-600">
              <ChevronLeft size={24} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-base shadow-xl shadow-indigo-500/30" style={{ background: C }}>AL</div>
            <button onClick={() => setCol(false)} className="w-12 h-12 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-all flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800 z-50 transform hover:scale-110 active:scale-95 group">
              <ChevronRight size={24} className="group-hover:text-indigo-600 transition-colors" />
            </button>
          </div>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => setTab(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'text-white shadow-lg' : (isSto ? 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white')}`} style={active ? { background: isSto ? '#3B82F6' : C } : {}}>
              <Icon size={18} className="shrink-0" />{!col && label}
            </button>
          )
        })}
      </nav>
      <div className="px-3 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
          <LogOut size={18} className="shrink-0" />{!col && 'Вийти'}
        </button>
      </div>
    </aside>
  )
}

// ─── Topbar ──────────────────────────────────────────────────────────────────
function Topbar({ isDark, setDark, incomingTransfer, onAcceptTransfer, onRejectTransfer, onLogout, currentUser, userProfile, col, setCol, pendingApprovals = [], onAcceptService, onRejectService }) {
  const [showNotif, setShowNotif] = useState(false)
  const initial = currentUser?.displayName?.[0] || currentUser?.email?.[0]?.toUpperCase() || 'К'
  const hasAvatar = !!userProfile?.avatarBase64
  const hasNotif = !!incomingTransfer || pendingApprovals.length > 0
  const notifCount = (incomingTransfer ? 1 : 0) + pendingApprovals.length

  return (
    <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200/50 dark:border-gray-700/50 flex items-center px-4 sm:px-6 gap-4 shrink-0 print:hidden transition-all duration-300 relative z-50">
      <div className="flex-1"></div>
      <div className="ml-auto flex items-center gap-2 relative">
        <button onClick={() => setDark(d => !d)} className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="relative">
          <button onClick={() => setShowNotif(!showNotif)} className="relative w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all">
            <Bell size={18} />
            {hasNotif && <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">{notifCount}</span>}
          </button>
          {showNotif && hasNotif && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 z-50 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Сповіщення</h3>
              {incomingTransfer && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-800 dark:text-gray-200 mb-2">Користувач <strong>{incomingTransfer.from}</strong> передає вам автомобіль <strong>{incomingTransfer.brand}</strong>. Вся історія перейде до вас.</p>
                  <div className="flex gap-2">
                    <button onClick={() => { onAcceptTransfer(); setShowNotif(false) }} className="flex-1 py-1.5 text-white text-xs font-semibold rounded-lg bg-green-500 hover:bg-green-600 transition-colors">Прийняти</button>
                    <button onClick={() => { onRejectTransfer(); setShowNotif(false) }} className="flex-1 py-1.5 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">Відхилити</button>
                  </div>
                </div>
              )}
              {pendingApprovals.map(svc => (
                 <div key={svc.id} className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                  <p className="text-xs text-indigo-900 dark:text-indigo-200 mb-2">
                    СТО <strong className="text-indigo-700 dark:text-indigo-300">{svc.stoName}</strong> надіслало запис <strong>{svc.title}</strong> для вашого авто ({svc.date.split('-').reverse().join('.')}).
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => { onAcceptService(svc.id); if (notifCount === 1) setShowNotif(false) }} className="flex-1 py-1.5 text-white text-xs font-semibold rounded-lg bg-[#5C3EFE] hover:opacity-90 transition-opacity shadow-sm">Затвердити</button>
                    <button onClick={() => { onRejectService(svc.id); if (notifCount === 1) setShowNotif(false) }} className="flex-1 py-1.5 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg bg-white dark:bg-red-900/40 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/60 transition-colors">Відхилити</button>
                  </div>
                 </div>
              ))}
            </div>
          )}
        </div>
        {hasAvatar ? (
          <img src={userProfile.avatarBase64} alt="Avatar" className="w-9 h-9 rounded-xl ml-1 object-cover border border-gray-200 dark:border-gray-700" title={currentUser?.displayName || currentUser?.email} />
        ) : (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ml-1 uppercase" style={{ background: C }} title={currentUser?.displayName || currentUser?.email}>{initial}</div>
        )}
        <button onClick={onLogout} className="w-9 h-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 transition-all ml-1" title="Вийти з акаунта">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function DashboardView({ carList, historyList }) {
  const totalMileage = carList.reduce((s, c) => s + c.mileage, 0)
  const totalCost = historyList.reduce((s, h) => s + h.cost, 0)
  const cpk = totalMileage > 0 ? (totalCost / totalMileage).toFixed(2) : '0.00'
  const maxM = [...carList].sort((a, b) => b.mileage - a.mileage)[0]
  const nextTO = maxM ? Math.ceil(maxM.mileage / 10000) * 10000 - maxM.mileage : 0
  const kpis = [
    { label: 'ВИТРАТИ ЗА МІСЯЦЬ', value: '18 400 грн', sub: '+12%', sc: 'text-green-500', icon: '💰', bg: 'bg-yellow-100 dark:bg-yellow-900/40' },
    { label: 'ЗАГАЛЬНИЙ ПРОБІГ', value: `${fmt(totalMileage)} КМ`, sub: '+5%', sc: 'text-green-500', icon: '🛣️', bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { label: 'ВИТРАТИ НА КМ', value: `${cpk} грн`, sub: '-3%', sc: 'text-red-500', icon: '📊', bg: 'bg-purple-100 dark:bg-purple-900/40' },
    { label: 'НАСТУПНЕ ТО', value: `за ${fmt(nextTO)} км`, sub: 'Скоро', sc: 'text-orange-500', icon: '🔧', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  ]
  const maxC = Math.max(...CHART)
  const recent = [...historyList].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-5 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl ${k.bg} flex items-center justify-center text-2xl shrink-0`}>{k.icon}</div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 tracking-wider mb-1">{k.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{k.value}</p>
              <p className={`text-xs font-medium mt-0.5 ${k.sc}`}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Витрати за рік</h2>
            <span className="text-sm text-gray-400">2025</span>
          </div>
          <div className="flex items-end gap-1.5 h-36">
            {CHART.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t-lg transition-all" style={{ height: `${(v / maxC) * 100}%`, background: i === 11 ? C : (i === 0 ? '#CBD5E1' : '#E2E8F0') }} />
                <span className="text-[9px] text-gray-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-6 flex flex-col text-white" style={{ background: 'linear-gradient(135deg,#7C3AED,#5C3EFE)' }}>
          <div className="flex items-center gap-2 mb-3"><Sparkles size={18} /><span className="text-sm font-bold tracking-wide">AI МЕХАНІК</span></div>
          <p className="text-sm opacity-80 leading-relaxed mb-5 flex-1">Отримайте персоналізований план обслуговування на основі вашої історії та пробігу.</p>
          <div className="space-y-2 mb-6">
            {['Аналіз 45+ параметрів', 'Прогнозування поломок', 'Оцінка вартості ремонту'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm opacity-90">
                <div className="w-4 h-4 rounded-full border border-white/50 flex items-center justify-center"><Check size={10} /></div>{f}
              </div>
            ))}
          </div>
          <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all">
            Спробувати безкоштовно <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Остання активність</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wide">
              {['Авто', 'Послуга', 'Дата', 'Вартість', 'Статус'].map(h => <th key={h} className="text-left pb-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {recent.map(r => {
              const car = carList.find(c => c.id === r.carId)
              return (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{car?.brand}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mr-2 ${CAT_CLR[r.category] || 'bg-gray-100 text-gray-600'}`}>{CAT[r.category]}</span>
                    <span className="text-gray-700 dark:text-gray-300">{r.title}</span>
                  </td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">{r.date}</td>
                  <td className="py-3 font-semibold" style={{ color: r.cost > 0 ? C : '#10B981' }}>{fmtCost(r.cost)}</td>
                  <td className="py-3">
                    {r.status === 'verified'
                      ? <span className="flex items-center gap-1 text-blue-600 text-xs font-medium"><ShieldCheck size={14} />Verified</span>
                      : <span className="text-gray-400 text-xs">Очікується</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Garage ──────────────────────────────────────────────────────────────────
function GarageView({ carList, onAddCar, onSelectCar, userProfile, onGoPlans }) {
  const [showAdd, setShowAdd] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const plan = userProfile?.plan || 'Free'
  const limit = plan === 'Business' ? Infinity : (plan === 'Premium' ? 5 : 1)
  const isLimitReached = carList.length >= limit

  const handleAddClick = () => {
    if (isLimitReached) setShowPaywall(true)
    else setShowAdd(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Мій гараж</h1>
        <PrimaryBtn onClick={handleAddClick}><Plus size={18} />Додати авто</PrimaryBtn>
      </div>
      {carList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <Car size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">У вашому гаражі поки немає автомобілів</p>
          <button onClick={handleAddClick} className="mt-4 text-sm font-bold" style={{ color: C }}>Додати перший автомобіль</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carList.map(car => {
            const logo = getBrandLogo(car.brand)
            return (
              <div key={car.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-5 hover:shadow-md dark:hover:shadow-gray-900 transition-all">
                <div className="flex items-center gap-3 mb-5">
                  {logo ? <img src={logo} alt={car.brand} className="w-12 h-12 object-contain" />
                    : <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold">{car.brand[0]}</div>}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{car.brand}</p>
                    <p className="text-sm text-gray-400">{car.plate}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-gray-900 dark:text-white">{fmt(car.mileage)} КМ</p>
                  <button onClick={() => onSelectCar(car)} className="text-sm font-semibold hover:opacity-70 transition-all" style={{ color: C }}>Деталі</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showAdd && <AddCarModal onClose={() => setShowAdd(false)} onAdd={car => { onAddCar(car); setShowAdd(false) }} />}
      {showPaywall && (
        <Modal title="Обмеження плану" onClose={() => setShowPaywall(false)}>
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-[#5C3EFE]">
              <Lock size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ліміт автомобілів вичерпано</h3>
              <p className="text-sm text-gray-500 mt-2">На плані <strong>{plan}</strong> ви можете додати не більше {limit} авто. Оновіть підписку для розширення можливостей.</p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button onClick={() => setShowPaywall(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:opacity-80 transition-all">Пізніше</button>
              <button onClick={() => { setShowPaywall(false); onGoPlans() }} className="flex-1 py-3 text-white rounded-xl font-semibold text-sm transition-all shadow-lg" style={{ background: C }}>Оновити план</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AddCarModal({ onClose, onAdd }) {
  const [f, setF] = useState({ brand: '', model: '', year: new Date().getFullYear(), plate: '', mileage: '', vin: '' })
  const set = k => v => setF(p => ({ ...p, [k]: v }))

  const handleBrandChange = (b) => {
    const models = BRANDS_MODELS[b] || []
    setF(p => ({ ...p, brand: b, model: models[0] || '' }))
  }

  const submit = e => {
    e.preventDefault()
    if (!f.brand || !f.plate) return
    const fullName = f.brand === 'Інше' ? f.model : `${f.brand} ${f.model}`.trim()
    onAdd({ id: Date.now(), brand: fullName, year: parseInt(f.year), plate: f.plate.toUpperCase(), mileage: parseInt(f.mileage) || 0, status: 'ok', vin: f.vin.toUpperCase() })
  }
  const ic = inp_cls()
  return (
    <Modal title="Додати авто" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Марка *">
            <select value={f.brand} onChange={e => handleBrandChange(e.target.value)} className={ic} required>
              <option value="" disabled>Оберіть марку</option>
              {Object.keys(BRANDS_MODELS).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Модель *">
            {f.brand === 'Інше' ? (
              <input value={f.model} onChange={e => set('model')(e.target.value)} placeholder="Введіть модель" className={ic} required />
            ) : (
              <select value={f.model} onChange={e => set('model')(e.target.value)} className={ic} required disabled={!f.brand}>
                <option value="" disabled>Оберіть модель</option>
                {(BRANDS_MODELS[f.brand] || []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
          </Field>
        </div>
        <Field label="VIN код"><input value={f.vin} onChange={e => set('vin')(e.target.value.toUpperCase())} placeholder="17 символів" minLength={17} maxLength={17} className={ic} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Рік"><input type="number" value={f.year} onChange={e => set('year')(e.target.value)} className={ic} /></Field>
          <Field label="Пробіг (км)"><input type="number" value={f.mileage} onChange={e => set('mileage')(e.target.value)} placeholder="0" className={ic} /></Field>
        </div>
        <Field label="Номерний знак *"><input value={f.plate} onChange={e => set('plate')(e.target.value.toUpperCase())} placeholder="BM4554AA" className={ic} required /></Field>
        <button type="submit" className="w-full py-3 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all" style={{ background: C }}>Додати автомобіль</button>
      </form>
    </Modal>
  )
}

function CarDetailsModal({ car, onClose, onGoService, onGoReport, onGoTransfer }) {
  const logo = getBrandLogo(car.brand)
  return (
    <Modal title="Деталі автомобіля" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          {logo ? <img src={logo} alt={car.brand} className="w-14 h-14 object-contain" />
            : <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center font-bold text-2xl text-gray-500">{car.brand[0]}</div>}
          <div><p className="text-lg font-bold text-gray-900 dark:text-white">{car.brand}</p><p className="text-sm text-gray-500">{car.plate} · {car.year} р.</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[['Пробіг', `${fmt(car.mileage)} км`], ['Рік', car.year], ['Номер', car.plate], ['VIN', car.vin || '—'], ['Стан', car.status === 'ok' ? 'Відмінний' : 'Потребує уваги']].map(([l, v]) => (
            <div key={l} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">{l}</p>
              <p className="font-semibold text-gray-900 dark:text-white truncate" title={String(v)}>{v}</p>
            </div>
          ))}
        </div>
        <button onClick={onGoService} className="w-full py-3 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all" style={{ background: C }}>
          <ClipboardList size={16} />Історія обслуговування
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onGoReport} className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
            <FileText size={16} />Звіт (Carfax)
          </button>
          <button onClick={onGoTransfer} className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all">
            <Send size={16} />Передати авто
          </button>
        </div>
      </div>
    </Modal>
  )
}

function TransferCarModal({ car, onClose, onTransfer }) {
  const [email, setEmail] = useState('')
  const submit = e => {
    e.preventDefault()
    if (!email) return
    onTransfer(email)
  }
  const ic = inp_cls()
  return (
    <Modal title="Передача автомобіля" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm leading-relaxed border border-blue-100 dark:border-blue-800">
          Ви збираєтесь передати права на <strong>{car.brand}</strong>. Після підтвердження запиту новим власником, авто та <strong>вся історія обслуговування</strong> будуть видалені з вашого гаража.
        </div>
        <Field label="Email нового власника *">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" className={ic} required />
        </Field>
        <div className="flex gap-3 mt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:opacity-80 transition-all">Скасувати</button>
          <button type="submit" className="flex-1 py-3 text-white rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 hover:opacity-90" style={{ background: C }}><Send size={16} />Передати</button>
        </div>
      </form>
    </Modal>
  )
}

function CarReportModal({ car, historyList, onClose }) {
  const records = historyList.filter(h => h.carId === car.id).sort((a, b) => new Date(b.date) - new Date(a.date))
  const totalCost = records.reduce((s, h) => s + h.cost, 0)
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:block">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:max-h-none print:h-auto print:max-w-none print:rounded-none">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: C }}>AL</div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Звіт про авто</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-300">
              <Download size={16} />Завантажити PDF
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 transition-all"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto print:overflow-visible p-6 sm:p-8">
          <div className="flex justify-between items-end border-b-2 border-[#5C3EFE] pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{car.brand}</h1>
              <p className="text-sm text-gray-500 uppercase mt-1">VIN: <span className="font-bold text-gray-800 dark:text-gray-300">{car.vin || 'НЕ ВКАЗАНО'}</span></p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-bold uppercase tracking-wide mb-2">AUTOLOG VERIFIED</span>
              <p className="text-xs text-gray-400">Згенеровано: {new Date().toLocaleDateString('uk-UA')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 border-l-4 border-l-[#5C3EFE] print:border-l-4 print:border-gray-300">
              <p className="text-xs text-gray-400 mb-1">ОСТАННІЙ ПРОБІГ</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(car.mileage)} <span className="text-sm text-gray-400">КМ</span></p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 border-l-4 border-l-blue-500 print:border-l-4 print:border-gray-300">
              <p className="text-xs text-gray-400 mb-1">КІЛЬКІСТЬ ЗАПИСІВ ТО</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{records.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 border-l-4 border-l-green-500 print:border-l-4 print:border-gray-300">
              <p className="text-xs text-gray-400 mb-1">ЗАГАЛЬНІ ВИТРАТИ</p>
              <p className="text-2xl font-bold text-green-600">{fmt(totalCost)} <span className="text-sm">₴</span></p>
            </div>
          </div>

          {records.length > 0 && (
            <div className="mb-8 print:break-inside-avoid shadow-sm rounded-2xl">
              <MileageDynamicChart mileage={car.mileage} carName={car.brand} />
            </div>
          )}

          <div className="print:break-inside-avoid">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Детальна історія обслуговування</h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Дата</th>
                    <th className="px-4 py-3 font-semibold">Пробіг</th>
                    <th className="px-4 py-3 font-semibold">Сервіс</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Вартість (₴)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 text-gray-900 dark:text-white min-w-[100px]">{r.date.split('-').reverse().join('.')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 min-w-[100px] font-medium">{fmt(r.mileage || 0)} км</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-white">{r.title}</p>
                        {r.stoName ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold text-[#5C3EFE] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{r.stoName}</span>
                            {r.status === 'verified' && <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5"><ShieldCheck size={10}/>Верифіковано</span>}
                            {r.status === 'pending_approval' && <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5"><Clock size={10}/>Очікує</span>}
                            {r.status === 'rejected' && <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5"><AlertCircle size={10}/>Відхилено</span>}
                          </div>
                        ) : (
                          r.garage && <p className="text-xs text-gray-500">{r.garage}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold" style={{ color: r.cost === 0 ? '#10B981' : C }}>{fmt(r.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MileageDynamicChart({ mileage, carName }) {
  const years = [2019, 2020, 2021, 2022, 2023, 2024]
  const steps = [0.72, 0.78, 0.84, 0.89, 0.94, 1.0]
  const data = years.map((y, i) => ({
    year: y,
    val: Math.round(mileage * steps[i])
  }))

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700/60 shadow-sm animate-in slide-in-from-top-4 duration-500 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[#5C3EFE]">
            <Activity size={22} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Динаміка пробігу</h3>
        </div>
        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {carName}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-40 group/chart">
        {data.map((d, i) => {
          const heightPercent = (d.val / (mileage * 1.1)) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 relative group/bar">
              <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 print:opacity-100 transition-all duration-200 pointer-events-none translate-y-2 group-hover/bar:translate-y-0 print:-translate-y-0 z-10">
                <div className="bg-gray-900 text-white print:bg-gray-100 print:text-black text-[10px] font-bold px-2 py-1 rounded shadow-xl print:shadow-none whitespace-nowrap">
                  {fmt(d.val)} км
                </div>
                <div className="w-1.5 h-1.5 bg-gray-900 print:bg-gray-100 rotate-45 mx-auto -mt-1"></div>
              </div>
              <div
                className="w-full bg-indigo-500/10 dark:bg-indigo-500/5 rounded-t-lg hover:bg-[#5C3EFE] transition-all cursor-pointer relative overflow-hidden group-hover/bar:bg-indigo-500/20"
                style={{ height: `${heightPercent}%` }}
              >
                <div className="absolute inset-x-0 bottom-0 top-0 bg-[#5C3EFE] opacity-20 group-hover/bar:opacity-100 transition-all"></div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{d.year}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HistoryView({ historyList, carList, onAddService, onUpdateService, onDeleteService }) {
  const [catFilter, setCatFilter] = useState('all')
  const [activeCarFilter, setActiveCarFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  const filtered = historyList
    .filter(h => (catFilter === 'all' || h.category === catFilter) && (activeCarFilter === 'all' || h.carId === parseInt(activeCarFilter)))
    .sort((a, b) => {
      const dA = new Date(a.date).getTime()
      const dB = new Date(b.date).getTime()
      if (dA === dB) return (b.createdAt || 0) - (a.createdAt || 0)
      return dB - dA
    })

  const selectedCarDetails = activeCarFilter !== 'all' ? carList.find(c => c.id === parseInt(activeCarFilter)) : null

  const handleSave = (svc) => {
    if (editingRecord) onUpdateService(svc)
    else onAddService(svc)
    setShowModal(false)
    setEditingRecord(null)
  }

  return (
    <div className="flex flex-col max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-[28px] font-black text-gray-900 dark:text-white leading-none">Історія Сервісу</h1>
        <button
          onClick={() => { setEditingRecord(null); setShowModal(true) }}
          className="flex items-center justify-center gap-2 px-6 py-3 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:opacity-90 transition-all shrink-0"
          style={{ background: C }}
        >
          <Plus size={20} />
          Додати сервіс
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/60 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {['all', ...Object.keys(CAT).slice(0, 7)].map(f => (
            <button
              key={f}
              onClick={() => setCatFilter(f)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${catFilter === f ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-lg' : 'bg-[#F8FAFC] dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-600 hover:bg-gray-100'
                }`}
            >
              {f === 'all' ? 'Всі записи' : CAT[f]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900/50 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
          <Filter size={16} className="text-gray-400" />
          <select
            value={activeCarFilter}
            onChange={e => setActiveCarFilter(e.target.value)}
            className="bg-transparent outline-none text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer appearance-none pr-8 relative z-10"
          >
            <option value="all">Всі автомобілі</option>
            {carList.map(c => <option key={c.id} value={c.id}>{c.brand} ({c.plate})</option>)}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-0">
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {selectedCarDetails && (
        <MileageDynamicChart mileage={selectedCarDetails.mileage || 0} carName={selectedCarDetails.brand} />
      )}

      <div className="flex flex-col gap-5">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/60 p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-300 mb-6">
              <FileText size={40} className="opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Записів не знайдено</h3>
            <p className="text-gray-500 max-w-xs text-sm">За обраними фільтрами не знайдено жодного сервісного запису.</p>
          </div>
        ) : (
          filtered.map(r => {
            const car = carList.find(c => c.id === r.carId)
            const isVerified = r.status === 'verified'
            return (
              <div
                key={r.id}
                onClick={() => { setEditingRecord(r); setShowModal(true) }}
                className="bg-white dark:bg-gray-800 rounded-[2rem] border border-[#E2E8F0] dark:border-gray-700 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 hover:shadow-xl hover:border-[#CBD5E1] dark:hover:border-indigo-500/30 transition-all cursor-pointer group"
              >
                <div className="flex gap-6 items-start">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${isVerified ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-700 text-gray-400'}`}>
                    {isVerified ? <ShieldCheck size={28} /> : <FileText size={28} />}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest rounded leading-none">{CAT[r.category]}</span>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                        <Calendar size={12} />
                        {r.date.split('-').reverse().join('.')}
                      </div>
                      {isVerified && (
                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                          <Check size={10} />
                          ВЕРИФІКОВАНО
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white group-hover:text-[#5C3EFE] transition-all">{r.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                        <Car size={14} className="text-gray-300" />
                        {car?.brand || 'Авто'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                        <MapPin size={14} className="text-gray-300" />
                        {r.garage || 'Приватний майстер'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 text-right shrink-0">
                  <div className="text-3xl md:text-[40px] font-black text-gray-900 dark:text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[210px]">
                    {fmt(r.cost)} <span className="text-lg md:text-xl text-gray-400 ml-1 font-bold">₴</span>
                  </div>
                  {r.mileage && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700/60 shadow-sm mt-1 max-w-[180px]">
                      <Activity size={14} className="text-[#5C3EFE] shrink-0" />
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300 tracking-tight truncate">{fmt(r.mileage)} км</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {showModal && (
        <ServiceModal
          onClose={() => { setShowModal(false); setEditingRecord(null) }}
          onSave={handleSave}
          carList={carList}
          historyList={historyList}
          initialData={editingRecord}
          onDelete={onDeleteService}
        />
      )}
    </div>
  )
}

function ServiceModal({ onClose, onSave, carList, historyList, initialData }) {
  const isEdit = !!initialData

  const getMinMileage = (cid) => {
    const selCar = carList.find(c => c.id === parseInt(cid))
    let max = selCar?.mileage || 0
    const hist = historyList.filter(h => h.carId === parseInt(cid) && h.mileage && h.id !== initialData?.id)
    if (hist.length > 0) {
      max = Math.max(max, ...hist.map(h => h.mileage))
    }
    return max
  }

  const [f, setF] = useState(() => {
    const initCarId = initialData?.carId || carList[0]?.id || ''
    return {
      carId: initCarId,
      category: initialData?.category || 'maintenance',
      title: initialData?.title || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      cost: initialData?.cost != null ? String(initialData.cost) : '',
      garage: initialData?.garage || '',
      status: initialData?.status || 'verified',
      mileage: initialData?.mileage || (initCarId ? getMinMileage(initCarId) : ''),
    }
  })

  const set = k => v => {
    setF(p => {
      const next = { ...p, [k]: v }
      if (k === 'carId' && !isEdit) {
        next.mileage = getMinMileage(v)
      }
      return next
    })
  }

  const minM = f.carId ? getMinMileage(f.carId) : 0
  const submit = e => {
    e.preventDefault()
    if (!f.title || !f.carId) return
    onSave({
      id: initialData?.id || Date.now(),
      carId: parseInt(f.carId),
      category: f.category,
      title: f.title,
      date: f.date,
      cost: f.cost ? parseInt(f.cost) : 0,
      garage: f.garage,
      status: f.status,
      mileage: f.mileage ? parseInt(f.mileage) : null,
    })
  }
  const ic = inp_cls()
  const fieldCls = `${ic} flex items-center gap-2`
  return (
    <Modal title={isEdit ? 'Редагувати запис' : 'Додати сервіс'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Автомобіль *">
          <div className={fieldCls}><Car size={16} className="text-gray-400 shrink-0" />
            <select value={f.carId} onChange={e => set('carId')(e.target.value)} className="flex-1 bg-transparent focus:outline-none text-sm dark:text-white" required>
              {carList.map(c => <option key={c.id} value={c.id}>{c.brand} ({c.plate})</option>)}
            </select>
          </div>
        </Field>
        <Field label="Категорія *">
          <div className={fieldCls}><Layers size={16} className="text-gray-400 shrink-0" />
            <select value={f.category} onChange={e => set('category')(e.target.value)} className="flex-1 bg-transparent focus:outline-none text-sm dark:text-white">
              {Object.entries(CAT).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Що було зроблено? *">
          <div className={fieldCls}><FileText size={16} className="text-gray-400 shrink-0" />
            <input value={f.title} onChange={e => set('title')(e.target.value)} placeholder="Напр. Заміна масла" className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" required />
          </div>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Дата">
            <div className={`${fieldCls} relative`}>
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <input type="date" value={f.date} onChange={e => set('date')(e.target.value)} className="flex-1 w-full bg-transparent focus:outline-none text-sm dark:text-white appearance-none" style={{ minHeight: '20px' }} />
            </div>
          </Field>
          <Field label="Вартість (₴)">
            <div className={fieldCls}>
              <span className="text-gray-400 text-sm font-bold">₴</span>
              <input type="number" value={f.cost} onChange={e => set('cost')(e.target.value)} placeholder="0" className="flex-1 w-full bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" />
            </div>
          </Field>
          <Field label="Пробіг *">
            <div className={fieldCls}>
              <Activity size={16} className="text-[#5C3EFE] shrink-0" />
              <input type="number" min={minM} value={f.mileage} onChange={e => set('mileage')(e.target.value)} placeholder={`Від ${fmt(minM)} км`} required className="flex-1 w-full bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" />
            </div>
          </Field>
        </div>
        <Field label="СТО / Майстерня">
          <div className={fieldCls}><MapPin size={16} className="text-gray-400 shrink-0" />
            <input value={f.garage} onChange={e => set('garage')(e.target.value)} placeholder="Назва СТО" className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:text-white" />
          </div>
        </Field>
        <Field label="Статус">
          <div className="flex gap-3">
            {[['verified', '✅ Виконано'], ['pending', '🕐 Заплановано']].map(([val, lbl]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input type="radio" name="status" value={val} checked={f.status === val} onChange={e => set('status')(e.target.value)} className="accent-[#5C3EFE]" />
                {lbl}
              </label>
            ))}
          </div>
        </Field>
        <button type="submit" className="w-full py-3 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all" style={{ background: C }}>
          {isEdit ? 'Зберегти зміни' : 'Додати в історію'}
        </button>
      </form>
    </Modal>
  )
}

// ─── AI Mechanic ─────────────────────────────────────────────────────────────
function AIView({ carList, historyList }) {
  const [msgs, setMsgs] = useState([
    { id: 1, text: `Вітаю! Я ваш AI-асистент AutoLog. Бачу у вас ${carList.length > 0 ? carList.map(c => c.brand).join(', ') : 'автомобілі'}. Чим можу допомогти зараз?`, sender: 'ai' }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const ref = useRef(null)

  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])

  const send = async () => {
    if (!input.trim() || typing) return
    const userText = input.trim()
    setMsgs(p => [...p, { id: Date.now(), text: userText, sender: 'user' }])
    setInput('')
    setTyping(true)

    try {
      const response = await askGemini(userText, carList, historyList);
      setMsgs(p => [...p, { id: Date.now() + 1, text: response, sender: 'ai' }])
    } catch (e) {
      setMsgs(p => [...p, { id: Date.now() + 1, text: "Вибачте, сталася помилка з'єднання з AI.", sender: 'ai' }])
    } finally {
      setTyping(false)
    }
  }
  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-white dark:bg-gray-800 rounded-b-none sm:rounded-t-[2.5rem] border-x border-t border-gray-200 dark:border-gray-700 shadow-none">
      <div className="p-5 sm:p-7 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Bot size={22} />
          </div>
          AI Механік
        </h1>
        <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 px-3.5 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.1em]">System Active</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar pb-10">
        {msgs.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender === 'ai'
              ? <div className="max-w-[85%] sm:max-w-[75%]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <Sparkles size={12} style={{ color: C }} />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider opacity-70" style={{ color: C }}>AI АСИСТЕНТ</span>
                </div>
                <div className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm backdrop-blur-sm shadow-indigo-500/5">
                  <div className="markdown-content">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
              : <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white shadow-lg shadow-indigo-500/10" style={{ background: C }}>{m.text}</div>
            }
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
              {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 rounded-full animate-bounce bg-gray-400" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={ref} />
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 bg-white dark:bg-gray-800 rounded-b-none">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Опишіть проблему або запитайте про ТО..." className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-gray-900 dark:text-white focus:outline-none focus:border-[#5C3EFE] transition-all flex-1" />
        <button onClick={send} className="w-12 h-12 rounded-none flex items-center justify-center text-white hover:opacity-90 transition-all shrink-0" style={{ background: C }}><Send size={20} /></button>
      </div>
    </div>
  )
}

// ─── Plans ───────────────────────────────────────────────────────────────────
function PlansView({ carList, userProfile, onUpdatePlan }) {
  const [loading, setLoading] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const currentPlan = userProfile?.plan || 'Free'

  const plans = [
    { id: 'Free', name: 'Free', price: 0, features: ['1 автомобіль', '10 записів/міс', 'AI: 5 запитів', 'Базовий звіт'], limit: 1, ai: 5 },
    { id: 'Premium', name: 'Premium', price: 299, features: ['5 автомобілів', 'Необмежені записи', 'AI: 100 запитів', 'Carfax звіт', 'Push-сповіщення'], limit: 5, ai: 100 },
    { id: 'Business', name: 'Business', price: 799, features: ['Безліміт авто', 'Команда до 10 осіб', 'AI: необмежено', 'API доступ', 'Пріоритетна підтримка'], limit: Infinity, ai: 9999 },
  ]

  const handleSelect = async (planId) => {
    if (planId === currentPlan) return
    setLoading(planId)
    // Симуляція оплати
    setTimeout(async () => {
      try {
        await onUpdatePlan(planId)
        setLoading(null)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } catch (e) {
        setLoading(null)
        alert('Помилка оплати')
      }
    }, 1500)
  }

  const activePlanData = plans.find(p => p.id === currentPlan) || plans[0]

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
              <span className="font-medium text-gray-900 dark:text-white">{carList.length} / {activePlanData.limit === Infinity ? '∞' : activePlanData.limit}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((carList.length / (activePlanData.limit || 1)) * 100, 100)}%`, background: C }} />
            </div>
          </div>
          <div className="mb-0">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500 dark:text-gray-400">AI запити (місяць)</span>
              <span className="font-medium text-gray-900 dark:text-white">0 / {activePlanData.ai}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `0%`, background: C }} />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(p => {
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

// ─── Settings ────────────────────────────────────────────────────────────────
function SettingsView({ currentUser, userProfile, setUserProfile }) {
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
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 200
        let w = img.width, h = img.height
        if (w > h && w > MAX) { h *= MAX / w; w = MAX }
        else if (h > MAX) { w *= MAX / h; h = MAX }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        setAvatar(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!currentUser) return
    setSaving(true)
    try {
      await updateProfile(currentUser, { displayName: name.trim() })
      const data = { phone, city, avatarBase64: avatar }
      await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true })
      setUserProfile(data)
      alert("Дані успішно збережено у Firestore!")
    } catch (err) {
      alert("Помилка: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const initial = currentUser?.displayName?.[0] || currentUser?.email?.[0]?.toUpperCase() || 'К'

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Налаштування</h1>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Профіль користувача</h2>
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold uppercase shadow-sm" style={{ background: C }}>{initial}</div>
          )}
          <div className="flex flex-col gap-1 items-start">
            <input type="file" accept="image/*" ref={fileRef} onChange={handlePhotoUpload} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="text-sm font-medium hover:opacity-70 transition-all" style={{ color: C }}>Завантажити фото</button>
            {avatar && <button onClick={() => setAvatar('')} className="text-sm font-medium text-red-500 hover:text-red-600 transition-all">Видалити фото</button>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ім'я та Прізвище">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Іван Іванов" className={ic} />
          </Field>
          <Field label="Email">
            <input value={currentUser?.email || ''} readOnly className={ic + ' opacity-60 cursor-not-allowed'} title="Зміна Email недоступна з міркувань безпеки" />
          </Field>
          <Field label="Телефон">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+380..." className={ic} />
          </Field>
          <Field label="Місто">
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Київ" className={ic} />
          </Field>
        </div>
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-all disabled:opacity-50" style={{ background: C }}>
            {saving ? 'Зберігаємо...' : 'Зберегти зміни'}
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Сповіщення</h2>
        {['Нагадування про ТО', 'Email-дайджест', 'Push-сповіщення', 'Новини та оновлення'].map((label, i) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={i < 2} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-[#5C3EFE] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Team ────────────────────────────────────────────────────────────────────
function TeamView({ teamMembers, onRemove, onInvite, limit }) {
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Управління командою</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Керуйте членами команди та їх доступом</p>
        </div>
        <button
          onClick={onInvite}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all shrink-0"
          style={{ background: C }}
        >
          <UserPlus size={18} />
          Запросити учасника
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/60 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Інформація про команду</h2>
          <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-100 dark:border-indigo-800">
            <span className="text-xs font-bold text-[#5C3EFE]">{teamMembers.length} / {limit} учасників</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {teamMembers.map(m => (
            <div key={m.id} className="group flex items-center justify-between p-4 bg-[#F8FAFC] dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm" style={{ background: C }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                    {m.status === 'pending' && (
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-bold rounded-md border border-amber-100 dark:border-amber-800/40 tracking-wider">Очікує</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{m.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-sm border ${m.role === 'owner' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800' :
                    m.role === 'admin' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                  }`}>
                  {m.role === 'viewer' ? <Eye size={12} /> : <Shield size={12} />}
                  {m.role === 'owner' ? 'Власник' : m.role === 'admin' ? 'Адмін' : 'Спостерігач'}
                </div>

                {m.role !== 'owner' && (
                  <button
                    onClick={() => onRemove(m.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                    title="Видалити учасника"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Shield size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Адміністратор</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Повний доступ до всіх функцій та керування командою.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
              <Eye size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Спостерігач</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Лише перегляд автомобілів без права внесення змін.</p>
        </div>
      </div>
    </div>
  )
}

function InviteMemberModal({ onClose, onInvite, currentCount, limit }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInvite = async (e) => {
    e.preventDefault()
    setError('')
    if (currentCount >= limit) {
      setError('Досягнуто ліміт команди')
      return
    }

    setLoading(true)
    setTimeout(() => {
      onInvite({
        id: Date.now(),
        name: email.split('@')[0],
        email: email,
        role: role,
        status: 'pending'
      })
      setLoading(false)
      onClose()
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Запросити в команду</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleInvite} className="p-6 sm:p-8 flex flex-col gap-5">
          {error && <div className="p-3 text-xs font-bold text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-1 text-gray-700 dark:text-gray-300">Email користувача</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@autolog.ua"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl outline-none focus:border-[#5C3EFE] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-1 text-gray-700 dark:text-gray-300">Роль</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl outline-none focus:border-[#5C3EFE] transition-all appearance-none cursor-pointer"
              >
                <option value="admin">Адміністратор</option>
                <option value="viewer">Спостерігач</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[54px] bg-[#5C3EFE] text-white rounded-2xl font-bold dark:shadow-indigo-500/20 hover:opacity-90 transition-all flex items-center justify-center mt-2"
          >
            {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Надіслати запрошення'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Admin ───────────────────────────────────────────────────────────────────
function AdminView() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  }, [])

  const handleUpdatePlan = async (id, newPlan) => {
    try {
      await updateDoc(doc(db, 'users', id), { plan: newPlan })
      setUsers(p => p.map(u => u.id === id ? { ...u, plan: newPlan } : u))
    } catch (e) { console.error(e) }
  }

  const handleUpdateRole = async (id, newRole) => {
    try {
      await updateDoc(doc(db, 'users', id), { role: newRole })
      setUsers(p => p.map(u => u.id === id ? { ...u, role: newRole } : u))
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="p-6 text-gray-500">Завантаження користувачів...</div>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Адмін панель</h1>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Користувачі</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wide bg-gray-50 dark:bg-gray-700/50">
              {['Користувач', 'Email', 'Телефон', 'Роль', 'Підписка'].map(h => <th key={h} className="text-left px-6 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {u.avatarBase64 ? (
                      <img src={u.avatarBase64} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 uppercase" style={{ background: C }}>{u.name?.[0] || u.email?.[0] || 'U'}</div>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">{u.name || 'Користувач'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{u.email}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{u.phone || '—'}</td>
                <td className="px-6 py-4">
                  <select
                    value={u.role || 'User'}
                    onChange={e => handleUpdateRole(u.id, e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 outline-none text-gray-900 dark:text-white text-xs rounded-lg focus:ring-[#5C3EFE] focus:border-[#5C3EFE] block w-full p-2 cursor-pointer transition-colors"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={u.plan || 'Free'}
                    onChange={e => handleUpdatePlan(u.id, e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 outline-none text-gray-900 dark:text-white text-xs rounded-lg focus:ring-[#5C3EFE] focus:border-[#5C3EFE] block w-full p-2 cursor-pointer transition-colors"
                  >
                    <option value="Free">Free</option>
                    <option value="Premium">Premium</option>
                    <option value="Business">Business</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function STODashboardView({ userProfile, setTab }) {
  const CURRENT_STO_NAME = userProfile?.stoName || "AWT Bavaria (Київ)"
  const [clientCars] = useState([
    { id: 101, brand: 'Audi Q5', plate: 'BC4554EP', vin: '22222222222222222', ownerName: 'Олександр' }
  ])
  const [stoHistory, setStoHistory] = useState([
    { id: 1, car: 'Audi Q5 (BC4554EP)', category: 'diagnostic', title: 'Тест', cost: 250, date: '2026-04-01', status: 'pending_approval' },
    { id: 2, car: 'Audi Q5 (BC4554EP)', category: 'maintenance', title: 'Масло', cost: 3411, date: '2026-04-01', status: 'pending_approval' }
  ])
  
  const [searchVin, setSearchVin] = useState('')
  const [foundCar, setFoundCar] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    if (auth.currentUser) {
      const q = query(collection(db, 'history'), where('stoId', '==', auth.currentUser.uid))
      getDocs(q).then(snap => {
        const h = snap.docs.map(d => ({id: d.id, ...d.data()}))
        h.sort((a,b) => new Date(b.date) - new Date(a.date))
        if (h.length > 0) setStoHistory(h)
      }).catch(console.error)
    }
  }, [])

  const handleSearch = async () => {
    const vin = searchVin.trim().toUpperCase()
    if (vin.length < 10) return

    try {
      setNotFound(false)
      setFoundCar(null)
      const q = query(collection(db, 'cars'), where('vin', '==', vin))
      const snap = await getDocs(q)
      
      if (!snap.empty) {
        const docSnap = snap.docs[0]
        const carData = { id: docSnap.id, ...docSnap.data() }
        
        let ownerName = 'Клієнт AutoLog'
        if (carData.userId) {
          const userSnap = await getDoc(doc(db, 'users', carData.userId))
          if (userSnap.exists()) {
            const uData = userSnap.data()
            if (uData.displayName) ownerName = uData.displayName
            else if (uData.email) ownerName = uData.email.split('@')[0]
          }
        }
        
        setFoundCar({ ...carData, ownerName })
        return
      }
      
      // Fallback
      const car = clientCars.find(c => c.vin === vin)
      if (car) {
        setFoundCar(car)
      } else {
        setNotFound(true)
      }
      
    } catch (err) {
      console.error(err)
      alert("Помилка при пошуку автомобіля")
    }
  }

  const handleSaveService = async (data) => {
    const newDoc = {
      ...data,
      userId: foundCar.userId || 'system',
      ownerName: foundCar.ownerName || 'Клієнт AutoLog',
      stoId: auth.currentUser?.uid || 'unknown_sto',
      stoName: CURRENT_STO_NAME,
      date: new Date().toISOString().split('T')[0],
      status: 'pending_approval'
    }

    try {
      const fakeId = Date.now().toString()
      setStoHistory(p => [{...newDoc, id: fakeId}, ...p])
      
      if (auth.currentUser) {
         await addDoc(collection(db, 'history'), newDoc)
      }

      setShowModal(false)
      setSearchVin('')
      setFoundCar(null)
      setToastMsg("Запит на сервіс успішно відправлено власнику на підтвердження")
      setTimeout(() => setToastMsg(''), 3000)
    } catch (e) {
      console.error(e)
      alert('Помилка при відправці запису: ' + e.message)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 w-full relative">
      {toastMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-10 duration-300">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0"><Check size={14}/></div>
          <p className="font-bold text-sm tracking-wide">{toastMsg}</p>
        </div>
      )}

      {(userProfile?.stoSubscription || 'inactive') === 'inactive' && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-1">Ваш партнерський акаунт неактивний</h2>
              <p className="text-amber-100 text-sm opacity-95 max-w-xl">
                Оформіть підписку або придбайте довічний доступ, щоб надсилати верифіковані записи клієнтам.
              </p>
            </div>
          </div>
          <button onClick={() => setTab('sto_plans')} className="shrink-0 px-6 py-3.5 bg-white text-amber-600 hover:bg-amber-50 font-black rounded-xl shadow transition-all duration-300">
            Перейти до тарифів
          </button>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-black text-[#0F172A] dark:text-white">Кабінет партнера: {CURRENT_STO_NAME}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Пошук авто та відправка записів про сервіс на підтвердження власникам</p>
      </div>

      <div className="bg-[#1E293B] rounded-2xl p-8 shadow-sm">
        <div className="flex items-end gap-4 max-w-2xl">
          <div className="flex-1">
            <label className="block text-sm font-bold text-white mb-2 ml-1">VIN-код автомобіля</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input 
                value={searchVin} 
                onChange={e => setSearchVin(e.target.value.toUpperCase())} 
                placeholder="Введіть 17 символів VIN..." 
                maxLength={17}
                className="w-full pl-12 pr-4 py-3.5 bg-[#334155] border-none rounded-xl outline-none focus:ring-2 focus:ring-[#5C3EFE] transition-all font-mono uppercase text-white placeholder-gray-400"
              />
            </div>
          </div>
          <button onClick={handleSearch} disabled={searchVin.length < 10} className="h-[52px] px-8 bg-[#5C3EFE] text-white rounded-xl font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2">
            Знайти авто
          </button>
        </div>

        {foundCar && (
          <div className="mt-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-2xl font-black text-gray-400">
                  {foundCar.brand[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    {foundCar.brand} <span className="text-sm font-bold px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md tracking-wider">{foundCar.plate}</span>
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-500 font-mono tracking-wide">{foundCar.vin}</p>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-opacity-80">Власник: {foundCar.ownerName}</p>
                  </div>
                </div>
              </div>
              <button disabled={(userProfile?.stoSubscription || 'inactive') === 'inactive'} onClick={() => setShowModal(true)} className="w-full md:w-auto px-6 py-4 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50 dark:disabled:hover:bg-blue-900/40">
                <ShieldCheck size={20}/>
                Створити запис про сервіс
              </button>
            </div>
          </div>
        )}

        {notFound && !foundCar && (
          <div className="mt-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#7F1D1D]/20 rounded-[2rem] border border-[#EF4444] p-6 flex flex-col sm:flex-row items-center gap-4 text-red-500">
              <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center shrink-0">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-lg mb-1">Автомобіль не знайдено</h3>
                <p className="text-sm opacity-90">Перевірте правильність вводу VIN-коду або переконайтеся, що клієнт додав це авто в систему.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Останні відправлені записи</h2>
        <div className="bg-[#1E293B] rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700/50">
                <th className="text-left px-6 py-4 font-semibold">Автомобіль / Власник</th>
                <th className="text-left px-6 py-4 font-semibold">Послуга</th>
                <th className="text-left px-6 py-4 font-semibold">Сума</th>
                <th className="text-left px-6 py-4 font-semibold">Дата</th>
                <th className="text-left px-6 py-4 font-semibold">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {stoHistory.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    {r.car ? (
                      <p className="font-bold text-white">{r.car}</p>
                    ) : (
                      <p className="font-bold text-white">{r.brand} <span className="text-xs font-normal text-gray-400 border border-gray-600 rounded px-1 ml-1">{r.plate}</span></p>
                    )}
                    {r.ownerName && <p className="text-xs text-gray-400 mt-1">Власник: {r.ownerName}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mr-2 uppercase tracking-tight bg-blue-100 text-blue-700">
                      {CAT[r.category] || 'ТО'}
                    </span>
                    <span className="font-medium text-gray-300">{r.title}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-white">{r.cost} ₴</td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{r.date}</td>
                  <td className="px-6 py-4">
                    {r.status === 'pending_approval' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FEF08A]/20 text-[#FACC15]">
                        <Clock size={12}/> Очікує підтвердження
                      </span>
                    )}
                    {r.status === 'verified' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <ShieldCheck size={12}/> Верифіковано
                      </span>
                    )}
                    {r.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        <AlertCircle size={12}/> Відхилено
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {showModal && foundCar && (
        <AddVerifiedServiceModal 
          car={foundCar} 
          onClose={() => setShowModal(false)}
          onSave={handleSaveService}
        />
      )}
    </div>
  )
}

function AddVerifiedServiceModal({ car, onClose, onSave }) {
  const [f, setF] = useState({ category:'maintenance', title:'', mileage:'', cost:'' })
  const set = k => v => setF(p => ({...p,[k]:v}))
  
  const submit = e => {
    e.preventDefault()
    onSave({
      carId: car.id,
      brand: car.brand,
      plate: car.plate,
      category: f.category,
      title: f.title,
      mileage: parseInt(f.mileage),
      cost: parseInt(f.cost) || 0
    })
  }

  const ic = "w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3EFE] bg-white dark:bg-gray-800 dark:text-white"

  return (
    <Modal title="Відправити запис на підтвердження" onClose={onClose}>
      <div className="flex bg-[#EFF6FF] dark:bg-blue-900/30 rounded-xl p-3 mb-5 border border-blue-100 dark:border-blue-800/50 items-start gap-3">
        <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"/>
        <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed font-medium">Власник отримає сповіщення. Після його підтвердження запис отримає статус "Верифіковано" у його історії.</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Автомобіль клієнта</label>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-white">{car.brand}</span>
            <span className="font-mono text-xs text-gray-400">{car.vin}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Категорія робіт</label>
          <select value={f.category} onChange={e=>set('category')(e.target.value)} className={ic}>
            {Object.entries(CAT).map(([id,label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Опис робіт *</label>
          <input value={f.title} onChange={e=>set('title')(e.target.value)} placeholder="Напр. Заміна передніх гальмівних колодок" className={ic} required/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Пробіг (км) *</label>
            <input type="number" min="0" value={f.mileage} onChange={e=>set('mileage')(e.target.value)} placeholder="Обов'язково" className={ic} required/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Вартість (₴)</label>
            <input type="number" min="0" value={f.cost} onChange={e=>set('cost')(e.target.value)} placeholder="0" className={ic}/>
          </div>
        </div>

        <button type="submit" className="w-full mt-2 py-3.5 bg-[#5C3EFE] text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2">
          <Send size={18}/> Надіслати власнику
        </button>
      </form>
    </Modal>
  )
}

function STOPricingView({ currentUser, userProfile, setUserProfile, setTab }) {
  const isDark = useContext(ThemeCtx)
  const [loading, setLoading] = useState(null)

  const handlePurchase = async (planType) => {
    setLoading(planType)
    await new Promise(r => setTimeout(r, 1500))
    
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { stoSubscription: 'active' })
      } catch (e) {
        console.error("Failed to update subscription", e)
      }
    }
    
    setUserProfile(p => ({ ...p, stoSubscription: 'active' }))
    setLoading(null)
    setTab('sto')
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 w-full pt-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Розблокуйте можливості Partner Garage</h1>
        <p className="text-gray-500 dark:text-[#94A3B8] text-lg max-w-2xl mx-auto leading-relaxed">
          Надавайте своїм клієнтам офіційні записи про сервіс. Усі ваші роботи залишаться в історії авто назавжди, формуючи довіру до вашого СТО.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4 sm:px-0">
        {/* Pro Card */}
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-700 rounded-3xl p-8 flex flex-col hover:border-indigo-500/50 transition-colors shadow-sm dark:shadow-none">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Підписка Pro</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Гнучке рішення для бізнесу</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900 dark:text-white">$14.99</span>
              <span className="text-gray-400 dark:text-gray-500 font-medium">/ місяць</span>
            </div>
          </div>
          
          <ul className="flex-1 space-y-4 mb-8 text-gray-600 dark:text-gray-300 font-medium">
            {['Безлімітне додавання верифікованих записів', 'Доступ до клієнтської бази сервісу', 'Базова аналітика вашого СТО', 'Пріоритетна підтримка'].map((feat, i) => (
              <li key={i} className="flex items-center gap-3">
                <Check size={18} className="text-[#5C3EFE] dark:text-indigo-400 shrink-0" /> {feat}
              </li>
            ))}
          </ul>
          
          <button 
            disabled={loading !== null}
            onClick={() => handlePurchase('pro')} 
            className="w-full py-4 text-[#5C3EFE] dark:text-white rounded-xl font-bold border border-gray-200 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all disabled:opacity-50 flex items-center justify-center text-base"
          >
            {loading === 'pro' ? <span className="animate-spin mr-2"><LayoutDashboard size={18}/></span> : 'Оформити підписку'}
          </button>
        </div>

        <div className="bg-gradient-to-b from-[#1c144e] to-[#0A0F24] border border-[#5C3EFE] rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-900/50">
          <div className="absolute -top-4 right-8 bg-[#5C3EFE] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-indigo-500/50">
            Оптимальний вибір
          </div>
          
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Назавжди (Lifetime)</h3>
            <p className="text-indigo-200 opacity-80">Платіть 1 раз, користуйтеся вічно</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">$149</span>
              <span className="text-indigo-200/50 font-medium">одноразово</span>
            </div>
          </div>
          
          <ul className="flex-1 space-y-4 mb-8 text-indigo-100/90">
            {['Усі можливості підписки Pro', 'Довічний доступ до платформи', 'Економія $60 щороку', 'Доступ до майбутніх AI-оновлень'].map((feat, i) => (
              <li key={i} className="flex items-center gap-3">
                <Check size={18} className="text-[#5C3EFE] shrink-0 bg-white rounded-full p-0.5" /> {feat}
              </li>
            ))}
          </ul>
          
          <button 
            disabled={loading !== null}
            onClick={() => handlePurchase('lifetime')} 
            className="w-full py-4 bg-[#5C3EFE] text-white rounded-xl font-black shadow-xl shadow-indigo-500/30 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center transform hover:-translate-y-1"
          >
            {loading === 'lifetime' ? <span className="animate-spin mr-2"><LayoutDashboard size={18}/></span> : 'Придбати назавжди'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AutoLogDashboard() {
  const [currentUser, setCurrentUser] = useState(undefined)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    if (!auth) {
      setCurrentUser(null)
      return
    }
    const unsub = onAuthStateChanged(auth, async user => {
      setCurrentUser(user)
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          if (snap.exists()) {
            const up = snap.data()
            setUserProfile(up)
            if (up.accountType === 'sto' && tab === 'dashboard') {
              setTab('sto')
            }
          } else {
            setUserProfile({ phone: '', city: '', avatarBase64: '' })
          }

          const carSnap = await getDocs(query(collection(db, 'cars'), where('userId', '==', user.uid)))
          setCarList(carSnap.docs.map(d => ({ id: d.id, ...d.data() })))

          const histSnap = await getDocs(query(collection(db, 'history'), where('userId', '==', user.uid)))
          const hList = histSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          hList.sort((a, b) => {
            const dA = new Date(a.date).getTime()
            const dB = new Date(b.date).getTime()
            if (dA === dB) return (b.createdAt || 0) - (a.createdAt || 0)
            return dB - dA
          })
          setHistoryList(hList)

        } catch (e) {
          console.error("Firestore error:", e)
        }
      } else {
        setUserProfile(null)
        setCarList([])
        setHistoryList([])
      }
    });
    return () => unsub();
  }, []);

  const [tab, setTab] = useState('dashboard')
  const [col, setCol] = useState(false)
  const [isDark, setDark] = useState(false)
  const [carList, setCarList] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [selectedCar, setSelectedCar] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [incomingTransfer, setIncomingTransfer] = useState(null)

  const TEAM_LIMIT = 5
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Олександр (Ви)', email: 'owner@autolog.ua', role: 'owner', status: 'active' }
  ])
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const isAdmin = currentUser?.email === 'olehmelnykovych@gmail.com' || userProfile?.role === 'Admin'

  const addCar = async car => {
    if (!currentUser) return
    try {
      const docRef = await addDoc(collection(db, 'cars'), { ...car, userId: currentUser.uid })
      setCarList(p => [{ ...car, id: docRef.id, userId: currentUser.uid }, ...p])
    } catch (e) { console.error(e) }
  }

  const addService = async svc => {
    if (!currentUser) return
    try {
      const ts = Date.now()
      const docRef = await addDoc(collection(db, 'history'), { ...svc, userId: currentUser.uid, createdAt: ts })
      setHistoryList(p => {
        const h = [{ ...svc, id: docRef.id, userId: currentUser.uid, createdAt: ts }, ...p]
        h.sort((a, b) => {
          const dA = new Date(a.date).getTime()
          const dB = new Date(b.date).getTime()
          if (dA === dB) return (b.createdAt || 0) - (a.createdAt || 0)
          return dB - dA
        })
        return h
      })
    } catch (e) { console.error(e) }
  }

  const updateService = async svc => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'history', svc.id), svc)
      setHistoryList(p => p.map(h => h.id === svc.id ? svc : h))
    } catch (e) { console.error(e) }
  }

  const deleteService = async id => {
    if (!currentUser) return
    try {
      await deleteDoc(doc(db, 'history', id))
      setHistoryList(p => p.filter(h => h.id !== id))
    } catch (e) { console.error(e) }
  }

  const goService = () => { setSelectedCar(null); setTab('service') }

  const handleAcceptService = async (svcId) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'history', svcId), { status: 'verified' })
      setHistoryList(p => p.map(h => h.id === svcId ? { ...h, status: 'verified' } : h))
    } catch (e) { console.error(e) }
  }

  const handleRejectService = async (svcId) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'history', svcId), { status: 'rejected' })
      setHistoryList(p => p.map(h => h.id === svcId ? { ...h, status: 'rejected' } : h))
    } catch (e) { console.error(e) }
  }

  const handleTransfer = async (email) => {
    if (!selectedCar || !currentUser) return
    try {
      const q = query(collection(db, 'users'), where('email', '==', email))
      const snap = await getDocs(q)
      if (snap.empty) {
        alert("Користувача з такою поштою не знайдено!")
        return
      }
      const recipientUid = snap.docs[0].id

      const batch = writeBatch(db)
      batch.update(doc(db, 'cars', selectedCar.id), { userId: recipientUid })

      const historyToTransfer = historyList.filter(h => h.carId === selectedCar.id)
      historyToTransfer.forEach(h => {
        batch.update(doc(db, 'history', h.id), { userId: recipientUid })
      })

      await batch.commit()

      setCarList(p => p.filter(c => c.id !== selectedCar.id))
      setHistoryList(p => p.filter(h => h.carId !== selectedCar.id))
      setShowTransfer(false)
      setSelectedCar(null)
      setTab('dashboard')
      alert(`Авто успішно передано користувачу ${email}!`)
    } catch (e) {
      console.error(e)
      alert("Помилка передачі авто.")
    }
  }

  const handleAcceptTransfer = () => setIncomingTransfer(null)

  const handleUpdatePlan = async (planId) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { plan: planId })
      setUserProfile(p => ({ ...p, plan: planId }))
    } catch (e) { console.error(e); throw e }
  }

  const handleLogout = () => {
    if (auth) {
      signOut(auth)
    }
  }

  if (currentUser === undefined) {
    return <div className={`flex items-center justify-center h-screen w-full bg-gray-50 dark:bg-gray-900 ${isDark ? 'dark' : ''}`}><div className="animate-spin text-[#5C3EFE]"><LayoutDashboard size={40} /></div></div>
  }

  if (currentUser === null) {
    return <AuthScreen isDark={isDark} setDark={setDark} />
  }

  return (
    <ThemeCtx.Provider value={isDark}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
          opacity: 0;
        }
      `}</style>
      <div className={`flex h-screen w-full font-sans overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white ${isDark ? 'dark' : ''}`}>
        <Sidebar tab={tab} setTab={setTab} col={col} setCol={setCol} isAdmin={isAdmin} userProfile={userProfile} />
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <Topbar 
            isDark={isDark} setDark={setDark} 
            incomingTransfer={incomingTransfer} 
            onAcceptTransfer={handleAcceptTransfer} 
            onRejectTransfer={() => setIncomingTransfer(null)} 
            onLogout={handleLogout} 
            currentUser={currentUser} 
            userProfile={userProfile} 
            col={col} setCol={setCol} 
            pendingApprovals={historyList.filter(h => h.status === 'pending_approval' && h.userId === currentUser.uid)}
            onAcceptService={handleAcceptService}
            onRejectService={handleRejectService}
          />
          <main className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${tab === 'ai' ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/50'}`}>
            {tab === 'dashboard' && <div className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="max-w-7xl mx-auto space-y-6 pb-12"><DashboardView carList={carList} historyList={historyList} /></div></div>}
            {tab === 'garage' && <div className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="max-w-7xl mx-auto pb-12"><GarageView carList={carList} onAddCar={addCar} onSelectCar={setSelectedCar} userProfile={userProfile} onGoPlans={() => setTab('plans')} /></div></div>}
            {tab === 'service' && <div className="flex-1 overflow-y-auto p-4 sm:p-6"><HistoryView historyList={historyList} carList={carList} onAddService={addService} onUpdateService={updateService} onDeleteService={deleteService} /></div>}
            {tab === 'ai' && <div className="flex-1 flex flex-col min-h-0 overflow-hidden sm:px-10"><div className="h-4 sm:h-10 shrink-0"></div><AIView carList={carList} historyList={historyList} /></div>}
            {tab === 'team' && <div className="flex-1 overflow-y-auto p-4 sm:p-6"><TeamView teamMembers={teamMembers} limit={TEAM_LIMIT} onRemove={id => setTeamMembers(p => p.filter(m => m.id !== id))} onInvite={() => setShowInviteModal(true)} /></div>}
            {tab === 'plans' && <div className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="max-w-7xl mx-auto pb-12"><PlansView carList={carList} userProfile={userProfile} onUpdatePlan={handleUpdatePlan} /></div></div>}
            {tab === 'settings' && <div className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="max-w-3xl mx-auto pb-12"><SettingsView currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} /></div></div>}
            {tab === 'admin' && isAdmin && <div className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="max-w-7xl mx-auto pb-12"><AdminView /></div></div>}
            {tab === 'sto' && <div className="flex-1 overflow-y-auto p-4 sm:p-6"><STODashboardView userProfile={userProfile} setTab={setTab} /></div>}
            {tab === 'sto_plans' && <div className="flex-1 overflow-y-auto p-4 sm:p-6"><STOPricingView currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} setTab={setTab} /></div>}
          </main>
        </div>
        {showInviteModal && (
          <InviteMemberModal
            limit={TEAM_LIMIT}
            currentCount={teamMembers.length}
            onClose={() => setShowInviteModal(false)}
            onInvite={mbr => setTeamMembers(p => [...p, mbr])}
          />
        )}
        {selectedCar && !showReport && !showTransfer && (
          <CarDetailsModal
            car={selectedCar}
            onClose={() => setSelectedCar(null)}
            onGoService={goService}
            onGoReport={() => setShowReport(true)}
            onGoTransfer={() => setShowTransfer(true)}
          />
        )}
        {showReport && (
          <CarReportModal
            car={selectedCar}
            historyList={historyList}
            onClose={() => setShowReport(false)}
          />
        )}
        {showTransfer && (
          <TransferCarModal
            car={selectedCar}
            onClose={() => setShowTransfer(false)}
            onTransfer={handleTransfer}
          />
        )}
      </div>
    </ThemeCtx.Provider>
  )
}

function AuthScreen({ isDark, setDark }) {
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

  const submit = async (e) => {
    e.preventDefault()
    if (!auth || !auth.app.options.apiKey || auth.app.options.apiKey.includes('YOUR_')) {
      setErr("Firebase ще не налаштовано! Відкрийте src/firebase.js та вставте свої ключі Config.")
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

  const inp_cls = "w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#5C3EFE] transition-all"

  return (
    <div className={`flex min-h-screen w-full font-sans bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white ${isDark ? 'dark' : ''}`}>
      <div className="flex-1 flex flex-col justify-center p-6 relative">
        <button onClick={() => setDark(d => !d)} className="absolute top-6 right-6 w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ background: C }}>AL</div>
            <h1 className="text-3xl font-bold tracking-tight">AutoLog</h1>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/60">
            <h2 className="text-2xl font-bold mb-2">{isLogin ? 'З поверненням' : 'Створити акаунт'}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{isLogin ? 'Введіть свої дані для входу в систему' : 'Приєднайтеся до найзручнішого гаража'}</p>

            {err && <div className="p-4 mb-4 text-sm font-semibold text-red-700 bg-red-100 rounded-xl dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">{err}</div>}

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
                <label className="block text-sm font-semibold mb-2 ml-1 text-gray-700 dark:text-gray-300">Адеса Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@autolog.app" className={inp_cls + ' rounded-xl'} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-gray-700 dark:text-gray-300">Ваш пароль *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} className={inp_cls + ' rounded-xl'} required />
              </div>

              <button disabled={loading} type="submit" className="w-full py-4 mt-2 text-white rounded-xl font-bold shadow-md shadow-indigo-500/30 flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50" style={{ background: C }}>
                {loading ? 'Зачекайте...' : (isLogin ? 'Увійти в гараж' : 'Створити акаунт')}
              </button>
            </form>

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

      {/* Aesthetic right graphic side */}
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
