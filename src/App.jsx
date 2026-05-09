import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, getDocs, collection, query, where, addDoc, updateDoc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore'

// Context & Constants
import { ThemeCtx } from './context/ThemeContext'
// SUBSCRIPTION: PLANS removed for free launch

// Layout
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'

// Views
import { DashboardView } from './components/views/DashboardView'
import { GarageView } from './components/views/GarageView'
import { HistoryView } from './components/views/HistoryView'
import { AIView } from './components/views/AIView'
import { TeamView } from './components/views/TeamView'
// SUBSCRIPTION: import { PlansView, STOPricingView } from './components/views/PlansView'
import { SettingsView } from './components/views/SettingsView'
import { AdminView } from './components/views/AdminView'
import { STODashboardView } from './components/views/STODashboardView'
import { PublicReportView } from './components/views/PublicReportView'
import { ClientBookingsView } from './components/views/ClientBookingsView'
import { STOBookingsView } from './components/views/STOBookingsView'
import { STOClientsView } from './components/views/STOClientsView'
import { STOActsView } from './components/views/STOActsView'

// Modals
import { CarDetailsModal } from './components/modals/CarDetailsModal'
import { CarReportModal } from './components/modals/CarReportModal'
import { TransferCarModal, InviteMemberModal } from './components/modals/Modals'

