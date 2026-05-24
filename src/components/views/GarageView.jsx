import React, { useState, useRef, useEffect } from 'react'
import { Plus, Camera, Search, User, Info, Smartphone, FileText, Send, Share2, MoreVertical, Trash2, ImagePlus, ShieldCheck, Loader2, Pencil } from 'lucide-react'
import { Modal, Field, inp_cls, PrimaryBtn, ConfirmModal } from '../common/Common'
import { fmt, getBrandLogo } from '../../utils'
import { BRANDS_MODELS } from '../../data/cars'

const CV_REF = 'YOUR_REF_CODE'
const cvLink = vin => `https://www.carvertical.com/uk/get-report?referralCode=${CV_REF}${vin ? `&vin=${vin}` : ''}`

function CarPhoto({ brand, model }) {
  const logo = getBrandLogo(brand)
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
      style={{ background: 'linear-gradient(145deg, var(--brand-soft) 0%, rgba(92,62,254,0.04) 100%)' }}>
      {logo && !logoFailed ? (
        <img
          src={logo}
          alt={brand}
          className="w-14 h-14 object-contain opacity-80 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black"
          style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
          {brand?.[0] || '?'}
        </div>
      )}
      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: 'var(--brand)' }}>
        {model}
      </span>
    </div>
  )
}

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const max = 800
        if (width > height && width > max) { height *= max / width; width = max; }
        else if (height > max) { width *= max / height; height = max; }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
    }
  })
}

