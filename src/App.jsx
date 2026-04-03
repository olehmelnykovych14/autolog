import React, { useState, useEffect, useContext, useRef } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, getDocs, collection, query, where, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'

// Context & Constants
import { ThemeCtx } from './context/ThemeContext'
import { C } from './constants'

// Layout
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'

// Views
import { DashboardView } from './components/views/DashboardView'
import { GarageView } from './components/views/GarageView'
import { HistoryView } from './components/views/HistoryView'
import { AIView } from './components/views/AIView'
import { TeamView } from './components/views/TeamView'
import { PlansView, STOPricingView } from './components/views/PlansView'
import { SettingsView } from './components/views/SettingsView'
import { AdminView } from './components/views/AdminView'
import { STODashboardView } from './components/views/STODashboardView'

// Modals
import { CarDetailsModal } from './components/modals/CarDetailsModal'
import { CarReportModal } from './components/modals/CarReportModal'
import { TransferCarModal, InviteMemberModal } from './components/modals/index'

// Auth
import { AuthScreen } from './components/auth/AuthScreen'

export default function App() {
  const [currentUser, setCurrentUser] = useState(undefined)
  const [userProfile, setUserProfile] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [col, setCol] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isDark, setDark] = useState(false)
  const [carList, setCarList] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [selectedCar, setSelectedCar] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [incomingTransfer, setIncomingTransfer] = useState(null)

  const TEAM_LIMIT = 5
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Олександр (Ви)', email: 'owner@autolog.ua', role: 'owner', status: 'active' }
  ])
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    if (!auth) {
      setCurrentUser(null)
      return
    }
    const unsub = onAuthStateChanged(auth, async user => {
      setCurrentUser(user)
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          if (snap.exists()) {
            const up = snap.data()
            setUserProfile(up)
            if (up.accountType === 'sto' && tab === 'dashboard') {
              setTab('sto')
            }
          } else {
            setUserProfile({ phone: '', city: '', avatarBase64: '' })
          }

          const carSnap = await getDocs(query(collection(db, 'cars'), where('userId', '==', user.uid)))
          setCarList(carSnap.docs.map(d => ({ id: d.id, ...d.data() })))

          const histSnap = await getDocs(query(collection(db, 'history'), where('userId', '==', user.uid)))
          const hList = histSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          hList.sort((a, b) => {
            const dA = new Date(a.date).getTime()
            const dB = new Date(b.date).getTime()
            if (dA === dB) return (b.createdAt || 0) - (a.createdAt || 0)
            return dB - dA
          })
          setHistoryList(hList)

        } catch (e) {
          console.error("Firestore error:", e)
        }
      } else {
        setUserProfile(null)
        setCarList([])
        setHistoryList([])
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    if (!userProfile) return
    const isStoTab = ['sto', 'sto_plans'].includes(tab)
    const isOwnerTab = ['dashboard', 'garage', 'service', 'plans', 'ai', 'team'].includes(tab)
    
    if (isStoTab && userProfile.accountType !== 'sto') {
      setTab('dashboard')
    }
    if (isOwnerTab && userProfile.accountType === 'sto') {
      setTab('sto')
    }
  }, [tab, userProfile?.accountType])

  const isAdmin = currentUser?.email === 'olehmelnykovych@gmail.com' || userProfile?.role === 'Admin'

  const addCar = async car => {
    if (!currentUser) return
    try {
      const docRef = await addDoc(collection(db, 'cars'), { ...car, userId: currentUser.uid })
      setCarList(p => [{ ...car, id: docRef.id, userId: currentUser.uid }, ...p])
    } catch (e) { console.error(e) }
  }

  const addService = async svc => {
    if (!currentUser) return
    try {
      const ts = Date.now()
      const docRef = await addDoc(collection(db, 'history'), { ...svc, userId: currentUser.uid, createdAt: ts })
      setHistoryList(p => {
        const h = [{ ...svc, id: docRef.id, userId: currentUser.uid, createdAt: ts }, ...p]
        h.sort((a, b) => {
          const dA = new Date(a.date).getTime()
          const dB = new Date(b.date).getTime()
          if (dA === dB) return (b.createdAt || 0) - (a.createdAt || 0)
          return dB - dA
        })
        return h
      })
    } catch (e) { console.error(e) }
  }

  const updateService = async svc => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'history', svc.id), svc)
      setHistoryList(p => p.map(h => h.id === svc.id ? svc : h))
    } catch (e) { console.error(e) }
  }

  const deleteService = async id => {
    if (!currentUser) return
    try {
      await deleteDoc(doc(db, 'history', id))
      setHistoryList(p => p.filter(h => h.id !== id))
    } catch (e) { console.error(e) }
  }

  const handleAcceptService = async (svcId) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'history', svcId), { status: 'verified' })
      setHistoryList(p => p.map(h => h.id === svcId ? { ...h, status: 'verified' } : h))
    } catch (e) { console.error(e) }
  }

  const handleRejectService = async (svcId) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'history', svcId), { status: 'rejected' })
      setHistoryList(p => p.map(h => h.id === svcId ? { ...h, status: 'rejected' } : h))
    } catch (e) { console.error(e) }
  }

  const handleTransfer = async (email) => {
    if (!selectedCar || !currentUser) return
    try {
      const q = query(collection(db, 'users'), where('email', '==', email))
      const snap = await getDocs(q)
      if (snap.empty) { alert("Користувача не знайдено!"); return }
      const recipientUid = snap.docs[0].id
      const batch = writeBatch(db)
      batch.update(doc(db, 'cars', selectedCar.id), { userId: recipientUid })
      historyList.filter(h => h.carId === selectedCar.id).forEach(h => {
        batch.update(doc(db, 'history', h.id), { userId: recipientUid })
      })
      await batch.commit()
      setCarList(p => p.filter(c => c.id !== selectedCar.id))
      setHistoryList(p => p.filter(h => h.carId !== selectedCar.id))
      setShowTransfer(false); setSelectedCar(null); setTab('dashboard')
      alert(`Авто успішно передано!`)
    } catch (e) { console.error(e); alert("Помилка передачі.") }
  }

  const handleUpdatePlan = async (planId) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { plan: planId })
      setUserProfile(p => ({ ...p, plan: planId }))
    } catch (e) { console.error(e); throw e }
  }

  if (currentUser === undefined) {
    return <div className={`flex items-center justify-center h-screen w-full bg-gray-50 dark:bg-gray-900 ${isDark ? 'dark' : ''}`}><div className="animate-spin text-[#5C3EFE]"><LayoutDashboard size={40} /></div></div>
  }

  if (currentUser === null) {
    return <AuthScreen isDark={isDark} setDark={setDark} />
  }

  return (
    <ThemeCtx.Provider value={isDark}>
      <div className={`flex h-screen w-full font-sans overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white ${isDark ? 'dark' : ''}`}>
        <Sidebar tab={tab} setTab={setTab} col={col} setCol={setCol} isAdmin={isAdmin} userProfile={userProfile} showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} onLogout={() => signOut(auth)} />
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <Topbar isDark={isDark} setDark={setDark} incomingTransfer={incomingTransfer} onAcceptTransfer={() => setIncomingTransfer(null)} onRejectTransfer={() => setIncomingTransfer(null)} onLogout={() => signOut(auth)} currentUser={currentUser} userProfile={userProfile} col={col} setCol={setCol} pendingApprovals={historyList.filter(h => h.status === 'pending_approval' && h.userId === currentUser.uid)} onAcceptService={handleAcceptService} onRejectService={handleRejectService} showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
          <main className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${tab === 'ai' ? 'bg-white dark:bg-gray-800' : 'bg-[#F8FAFC] dark:bg-gray-950'}`}>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <div className="max-w-7xl mx-auto space-y-6 pb-12">
                {tab === 'dashboard' && <DashboardView carList={carList} historyList={historyList} />}
                {tab === 'garage' && <GarageView carList={carList} onAddCar={addCar} onSelectCar={setSelectedCar} userProfile={userProfile} onGoPlans={() => setTab('plans')} />}
                {tab === 'service' && <HistoryView historyList={historyList} carList={carList} onAddService={addService} onUpdateService={updateService} onDeleteService={deleteService} />}
                {tab === 'ai' && <AIView carList={carList} historyList={historyList} />}
                {tab === 'team' && <TeamView teamMembers={teamMembers} limit={TEAM_LIMIT} onRemove={id => setTeamMembers(p => p.filter(m => m.id !== id))} onInvite={() => setShowInviteModal(true)} />}
                {tab === 'plans' && <PlansView carList={carList} userProfile={userProfile} onUpdatePlan={handleUpdatePlan} />}
                {tab === 'settings' && <SettingsView currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} />}
                {tab === 'admin' && isAdmin && <AdminView />}
                {tab === 'sto' && userProfile?.accountType === 'sto' && <STODashboardView userProfile={userProfile} setTab={setTab} />}
                {tab === 'sto_plans' && userProfile?.accountType === 'sto' && <STOPricingView currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} setTab={setTab} />}
              </div>
            </div>
          </main>
        </div>
        {showInviteModal && <InviteMemberModal limit={TEAM_LIMIT} currentCount={teamMembers.length} onClose={() => setShowInviteModal(false)} onInvite={mbr => setTeamMembers(p => [...p, mbr])} />}
        {selectedCar && !showReport && !showTransfer && <CarDetailsModal car={selectedCar} onClose={() => setSelectedCar(null)} onGoService={() => setTab('service')} onGoReport={() => setShowReport(true)} onGoTransfer={() => setShowTransfer(true)} />}
        {showReport && <CarReportModal car={selectedCar} historyList={historyList} onClose={() => setShowReport(false)} />}
        {showTransfer && <TransferCarModal car={selectedCar} onClose={() => setShowTransfer(false)} onTransfer={handleTransfer} />}
      </div>
    </ThemeCtx.Provider>
  )
}
