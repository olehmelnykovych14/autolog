import { useState, useEffect, lazy, Suspense, Component } from 'react'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 32, color: '#ef4444', fontFamily: 'monospace', fontSize: 13 }}>
        <b>Помилка рендеру:</b><br/>{this.state.error?.message}<br/><pre style={{fontSize:11,marginTop:8,whiteSpace:'pre-wrap'}}>{this.state.error?.stack?.slice(0,500)}</pre>
        <button onClick={() => this.setState({ error: null })} style={{ marginTop: 12, padding: '6px 14px', background: '#5C3EFE', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Спробувати знову</button>
      </div>
    )
    return this.props.children
  }
}
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'

import { auth, db, safeEnableNetwork } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, getDocs, collection, query, where, addDoc, updateDoc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore'

// Context & Constants
import { ThemeCtx } from './context/ThemeContext'

// Layout
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'

// Auth & Landing (always needed)
import { AuthScreen } from './components/auth/AuthScreen'
import { LandingView } from './components/views/LandingView'
import { PWAInstallBanner } from './components/common/PWAInstallBanner'

// Modals (loaded with app shell)
import { CarDetailsModal } from './components/modals/CarDetailsModal'
import { CarReportModal } from './components/modals/CarReportModal'
import { TransferCarModal, InviteMemberModal } from './components/modals/Modals'

// Views — lazy loaded per route
const DashboardView = lazy(() => import('./components/views/DashboardView').then(m => ({ default: m.DashboardView })))
const GarageView = lazy(() => import('./components/views/GarageView').then(m => ({ default: m.GarageView })))
const HistoryView = lazy(() => import('./components/views/HistoryView').then(m => ({ default: m.HistoryView })))
const AIView = lazy(() => import('./components/views/AIView').then(m => ({ default: m.AIView })))
const TeamView = lazy(() => import('./components/views/TeamView').then(m => ({ default: m.TeamView })))
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })))
const AdminView = lazy(() => import('./components/views/AdminView').then(m => ({ default: m.AdminView })))
const STODashboardView = lazy(() => import('./components/views/STODashboardView').then(m => ({ default: m.STODashboardView })))
const PublicReportView = lazy(() => import('./components/views/PublicReportView').then(m => ({ default: m.PublicReportView })))
const ClientBookingsView = lazy(() => import('./components/views/ClientBookingsView').then(m => ({ default: m.ClientBookingsView })))
const STOBookingsView = lazy(() => import('./components/views/STOBookingsView').then(m => ({ default: m.STOBookingsView })))
const STOClientsView = lazy(() => import('./components/views/STOClientsView').then(m => ({ default: m.STOClientsView })))
const STOActsView = lazy(() => import('./components/views/STOActsView').then(m => ({ default: m.STOActsView })))
const STOSettingsView = lazy(() => import('./components/views/STOSettingsView').then(m => ({ default: m.STOSettingsView })))
const PlansView = lazy(() => import('./components/views/PlansView').then(m => ({ default: m.PlansView })))
const FindSTOView = lazy(() => import('./components/views/FindSTOView').then(m => ({ default: m.FindSTOView })))
const BlogView = lazy(() => import('./components/views/BlogView'))
const ArticleView = lazy(() => import('./components/views/ArticleView'))


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
        onLogout={() => { localStorage.setItem('al_show_auth', '1'); signOut(auth) }}
      />
      <div className="flex flex-1 flex-col min-h-0 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        {!isAiRoute && (
          <Topbar
            isDark={isDark}
            setDark={setDark}
            incomingTransfer={incomingTransfer}
            onAcceptTransfer={() => setIncomingTransfer(null)}
            onRejectTransfer={() => setIncomingTransfer(null)}
            onLogout={() => { localStorage.setItem('al_show_auth', '1'); signOut(auth) }}
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
          <ErrorBoundary>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#5C3EFE] border-t-transparent rounded-full animate-spin" /></div>}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

