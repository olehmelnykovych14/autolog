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
  const activePlan = PLANS.find(p => p.id === (userProfile?.plan || 'Free')) || PLANS[0]
  const isLimited = carList.length >= activePlan.carLimit

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
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Мій гараж</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{carList.length} активних авто</p>
        </div>
        <PrimaryBtn onClick={() => setShowAdd(true)} className="sm:self-center">
          <Plus size={18} /> Додати автомобіль
        </PrimaryBtn>
      </div>

      {carList.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[#5C3EFE] mb-2 shadow-inner">
            <Plus size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ваш гараж порожній</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">Додайте свій перший автомобіль, щоб почати відстежувати історію обслуговування</p>
          <PrimaryBtn onClick={() => setShowAdd(true)} className="mt-4">Створити запис</PrimaryBtn>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
          {carList.map(car => {
            const logo = getBrandLogo(car.brand)
            return (
              <div 
                key={car.id} 
                onClick={() => onSelectCar(car)}
                className="group bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-700/60 shadow-md shadow-gray-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-500 cursor-pointer relative"
              >
                <div className="h-48 sm:h-52 overflow-hidden relative">
                  {car.image ? (
                    <img src={car.image} alt={car.brand} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center group-hover:bg-indigo-50/10 dark:group-hover:bg-indigo-900/10 transition-all duration-500">
                      <div className="flex flex-col items-center gap-3">
                        {logo ? (
                          <img 
                            src={logo} 
                            alt={car.brand} 
                            className="w-16 h-16 object-contain opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700" 
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className={`w-16 h-16 rounded-3xl bg-indigo-500/5 dark:bg-white/5 flex items-center justify-center border border-indigo-500/10 dark:border-white/10 ${logo ? 'hidden' : 'flex'}`}>
                          <span className="text-3xl font-black text-indigo-400/30 dark:text-gray-600 uppercase">{car.brand?.[0] || '?'}</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em]">{car.brand}</p>
                      </div>
                    </div>
                  )}
                  {/* Year badge */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/20">{car.year}</div>
                  </div>
                  {/* Upload photo button */}
                  <label 
                    className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-lg cursor-pointer transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/60 hover:scale-110 active:scale-95"
                    onClick={e => e.stopPropagation()}
                    title={car.image ? "Змінити фото" : "Завантажити фото"}
                  >
                    {car.image ? <Camera size={18} className="text-indigo-500" /> : <ImagePlus size={18} className="text-gray-500 dark:text-gray-300" />}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => handlePhotoUpload(car.id, e)} 
                    />
                  </label>
                </div>
                
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {logo && (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <img src={logo} alt="" className="w-full h-full object-contain opacity-80" onError={(e) => e.target.parentElement.style.display = 'none'} />
                        </div>
                      )}
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{car.brand}</h3>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg text-xs font-black text-gray-500 dark:text-gray-300 tracking-wider shadow-inner uppercase">{car.plate}</div>
                  </div>
                  
                  <p className="text-gray-400 font-bold text-sm uppercase mb-6 tracking-wide">{car.model}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ПРОБІГ</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white uppercase leading-none">{fmt(car.mileage)} <span className="text-xs text-gray-400">км</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[#5C3EFE] group-hover:scale-110 transition-all duration-500 shadow-inner">
                      <Share2 size={20} />
                    </div>
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
    onAdd({ ...f, id: Date.now(), mileage: parseInt(f.mileage) || 0 })
    onClose()
  }

  if (isLimited) {
    return (
      <Modal title="Обмеження плану" onClose={onClose}>
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/40 rounded-[2rem] flex items-center justify-center text-[#5C3EFE] mx-auto mb-6 shadow-inner">
            <Info size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Ваш ліміт вичерпано</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium max-w-sm mx-auto leading-relaxed">На безкоштовному плані ви можете додати лише <strong>1 автомобіль</strong>. Оновіть план, щоб розширити свій гараж.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95">Пізніше</button>
            <PrimaryBtn onClick={() => { onClose(); onGoPlans(); }} className="flex-1 py-4 justify-center text-base">Оновити план</PrimaryBtn>
          </div>
        </div>
      </Modal>
    )
  }

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
