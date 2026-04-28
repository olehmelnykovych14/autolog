import React, { useState, useRef } from 'react'
import { Plus, Camera, Search, Info, Share2, ImagePlus, ArrowRight, Gauge, Calendar, ShieldCheck, ChevronRight, Car, BarChart2 } from 'lucide-react'
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
        let width = img.width, height = img.height
        const max = 800
        if (width > height && width > max) { height *= max / width; width = max }
        else if (height > max) { width *= max / height; height = max }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
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
    if (onUpdateCar) onUpdateCar(carId, { image: compressed })
  }

  // Fleet health stats
  const totalCars = carList.length
  const carsWithService = carList.filter(c => c.mileage > 0).length
  const avgMileage = totalCars > 0 ? Math.round(carList.reduce((s, c) => s + (c.mileage || 0), 0) / totalCars) : 0

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Мій гараж</h1>
          <p className="text-gray-400 dark:text-gray-500 font-medium mt-1">
            Управляйте вашим автопарком та сервісними записами
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#5C3EFE] text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus size={18} /> + Add Car
        </button>
      </div>

      {carList.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[#5C3EFE] mb-2">
            <Car size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ваш гараж порожній</h3>
          <p className="text-gray-400 max-w-sm mx-auto">Додайте свій перший автомобіль щоб почати відстежувати сервісну історію</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 flex items-center gap-2 px-6 py-3 bg-[#5C3EFE] text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all">
            <Plus size={16} /> Додати авто
          </button>
        </div>
      ) : (
        <>
          {/* Car Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {carList.map(car => {
              const logo = getBrandLogo(car.brand)
              return (
                <div
                  key={car.id}
                  onClick={() => onSelectCar(car)}
                  className="group bg-white dark:bg-[#0F172A] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800/80 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
                >
                  {/* Car Image */}
                  <div className="h-44 overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    {car.image ? (
                      <img src={car.image} alt={car.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        {logo ? (
                          <img src={logo} alt={car.brand} className="w-20 h-20 object-contain opacity-15 grayscale group-hover:opacity-25 group-hover:grayscale-0 transition-all duration-500"
                            onError={e => { e.target.style.display = 'none' }} />
                        ) : (
                          <span className="text-5xl font-black text-gray-200 dark:text-gray-700">{car.brand?.[0]}</span>
                        )}
                      </div>
                    )}

                    {/* Year badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                      {car.year}
                    </div>

                    {/* Photo upload */}
                    <label
                      className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 hover:bg-indigo-50"
                      onClick={e => e.stopPropagation()}
                    >
                      {car.image ? <Camera size={16} className="text-indigo-500" /> : <ImagePlus size={16} className="text-gray-500" />}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(car.id, e)} />
                    </label>
                  </div>

                  {/* Car Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          {logo && <img src={logo} alt="" className="w-4 h-4 object-contain opacity-70" onError={e => e.target.style.display='none'} />}
                          <h3 className="text-lg font-black text-gray-900 dark:text-white">{car.brand} {car.model}</h3>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">{car.plate}</span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 group-hover:bg-[#5C3EFE] group-hover:text-white transition-all">
                        <ChevronRight size={16} className="text-[#5C3EFE] group-hover:text-white" />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-3">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Gauge size={14} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{fmt(car.mileage)}</span>
                        <span className="text-xs text-gray-400">км</span>
                      </div>
                      {car.vin && (
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-emerald-500" />
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">VIN</span>
                        </div>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); onSelectCar(car); }}
                        className="text-[11px] font-black text-[#5C3EFE] bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg hover:bg-[#5C3EFE] hover:text-white transition-all"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Fleet Health Summary */}
          <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-gray-900 dark:text-white">Стан автопарку</h2>
                <p className="text-xs text-gray-400 mt-0.5">Загальний огляд здоров'я сервісних записів</p>
              </div>
              <BarChart2 size={20} className="text-[#5C3EFE]" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <div className="text-2xl font-black text-gray-900 dark:text-white">{totalCars}/{activePlan.carLimit === Infinity ? '∞' : activePlan.carLimit}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Активні авто</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                <div className="text-2xl font-black text-[#5C3EFE]">{carsWithService}</div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Активні послуги</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <div className="text-2xl font-black text-gray-900 dark:text-white">{fmt(avgMileage)}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Сер. пробіг (км)</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add New Vehicle button at bottom */}
      {carList.length > 0 && (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-bold text-sm hover:border-[#5C3EFE] hover:text-[#5C3EFE] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add New Vehicle
        </button>
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

  if (isLimited) {
    return (
      <Modal title="Обмеження плану" onClose={onClose}>
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/40 rounded-[2rem] flex items-center justify-center text-[#5C3EFE] mx-auto mb-6">
            <Info size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Ваш ліміт вичерпано</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium max-w-sm mx-auto">На безкоштовному плані ви можете додати лише <strong>1 автомобіль</strong>. Оновіть план, щоб розширити гараж.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all">Пізніше</button>
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
          className="h-44 bg-gray-50 dark:bg-gray-700/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-[#5C3EFE] hover:border-[#5C3EFE] hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer group relative overflow-hidden"
        >
          {f.image ? (
            <img src={f.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-all">
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
