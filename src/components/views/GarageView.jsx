import React, { useState, useRef } from 'react'
import { Plus, Camera, Search, User, Info, Smartphone, FileText, Send, Share2, MoreVertical, Trash2, ImagePlus } from 'lucide-react'
import { Modal, Field, inp_cls, PrimaryBtn } from '../common/Common'
import { fmt, getBrandLogo } from '../../utils'
import { C, PLANS } from '../../constants'
import { BRANDS_MODELS } from '../../data/cars'

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

export function GarageView({ carList, onAddCar, onUpdateCar, onSelectCar, userProfile, onGoPlans }) {
  const [showAdd, setShowAdd] = useState(false)
  // SUBSCRIPTION: car limit disabled for free launch
  // const activePlan = PLANS.find(p => p.id === (userProfile?.plan || 'Free')) || PLANS[0]
  // const isLimited = carList.length >= activePlan.carLimit
  const isLimited = false

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
              <div key={car.id} className="car-card group" onClick={() => onSelectCar(car)}>
                <div className="hero">
                  {car.image ? (
                    <img src={car.image} alt={car.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0" />
                  ) : (
                    <>
                      <div className="brand-silhouette">{car.brand?.[0] || '?'}</div>
                      <svg viewBox="0 0 280 120" style={{ position: 'absolute', inset: '25% 5% 10%', width: '90%' }}>
                        <path d="M30 75 Q45 55 65 52 L90 44 Q120 36 160 36 Q210 36 230 50 L250 64 Q260 70 258 82 L254 92 L228 94 Q222 82 210 82 Q198 82 192 94 L88 94 Q82 82 70 82 Q58 82 52 94 L26 90 Q22 80 30 75 Z"
                          fill="var(--brand)" fillOpacity="0.10"/>
                        <ellipse cx="72" cy="94" rx="14" ry="6" fill="var(--brand)" fillOpacity="0.15"/>
                        <ellipse cx="210" cy="94" rx="14" ry="6" fill="var(--brand)" fillOpacity="0.15"/>
                      </svg>
                    </>
                  )}
                  <div className="year-badge">{car.year}</div>
                  <label
                    className="absolute top-3 right-14 h-8 w-8 rounded-xl backdrop-blur-sm flex items-center justify-center shadow-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.9)' }}
                    onClick={e => e.stopPropagation()}
                    title={car.image ? "Змінити фото" : "Завантажити фото"}
                  >
                    {car.image ? <Camera size={15} style={{ color: 'var(--brand)' }} /> : <ImagePlus size={15} style={{ color: 'var(--text-2)' }} />}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(car.id, e)} />
                  </label>
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
    </div>
  )
}

function AddCarModal({ onClose, onAdd, isLimited, onGoPlans }) {
  const [f, setF] = useState({ brand: 'Acura', model: 'ILX', year: new Date().getFullYear(), plate: '', vin: '', mileage: '', image: '' })
  const fileRef = useRef(null)
  const ic = inp_cls()

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
          <input value={f.vin} onChange={e => setF({ ...f, vin: e.target.value.toUpperCase() })} placeholder="17-значний номер" className={ic} maxLength={17} />
        </Field>

        <PrimaryBtn type="submit" className="w-full py-4 justify-center text-base mt-2">
          Зберегти автомобіль
        </PrimaryBtn>
      </form>
    </Modal>
  )
}