// Auth
import { AuthScreen } from './components/auth/AuthScreen'
import { LandingView } from './components/views/LandingView'
import { PWAInstallBanner } from './components/common/PWAInstallBanner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function AppShell({ children, currentUser, userProfile, isDark, setDark, col, setCol,
  showMobileMenu, setShowMobileMenu, isAdmin, incomingTransfer, setIncomingTransfer,
  historyList, bookingNotifications, incomingInvites, handleAcceptInvite, handleRejectInvite,
  handleAcceptService, handleRejectService, markNotificationAsRead, markAllNotificationsAsRead }) {

  const location = useLocation()
  const isAiRoute = location.pathname === '/ai'

  return (
    <div className={`fixed inset-0 flex overflow-hidden font-sans ${isDark ? 'dark' : ''}`} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar
        col={col}
        isAdmin={isAdmin}
        userProfile={userProfile}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        onLogout={() => signOut(auth)}
      />
      <div className="flex flex-1 flex-col min-h-0 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        {!isAiRoute && (
          <Topbar
            isDark={isDark}
            setDark={setDark}
            incomingTransfer={incomingTransfer}
            onAcceptTransfer={() => setIncomingTransfer(null)}
            onRejectTransfer={() => setIncomingTransfer(null)}
            onLogout={() => signOut(auth)}
            currentUser={currentUser}
            userProfile={userProfile}
            col={col}
            setCol={setCol}
            pendingApprovals={historyList.filter(h => h.status === 'pending_approval' && h.userId === currentUser.uid)}
            bookingNotifications={bookingNotifications}
            incomingInvites={incomingInvites}
            onAcceptInvite={handleAcceptInvite}
            onRejectInvite={handleRejectInvite}
            onAcceptService={handleAcceptService}
            onRejectService={handleRejectService}
            showMobileMenu={showMobileMenu}
            setShowMobileMenu={setShowMobileMenu}
            onMarkRead={markNotificationAsRead}
            onMarkAllRead={markAllNotificationsAsRead}
          />
        )}
        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(undefined)
  const [userProfile, setUserProfile] = useState(null)
  const [mode, setMode] = useState('landing') // 'landing' | 'auth'
  const [col, setCol] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isDark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : false
  })
  const [carList, setCarList] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [selectedCar, setSelectedCar] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [incomingTransfer, setIncomingTransfer] = useState(null)
  const [bookingNotifications, setBookingNotifications] = useState([])
  const [preselectedSto, setPreselectedSto] = useState(null)
  const [incomingInvites, setIncomingInvites] = useState([])

  // SUBSCRIPTION: const activePlan = PLANS.find(p => p.id === (userProfile?.plan || 'Free')) || PLANS[0]
  // SUBSCRIPTION: const TEAM_LIMIT = activePlan.teamLimit
  const TEAM_LIMIT = Infinity // Free launch — no limits
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Олександр (Ви)', email: 'owner@autolog.ua', role: 'owner', status: 'active' }
  ])
  const [showInviteModal, setShowInviteModal] = useState(false)

  // --- ROBUST DATA ORCHESTRATION ---
  const [relevantUids, setRelevantUids] = useState([])

  // 1. Auth & Profile
  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (!user) {
        setUserProfile(null)
        setCarList([])
        setHistoryList([])
        setRelevantUids([])
        return
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const up = snap.data()
          setUserProfile(up)
          if (up.accountType === 'sto') {
            navigate('/sto', { replace: true })
          }
        } else {
          setUserProfile({ phone: '', city: '', avatarBase64: '', accountType: 'owner' })
        }
      } catch (e) {
        console.error('Profile error:', e)
      }
    })
    return () => unsub()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Invitation & Team Tracking
  useEffect(() => {
    if (!currentUser?.email) return
    const lowerEmail = currentUser.email.toLowerCase()
    const q = query(
      collection(db, 'team_invitations'),
      where('email', 'in', [currentUser.email, lowerEmail]),
      where('status', '==', 'active')
    )
    const unsub = onSnapshot(q, (snap) => {
      const ownerIds = snap.docs.map(d => d.data().ownerId).filter(id => typeof id === 'string' && id)
      const uids = Array.from(new Set([currentUser.uid, ...ownerIds])).filter(Boolean)
      setRelevantUids(uids)
    })
    return () => unsub()
  }, [currentUser])

  // 3. Real-time Cars & History
  useEffect(() => {
    if (relevantUids.length === 0) {
      setCarList([])
      setHistoryList([])
      return
    }
    const carQ = query(collection(db, 'cars'), where('userId', 'in', relevantUids.slice(0, 10)))
    const unsubCars = onSnapshot(carQ, (snap) => {
      setCarList(snap.docs.map(d => ({ ...d.data(), id: d.id })))
    }, (err) => console.error('Cars listener error:', err))

    const histQ = query(collection(db, 'history'), where('userId', 'in', relevantUids.slice(0, 10)))
    const unsubHist = onSnapshot(histQ, (snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id }))
      list.sort((a, b) => (new Date(b.date) - new Date(a.date)) || (b.createdAt - a.createdAt))
      setHistoryList(list)
    }, (err) => console.error('History listener error:', err))

    return () => {
      unsubCars()
      unsubHist()
    }
  }, [relevantUids])

  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'team_invitations'), where('ownerId', '==', currentUser.uid))
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setTeamMembers([
        { id: 'owner', name: userProfile?.name || 'Ви', email: currentUser.email, role: 'owner', status: 'active' },
        ...list
      ])
    })
    return () => unsub()
  }, [currentUser, userProfile])

  useEffect(() => {
    if (!currentUser || !userProfile) {
      setBookingNotifications([])
      return
    }
    const isSto = userProfile.accountType === 'sto'
    const q = isSto
      ? query(collection(db, 'bookings'), where('stoId', '==', currentUser.uid))
      : query(collection(db, 'bookings'), where('userId', '==', currentUser.uid))

    const unsub = onSnapshot(q, async snap => {
      const list = []
      for (const d of snap.docs) {
        const b = { id: d.id, ...d.data() }
        if (isSto) {
          if (b.status === 'pending') list.push(b)
        } else {
          if (b.status === 'confirmed' || b.status === 'rejected') list.push(b)
        }
      }
      const unread = list.filter(b => !b.readByRecipient)
      unread.sort((a, b) => b.createdAt - a.createdAt)

      for (const b of unread) {
        if (isSto && b.carId) {
          try {
            const cSnap = await getDoc(doc(db, 'cars', String(b.carId)))
            if (cSnap.exists()) b.car = cSnap.data()
          } catch (e) { /* noop */ }
        }
        if (!isSto && b.stoId) {
          try {
            const sSnap = await getDoc(doc(db, 'users', String(b.stoId)))
            if (sSnap.exists()) b.sto = sSnap.data()
          } catch (e) { /* noop */ }
        }
      }
      setBookingNotifications(unread)
    })
    return () => unsub()
  }, [currentUser, userProfile])

  useEffect(() => {
    if (!currentUser || !currentUser.email) return
    const lowerEmail = currentUser.email.toLowerCase()
    const q = query(
      collection(db, 'team_invitations'),
      where('email', 'in', [currentUser.email, lowerEmail]),
      where('status', '==', 'pending')
    )
    const unsub = onSnapshot(q, snap => {
      setIncomingInvites(snap.docs.map(d => ({ ...d.data(), id: d.id })))
    })
    return () => unsub()
  }, [currentUser])

  const markNotificationAsRead = async (id) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'bookings', id), { readByRecipient: true })
    } catch (e) { console.error(e) }
  }

  const markAllNotificationsAsRead = async () => {
    if (!currentUser || bookingNotifications.length === 0) return
    const batch = writeBatch(db)
    bookingNotifications.forEach(b => {
      batch.update(doc(db, 'bookings', b.id), { readByRecipient: true })
    })
    try {
      await batch.commit()
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // SUBSCRIPTION: AI usage tracking disabled for free launch
  const onUpdateAIUsage = async () => {
    // no-op during free launch
  }

  const isAdmin = currentUser?.email === 'olehmelnykovych@gmail.com' || userProfile?.role === 'Admin'

  const addCar = async car => {
    if (!currentUser) return
    try {
      await addDoc(collection(db, 'cars'), { ...car, userId: currentUser.uid })
    } catch (e) { console.error(e) }
  }

  const updateCar = async (carId, updates) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'cars', carId), updates)
    } catch (e) { console.error(e) }
  }

  const addService = async svc => {
    if (!currentUser) return
    try {
      const ts = Date.now()
      await addDoc(collection(db, 'history'), { ...svc, userId: currentUser.uid, createdAt: ts })
      if (svc.carId && svc.mileage) {
        const car = carList.find(c => String(c.id) === String(svc.carId))
        if (car && svc.mileage > (car.mileage || 0)) {
          await updateDoc(doc(db, 'cars', svc.carId), { mileage: svc.mileage })
        }
      }
    } catch (e) { console.error(e) }
  }

  const updateService = async svc => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'history', svc.id), svc)
      if (svc.carId && svc.mileage) {
        const car = carList.find(c => String(c.id) === String(svc.carId))
        if (car && svc.mileage > (car.mileage || 0)) {
          await updateDoc(doc(db, 'cars', svc.carId), { mileage: svc.mileage })
        }
      }
    } catch (e) { console.error(e) }
  }

  const deleteService = async id => {
    if (!currentUser) return false
    try {
      await deleteDoc(doc(db, 'history', id))
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  const handleAcceptService = async (svcId) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'history', svcId), { status: 'verified' })
    } catch (e) { console.error(e) }
  }

  const handleAcceptInvite = async (invId) => {
    if (!currentUser || !invId) return
    try {
      await updateDoc(doc(db, 'team_invitations', String(invId)), { status: 'active' })
    } catch (e) {
      console.error('Accept invite error:', e)
      throw e
    }
  }

  const handleRejectInvite = async (invId) => {
    if (!currentUser || !invId) return
    try {
      await deleteDoc(doc(db, 'team_invitations', String(invId)))
    } catch (e) {
      console.error('Reject invite error:', e)
      throw e
    }
  }

  const handleRejectService = async (svcId) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'history', svcId), { status: 'rejected' })
    } catch (e) { console.error(e) }
  }

  const handleTransfer = async (email) => {
    if (!selectedCar || !currentUser) return
    try {
      const q = query(collection(db, 'users'), where('email', '==', email))
      const snap = await getDocs(q)
      if (snap.empty) { alert('Користувача не знайдено!'); return }
      const recipientUid = snap.docs[0].id
      const batch = writeBatch(db)
      batch.update(doc(db, 'cars', selectedCar.id), { userId: recipientUid })
      historyList.filter(h => h.carId === selectedCar.id).forEach(h => {
        batch.update(doc(db, 'history', h.id), { userId: recipientUid })
      })
      await batch.commit()
      setShowTransfer(false)
      setSelectedCar(null)
      navigate('/dashboard')
      alert('Авто успішно передано!')
    } catch (e) { console.error(e); alert('Помилка передачі.') }
  }

  // --- Loading state ---
  if (currentUser === undefined || (currentUser && userProfile === null)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', background: 'var(--bg)' }} className={isDark ? 'dark' : ''}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 22, background: 'var(--bg-card)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, boxShadow: '0 8px 24px rgba(92,62,254,0.2)' }}>
            <img src="/logo.png" alt="AutoLog" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 160, height: 4, background: 'var(--line-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div className="animate-progress-loading" style={{ height: '100%', background: 'var(--brand)', borderRadius: 99, width: '40%' }}></div>
            </div>
            <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Завантаження...</p>
          </div>
        </div>
      </div>
    )
  }

  // --- Not logged in ---
  if (currentUser === null) {
    return (
      <Routes>
        <Route path="/share/:carId" element={<PublicReportViewWrapper />} />
        <Route path="/auth" element={<AuthScreen isDark={isDark} setDark={setDark} onBack={() => navigate('/')} />} />
        <Route path="/" element={
          mode === 'auth'
            ? <AuthScreen isDark={isDark} setDark={setDark} onBack={() => setMode('landing')} />
            : <LandingView onLogin={() => setMode('auth')} />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // --- Shared route accessible while logged in ---
  const isSto = userProfile?.accountType === 'sto'
  const defaultRoute = isSto ? '/sto' : '/dashboard'

  const shellProps = {
    currentUser, userProfile, isDark, setDark, col, setCol,
    showMobileMenu, setShowMobileMenu, isAdmin,
    incomingTransfer, setIncomingTransfer,
    historyList, bookingNotifications, incomingInvites,
    handleAcceptInvite, handleRejectInvite,
    handleAcceptService, handleRejectService,
    markNotificationAsRead, markAllNotificationsAsRead,
  }

  const scrollWrapper = (maxW, children) => (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
      <div className={`${maxW} mx-auto space-y-6`}>{children}</div>
    </div>
  )

  return (
    <ThemeCtx.Provider value={isDark}>
      <PWAInstallBanner />
      <Routes>
        {/* Public shared report — no shell */}
        <Route path="/share/:carId" element={<PublicReportViewWrapper />} />

        {/* AI view — full screen, no topbar (shell handles that via isAiRoute) */}
        <Route path="/ai" element={
          <AppShell {...shellProps}>
            <AIView
              carList={carList}
              historyList={historyList}
              userProfile={userProfile}
              onUpdateAIUsage={onUpdateAIUsage}
              onGoPlans={() => navigate('/plans')}
              onGoBookings={() => navigate('/bookings')}
              onMenu={() => setShowMobileMenu(true)}
              onBack={() => navigate('/dashboard')}
            />
          </AppShell>
        } />

        {/* Owner routes */}
        <Route path="/dashboard" element={
          isSto ? <Navigate to="/sto" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <DashboardView carList={carList} historyList={historyList} />)}
          </AppShell>
        } />
        <Route path="/garage" element={
          isSto ? <Navigate to="/sto" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <GarageView carList={carList} onAddCar={addCar} onUpdateCar={updateCar} onSelectCar={setSelectedCar} userProfile={userProfile} onGoPlans={() => {}} />)}
          </AppShell>
        } />
        <Route path="/bookings" element={
          isSto ? <Navigate to="/sto/bookings" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <ClientBookingsView carList={carList} preselectedSto={preselectedSto} onClearPreselected={() => setPreselectedSto(null)} />)}
          </AppShell>
        } />
        <Route path="/service" element={
          isSto ? <Navigate to="/sto" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <HistoryView historyList={historyList} carList={carList} onAddService={addService} onUpdateService={updateService} onDeleteService={deleteService} />)}
          </AppShell>
        } />
        <Route path="/team" element={
          isSto ? <Navigate to="/sto" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <TeamView teamMembers={teamMembers} limit={TEAM_LIMIT} onRemove={id => setTeamMembers(p => p.filter(m => m.id !== id))} onInvite={() => setShowInviteModal(true)} />)}
          </AppShell>
        } />

        {/* Shared routes */}
        <Route path="/settings" element={
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <SettingsView currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} />)}
          </AppShell>
        } />
        {isAdmin && (
          <Route path="/admin" element={
            <AppShell {...shellProps}>
              {scrollWrapper('max-w-7xl', <AdminView />)}
            </AppShell>
          } />
        )}

        {/* STO routes */}
        <Route path="/sto" element={
          !isSto ? <Navigate to="/dashboard" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <STODashboardView userProfile={userProfile} />)}
          </AppShell>
        } />
        <Route path="/sto/bookings" element={
          !isSto ? <Navigate to="/bookings" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-[120rem]', <STOBookingsView userProfile={userProfile} />)}
          </AppShell>
        } />
        <Route path="/sto/clients" element={
          !isSto ? <Navigate to="/dashboard" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <STOClientsView />)}
          </AppShell>
        } />
        <Route path="/sto/acts" element={
          !isSto ? <Navigate to="/dashboard" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <STOActsView userProfile={userProfile} />)}
          </AppShell>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>

      {/* Global modals */}
      {showInviteModal && (
        <InviteMemberModal
          limit={TEAM_LIMIT}
          currentCount={teamMembers.length}
          onClose={() => setShowInviteModal(false)}
          onInvite={async (mbr) => {
            try {
              await addDoc(collection(db, 'team_invitations'), {
                ...mbr,
                ownerId: currentUser.uid,
                fromName: userProfile?.displayName || userProfile?.name || 'Власник',
                createdAt: Date.now(),
                notified: false
              })
              setTeamMembers(p => [...p, mbr])
            } catch (e) { console.error('Invite error:', e) }
          }}
        />
      )}
      {selectedCar && !showReport && !showTransfer && (
        <CarDetailsModal
          car={selectedCar}
          onClose={() => setSelectedCar(null)}
          onGoService={() => navigate('/service')}
          onGoReport={() => setShowReport(true)}
          onGoTransfer={() => setShowTransfer(true)}
        />
      )}
      {showReport && (
        <CarReportModal
          car={selectedCar}
          historyList={historyList}
          userProfile={userProfile}
          onClose={() => setShowReport(false)}
        />
      )}
      {showTransfer && (
        <TransferCarModal
          car={selectedCar}
          onClose={() => setShowTransfer(false)}
          onTransfer={handleTransfer}
        />
      )}
    </ThemeCtx.Provider>
  )
}

// Wrapper to extract :carId param for PublicReportView
function PublicReportViewWrapper() {
  const location = useLocation()
  const carId = location.pathname.split('/')[2]
  return <PublicReportView carId={carId} />
}
