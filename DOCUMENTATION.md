# AutoLog — Документація проекту

## Огляд

**AutoLog** — це повноцінна SaaS-платформа для керування автомобілями, відстеження сервісної історії та взаємодії із СТО-партнерами. Проект складається з трьох частин:

| Частина | Технологія | Призначення |
|---|---|---|
| **Web App** | React + Vite + Firebase | Клієнтський та партнерський інтерфейс |
| **Bot Server** | Node.js + Telegraf | Telegram-бот для водіїв |
| **Firebase** | Firestore + Auth | База даних та автентифікація |

**Два типи акаунтів:**
- **Власник авто (owner)** — керує гаражем, переглядає сервісну історію, спілкується з AI-механіком
- **СТО / Партнер (sto)** — отримує записи на сервіс, верифікує ремонти, веде клієнтську базу

---

## Архітектура

```
d:\AI\
├── src/                        # React Web App
│   ├── App.jsx                 # Кореневий компонент, роутинг, стан
│   ├── firebase.js             # Ініціалізація Firebase
│   ├── main.jsx                # Точка входу React
│   ├── components/
│   │   ├── auth/               # AuthScreen
│   │   ├── common/             # Common, PWAInstallBanner
│   │   ├── layout/             # Sidebar, Topbar
│   │   ├── modals/             # CarDetailsModal, CarReportModal, Modals, ServiceModal
│   │   └── views/              # Всі сторінки (17 компонентів)
│   ├── lib/
│   │   └── ai.js               # Клієнтська інтеграція з Gemini API
│   ├── utils/
│   │   └── index.js            # fmt, fmtCost, getBrandLogo
│   ├── context/
│   │   └── ThemeContext.js     # Контекст теми (dark/light)
│   └── constants/              # Константи бренду (C, PLANS тощо)
├── bot-server/
│   ├── bot.js                  # Telegram-бот (Telegraf)
│   └── utils.js                # fmtCost, parseDateSafe, normPlate
└── public/                     # Статичні файли (logo.png, PWA icons)
```

---

## Firebase — Структура Firestore

| Колекція | Призначення |
|---|---|
| `users` | Профілі користувачів (owner / sto) |
| `cars` | Автомобілі власників |
| `history` | Сервісні записи |
| `bookings` | Записи на СТО |
| `team_invitations` | Запрошення до спільного гаражу |
| `users/{uid}/ai_chats` | Збережені AI-чати |
| `users/{uid}/reminders` | Нагадування (страховка, ТО тощо) |

---

## `src/firebase.js`

Ініціалізація Firebase із env-змінних. Вмикає офлайн-персистентність через IndexedDB.

**Експортує:** `app`, `auth`, `analytics`, `db`

---

## `src/App.jsx` — Головний компонент

### Стан додатку

| Стан | Тип | Призначення |
|---|---|---|
| `currentUser` | User \| null \| undefined | Поточний Firebase-користувач |
| `userProfile` | object \| null | Профіль з Firestore |
| `carList` | array | Список авто (real-time) |
| `historyList` | array | Сервісні записи (real-time) |
| `isDark` | boolean | Тема (зберігається в localStorage) |
| `bookingNotifications` | array | Непрочитані сповіщення про записи |
| `incomingInvites` | array | Вхідні запрошення в команду |

### Функції

#### `addCar(car)`
Додає новий автомобіль до Firestore (`cars`). Прив'язує до `currentUser.uid`.

#### `updateCar(carId, updates)`
Оновлює поля автомобіля в Firestore по `carId`.

#### `addService(svc)`
Додає сервісний запис до `history`. Якщо пробіг більший за поточний — автоматично оновлює пробіг авто.

#### `updateService(svc)`
Оновлює існуючий сервісний запис. Аналогічно оновлює пробіг авто за потреби.

#### `deleteService(id)`
Видаляє сервісний запис. Повертає `true`/`false`.

#### `handleTransfer(email)`
Передає авто іншому користувачу за email. Використовує batch-запит: змінює `userId` для авто та всіх його записів в `history`.

#### `handleAcceptInvite(invId)`
Приймає командне запрошення — встановлює статус `active` у `team_invitations`.

#### `handleRejectInvite(invId)`
Відхиляє запрошення — видаляє документ із `team_invitations`.

#### `handleAcceptService(svcId)`
Позначає сервісний запис як `verified` (підтверджений).

#### `handleRejectService(svcId)`
Позначає сервісний запис як `rejected`.

#### `markNotificationAsRead(id)`
Позначає конкретне сповіщення `bookings/{id}` як прочитане (`readByRecipient: true`).

#### `markAllNotificationsAsRead()`
Batch-запит: позначає всі непрочитані сповіщення як прочитані.

