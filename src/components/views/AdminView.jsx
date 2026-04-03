import React, { useState, useEffect, useContext } from 'react'
import { Search, Loader2, Shield, Eye, Trash2, CheckCircle2, ChevronRight, Mail, Phone, Calendar, Edit, X, Save, AlertTriangle, User, CreditCard, Wrench } from 'lucide-react'
import { ThemeCtx } from '../../context/ThemeContext'
import { Modal, Field, inp_cls, PrimaryBtn } from '../common/Common'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { C } from '../../constants'

// --- Edit User Modal ---
function EditUserModal({ user, onClose, onSave }) {
  const [f, setF] = useState({
    displayName: user.displayName || '',
    plan: user.plan || 'Free',
    accountType: user.accountType || 'owner',
    stoName: user.stoName || '',
    stoSubscription: user.stoSubscription || 'inactive',
    phone: user.phone || '',
    city: user.city || '',
    role: user.role || 'user',
  })
  const [saving, setSaving] = useState(false)
  const ic = inp_cls()

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.id), {
        displayName: f.displayName,
        plan: f.plan,
        accountType: f.accountType,
        stoName: f.stoName,
        stoSubscription: f.stoSubscription,
        phone: f.phone,
        city: f.city,
        role: f.role,
      })
      onSave({ ...user, ...f })
    } catch (e) {
      console.error('Error updating user:', e)
      alert('Помилка оновлення користувача')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Редагувати користувача" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* User header */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/60">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-500 font-black text-lg border border-indigo-100 dark:border-indigo-800/50 shrink-0 overflow-hidden">
            {user.avatarBase64 ? <img src={user.avatarBase64} alt="" className="w-full h-full object-cover rounded-2xl" /> : (user.displayName?.[0] || 'U')}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-white tracking-tight truncate">{user.displayName || 'Невідомо'}</p>
            <p className="text-xs text-gray-400 font-medium truncate">{user.email}</p>
          </div>
        </div>

        {/* Name */}
        <Field label="Ім'я користувача">
          <input value={f.displayName} onChange={e => setF({...f, displayName: e.target.value})} className={ic} placeholder="Ім'я" />
        </Field>

        {/* Account type + Role */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Тип акаунту">
            <select value={f.accountType} onChange={e => setF({...f, accountType: e.target.value})} className={ic}>
              <option value="owner">Власник авто</option>
              <option value="sto">СТО Партнер</option>
            </select>
          </Field>
          <Field label="Роль">
            <select value={f.role} onChange={e => setF({...f, role: e.target.value})} className={ic}>
              <option value="user">Користувач</option>
              <option value="admin">Адміністратор</option>
            </select>
          </Field>
        </div>

        {/* Plan (for owners) */}
        {f.accountType === 'owner' && (
          <Field label="Підписка (план)">
            <div className="grid grid-cols-3 gap-2">
              {['Free', 'Premium', 'Business'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setF({...f, plan: p})}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${f.plan === p 
                    ? 'bg-[#5C3EFE] text-white border-[#5C3EFE] shadow-lg shadow-indigo-500/20' 
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-200'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* STO fields */}
        {f.accountType === 'sto' && (
          <>
            <Field label="Назва СТО">
              <input value={f.stoName} onChange={e => setF({...f, stoName: e.target.value})} className={ic} placeholder="Назва вашого СТО" />
            </Field>
            <Field label="Статус підписки СТО">
              <div className="grid grid-cols-2 gap-2">
                {[['active', '✅ Активна'], ['inactive', '⛔ Неактивна']].map(([val, lbl]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setF({...f, stoSubscription: val})}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${f.stoSubscription === val 
                      ? (val === 'active' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 border-green-300 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/30 text-red-500 border-red-300 dark:border-red-700')
                      : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-indigo-200'}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Телефон">
            <input value={f.phone} onChange={e => setF({...f, phone: e.target.value})} className={ic} placeholder="+380..." />
          </Field>
          <Field label="Місто">
            <input value={f.city} onChange={e => setF({...f, city: e.target.value})} className={ic} placeholder="Київ" />
          </Field>
        </div>

        {/* Save */}
        <PrimaryBtn onClick={handleSave} disabled={saving} className="w-full py-4 justify-center text-base mt-2">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Зберегти зміни</>}
        </PrimaryBtn>
      </div>
    </Modal>
  )
}

// --- Delete Confirmation Modal ---
function DeleteUserModal({ user, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const ic = inp_cls()

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'users', user.id))
      onConfirm(user.id)
    } catch (e) {
      console.error('Error deleting user:', e)
      alert('Помилка видалення користувача')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal title="Видалити користувача" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl flex gap-4">
          <div className="shrink-0 text-red-500 mt-0.5"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">Ця дія є незворотною!</p>
            <p className="text-xs text-red-700/80 dark:text-red-300/70 leading-relaxed">
              Видалення профілю користувача <strong>{user.displayName || user.email}</strong> призведе до втрати всіх даних цього користувача з бази. Авто та сервісна історія залишаться в системі.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/60">
          <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-900/40 flex items-center justify-center text-red-500 font-black text-sm border border-red-100 dark:border-red-800/50 shrink-0">
            {user.displayName?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-white tracking-tight">{user.displayName || 'Невідомо'}</p>
            <p className="text-[11px] text-gray-400 font-medium">{user.email}</p>
          </div>
        </div>

        <Field label={<>Введіть <strong className="text-red-500">DELETE</strong> для підтвердження</>}>
          <input 
            value={confirmText} 
            onChange={e => setConfirmText(e.target.value)} 
            className={`${ic} ${confirmText === 'DELETE' ? '!border-red-400 !ring-red-500/20' : ''}`}
            placeholder="DELETE"
            autoFocus
          />
        </Field>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
          >
            Скасувати
          </button>
          <button 
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || deleting}
            className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 active:scale-95"
          >
            {deleting ? <Loader2 size={18} className="animate-spin" /> : <><Trash2 size={16} /> Видалити назавжди</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// --- Main AdminView ---
export function AdminView() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const isDark = useContext(ThemeCtx)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  }, [])

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleEditSave = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
    setEditUser(null)
    showSuccess('Користувача оновлено успішно!')
  }

  const handleDeleteConfirm = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId))
    setDeleteUser(null)
    showSuccess('Користувача видалено!')
  }

  const filtered = users.filter(u => 
    (u.email || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.stoName || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12 w-full pt-4 relative">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-green-500/30 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 font-bold text-sm">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight uppercase tracking-tighter">Панель керування</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">Управління користувачами платформи та моніторинг активності. <span className="text-indigo-500 font-bold">{users.length} осіб</span></p>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Пошук за email або назвою..." 
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-bold uppercase tracking-widest text-[10px] border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-8 py-5">Користувач</th>
                <th className="px-6 py-5">Тіп акаунту</th>
                <th className="px-6 py-5">Контакти</th>
                <th className="px-6 py-5">Підписка</th>
                <th className="px-8 py-5 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-500 font-black text-sm border border-indigo-100 dark:border-indigo-800/50 shrink-0">
                        {u.avatarBase64 ? <img src={u.avatarBase64} alt="" className="w-full h-full object-cover rounded-2xl" /> : (u.displayName?.[0] || 'U')}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white mb-0.5 tracking-tight">{u.displayName || 'Невідомо'}</p>
                        <p className="text-[11px] text-gray-400 font-medium lowercase tracking-tight">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${u.accountType === 'sto' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'}`}>
                      {u.accountType === 'sto' ? 'СТО Партнер' : 'Власник авто'}
                    </span>
                    {u.stoName && <p className="text-[10px] font-bold text-gray-400 mt-1 ml-1 truncate max-w-[150px]">{u.stoName}</p>}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1 text-[11px] font-medium text-gray-500">
                      <div className="flex items-center gap-2"><Phone size={12} className="text-gray-300"/> {u.phone || '—'}</div>
                      <div className="flex items-center gap-2"><Calendar size={12} className="text-gray-300"/> {u.city || '—'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight ${u.plan === 'Premium' || u.plan === 'Business' || u.stoSubscription === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {u.accountType === 'sto' ? (u.stoSubscription === 'active' ? 'ACTIVE' : 'INACTIVE') : (u.plan || 'Free')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditUser(u)}
                        className="p-2.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all active:scale-90"
                        title="Редагувати"
                      >
                        <Edit size={16}/>
                      </button>
                      <button 
                        onClick={() => setDeleteUser(u)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl transition-all active:scale-90"
                        title="Видалити"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {editUser && (
        <EditUserModal 
          user={editUser} 
          onClose={() => setEditUser(null)} 
          onSave={handleEditSave} 
        />
      )}
      {deleteUser && (
        <DeleteUserModal 
          user={deleteUser} 
          onClose={() => setDeleteUser(null)} 
          onConfirm={handleDeleteConfirm} 
        />
      )}
    </div>
  )
}