export function GarageView({ carList, onAddCar, onUpdateCar, onDeleteCar, onSelectCar, userProfile, onGoPlans }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editCar, setEditCar] = useState(null)
  const [confirmDlg, setConfirmDlg] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  // SUBSCRIPTION: car limit disabled for free launch
  const isLimited = false

  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handlePhotoUpload = async (carId, e) => {
    e.stopPropagation()
    const file = e.target.files[0]
    if (!file) return
    const compressed = await compressImage(file)
    if (onUpdateCar) {
      onUpdateCar(carId, { image: compressed })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Мій гараж</h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-3)' }}>{carList.length} активних авто</p>
        </div>
        <button className="btn-brand sm:self-center" onClick={() => setShowAdd(true)}><Plus size={16}/> Додати автомобіль</button>
      </div>

      {carList.length === 0 ? (
        <div className="al-card p-12 text-center flex flex-col items-center gap-4" style={{ border: '2px dashed var(--line-2)', boxShadow: 'none', background: 'var(--bg-card)' }}>
          <div className="w-16 h-16 rounded-[20px] flex items-center justify-center" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
            <Plus size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Ваш гараж порожній</h3>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Додайте перший автомобіль, щоб почати відстежувати сервісну історію</p>
          </div>
          <button className="btn-brand mt-2" onClick={() => setShowAdd(true)}><Plus size={16} /> Додати авто</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
          {carList.map(car => {
            const logo = getBrandLogo(car.brand)
            return (
              <div key={car.id} data-car-id={car.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="car-card group" data-car-id={car.id} onClick={() => onSelectCar(car)}>
                  <div className="hero">
                    {car.image ? (
                      <img src={car.image} alt={car.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0" />
                    ) : (
                      <CarPhoto brand={car.brand} model={car.model} />
                    )}
                    <div className="year-badge">{car.year}</div>

                    {/* Action buttons — compact pill group, top-right */}
                    <div className="absolute top-3 right-3 z-30" onClick={e => e.stopPropagation()}>
                      {/* Desktop hover actions (original design & classes for Playwright tests) */}
                      <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        {/* Upload photo */}
                        <label
                          title={car.image ? 'Змінити фото' : 'Завантажити фото'}
                          className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95"
                          style={{ background: 'rgba(15,15,30,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}
                        >
                          <Camera size={14} style={{ color: 'rgba(255,255,255,0.85)' }} />
                          <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(car.id, e)} />
                        </label>

                        {/* Edit */}
                        <button
                          type="button"
                          title="Редагувати"
                          onClick={() => setEditCar(car)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                          style={{ background: 'rgba(15,15,30,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}
                        >
                          <Pencil size={14} style={{ color: 'rgba(255,255,255,0.85)' }} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          title="Видалити"
                          onClick={() => {
                            setConfirmDlg({
                              brand: car.brand,
                              model: car.model,
                              id: car.id
                            })
                          }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                          style={{ background: 'rgba(180,30,30,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.35)' }}
                        >
                          <Trash2 size={14} style={{ color: '#fca5a5' }} />
                        </button>
                      </div>

                      {/* Mobile 3-dot kebab menu */}
                      <div className="relative sm:hidden">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === car.id ? null : car.id)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center bg-black/60 backdrop-blur border border-white/10 text-white hover:scale-105 active:scale-95"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openMenuId === car.id && (
                          <div className="absolute right-0 top-10 bg-[#15152c]/95 border border-white/10 backdrop-blur-md rounded-xl p-1.5 shadow-xl flex flex-col gap-1 z-50 min-w-[140px]">
                            {/* Upload photo */}
                            <label
                              className="h-9 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:bg-white/10 active:scale-95 text-xs text-gray-300 font-semibold"
                            >
                              <Camera size={14} className="text-white/80 shrink-0" />
                              <span>Змінити фото</span>
                              <input type="file" accept="image/*" className="hidden" onChange={e => { handlePhotoUpload(car.id, e); setOpenMenuId(null); }} />
                            </label>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => { setEditCar(car); setOpenMenuId(null); }}
                              className="h-9 px-3 rounded-lg flex items-center gap-2 transition-all hover:bg-white/10 active:scale-95 text-xs text-gray-300 font-semibold border-0 bg-transparent text-left cursor-pointer"
                            >
                              <Pencil size={14} className="text-white/80 shrink-0" />
                              <span>Редагувати</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDlg({
                                  brand: car.brand,
                                  model: car.model,
                                  id: car.id
                                });
                                setOpenMenuId(null);
                              }}
                              className="h-9 px-3 rounded-lg flex items-center gap-2 transition-all hover:bg-red-500/20 active:scale-95 text-xs text-red-400 font-semibold border-0 bg-transparent text-left cursor-pointer"
                            >
                              <Trash2 size={14} className="text-red-400 shrink-0" />
                              <span>Видалити</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="body">
                    <div className="brand-row">
                      <span className="brand-name">{car.brand}</span>
                      <span className="plate-badge">{car.plate}</span>
                    </div>
                    <div className="car-model">{car.model}</div>
                    <div className="km-row">
                      <div>
                        <div className="km-label">Пробіг</div>
                        <div className="km-val">{fmt(car.mileage)}<span className="km-unit">км</span></div>
                      </div>
                      <div className="share-btn"><Share2 size={18}/></div>
                    </div>
                  </div>
                </div>
                <a href={cvLink(car.vin)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', transition: 'opacity 200ms' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <ShieldCheck size={15} style={{ color: '#4ade80', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9' }}>Перевірити історію авто</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>CarVertical — ДТП, пробіг, власники</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', flexShrink: 0 }}>→</div>
                </a>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <AddCarModal
          onClose={() => setShowAdd(false)}
          onAdd={onAddCar}
          isLimited={isLimited}
          onGoPlans={onGoPlans}
        />
      )}

      {editCar && (
        <EditCarModal
          car={editCar}
          onClose={() => setEditCar(null)}
          onSave={(updates) => { onUpdateCar?.(editCar.id, updates); setEditCar(null) }}
        />
      )}

      {confirmDlg && (
        <ConfirmModal
          title={`Видалити ${confirmDlg.brand} ${confirmDlg.model}?`}
          message="Сервісну історію автомобіля також буде видалено. Цю дію не можна скасувати."
          confirmLabel="Видалити авто"
          variant="danger"
          onConfirm={() => { onDeleteCar?.(confirmDlg.id); setConfirmDlg(null) }}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
    </div>
  )
}

function EditCarModal({ car, onClose, onSave }) {
  const ic = inp_cls()
  const [f, setF] = useState({
    plate: car.plate || '',
    mileage: car.mileage || 0,
    year: car.year || new Date().getFullYear(),
    vin: car.vin || '',
  })
  const submit = (e) => {
    e.preventDefault()
    onSave({
      plate: f.plate.toUpperCase(),
      mileage: parseInt(f.mileage) || 0,
      year: parseInt(f.year) || car.year,
      vin: f.vin.toUpperCase(),
    })
  }
  return (
    <Modal title={`Редагувати ${car.brand} ${car.model}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Рік">
            <input type="number" min="1900" max={new Date().getFullYear() + 1} value={f.year} onChange={e => setF({ ...f, year: e.target.value })} className={ic} />
          </Field>
          <Field label="Держ. номер">
            <input value={f.plate} onChange={e => setF({ ...f, plate: e.target.value.toUpperCase() })} className={ic} />
          </Field>
        </div>
        <Field label="Пробіг (км)">
          <input type="number" value={f.mileage} onChange={e => setF({ ...f, mileage: e.target.value })} className={ic} />
        </Field>
        <Field label="VIN">
          <input value={f.vin} onChange={e => setF({ ...f, vin: e.target.value.toUpperCase() })} className={ic} maxLength={17} />
        </Field>
        <PrimaryBtn type="submit" className="w-full py-4 justify-center text-base mt-2">
          Зберегти зміни
        </PrimaryBtn>
      </form>
    </Modal>
  )
}

function AddCarModal({ onClose, onAdd, isLimited, onGoPlans }) {
  const [f, setF] = useState({ brand: 'Acura', model: 'ILX', year: new Date().getFullYear(), plate: '', vin: '', mileage: '', image: '', engineL: '', engineCyl: '', fuelType: '', driveType: '', transmission: '', bodyClass: '' })
  const [vinStatus, setVinStatus] = useState(null)
  const fileRef = useRef(null)
  const ic = inp_cls()

  const handleVinChange = async (raw) => {
    const vin = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setF(p => ({ ...p, vin }))
    if (vin.length !== 17) { setVinStatus(null); return }
    setVinStatus('loading')
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`)
      const data = await res.json()
      const get = v => { const val = data.Results?.find(r => r.Variable === v)?.Value; return (!val || val === 'null' || val === '0' || val === 'Not Applicable') ? '' : val }
      const make  = get('Make')
      const model = get('Model') || get('Series') || get('Trim')
      const year  = get('Model Year')
      if (!make) { setVinStatus('notfound'); return }
      const brandKey = Object.keys(BRANDS_MODELS).find(b => b.toLowerCase() === make.toLowerCase()) || make
      const modelVal = BRANDS_MODELS[brandKey]
        ? (BRANDS_MODELS[brandKey].find(m => m.toLowerCase() === (model||'').toLowerCase()) || model || '')
        : (model || '')
      setF(p => ({
        ...p, vin,
        brand: brandKey,
        model: modelVal,
        year: parseInt(year) || p.year,
        engineL:      get('Displacement (L)'),
        engineCyl:    get('Engine Number of Cylinders'),
        fuelType:     get('Fuel Type - Primary'),
        driveType:    get('Drive Type'),
        transmission: get('Transmission Style'),
        bodyClass:    get('Body Class'),
      }))
      setVinStatus('found')
    } catch {
      setVinStatus('error')
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const compressed = await compressImage(file)
    setF({ ...f, image: compressed })
  }

  const submit = e => {
    e.preventDefault()
    if (isLimited) return
    onAdd({ ...f, mileage: parseInt(f.mileage) || 0 })
    onClose()
  }

  // SUBSCRIPTION: limit wall disabled for free launch
  // if (isLimited) {
  //   return (
  //     <Modal title="Обмеження плану" onClose={onClose}>
  //       <div className="text-center py-6">
  //         <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/40 rounded-[2rem] flex items-center justify-center text-[#5C3EFE] mx-auto mb-6 shadow-inner">
  //           <Info size={40} />
  //         </div>
  //         <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Ваш ліміт вичерпано</h2>
  //         <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium max-w-sm mx-auto leading-relaxed">На безкоштовному плані ви можете додати лише <strong>1 автомобіль</strong>. Оновіть план, щоб розширити свій гараж.</p>
  //         <div className="flex gap-3">
  //           <button onClick={onClose} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95">Пізніше</button>
  //           <PrimaryBtn onClick={() => { onClose(); onGoPlans(); }} className="flex-1 py-4 justify-center text-base">Оновити план</PrimaryBtn>
  //         </div>
  //       </div>
  //     </Modal>
  //   )
  // }

  return (
    <Modal title="Додати автомобіль" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div 
          onClick={() => fileRef.current?.click()} 
          className="h-44 bg-gray-50 dark:bg-gray-700/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-[#5C3EFE] hover:border-[#5C3EFE] hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer group relative overflow-hidden shadow-inner"
        >
          {f.image ? (
            <img src={f.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center mb-2 shadow-sm group-hover:shadow-indigo-500/10 group-hover:scale-110 transition-all">
                <Camera size={24} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">Завантажити фото</p>
            </>
          )}
          <input type="file" ref={fileRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <Field label="Марка *">
            <select value={f.brand} onChange={e => setF({ ...f, brand: e.target.value, model: BRANDS_MODELS[e.target.value][0] })} className={ic} required>
              {Object.keys(BRANDS_MODELS).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Модель *">
            <select value={f.model} onChange={e => setF({ ...f, model: e.target.value })} className={ic} required>
              {BRANDS_MODELS[f.brand].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Рік *">
            <input type="number" min="1900" max={new Date().getFullYear() + 1} value={f.year} onChange={e => setF({ ...f, year: e.target.value })} className={ic} required />
          </Field>
          <Field label="Держ. номер *">
            <input value={f.plate} onChange={e => setF({ ...f, plate: e.target.value.toUpperCase() })} placeholder="AA 0000 BB" className={ic} required />
          </Field>
          <Field label="Пробіг (км) *">
            <input type="number" value={f.mileage} onChange={e => setF({ ...f, mileage: e.target.value })} placeholder="0" className={ic} required />
          </Field>
        </div>

        <Field label="VIN номер">
          <div style={{ position: 'relative' }}>
            <input
              value={f.vin}
              onChange={e => handleVinChange(e.target.value)}
              placeholder="17-значний номер — марка підтягнеться автоматично"
              className={ic} maxLength={17}
              style={{ paddingRight: 36 }}
            />
            {vinStatus === 'loading' && (
              <Loader2 size={15} className="animate-spin" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--brand)' }} />
            )}
            {vinStatus === 'found' && (
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#10B981', fontSize: 16 }}>✓</span>
            )}
          </div>
          {vinStatus === 'notfound' && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
              ⚠ Авто не знайдено в базі — заповніть марку та модель вручну
            </p>
          )}
          {vinStatus === 'error' && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>
              Помилка запиту — заповніть вручну
            </p>
          )}
          {vinStatus === 'found' && (
            <p style={{ fontSize: 12, color: '#10B981', marginTop: 5 }}>
              ✓ Дані підтягнуто автоматично
            </p>
          )}
        </Field>

        <PrimaryBtn type="submit" className="w-full py-4 justify-center text-base mt-2">
          Зберегти автомобіль
        </PrimaryBtn>
      </form>
    </Modal>
  )
}
