import React, { useState, useEffect } from 'react'
import { Calendar, User, Phone, CheckCircle2, XCircle, Clock4, Car } from 'lucide-react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../../firebase'

export function STOBookingsView({ userProfile }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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
        const driverSnap = await getDoc(doc(db, 'users', b.userId))
        if (driverSnap.exists()) b.driver = driverSnap.data()
        
        // Fetch detailed car data
        const carSnap = await getDoc(doc(db, 'cars', b.carId))
        if (carSnap.exists()) b.car = carSnap.data()
        
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

  const filtered = bookings.filter(b => {
    if (filter === 'pending') return b.status === 'pending'
    return true
  })

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pt-4 px-4 sm:px-0 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Календар записів</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Керуйте візитами клієнтів</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter === 'all' ? 'bg-[#5C3EFE] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>Всі</button>
        <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter === 'pending' ? 'bg-[#5C3EFE] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
          Нові
          {bookings.some(b => b.status === 'pending') && <span className="ml-2 w-2 h-2 inline-block bg-white rounded-full"></span>}
        </button>
      </div>

      <div className="flex flex-col gap-4">
         {loading ? <div className="text-gray-500">Завантаження...</div> : filtered.length === 0 ? (
           <div className="p-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] text-center">
             <Calendar size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
             <p className="text-gray-500 dark:text-gray-400 font-medium">Немає записів за цим фільтром.</p>
           </div>
         ) : filtered.map(b => (
           <div key={b.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              
              <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-3">
                   {b.status === 'pending' && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black tracking-widest uppercase rounded-md flex items-center gap-1"><Clock4 size={12}/> ЧЕКАЄ ВІДПОВІДІ</span>}
                   {b.status === 'confirmed' && <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black tracking-widest uppercase rounded-md flex items-center gap-1"><CheckCircle2 size={12}/> ПІДТВЕРДЖЕНО</span>}
                   {b.status === 'rejected' && <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black tracking-widest uppercase rounded-md flex items-center gap-1"><XCircle size={12}/> ВІДХИЛЕНО</span>}
                   {b.status === 'updating' && <span className="text-[10px]">Оновлення...</span>}
                 </div>

                 <div>
                   <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
                     <Car size={18} className="text-[#5C3EFE]" />
                     {b.car ? `${b.car.brand} ${b.car.model} (${b.car.plate})` : 'Автомобіль вилучено'}
                   </h3>
                   <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                     <span className="flex items-center gap-1"><User size={14}/> {b.driver?.displayName || 'Анонім'}</span>
                     <span className="flex items-center gap-1"><Phone size={14}/> {b.driver?.phone || 'Не вказано'}</span>
                   </div>
                 </div>

                 <p className="text-sm font-medium mt-2 bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-xl line-clamp-3 leading-relaxed">
                   {b.issue}
                 </p>
              </div>

              <div className="flex flex-col md:items-end w-full md:w-auto mt-4 md:mt-0 gap-4 shrink-0">
                 <div className="flex items-center gap-6 px-6 py-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 tracking-widest uppercase mb-1">ДАТА</p>
                      <p className="font-bold text-lg leading-none">{b.date?.split('-').reverse().join('.')}</p>
                    </div>
                    <div className="w-px h-8 bg-indigo-200 dark:bg-indigo-800"></div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 tracking-widest uppercase mb-1">ЧАС</p>
                      <p className="font-bold text-lg leading-none">{b.time}</p>
                    </div>
                 </div>

                 {b.status === 'pending' && (
                   <div className="flex gap-2 w-full mt-2">
                     <button onClick={() => updateStatus(b.id, 'rejected')} className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors active:scale-95">Відхилити</button>
                     <button onClick={() => updateStatus(b.id, 'confirmed')} className="flex-[2] py-3 bg-[#5C3EFE] hover:bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex justify-center items-center gap-2"><CheckCircle2 size={16}/> Підтвердити</button>
                   </div>
                 )}
              </div>
           </div>
         ))}
      </div>
    </div>
  )
}
