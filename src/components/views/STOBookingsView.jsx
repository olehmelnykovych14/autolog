import React, { useState, useEffect } from 'react'
import { Calendar as CalIcon, User, Phone, CheckCircle2, XCircle, Clock4, Car, Plus, Search, Info, Loader2, Edit3, LayoutDashboard as LayoutBoard, ChevronLeft, ChevronRight } from 'lucide-react'
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { Modal, Field, inp_cls, PrimaryBtn } from '../common/Common'

export function STOBookingsView({ userProfile }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createInitial, setCreateInitial] = useState(null)
  const [editingBooking, setEditingBooking] = useState(null)
  
  const [viewMode, setViewMode] = useState('calendar') // 'kanban' | 'calendar'
  const [weekOffset, setWeekOffset] = useState(0)

  // Helper for Calendar Math
  const getWeekDays = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const day = today.getDay() || 7; // 1=Mon..7=Sun
    today.setDate(today.getDate() - day + 1 + (weekOffset * 7));
    const days = [];
    for(let i=0; i<7; i++){
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }
  const weekDays = getWeekDays();

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    if (!auth.currentUser) return
    try {
      const q = query(collection(db, 'bookings'), where('stoId', '==', auth.currentUser.uid))
      const snap = await getDocs(q)
      
      const list = []
      for (const d of snap.docs) {
        const b = { id: d.id, ...d.data() }
        
        // Fetch detailed driver data
        if (b.userId) {
          try {
            const driverSnap = await getDoc(doc(db, 'users', String(b.userId)))
            if (driverSnap.exists()) b.driver = driverSnap.data()
          } catch(err) { console.error('Driver fetch error:', err) }
        }
        
        // Fetch detailed car data
        if (b.carId) {
          try {
            const carSnap = await getDoc(doc(db, 'cars', String(b.carId)))
            if (carSnap.exists()) b.car = carSnap.data()
          } catch(err) { console.error('Car fetch error:', err) }
        }
        
        list.push(b)
      }
      
      list.sort((a, b) => b.createdAt - a.createdAt)
      setBookings(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (bookingId, status) => {
    try {
      setBookings(p => p.map(b => b.id === bookingId ? { ...b, status: 'updating' } : b))
      const { updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'bookings', bookingId), { status })
      setBookings(p => p.map(b => b.id === bookingId ? { ...b, status } : b))
    } catch (e) {
      console.error(e)
      fetchBookings()
    }
  }

  const onDragStart = (e, bookingId) => {
    e.dataTransfer.setData('bookingId', bookingId)
  }

  const onDragOver = (e) => {
    e.preventDefault()
  }

  const onDrop = (e, targetStatus) => {
    const bookingId = e.dataTransfer.getData('bookingId')
    if (bookingId) updateStatus(bookingId, targetStatus)
  }

  const cols = [
    { id: 'pending', label: 'Нові Заявки', color: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/40', titleColor: 'text-amber-600', icon: Clock4 },
    { id: 'confirmed', label: 'Сплановані', color: 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/40', titleColor: 'text-green-600', icon: CheckCircle2 },
    { id: 'rejected', label: 'Архів / Відхилені', color: 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/60', titleColor: 'text-gray-500', icon: XCircle }
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[90rem] mx-auto w-full pt-4 px-4 sm:px-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">Розклад та Записи</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Контролюйте завантаженість СТО та змінюйте статуси.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-fit shrink-0">
            <button onClick={() => setViewMode('kanban')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 text-[#5C3EFE] shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><LayoutBoard size={16}/> Дошка</button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-700 text-[#5C3EFE] shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><CalIcon size={16}/> Календар</button>
          </div>

          <button onClick={() => { setCreateInitial(null); setShowCreateModal(true) }} className="flex items-center gap-2 px-6 py-3 bg-[#5C3EFE] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all">
             <Plus size={20}/> Клієнту
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex flex-col md:flex-row gap-6 mt-4 overflow-x-auto pb-8 snap-x snap-mandatory">
           {loading ? <div className="text-gray-500 p-4">Завантаження...</div> : cols.map(c => {
             const items = bookings.filter(b => b.status === c.id || (c.id==='pending' && b.status==='updating'))
             return (
               <div 
                 key={c.id} 
                 className={`flex-1 min-w-[320px] shrink-0 p-4 rounded-3xl border snap-center flex flex-col gap-4 ${c.color}`}
                 onDragOver={onDragOver}
                 onDrop={e => onDrop(e, c.id)}
               >
                  <div className="flex items-center justify-between px-2">
                    <h3 className={`font-black text-sm uppercase tracking-widest flex items-center gap-2 ${c.titleColor}`}>
                      <c.icon size={16}/> {c.label}
                    </h3>
                    <span className="px-2.5 py-1 bg-white dark:bg-gray-900 rounded-lg text-xs font-bold text-gray-900 dark:text-white shadow-sm">{items.length}</span>
                  </div>

                  <div className="flex flex-col gap-3 min-h-[200px]">
                    {items.map(b => (
                      <div 
                        key={b.id} 
                        draggable 
                        onDragStart={e => onDragStart(e, b.id)}
                        className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all hover:border-[#5C3EFE]/50 relative overflow-hidden group ${b.status==='updating' ? 'opacity-50' : ''}`}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#5C3EFE] scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#5C3EFE] uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                             <CalIcon size={12}/> {b.date?.split('-').reverse().join('.')} • {b.time}
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); setEditingBooking(b) }} className="p-1.5 text-gray-400 hover:text-[#5C3EFE] hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded flex-shrink-0 transition-colors">
                             <Edit3 size={14} />
                           </button>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1"><Car size={16} className="text-gray-400"/> {b.car ? `${b.car.brand} ${b.car.model}` : 'Автомобіль'}</h4>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest rounded">{b.car?.plate || '—'}</span>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl mb-4 line-clamp-2">
                          {b.issue}
                        </p>

                        <div className="flex flex-col gap-2 p-3 bg-gray-50/50 dark:bg-gray-700/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-600/50">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><User size={12} className="text-gray-400"/> {b.driver?.displayName || 'Анонім'}</p>
                          {b.driver?.phone && <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Phone size={12} className="text-gray-400"/> {b.driver.phone}</p>}
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700/50 rounded-2xl opacity-50"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Порожньо</p></div>}
                  </div>
               </div>
             )
           })}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4 animate-in slide-in-from-right-4">
          <div className="flex flex-wrap sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => setWeekOffset(p=>p-1)} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ChevronLeft size={16}/></button>
              <button onClick={() => setWeekOffset(0)} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">Поточний тиждень</button>
              <button onClick={() => setWeekOffset(p=>p+1)} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ChevronRight size={16}/></button>
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-lg lg:text-xl w-full sm:w-auto text-center sm:text-right">{weekDays[0].getDate()} {weekDays[0].toLocaleString('uk',{month:'short'})} — {weekDays[6].getDate()} {weekDays[6].toLocaleString('uk',{month:'short'})}</p>
          </div>

          <div className="overflow-x-auto custom-scrollbar border border-gray-200 dark:border-gray-800 rounded-[2rem] bg-white dark:bg-gray-900 shadow-sm relative max-h-[70vh]">
            <table className="w-full text-sm min-w-[900px] border-collapse relative">
               <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-20 shadow-sm">
                 <tr>
                   <th className="p-4 border-r border-b border-gray-200 dark:border-gray-700/50 text-left w-20 sticky left-0 z-30 bg-gray-50 dark:bg-gray-800">Час</th>
                   {weekDays.map(d => {
                      const dStart = new Date(d); dStart.setHours(0,0,0,0);
                      const tStart = new Date(); tStart.setHours(0,0,0,0);
                      const today = dStart.getTime() === tStart.getTime();
                      return (
                       <th key={d.toString()} className={`p-4 border-r border-b border-gray-200 dark:border-gray-700/50 text-center uppercase tracking-widest ${today ? 'text-[#5C3EFE] bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-gray-500'}`}>
                         <span className="block text-[10px] font-black">{d.toLocaleString('uk',{weekday:'short'})}</span>
                         <span className={`block text-xl font-black mt-0.5 ${today ? 'text-[#5C3EFE]' : 'text-gray-900 dark:text-white'}`}>{d.getDate()}</span>
                       </th>
                      )
                   })}
                 </tr>
               </thead>
               <tbody>
                 {[...Array(24)].map((_, i) => (
                   <tr key={i} className="group">
                     <td className="p-2 border-r border-b border-gray-200 dark:border-gray-700/50 text-center font-bold text-gray-400 bg-gray-50 dark:bg-gray-800/20 sticky left-0 z-10">
                       {String(i).padStart(2,'0')}:00
                     </td>
                     {weekDays.map(d => {
                       const tzOffset = d.getTimezoneOffset() * 60000;
                       const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
                       const hourStr = String(i).padStart(2,'0');
                       const slotBookings = bookings.filter(b => b.date === localISOTime && b.time?.startsWith(hourStr + ':'));
                       
                       return (
                         <td 
                           key={d.toString()} 
                           onClick={() => !slotBookings.length && (setCreateInitial({ date: localISOTime, time: hourStr+':00' }), setShowCreateModal(true))}
                           className={`border-r border-b border-gray-200 dark:border-gray-700/50 p-1 align-top h-24 min-w-[140px] transition-colors ${!slotBookings.length ? 'hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer group-hover:bg-gray-50/50 dark:group-hover:bg-gray-800/50' : 'bg-gray-50/20 dark:bg-gray-800/20'}`}
                         >
                           {slotBookings.map(b => (
                             <div onClick={e => { e.stopPropagation(); setEditingBooking(b) }} key={b.id} className="cursor-pointer hover:scale-[1.02] active:scale-95 p-3 rounded-2xl mb-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-1 transition-all group/item hover:border-indigo-300 dark:hover:border-indigo-600 relative overflow-hidden">
                               <div className="absolute top-0 left-0 w-1 h-full bg-[#5C3EFE]"></div>
                               <div className="flex justify-between items-start pl-1">
                                 <p className="text-[10px] font-black tracking-widest text-[#5C3EFE]">{b.time}</p>
                                 {b.status === 'confirmed' ? <CheckCircle2 size={12} className="text-green-500"/> : b.status === 'pending' ? <Clock4 size={12} className="text-amber-500"/> : <XCircle size={12} className="text-gray-400"/>}
                               </div>
                               <p className="font-bold text-gray-900 dark:text-white text-xs leading-tight line-clamp-1 pl-1" title={`${b.car?.brand} ${b.car?.model}`}>{b.car?.brand} {b.car?.model}</p>
                               <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 pl-1" title={b.issue}>{b.issue}</p>
                             </div>
                           ))}
                         </td>
                       )
                     })}
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && <CreateBookingBySTOModal userProfile={userProfile} initialParams={createInitial} onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchBookings(); }} />}
      {editingBooking && <EditBookingTimeModal booking={editingBooking} onClose={() => setEditingBooking(null)} onSuccess={() => { setEditingBooking(null); fetchBookings(); }} />}
    </div>
  )
}

function CreateBookingBySTOModal({ userProfile, onClose, onSuccess, initialParams }) {
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [foundCar, setFoundCar] = useState(null)
  
  const [f, setF] = useState({ date: initialParams?.date || new Date().toISOString().split('T')[0], time: initialParams?.time || '10:00', issue: '' })
  const ic = inp_cls()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!search.trim()) return
    setLoading(true)
    setErr('')
    try {
      const q = query(collection(db, 'cars'), where('plate', '==', search.trim().toUpperCase()))
      const snap = await getDocs(q)
      if (snap.empty) {
        setErr('Авто не знайдено або закрито власником.')
        setFoundCar(null)
      } else {
        setFoundCar({ id: snap.docs[0].id, ...snap.docs[0].data() })
        setStep(2)
      }
    } catch(e) {
      console.error(e)
      setErr('Помилка бази.')
    } finally {
      setLoading(false)
    }
  }

  const submitBooking = async (e) => {
    e.preventDefault()
    if (!f.issue || !foundCar) return
    setLoading(true)
    try {
      await addDoc(collection(db, 'bookings'), {
        stoId: auth.currentUser.uid,
        userId: foundCar.userId || 'unclaimed',
        carId: foundCar.id || 'unknown',
        date: f.date || 'unknown',
        time: f.time || 'unknown',
        issue: f.issue || 'Без опису',
        status: 'confirmed', // Created by STO => automatically confirmed
        creator: 'sto',
        createdAt: Date.now()
      })
      onSuccess()
    } catch(e) {
      console.error(e)
      alert("Помилка створення")
      setLoading(false)
    }
  }

  return (
    <Modal title="Створити запис клієнту" onClose={onClose}>
      {step === 1 && (
        <form onSubmit={handleSearch} className="flex flex-col gap-4 py-2">
          <p className="text-sm text-gray-500 mb-2">Знайдіть авто клієнта за номером, щоб додати його у ваш розклад.</p>
          <Field label="Номер автомобіля">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-gray-400" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="AA0000AA" className={`${ic} !pl-12 uppercase font-mono`} maxLength={12} required />
            </div>
          </Field>
          {err && <p className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-lg flex items-center gap-2"><Info size={14}/> {err}</p>}
          <PrimaryBtn type="submit" disabled={loading} className="w-full py-4 justify-center text-base mt-4 shadow-indigo-500/20">
            {loading ? <Loader2 className="animate-spin" size={20}/> : 'Знайти і далі'}
          </PrimaryBtn>
        </form>
      )}

      {step === 2 && foundCar && (
        <form onSubmit={submitBooking} className="flex flex-col gap-4 animate-in slide-in-from-right-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 p-4 rounded-xl flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm text-indigo-500 border border-indigo-100 dark:border-indigo-800"><Car size={20}/></div>
               <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white uppercase">{foundCar.brand} {foundCar.model}</p>
                  <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{foundCar.plate}</p>
               </div>
             </div>
             <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-indigo-500 hover:underline">Змінити</button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <Field label="Дата візиту *">
              <input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className={ic} required/>
            </Field>
            <Field label="Час *">
              <input type="time" value={f.time} onChange={e => setF({...f, time: e.target.value})} className={ic} required/>
            </Field>
          </div>

          <Field label="Суть звернення / Заплановані роботи *">
            <textarea value={f.issue} onChange={e => setF({...f, issue: e.target.value})} className={`${ic} resize-none h-24`} placeholder="Наприклад: Заміна ГРМ та помпи" required></textarea>
          </Field>

          <PrimaryBtn type="submit" disabled={loading} className="w-full py-4 justify-center text-base mt-2 shadow-indigo-500/20">
            {loading ? <Loader2 className="animate-spin" size={20}/> : 'Підтвердити та Забронювати'}
          </PrimaryBtn>
        </form>
      )}
    </Modal>
  )
}

function EditBookingTimeModal({ booking, onClose, onSuccess }) {
  const [f, setF] = useState({ date: booking.date || '', time: booking.time || '' })
  const [loading, setLoading] = useState(false)
  const ic = inp_cls()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        date: f.date,
        time: f.time
      })
      onSuccess()
    } catch(e) {
      console.error(e)
      alert('Помилка оновлення часу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Редагувати дату та час" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Нова дата візиту">
            <input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className={ic} required/>
          </Field>
          <Field label="Новий час">
            <input type="time" value={f.time} onChange={e => setF({...f, time: e.target.value})} className={ic} required/>
          </Field>
        </div>
        <PrimaryBtn type="submit" disabled={loading} className="w-full py-4 justify-center text-base mt-4 shadow-indigo-500/20">
          {loading ? <Loader2 className="animate-spin" size={20}/> : 'ЗБЕРЕГТИ ЗМІНИ'}
        </PrimaryBtn>
      </form>
    </Modal>
  )
}