#### `onUpdateAIUsage()`
No-op під час безкоштовного запуску. Призначений для відстеження лімітів AI.

### Компонент `AppShell`
Обгортка з `Sidebar` + `Topbar` + `Suspense`. Topbar приховується на маршруті `/ai`.

### Компонент `PublicReportViewWrapper`
Зчитує `:carId` з URL і рендерить `PublicReportView` без оболонки застосунку.

### Роутинг

| Маршрут | Компонент | Доступ |
|---|---|---|
| `/` | Редирект на dashboard / landing | Усі |
| `/auth` | `AuthScreen` | Незалогінені |
| `/dashboard` | `DashboardView` | owner |
| `/garage` | `GarageView` | owner |
| `/service` | `HistoryView` | owner |
| `/ai` | `AIView` | owner |
| `/bookings` | `ClientBookingsView` | owner |
| `/team` | `TeamView` | owner |
| `/settings` | `SettingsView` | Усі |
| `/admin` | `AdminView` | Admin-email |
| `/sto` | `STODashboardView` | sto |
| `/sto/bookings` | `STOBookingsView` | sto |
| `/sto/clients` | `STOClientsView` | sto |
| `/sto/acts` | `STOActsView` | sto |
| `/sto/settings` | `STOSettingsView` | sto |
| `/share/:carId` | `PublicReportView` | Публічний |

---

## `src/lib/ai.js` — Клієнтська AI-бібліотека

### `askGemini(userInput, carList, historyList, mediaData?)`

Надсилає запит до Google Gemini API з контекстом гаражу користувача.

**Параметри:**
- `userInput` — текст запитання
- `carList` — масив авто користувача (для контексту)
- `historyList` — масив сервісних записів (для контексту)
- `mediaData` — `{ data: string (base64), mimeType: string }` — опціональне медіа

**Логіка fallback:**
1. Спробує модель `gemini-1.5-flash`
2. При помилці — `gemini-flash-latest` через SDK
3. При помилці — прямий HTTP-запит до Generative Language API

**Повертає:** рядок з відповіддю AI (Markdown).

---

## `src/utils/index.js` — Утиліти фронтенду

### `fmt(n)`
Форматує число у локалі `uk-UA` (напр. `15000` → `"15 000"`).

### `fmtCost(n)`
Якщо `n === 0` → `"Безкоштовно"`, інакше → `"15 000 грн"`.

### `getBrandLogo(brand)`
Повертає URL логотипу марки авто з CDN `simpleicons.org`. Підтримує 50+ марок (BMW, Toyota, Mercedes тощо). Використовує `BRAND_MAPPING` для нормалізації назв.

---

## `src/components/auth/AuthScreen.jsx`

Екран входу/реєстрації з підтримкою двох типів акаунтів.

### `AuthScreen({ isDark, setDark, onBack })`

**Стан:** `isLogin`, `isReset`, `accountType` (`owner`/`sto`), поля форми, `loading`, `err`.

#### `submit(e)`
Обробляє вхід або реєстрацію:
- **Вхід:** `signInWithEmailAndPassword`
- **Реєстрація:** `createUserWithEmailAndPassword` → `updateProfile` → запис профілю у Firestore (`users/{uid}`). Для СТО зберігає додаткові поля: `stoName`, `stoAddress`, `stoEdrpou`.

#### `handleReset(e)`
Надсилає email для скидання пароля через `sendPasswordResetEmail`.

---

## `src/components/views/GarageView.jsx`

### `GarageView({ carList, onAddCar, onUpdateCar, onSelectCar, userProfile, onGoPlans })`

Відображає сітку карток авто. При кліку → відкриває `CarDetailsModal`.

#### `handlePhotoUpload(carId, e)`
Стискає завантажене фото через `compressImage` і зберігає base64 в Firestore.

#### `compressImage(file)` (внутрішня)
Зменшує зображення до max 800px з якістю JPEG 0.7. Повертає Promise з base64-рядком.

### `AddCarModal({ onClose, onAdd, isLimited, onGoPlans })`

Форма додавання авто з полями: марка, модель, рік, держ. номер, пробіг, VIN, фото.

#### `submit(e)`
Викликає `onAdd` з даними форми. Пробіг парсить через `parseInt`.

#### `handlePhotoUpload(e)`
Стискає фото і зберігає preview в стані форми.

---

## `src/components/views/AIView.jsx`

### `AIView({ carList, historyList, userProfile, onUpdateAIUsage, onGoPlans, onGoBookings, onMenu, onBack })`

Повноекранний AI-чат з боковою панеллю збережених чатів.

#### `startNewChat()`
Очищує повідомлення, скидає `activeChatId`.

#### `openChat(chat)`
Завантажує раніше збережений чат із Firestore.