// A premium dark glassmorphic layout wrapper for public guest views (pricing, find STO)
function PublicPageLayout({ children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#06061a] text-[#e8eaf6] font-sans relative overflow-hidden flex flex-col">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-radial from-[#5c3efe]/15 to-transparent blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-radial from-[#7c5cff]/10 to-transparent blur-[80px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#06061a]/85 backdrop-blur-md border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline text-white font-bold text-xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5C3EFE] to-[#7C5CFF] flex items-center justify-center shadow-lg shadow-[#5c3efe]/30">
              <img src="/logo.svg" alt="Logo" className="w-5.5 h-5.5 object-contain" />
            </div>
            <span>AutoLog</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/blog" className="text-sm font-semibold text-gray-355 hover:text-white transition-colors no-underline">
              Блог
            </Link>
            <Link to="/pricing" className="text-sm font-semibold text-gray-355 hover:text-white transition-colors no-underline">
              Тарифи
            </Link>
            <Link to="/sto-map" className="text-sm font-semibold text-gray-355 hover:text-white transition-colors no-underline">
              Знайти СТО
            </Link>
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest text-white rounded-xl bg-gradient-to-r from-[#5c3efe] to-[#7c5cff] border-0 cursor-pointer hover:shadow-lg hover:shadow-[#5c3efe]/25 hover:-translate-y-[1px] active:translate-y-0 transition-all"
            >
              Увійти
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div style={{ width: 36, height: 36, border: '3px solid var(--line-2)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        }>
          {children}
        </Suspense>
      </main>

      {/* Main Footer */}
      <footer className="relative z-10 py-8 px-6 text-center border-t border-white/5 bg-[#050512]">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} AutoLog. Усі права захищено. Зроблено з любов’ю для водіїв України.
        </p>
      </footer>
    </div>
  )
}

export default function App() {

  const navigate = useNavigate()
  const location = useLocation()

  // Re-enable Firestore network when transitioning away from STO or public report views
  useEffect(() => {
    const path = location.pathname
    const isOfflinePath = path.startsWith('/sto') || path.startsWith('/report/')
    if (!isOfflinePath) {
      safeEnableNetwork()
    }
  }, [location.pathname])

  const [currentUser, setCurrentUser] = useState(undefined)
  const [userProfile, setUserProfile] = useState(null)
  const [authTimedOut, setAuthTimedOut] = useState(false)
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

  // Update plan in Firestore and state
  const updatePlan = async (planId) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { plan: planId })
      setUserProfile(p => ({ ...p, plan: planId }))
    } catch (e) {
      console.error(e)
      throw e
    }
  }


  // --- ROBUST DATA ORCHESTRATION ---
  const [relevantUids, setRelevantUids] = useState([])

  // Instantly set self UID to avoid asynchronous data-loading race conditions in E2E tests
  useEffect(() => {
    if (currentUser?.uid) {
      setRelevantUids([currentUser.uid])
    } else {
      setRelevantUids([])
    }
  }, [currentUser])

  // Force-exit loading screen if auth takes too long
  useEffect(() => {
    if (currentUser !== undefined) return
    const wasLoggedIn = localStorage.getItem('al_authed') === '1'
    const delay = wasLoggedIn ? 4000 : 2000
    const t = setTimeout(() => setAuthTimedOut(true), delay)
    return () => clearTimeout(t)
  }, [currentUser])

  // Clear show-auth flag once user has hit auth screen
  useEffect(() => {
    if (currentUser === null && mode === 'auth') {
      localStorage.removeItem('al_show_auth')
    }
  }, [currentUser, mode])

  // 1. Auth & Profile
  useEffect(() => {
    if (!auth) return
    let unsubProfile = null
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      safeEnableNetwork()
      if (unsubProfile) {
        unsubProfile()
        unsubProfile = null
      }
      setCurrentUser(user)
      if (!user) {
        localStorage.removeItem('al_authed')
        localStorage.removeItem('al_profile_type')
        setUserProfile(null)
        setCarList([])
        setHistoryList([])
        setRelevantUids([])
        
        // Auto-redirect from private paths to / upon logout to avoid 404 page
        const path = window.location.pathname
        const isPrivate = ['/dashboard', '/garage', '/bookings', '/service', '/team', '/settings', '/admin', '/sto'].some(p => path === p || path.startsWith(p + '/'))
        if (isPrivate) {
          navigate('/', { replace: true })
        }
        return
      }
      localStorage.setItem('al_authed', '1')
      
      // Subscribe to user document changes in real time
      unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const up = snap.data()
          setUserProfile(up)
          const isUpSto = up.accountType === 'sto' || up.role === 'СТО' || up.role === 'sto'
          localStorage.setItem('al_profile_type', isUpSto ? 'sto' : 'owner')
          if (isUpSto) {
            const path = window.location.pathname
            if (!path.startsWith('/sto')) {
              navigate('/sto', { replace: true })
            }
          } else {
            safeEnableNetwork()
          }
        } else {
          // Default profile if the document doesn't exist yet (will update automatically when setDoc resolves)
          setUserProfile({ phone: '', city: '', avatarBase64: '', accountType: 'owner' })
        }
      }, (err) => {
        console.error('Profile real-time error:', err)
        const cached = localStorage.getItem('al_profile_type')
        const accountType = cached || 'owner'
        setUserProfile({ phone: '', city: '', avatarBase64: '', accountType })
        if (accountType === 'sto') {
          const path = window.location.pathname
          if (!path.startsWith('/sto')) {
            navigate('/sto', { replace: true })
          }
        }
      })
    })
    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Invitation & Team Tracking (one-time fetch)
  useEffect(() => {
    if (!currentUser?.email) return
    const lowerEmail = currentUser.email.toLowerCase()
    const q = query(
      collection(db, 'team_invitations'),
      where('email', 'in', [currentUser.email, lowerEmail]),
      where('status', '==', 'active')
    )
    getDocs(q).then(snap => {
      const ownerIds = snap.docs.map(d => d.data().ownerId).filter(id => typeof id === 'string' && id)
      const uids = Array.from(new Set([currentUser.uid, ...ownerIds])).filter(Boolean)
      setRelevantUids(uids)
    }).catch(err => {
      console.error(err)
      if (currentUser?.uid) setRelevantUids([currentUser.uid])
    })
  }, [currentUser])

  // 3. Real-time Cars & History (owner only) — chunked listeners (Firestore 'in' limit = 10)
  useEffect(() => {
    if (relevantUids.length === 0 || userProfile?.accountType === 'sto' || userProfile?.role === 'СТО' || userProfile?.role === 'sto') {
      setCarList([])
      setHistoryList([])
      return
    }
    const chunks = []
    for (let i = 0; i < relevantUids.length; i += 10) chunks.push(relevantUids.slice(i, i + 10))

    const carsByChunk = chunks.map(() => [])
    const histByChunk = chunks.map(() => [])
    const unsubs = []

    chunks.forEach((chunk, idx) => {
      unsubs.push(onSnapshot(
        query(collection(db, 'cars'), where('userId', 'in', chunk)),
        (snap) => {
          carsByChunk[idx] = snap.docs.map(d => ({ ...d.data(), id: d.id }))
          const merged = [...new Map(carsByChunk.flat().map(c => [c.id, c])).values()]
          setCarList(merged)
        },
        (err) => console.error('Cars listener error:', err)
      ))
      unsubs.push(onSnapshot(
        query(collection(db, 'history'), where('userId', 'in', chunk)),
        (snap) => {
          histByChunk[idx] = snap.docs.map(d => ({ ...d.data(), id: d.id }))
          const merged = [...new Map(histByChunk.flat().map(h => [h.id, h])).values()]
          merged.sort((a, b) => (new Date(b.date) - new Date(a.date)) || (b.createdAt - a.createdAt))
          setHistoryList(merged)
        },
        (err) => console.error('History listener error:', err)
      ))
    })

    return () => unsubs.forEach(u => u())
  }, [relevantUids])

  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'team_invitations'), where('ownerId', '==', currentUser.uid))
    getDocs(q).then(snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setTeamMembers([
        { id: 'owner', name: userProfile?.name || 'Ви', email: currentUser.email, role: 'owner', status: 'active' },
        ...list
      ])
    }).catch(console.error)
  }, [currentUser, userProfile])

  useEffect(() => {
    if (!currentUser || !userProfile) {
      setBookingNotifications([])
      return
    }
    const isSto = userProfile.accountType === 'sto' || userProfile.role === 'СТО' || userProfile.role === 'sto'
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
    getDocs(q).then(snap => {
      setIncomingInvites(snap.docs.map(d => ({ ...d.data(), id: d.id })))
    }).catch(console.error)
  }, [currentUser])

  const markNotificationAsRead = async (id) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'bookings', id), { readByRecipient: true })
    } catch (e) { console.error(e) }
  }

  const markAllNotificationsAsRead = async () => {
    if (!currentUser || bookingNotifications.length === 0) return
    // Firestore batch limit = 500 ops; chunk to be safe
    try {
      for (let i = 0; i < bookingNotifications.length; i += 450) {
        const chunk = bookingNotifications.slice(i, i + 450)
        const batch = writeBatch(db)
        chunk.forEach(b => batch.update(doc(db, 'bookings', b.id), { readByRecipient: true }))
        await batch.commit()
      }
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
      await addDoc(collection(db, 'cars'), { ...car, userId: currentUser.uid, isPublic: true })
    } catch (e) { console.error(e) }
  }

  const updateCar = async (carId, updates) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'cars', carId), updates)
    } catch (e) { console.error(e) }
  }

  const deleteCar = async (carId) => {
    if (!currentUser || !carId) return
    
    // 1. Best-effort history cleanup
    try {
      const histSnap = await getDocs(query(collection(db, 'history'), where('carId', '==', carId)))
      for (let i = 0; i < histSnap.docs.length; i += 450) {
        const chunk = histSnap.docs.slice(i, i + 450)
        const batch = writeBatch(db)
        chunk.forEach(d => batch.delete(d.ref))
        await batch.commit()
      }
    } catch (e) {
      console.error('Failed to clean up history for car:', carId, e)
    }

    // 2. Guaranteed car deletion
    try {
      await deleteDoc(doc(db, 'cars', carId))
    } catch (e) {
      console.error('Failed to delete car:', carId, e)
    }
  }

  const addService = async svc => {
    if (!currentUser) return
    try {
      const ts = Date.now()
      // owner-created records are 'self_reported'; only STO-added records get 'verified'
      const status = (userProfile?.accountType === 'sto' || userProfile?.role === 'СТО' || userProfile?.role === 'sto') ? 'verified' : 'self_reported'
      await addDoc(collection(db, 'history'), { ...svc, userId: currentUser.uid, createdAt: ts, status })
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
  if ((currentUser === undefined && !authTimedOut) || (currentUser && userProfile === null)) {
    const wasLoggedIn = localStorage.getItem('al_authed') === '1'
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', background: 'var(--bg)' }} className={isDark ? 'dark' : ''}>
        {wasLoggedIn ? (
          <div style={{ width: 36, height: 36, border: '3px solid var(--line-2)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 22, background: 'var(--bg-card)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, boxShadow: '0 8px 24px rgba(92,62,254,0.2)' }}>
              <img src="/logo.svg" alt="AutoLog" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ width: 160, height: 4, background: 'var(--line-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div className="animate-progress-loading" style={{ height: '100%', background: 'var(--brand)', borderRadius: 99, width: '40%' }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- Not logged in ---
  if (currentUser === null || (authTimedOut && currentUser === undefined)) {
    const wasLoggedIn = localStorage.getItem('al_authed') === '1'
    const showAuthFlag = localStorage.getItem('al_show_auth') === '1'
    const showAuth = mode === 'auth' || wasLoggedIn || showAuthFlag

    const handleAuthBack = () => {
      localStorage.removeItem('al_show_auth')
      localStorage.removeItem('al_authed')
      setMode('landing')
      navigate('/')
    }

    return (
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', background: 'var(--bg)' }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--line-2)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      }>
        <Routes>
          <Route path="/share/:carId" element={<PublicReportViewWrapper />} />
          <Route path="/login" element={<AuthScreen isDark={isDark} setDark={setDark} onBack={handleAuthBack} defaultMode="login" />} />
          <Route path="/register" element={<AuthScreen isDark={isDark} setDark={setDark} onBack={handleAuthBack} defaultMode="register" />} />
          <Route path="/forgot" element={<AuthScreen isDark={isDark} setDark={setDark} onBack={handleAuthBack} defaultMode="forgot" />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/" element={
            showAuth
              ? <Navigate to="/login" replace />
              : <LandingView onLogin={(mode) => navigate(mode === 'register' ? '/register' : '/login')} />
          } />
          <Route path="/drivers" element={<LandingView onLogin={(mode) => navigate(mode === 'register' ? '/register' : '/login')} />} />
          <Route path="/sto" element={<LandingView onLogin={(mode) => navigate(mode === 'register' ? '/register' : '/login')} />} />
          <Route path="/telegram-bot" element={<LandingView onLogin={(mode) => navigate(mode === 'register' ? '/register' : '/login')} />} />
          
          <Route path="/blog" element={<BlogView />} />
          <Route path="/blog/:slug" element={<ArticleView />} />
          <Route path="/pricing" element={<PublicPageLayout><PlansView carList={[]} userProfile={null} onUpdatePlan={() => {}} currentUser={null} /></PublicPageLayout>} />
          <Route path="/sto-map" element={<PublicPageLayout><FindSTOView setTab={() => {}} onBookSTO={() => {}} currentUser={null} /></PublicPageLayout>} />
          <Route path="*" element={<NotFoundPage to="/" />} />
        </Routes>
      </Suspense>
    )
  }


  // --- Shared route accessible while logged in ---
  const isSto = userProfile?.accountType === 'sto' || userProfile?.role === 'СТО' || userProfile?.role === 'sto'
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

        {/* Redirect authenticated users away from auth pages */}
        <Route path="/login" element={<Navigate to={defaultRoute} replace />} />
        <Route path="/register" element={<Navigate to={defaultRoute} replace />} />
        <Route path="/forgot" element={<Navigate to={defaultRoute} replace />} />
        <Route path="/auth" element={<Navigate to={defaultRoute} replace />} />

        {/* Public blog & pricing accessible to authenticated users */}
        <Route path="/blog" element={<BlogView />} />
        <Route path="/blog/:slug" element={<ArticleView />} />
        <Route path="/pricing" element={
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <PlansView carList={carList} userProfile={userProfile} onUpdatePlan={updatePlan} currentUser={currentUser} />)}
          </AppShell>
        } />
        <Route path="/plans" element={<Navigate to="/pricing" replace />} />
        <Route path="/sto-map" element={
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <FindSTOView setTab={() => {}} onBookSTO={(sto) => { setPreselectedSto(sto); navigate('/bookings'); }} currentUser={currentUser} />)}
          </AppShell>
        } />


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
            {scrollWrapper('max-w-7xl', <GarageView carList={carList} onAddCar={addCar} onUpdateCar={updateCar} onDeleteCar={deleteCar} onSelectCar={setSelectedCar} userProfile={userProfile} onGoPlans={() => {}} />)}
          </AppShell>
        } />
        <Route path="/bookings" element={
          isSto ? <Navigate to="/sto/bookings" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-7xl', <ClientBookingsView carList={carList} preselectedSto={preselectedSto} onClearPreselected={() => setPreselectedSto(null)} currentUser={currentUser} />)}
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
        <Route path="/sto/settings" element={
          !isSto ? <Navigate to="/dashboard" replace /> :
          <AppShell {...shellProps}>
            {scrollWrapper('max-w-3xl', <STOSettingsView userProfile={userProfile} setUserProfile={setUserProfile} />)}
          </AppShell>
        } />

        {/* Route aliases (BUG #15) */}
        <Route path="/ai-mechanic" element={<Navigate to="/ai" replace />} />
        <Route path="/service-booking" element={<Navigate to="/bookings" replace />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route path="*" element={<NotFoundPage to={defaultRoute} />} />
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
              setTeamMembers(p => [...p, { ...mbr, status: 'pending' }])
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

function NotFoundPage({ to = '/' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 96, fontWeight: 900, color: 'var(--brand)', letterSpacing: '-0.05em', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 16, marginBottom: 8 }}>Сторінку не знайдено</h1>
        <p style={{ color: 'var(--text-3)', marginBottom: 24, fontSize: 14 }}>Можливо, ви ввели неправильну адресу або сторінку було видалено.</p>
        <Link to={to} style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 24px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', transition: 'opacity 200ms' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          На головну
        </Link>
      </div>
    </div>
  )
}

// Wrapper to extract :carId param for PublicReportView
function PublicReportViewWrapper() {
  const location = useLocation()
  const carId = location.pathname.split('/')[2]
  return <PublicReportView carId={carId} />
}
