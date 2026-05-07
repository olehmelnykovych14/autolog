import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Search, ChevronRight, CheckCircle2, XCircle, Clock4, Info, ShieldCheck } from 'lucide-react'
import { collection, query, where, getDocs, orderBy, addDoc } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { PrimaryBtn, Modal, Field, inp_cls } from '../common/Common'

export function ClientBookingsView({ carList, preselectedSto, onClearPreselected }) {
  const [activeTab, setActiveTab] = useState('new') // 'new' | 'my'
  const [stos, setStos] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSto, setSelectedSto] = useState(null)

  useEffect(() => {
    fetchStos()
    fetchMyBookings()
  }, [])

  useEffect(() => {
    if (preselectedSto) {
      setSelectedSto(preselectedSto)
      onClearPreselected?.()
    }
  }, [preselectedSto])

  const fetchStos = async () => {
    try {
      // Load all Business users (STOs)
      const q = query(collection(db, 'users'), where('accountType', '==', 'sto'))
      const snap = await getDocs(q)
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setStos(list)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchMyBookings = async () => {
    if (!auth.currentUser) return
    try {
      const q = query(collection(db, 'bookings'), where('userId', '==', auth.currentUser.uid))
      const snap = await getDocs(q)
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => b.createdAt - a.createdAt)
      setMyBookings(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleBookingSuccess = () => {
    setSelectedSto(null)
    setActiveTab('my')
    fetchMyBookings()
  }

  const filteredStos = stos.filter(s => 
    s.stoName?.toLowerCase().includes(search.toLowerCase()) || 
    s.stoAddress?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pt-4 px-4 sm:px-0">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Запис на СТО</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Оберіть партнера та заплануйте ваш візит</p>
      </div>

      <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('new')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'new' ? 'bg-white dark:bg-gray-700 text-[#5C3EFE] shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Знайти СТО</button>
        <button onClick={() => setActiveTab('my')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'my' ? 'bg-white dark:bg-gray-700 text-[#5C3EFE] shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
          Мої записи
          {myBookings.some(b => b.status === 'pending') && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
        </button>
      </div>

      {activeTab === 'new' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Шукати за назвою або містом..." 
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 dark:text-white transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {loading ? <div className="text-gray-400 font-medium p-4">Завантаження...</div> : 
              filteredStos.length === 0 ? <div className="text-gray-400 font-medium p-4">СТО не знайдено.</div> : 
              filteredStos.map(sto => (
                <div key={sto.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-800/50 transition-all cursor-pointer group" onClick={() => setSelectedSto(sto)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[#5C3EFE] font-black border border-indigo-100/50 text-xl border-dashed">
                         {sto.stoName?.[0] || 'S'}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-gray-900 dark:text-white group-hover:text-[#5C3EFE] transition-colors">{sto.stoName}</h3>
                        <div className="flex items-center gap-1 text-xs text-indigo-500 font-bold mt-0.5"><ShieldCheck size={12}/> AutoLog Partner</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400 mt-4 mb-6">
                    <MapPin size={16} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{sto.stoAddress || sto.city || 'Адреса не вказана'}</p>
                  </div>
                  <button className="w-full py-3 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-bold text-sm rounded-xl group-hover:bg-[#5C3EFE] group-hover:text-white transition-all">Записатися</button>
                </div>
              ))
             }
          </div>
        </div>
      )}

      {activeTab === 'my' && (
        <div className="flex flex-col gap-4 animate-in slide-in-from-left-4 duration-300">
           {loading ? <div className="text-gray-400 p-4">Завантаження...</div> :
            myBookings.length === 0 ? (
              <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                 <p className="text-gray-500 dark:text-gray-400">У вас немає активних записів.</p>
              </div>
            ) : myBookings.map(b => {
              const car = carList.find(c => c.id === b.carId)
              const stoName = stos.find(s => s.id === b.stoId)?.stoName || 'СТО Партнер'
              return (
                <div key={b.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                   <div>
                     <div className="flex items-center gap-3 mb-2">
                       <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[10px] uppercase font-black tracking-widest rounded-md">{stoName}</span>
                       <StatusBadge status={b.status} />
                     </div>
                     <p className="text-lg font-black text-gray-900 dark:text-white">{car ? `${car.brand} ${car.model}` : 'Автомобіль'}</p>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{b.issue}</p>
                   </div>
                   <div className="flex items-center gap-6 px-5 py-4 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl whitespace-nowrap">
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-[#5C3EFE] mb-0.5">ДАТА ВІЗИТУ</p>
                        <p className="font-bold border-b border-dashed border-indigo-200 dark:border-indigo-800 pb-0.5">{b.date?.split('-').reverse().join('.') || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-[#5C3EFE] mb-0.5">ЧАС</p>
                        <p className="font-bold border-b border-dashed border-indigo-200 dark:border-indigo-800 pb-0.5">{b.time || '—'}</p>
                      </div>
                   </div>
                </div>
              )
            })
           }
        </div>
      )}

      {selectedSto && (
        <BookingRequestModal 
          sto={selectedSto} 
          carList={carList} 
          onClose={() => setSelectedSto(null)} 
          onSuccess={handleBookingSuccess} 
        />
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'pending') return <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-500"><Clock4 size={12}/> В ОБРОБЦІ</span>
  if (status === 'confirmed') return <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-500"><CheckCircle2 size={12}/> ПІДТВЕРДЖЕНО</span>
  if (status === 'rejected') return <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-500"><XCircle size={12}/> ВІДХИЛЕНО</span>
  return null
}

function BookingRequestModal({ sto, carList, onClose, onSuccess }) {
  const [f, setF] = useState({ carId: carList[0]?.id || '', date: '', time: '10:00', issue: '' })
  const [loading, setLoading] = useState(false)
  const ic = inp_cls()

  const submit = async (e) => {
    e.preventDefault()
    if (!f.carId || !f.date || !f.issue) return
    setLoading(true)
    try {
      await addDoc(collection(db, 'bookings'), {
        stoId: sto.id,
        userId: auth.currentUser?.uid,
        carId: f.carId,
        date: f.date,
        time: f.time,
        issue: f.issue,
        status: 'pending',
        createdAt: Date.now()
      })
      onSuccess()
    } catch (e) {
      console.error(e)
      alert("Помилка відправки заявки.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Запис на СТО" onClose={onClose}>
       <form onSubmit={submit} className="flex flex-col gap-4">
         <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl mb-2 flex items-center gap-4 border border-indigo-100 dark:border-indigo-800/50">
           <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-[#5C3EFE] font-black border border-indigo-100 dark:border-indigo-800 shadow-sm">{sto.stoName?.[0]}</div>
           <div>
             <p className="text-sm font-bold dark:text-white uppercase">{sto.stoName}</p>
             <p className="text-xs text-gray-500 dark:text-gray-400">{sto.stoAddress}</p>
           </div>
         </div>

         {carList.length === 0 ? (
           <p className="text-sm text-red-500 p-4 bg-red-50 rounded-lg">Додайте хоча б одне авто в гараж.</p>
         ) : (
          <Field label="Оберіть авто *">
            <select value={f.carId} onChange={e => setF({...f, carId: e.target.value})} className={ic} required>
              {carList.map(c => <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.plate})</option>)}
            </select>
          </Field>
         )}

         <div className="grid grid-cols-2 gap-4">
           <Field label="Бажана дата *">
             <input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} min={new Date().toISOString().split('T')[0]} className={ic} required />
           </Field>
           <Field label="Орієнтовний час *">
             <input type="time" value={f.time} onChange={e => setF({...f, time: e.target.value})} className={ic} required />
           </Field>
         </div>

         <Field label="Опис проблеми чи побажання *">
           <textarea value={f.issue} onChange={e => setF({...f, issue: e.target.value})} className={`${ic} h-24 resize-none`} placeholder="Наприклад: Заміна масла, стукає підвіска..." required></textarea>
         </Field>

         <PrimaryBtn type="submit" disabled={loading || carList.length === 0} className="w-full py-4 justify-center text-base mt-2">
            {loading ? 'Надсилання...' : 'ПІДТВЕРДИТИ ЗАПРОС'}
         </PrimaryBtn>
       </form>
    </Modal>
  )
}