#### `startRenaming(e, chat)` / `saveRename(e, chatId)`
Перейменування чату (inline-редагування у сайдбарі). Зберігає в Firestore.

#### `deleteChat(e, chatId)`
Видаляє чат із Firestore та зі стану.

#### `saveMessages(newMsgs)`
Зберігає або оновлює чат у підколекції `users/{uid}/ai_chats`. Автоматично генерує назву з першого повідомлення.

#### `handlePhoto(e)`
Читає файл-зображення та конвертує в base64 для передачі до `askGemini`.

#### `startRecording()` / `stopRecording()`
Запис голосу через `MediaRecorder`. Зберігає blob як `audio/mp3`, конвертує в base64.

#### `send(textOverride?)`
Відправляє повідомлення (текст + медіа) до `askGemini`. Оновлює стан чату та зберігає в Firestore.

#### `formatTime(s)` / `formatDate(ts)`
Допоміжні функції форматування часу для відображення в UI.

---

## `src/components/views/SettingsView.jsx`

### `SettingsView({ currentUser, userProfile, setUserProfile })`

#### `save()`
Зберігає профіль у Firestore (`setDoc` з `merge: true`). Оновлює `displayName` через Firebase Auth.

#### `generateTgToken()`
Генерує 6-символьний токен для підключення Telegram-бота. Зберігає токен і час закінчення (10 хв) у Firestore.

#### `handlePhotoUpload(e)`
Читає аватар через `FileReader` і зберігає base64 в стані.

### `RemindersSection({ currentUser, hasTelegram })`

#### `addReminder()`
Зберігає нагадування в підколекцію `users/{uid}/reminders`.

#### `deleteReminder(id)`
Видаляє нагадування з Firestore.

#### `toggleReminder(id, enabled)`
Вмикає/вимикає нагадування.

#### `daysLeft(dateStr)`
Розраховує залишок днів до події. Повертає `{ label, color }`.

---

## `src/components/views/STODashboardView.jsx`

### `STODashboardView({ userProfile })`

Кабінет партнера-СТО.

#### `fetchStats()`
Завантажує статистику з Firestore: кількість очікуючих записів, обслужених авто, суму доходу.

#### `fetchRecentLogs()`
Завантажує 5 останніх сервісних записів, прив'язаних до СТО.

#### `handleSearch(e)`
Шукає авто за держ. номером або VIN у Firestore. При збігу — відображає картку авто.

#### `statusIcon(status)` / `statusLabel(status)`
Повертають іконку та бейдж статусу (`verified` / `pending` / `rejected`).

---

## `src/components/layout/Topbar.jsx` та `Sidebar.jsx`

**Topbar** — верхня панель з перемикачем теми, сповіщеннями (записи на СТО, запрошення в команду), аватаром.

**Sidebar** — бокова навігація. Адаптується до типу акаунту (`owner` / `sto`). Підтримує collapsed-режим.

---

## `src/components/modals/`

| Файл | Призначення |
|---|---|
| `CarDetailsModal.jsx` | Деталі авто з кнопками: сервісна історія, звіт, передача |
| `CarReportModal.jsx` | Генерація PDF-звіту у стилі Carfax |
| `ServiceModal.jsx` | Форма додавання/редагування сервісного запису |
| `Modals.jsx` | `TransferCarModal`, `InviteMemberModal`, `AddVerifiedServiceModal` |

---

## `src/components/common/`

### `Common.jsx`
Містить: `Modal`, `Field`, `PrimaryBtn`, `inp_cls()`.

### `PWAInstallBanner.jsx`
Банер встановлення PWA. Слухає `beforeinstallprompt`, відображає кнопку "Встановити".

---

## `bot-server/bot.js` — Telegram-бот

**Стек:** Telegraf, Firebase Admin, Gemini AI, ffmpeg, Express.

### Middleware

#### Global Logger
Логує всі вхідні повідомлення та callback-запити в консоль.

#### User Resolver
Шукає користувача в Firestore за `telegramId`. Зберігає у `ctx.userData` та `ctx.userId`.

---

### Команди та обробники

#### `bot.start(ctx)`
- Якщо є токен у `/start TOKEN` — прив'язує Telegram до веб-акаунту.
- Якщо користувач зареєстрований — вітає.
- Новий користувач — запитує контакт.

#### `bot.on('contact', ctx)`
Реєструє нового користувача або синхронізує існуючий акаунт за номером телефону.

#### `bot.hears(/Мої авто/, ctx)`
Повертає список авто з гаражу користувача.

#### `bot.hears(/Мої записи/, ctx)`
Повертає 5 останніх сервісних записів, відсортованих за датою.

#### `bot.hears(/Витрати/, ctx)`
Відображає inline-кнопки для вибору авто або перегляду загальної статистики.

