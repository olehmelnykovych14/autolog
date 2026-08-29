import { LayoutDashboard, Car, ClipboardList, Bot, Users, Settings, Wrench, Calendar, FileText, Fuel } from 'lucide-react'

export const C = '#5C3EFE'

// Типи документів авто для «Сейфу документів». Порядок = порядок у списку.
export const DOC_TYPES = {
  osago:      'ОСАГО / Автоцивілка',
  inspection: 'Техогляд',
  greencard:  'Зелена карта',
  gbo:        'Свідоцтво ГБО',
  vignette:   'Віньєтка / Дозвіл ЄС',
  other:      'Інше',
}

export const DOC_TYPE_ORDER = ['osago', 'inspection', 'greencard', 'gbo', 'vignette', 'other']

export const CAT = {
  maintenance: 'ТО', 
  repair: 'Ремонт', 
  diagnostic: 'Діагностика', 
  tires: 'Шиномонтаж', 
  washing: 'Мийка', 
  tuning: 'Тюнінг', 
  insurance: 'Страховка', 
  fuel: 'Паливо', 
  parts: 'Запчастини', 
  other: 'Інше' 
}

// Hex-кольори категорій для діаграм (recharts)
export const CAT_HEX = {
  maintenance: '#3B82F6',
  repair:      '#F97316',
  diagnostic:  '#8B5CF6',
  tires:       '#64748B',
  washing:     '#06B6D4',
  tuning:      '#EAB308',
  insurance:   '#22C55E',
  fuel:        '#EF4444',
  parts:       '#6366F1',
  other:       '#94A3B8',
}

export const CAT_CLR = {
  maintenance: 'bg-blue-100 text-blue-700', 
  repair: 'bg-orange-100 text-orange-700', 
  diagnostic: 'bg-purple-100 text-purple-700', 
  tires: 'bg-gray-100 text-gray-600', 
  washing: 'bg-cyan-100 text-cyan-700', 
  tuning: 'bg-yellow-100 text-yellow-700', 
  insurance: 'bg-green-100 text-green-700', 
  fuel: 'bg-red-100 text-red-700', 
  parts: 'bg-indigo-100 text-indigo-700', 
  other: 'bg-gray-100 text-gray-600' 
}

export const NAV_OWNER = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'garage', label: 'Мій гараж', icon: Car },
  // { id: 'bookings', label: 'Запис на СТО', icon: Calendar },
  { id: 'service', label: 'Сервіс', icon: ClipboardList },
  { id: 'fuel', label: 'Паливо', icon: Fuel },
  { id: 'ai', label: 'AI Механік', icon: Bot },
  { id: 'team', label: 'Команда', icon: Users },
  // SUBSCRIPTION: { id: 'plans', label: 'Тарифи', icon: CreditCard },
  { id: 'settings', label: 'Налаштування', icon: Settings },
  { id: 'admin', label: 'Адмін панель', icon: Users },
]

export const NAV_STO = [
  { id: 'sto', label: 'Кабінет партнера', icon: Wrench },
  { id: 'sto_bookings', label: 'Календар записів', icon: Calendar },
  { id: 'sto_clients', label: 'CRM Клієнти', icon: Users },
  { id: 'sto_acts', label: 'Акти', icon: FileText },
  // SUBSCRIPTION: { id: 'sto_plans', label: 'Тарифи', icon: CreditCard },
  { id: 'sto_settings', label: 'Налаштування СТО', icon: Settings },
  { id: 'settings', label: 'Мій акаунт', icon: Settings },
  { id: 'admin', label: 'Адмін панель', icon: Users },
]

export const AI_REPLIES = [
  'Проаналізував ваш запит. Рекомендую звернутися до офіційного СТО для детальної діагностики.',
  'На основі пробігу вашого автомобіля, настав час для планового ТО. Перевірте масло та фільтри.',
  'Це типова проблема. Зазвичай вирішується заміною вузла. Вартість: 2 000–5 000 грн.',
  'Можливі проблеми з гальмівною системою. Рекомендую термінову перевірку.',
  'Найчастіше допомагає промивка форсунок або заміна свічок запалювання.',
]

// Преміум продається трьома способами (однакові переваги): місяць / рік / довічно.
export const PREMIUM_PRICING = { month: 49, year: 399, lifetime: 499 }

// Ростова фаза: жорсткі ліміти (авто/команда) вимкнені, щоб не гальмувати ріст.
// Увімкнути монетизацію = виставити VITE_ENFORCE_LIMITS=true в env (Vercel).
// AI-ліміт лишається завжди (захист спільного ключа Gemini), тому тут не залежить.
export const ENFORCE_LIMITS = import.meta.env.VITE_ENFORCE_LIMITS === 'true'

export const PLANS = [
  {
    id: 'Free', name: 'Free', price: 0,
    features: ['1 авто', 'Журнал сервісу та пального', 'Сейф документів', 'AI-механік: 20 запитів/міс', 'Публічний звіт'],
    carLimit: 1, teamLimit: 1, aiLimit: 20,
  },
  {
    id: 'Premium', name: 'Premium', price: PREMIUM_PRICING.year,
    features: ['Безліміт авто', 'AI-механік: 100 запитів/міс', 'Скан чеків AI', 'Паспорт для продажу + PDF', 'Telegram-нагадування', 'Експорт історії', 'Команда до 3 осіб'],
    carLimit: Infinity, teamLimit: 3, aiLimit: 100,
  },
]
