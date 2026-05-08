import { LayoutDashboard, Car, ClipboardList, Bot, Users, Settings, Wrench, Calendar, FileText } from 'lucide-react'

export const C = '#5C3EFE'

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
  { id: 'bookings', label: 'Запис на СТО', icon: Calendar },
  { id: 'service', label: 'Сервіс', icon: ClipboardList },
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
  { id: 'settings', label: 'Налаштування', icon: Settings },
  { id: 'admin', label: 'Адмін панель', icon: Users },
]

export const AI_REPLIES = [
  'Проаналізував ваш запит. Рекомендую звернутися до офіційного СТО для детальної діагностики.',
  'На основі пробігу вашого автомобіля, настав час для планового ТО. Перевірте масло та фільтри.',
  'Це типова проблема. Зазвичай вирішується заміною вузла. Вартість: 2 000–5 000 грн.',
  'Можливі проблеми з гальмівною системою. Рекомендую термінову перевірку.',
  'Найчастіше допомагає промивка форсунок або заміна свічок запалювання.',
]

export const PLANS = [
  { id: 'Free', name: 'Free', price: 0, features: ['1 автомобіль', '10 записів/міс', 'AI: 5 запитів', 'Базовий звіт'], carLimit: 1, teamLimit: 1, aiLimit: 5 },
  { id: 'Premium', name: 'Premium', price: 299, features: ['5 автомобілів', 'Необмежені записи', 'AI: 100 запитів', 'Carfax звіт', 'Push-сповіщення'], carLimit: 5, teamLimit: 3, aiLimit: 100 },
  { id: 'Business', name: 'Business', price: 799, features: ['Безліміт авто', 'Команда до 10 осіб', 'AI: необмежено', 'Експорт в Excel', 'Брендування звітів'], carLimit: Infinity, teamLimit: 10, aiLimit: 9999 },
]