#### `bot.action(/exp_car_(.+)/, ctx)`
Показує статистику витрат для конкретного авто: поточний місяць, рік, загалом.

#### `bot.action('exp_all', ctx)`
Показує загальну статистику витрат по всіх авто.

#### `bot.on('photo', ctx)`
Аналізує фото через Gemini AI:
- **Чек СТО** → розпізнає суму, тип робіт, дату → пропонує зберегти в гараж.
- **Поломка/деталь** → дає пораду + посилання на запчастини (Exist.ua, Avto.pro).

#### `bot.action(/save_rec_(.+)/, ctx)`
Зберігає розпізнаний запис із фото чека в `history` Firestore.

#### `bot.on('voice', ctx)`
Обробляє голосові повідомлення:
1. Завантажує OGG-файл
2. Конвертує в MP3 через ffmpeg
3. Надсилає в Gemini з контекстом гаражу
4. Повертає пораду + кнопку запису на СТО

#### `bot.on('text', ctx)`
Catch-all для текстових запитів до AI-механіка. Відповідає з рекомендаціями та посиланнями на запчастини.

#### `bot.action('book_sto_start', ctx)`
Починає flow запису на СТО. Показує список доступних СТО.

#### `bot.action(/book_select_sto_(.+)/, ctx)`
Зберігає вибрану СТО. Показує авто користувача для вибору.

#### `bot.action(/book_select_car_(.+)/, ctx)`
Зберігає вибране авто. Показує вибір часу (сьогодні / завтра / найближчим часом).

#### `bot.action(/book_confirm_(.+)/, ctx)`
Створює запис у Firestore (`bookings`) зі статусом `pending`.

#### `bot.command('ping', ctx)`
Health-check команда. Відповідає `Pong! 🏓`.

---

### Автоматичні процеси

#### Firestore Listeners (постійні)
- **`team_invitations`** — при новому запрошенні (`status: pending`) надсилає Telegram-сповіщення запрошеному.
- **`bookings`** — слухає нові записи зі статусом `pending` для можливих сповіщень СТО.

#### `checkReminders()`
Перевіряє нагадування всіх користувачів з підключеним Telegram.
- Надсилає сповіщення якщо `daysLeft === daysBefore`, `=== 1` або `=== 0`.
- Уникає дублікатів через `lastNotifiedDate`.

#### `scheduleReminders()`
Планує `checkReminders()` щодня о 09:00. При старті сервера — розраховує час до наступного запуску.

#### `getExpenseStats(snap, carId?, carPlate?)`
Підраховує витрати за всю історію, поточний рік та поточний місяць. Фільтрує за `carId` або `plate` з нормалізацією через `normPlate`.

#### `handleAILimit(ctx)`
Перевіряє ліміт AI-запитів користувача за поточний місяць. Повертає `false` якщо вичерпано.

#### `incrementAIUsage(ctx)`
Збільшує лічильник `aiUsage` у Firestore. Скидає лічильник при зміні місяця.

#### `askGemini(prompt, hasMedia?, base64?, mimeType?)`
Відправляє запит до Gemini API (модель `gemini-2.0-flash`). Підтримує текст та медіа (фото/аудіо).

#### `getUserGarageContext(userId)`
Формує текстовий контекст з переліком авто користувача для AI-промптів.

---

## `bot-server/utils.js`

### `fmtCost(v)`
Форматує число у локалі `uk-UA`.

### `parseDateSafe(dateStr)`
Безпечний парсинг дат у форматах `YYYY-MM-DD`, `DD.MM.YYYY` та ISO. Уникає зміщень часових поясів.

### `normPlate(p)`
Нормалізує держ. номер — конвертує латинські символи у кириличні еквіваленти (A→А, B→В тощо).

---

## Змінні оточення

### Фронтенд (`.env.local`)
| Змінна | Призначення |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics Measurement ID |
| `VITE_GEMINI_API_KEY` | Google Gemini API Key |

### Бот-сервер (`bot-server/.env`)
| Змінна | Призначення |
|---|---|
| `BOT_TOKEN` | Telegram Bot Token |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `FIREBASE_SERVICE_ACCOUNT` | JSON сервісного акаунту Firebase (або файл `serviceAccountKey.json`) |
| `PORT` | HTTP-порт для health-check (Render) |

---

## Запуск

```bash
# Web App
npm run dev          # Dev-сервер (Vite)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest

# Bot Server
cd bot-server
node bot.js          # Запуск бота
```

---

## Деплой

| Сервіс | Частина |
|---|---|
| **Vercel** | Web App (`vercel.json` налаштований) |
| **Render** | Bot Server (always-on instance) |
| **Firebase** | Firestore, Auth, Analytics |
