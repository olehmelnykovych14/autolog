import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { Loader2, Save, Clock, Calendar, Car, Bell, Building2, CheckCircle2 } from 'lucide-react'

const DEFAULT_SETTINGS = {
  // Загальне
  stoName: '',
  stoAddress: '',
  stoPhone: '',
  // Календар
  workdayStart: 8,
  workdayEnd: 19,
  workDays: [1, 2, 3, 4, 5], // 0=Sun, 6=Sat
  slotDuration: 60, // minutes
  postsCount: 1,
  // Запис
  minBookingHours: 2,
  maxBookingDays: 30,
  autoConfirm: false,
  requirePlate: true,
  // Фінанси
  currency: '₴',
  autoAddHistory: true,
}

const WEEK_DAYS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function Section({ icon: Icon, title, children }) {
  return (
    <div className="al-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(92,62,254,0.1)', display: 'grid', placeItems: 'center' }}>
          <Icon size={16} style={{ color: 'var(--brand)' }} />
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
    </div>
  )
}

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{label}</span>
      <button onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, background: value ? 'var(--brand)' : 'var(--line)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}

function inp() { return 'w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-colors' }

export function STOSettingsView({ userProfile, setUserProfile }) {
  const [s, setS] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    getDoc(doc(db, 'sto_settings', uid)).then(snap => {
      if (snap.exists()) setS({ ...DEFAULT_SETTINGS, ...snap.data() })
      else if (userProfile?.stoName) setS(p => ({ ...p, stoName: userProfile.stoName || '' }))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setS(p => ({ ...p, [k]: v }))

  const toggleDay = (d) => set('workDays', s.workDays.includes(d) ? s.workDays.filter(x => x !== d) : [...s.workDays, d].sort())

  const save = async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    setSaving(true)
    try {
      await setDoc(doc(db, 'sto_settings', uid), s, { merge: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) { console.error(e); alert('Помилка збереження') }
    finally { setSaving(false) }
  }

  const ic = `${inp()} al-input-inner`

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 className="animate-spin" size={28} style={{ color: 'var(--brand)' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', margin: 0 }}>Налаштування СТО</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Конфігурація роботи вашого сервісу</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: saved ? 'linear-gradient(135deg,#10B981,#34d399)' : 'linear-gradient(135deg,#5C3EFE,#7C5CFF)' }}>
          {saving ? <Loader2 className="animate-spin" size={15} /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saving ? 'Збереження...' : saved ? 'Збережено' : 'Зберегти'}
        </button>
      </div>

      {/* Загальне */}
      <Section icon={Building2} title="Загальне">
        <Field label="Назва СТО">
          <input className={ic} value={s.stoName} onChange={e => set('stoName', e.target.value)} placeholder="AutoService Київ" />
        </Field>
        <Field label="Адреса">
          <input className={ic} value={s.stoAddress} onChange={e => set('stoAddress', e.target.value)} placeholder="вул. Механіків 14, Київ" />
        </Field>
        <Field label="Телефон">
          <input className={ic} value={s.stoPhone} onChange={e => set('stoPhone', e.target.value)} placeholder="+380 67 123 45 67" />
        </Field>
      </Section>

      {/* Календар */}
      <Section icon={Calendar} title="Календар та графік">
        <Field label="Робочі дні">
          <div style={{ display: 'flex', gap: 8 }}>
            {WEEK_DAYS.map((d, i) => (
              <button key={i} onClick={() => toggleDay(i)}
                style={{ width: 38, height: 38, borderRadius: 10, fontWeight: 700, fontSize: 12, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                  background: s.workDays.includes(i) ? 'var(--brand)' : 'var(--bg-input)',
                  borderColor: s.workDays.includes(i) ? 'var(--brand)' : 'var(--line)',
                  color: s.workDays.includes(i) ? 'white' : 'var(--text-2)' }}>
                {d}
              </button>
            ))}
          </div>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Початок робочого дня">
            <select className={ic} value={s.workdayStart} onChange={e => set('workdayStart', Number(e.target.value))}
              style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
              {Array.from({ length: 14 }, (_, i) => i + 6).map(h => (
                <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </select>
          </Field>
          <Field label="Кінець робочого дня">
            <select className={ic} value={s.workdayEnd} onChange={e => set('workdayEnd', Number(e.target.value))}
              style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
              {Array.from({ length: 14 }, (_, i) => i + 10).map(h => (
                <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Кількість постів" hint="Вибирається при створенні запису">
            <select className={ic} value={s.postsCount} onChange={e => set('postsCount', Number(e.target.value))}
              style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n === 1 ? 'пост' : n < 5 ? 'пости' : 'постів'}</option>)}
            </select>
          </Field>
          <Field label="Тривалість слоту">
            <select className={ic} value={s.slotDuration} onChange={e => set('slotDuration', Number(e.target.value))}
              style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
              {[30,60,90,120].map(n => <option key={n} value={n}>{n} хв</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* Запис */}
      <Section icon={Clock} title="Правила запису">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Мін. час до запису" hint="Клієнт не може записатись раніше">
            <select className={ic} value={s.minBookingHours} onChange={e => set('minBookingHours', Number(e.target.value))}
              style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
              {[0,1,2,3,4,6,12,24,48].map(n => <option key={n} value={n}>{n === 0 ? 'Без обмежень' : `${n} год`}</option>)}
            </select>
          </Field>
          <Field label="Макс. глибина запису" hint="Скільки днів наперед можна записатись">
            <select className={ic} value={s.maxBookingDays} onChange={e => set('maxBookingDays', Number(e.target.value))}
              style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
              {[7,14,30,60,90].map(n => <option key={n} value={n}>{n} днів</option>)}
            </select>
          </Field>
        </div>
        <Toggle value={s.autoConfirm} onChange={v => set('autoConfirm', v)} label="Автопідтвердження нових заявок" />
        <Toggle value={s.requirePlate} onChange={v => set('requirePlate', v)} label="Обовʼязковий номер авто при записі" />
      </Section>

      {/* Фінанси */}
      <Section icon={Car} title="Фінанси та сервісна книжка">
        <Field label="Валюта">
          <select className={ic} value={s.currency} onChange={e => set('currency', e.target.value)}
            style={{ background: 'var(--bg-input)', color: 'var(--text)', maxWidth: 160 }}>
            {['₴','$','€','zł'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Toggle value={s.autoAddHistory} onChange={v => set('autoAddHistory', v)} label="Автоматично додавати завершені роботи в сервісну книжку клієнта" />
      </Section>

      {/* Сповіщення */}
      <Section icon={Bell} title="Сповіщення">
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>SMS та email-нагадування клієнтам — в розробці. Буде доступно в наступному оновленні.</p>
      </Section>
    </div>
  )
}
