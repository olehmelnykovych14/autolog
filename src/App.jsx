import React, { useState, useEffect, useContext, useRef } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, getDocs, collection, query, where, addDoc, updateDoc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore'

// Context & Constants
import { ThemeCtx } from './context/ThemeContext'
import { C, PLANS } from './constants'

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
import { PublicReportView } from './components/views/PublicReportView'
import { ClientBookingsView } from './components/views/ClientBookingsView'
import { STOBookingsView } from './components/views/STOBookingsView'

// Modals
import { CarDetailsModal } from './components/modals/CarDetailsModal'
import { CarReportModal } from './components/modals/CarReportModal'
import { TransferCarModal, InviteMemberModal } from './components/modals/Modals'

// Auth
import { AuthScreen } from './components/auth/AuthScreen'
import { LandingView } from './components/views/LandingView'

export default function App() {
  const [currentUser, setCurrentUser] = useState(undefined)
  const [userProfile, setUserProfile] = useState(null)
  const [tab, setTab] = useState('dashboard')
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
  const [incomingInvites, setIncomingInvites] = useState([])
  
  const tabRef = useRef(tab)
  useEffect(() => { tabRef.current = tab }, [tab])

  const activePlan = PLANS.find(p => p.id === (userProfile?.plan || 'Free')) || PLANS[0]
  const TEAM_LIMIT = activePlan.teamLimit
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Олександр (Ви)', email: 'owner@autolog.ua', role: 'owner', status: 'active' }
  ])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const carUnsubRef = useRef(null);
  const histUnsubRef = useRef(null);

  // --- DATA AGGREGATION FOR TEAMS ---
  const [activeMemberships, setActiveMemberships] = useState([]); // List of ownerIds where user is active

  useEffect(() => {
    if (!auth) {
      setCurrentUser(null);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setUserProfile(null);
        setCarList([]);
        setHistoryList([]);
        return;
      }

      // 1. Fetch User Profile
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const up = snap.data();
          setUserProfile(up);
          if (up.accountType === "sto") setTab("sto");
          else setTab("dashboard");
        } else {
          setUserProfile({ phone: "", city: "", avatarBase64: "", accountType: "owner" });
          setTab("dashboard");
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
      }

      // 2. Listen for Active Memberships
      const lowerEmail = user.email.toLowerCase();
      const inviteQuery = query(
        collection(db, "team_invitations"),
        where("email", "in", [user.email, lowerEmail]),
        where("status", "==", "active")
      );

      const unsubInvites = onSnapshot(inviteQuery, async (snap) => {
        const ownerIds = snap.docs.map((d) => d.data().ownerId).filter(Boolean);
        const allRelevantUids = Array.from(new Set([user.uid, ...ownerIds])).filter(id => typeof id === 'string' && id).slice(0, 10);
        setActiveMemberships(ownerIds);

        // Cleanup previous listeners
        if (carUnsubRef.current) carUnsubRef.current();
        if (histUnsubRef.current) histUnsubRef.current();

        // 3. Listen for Cars (Personal + Shared)
        carUnsubRef.current = onSnapshot(query(collection(db, "cars"), where("userId", "in", allRelevantUids)), (carSnap) => {
          setCarList(carSnap.docs.map((d) => ({ ...d.data(), id: d.id })));
        });

        // 4. Listen for History (Personal + Shared)
        histUnsubRef.current = onSnapshot(query(collection(db, "history"), where("userId", "in", allRelevantUids)), (histSnap) => {
          const hList = histSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
          hList.sort((a, b) => {
            const dA = new Date(a.date).getTime();
            const dB = new Date(b.date).getTime();
            if (dA === dB) return (b.createdAt || 0) - (a.createdAt || 0);
            return dB - dA;
          });
          setHistoryList(hList);
        });
      });

      return () => {
        unsubInvites();
        if (carUnsubRef.current) carUnsubRef.current();
        if (histUnsubRef.current) histUnsubRef.current();
      };
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'team_invitations'), where('ownerId', '==', currentUser.uid));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeamMembers([
        { id: 'owner', name: userProfile?.name || 'Ви', email: currentUser.email, role: 'owner', status: 'active' },
        ...list
      ]);
    });
    return () => unsub();
  }, [currentUser, userProfile]);

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
       for(const d of snap.docs) {
          const b = { id: d.id, ...d.data() }
          if (isSto) {
             if (b.status === 'pending') list.push(b)
          } else {
             if (b.status === 'confirmed' || b.status === 'rejected') list.push(b)
          }
       }
       // Filter unread
       const unread = list.filter(b => !b.readByRecipient)
       unread.sort((a,b) => b.createdAt - a.createdAt)
       
       for (const b of unread) {
         if (isSto && b.carId) {
             try {
               const cSnap = await getDoc(doc(db, 'cars', String(b.carId)))
               if (cSnap.exists()) b.car = cSnap.data()
             } catch(e){}
         }
         if (!isSto && b.stoId) {
             try {
               const sSnap = await getDoc(doc(db, 'users', String(b.stoId)))
               if (sSnap.exists()) b.sto = sSnap.data()
             } catch(e){}
         }
       }
       setBookingNotifications(unread)
    })
    return () => unsub()
  }, [currentUser, userProfile])

  useEffect(() => {
    if (!currentUser || !currentUser.email) return;
    const lowerEmail = currentUser.email.toLowerCase();
    const q = query(
      collection(db, 'team_invitations'), 
      where('email', 'in', [currentUser.email, lowerEmail]), 
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, snap => {
      setIncomingInvites(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => unsub();
  }, [currentUser]);

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

  useEffect(() => {
    if (!userProfile) return
    const isStoTab = ['sto', 'sto_bookings', 'sto_plans'].includes(tab)
    const isOwnerTab = ['dashboard', 'garage', 'bookings', 'service', 'plans', 'ai', 'team'].includes(tab)
    
    if (isStoTab && userProfile.accountType !== 'sto') {
      setTab('dashboard')
    }
    if (isOwnerTab && userProfile.accountType === 'sto') {
      setTab('sto')
    }
  }, [tab, userProfile?.accountType])

  const onUpdateAIUsage = async () => {
    if (!currentUser) return
    const newUsage = (userProfile?.aiUsage || 0) + 1
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { aiUsage: newUsage })
      setUserProfile(p => ({ ...p, aiUsage: newUsage }))
    } catch (e) { console.error(e) }
  }

  const isAdmin = currentUser?.email === 'olehmelnykovych@gmail.com' || userProfile?.role === 'Admin'

  const addCar = async car => {
    if (!currentUser) return
    try {
      const docRef = await addDoc(collection(db, 'cars'), { ...car, userId: currentUser.uid })
      setCarList(p => [{ ...car, id: docRef.id, userId: currentUser.uid }, ...p])
    } catch (e) { console.error(e) }
  }

  const updateCar = async (carId, updates) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'cars', carId), updates)
      setCarList(p => p.map(c => c.id === carId ? { ...c, ...updates } : c))
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
    if (!currentUser) return false
    try {
      await deleteDoc(doc(db, 'history', id))
      setHistoryList(p => p.filter(h => h.id !== id))
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
      setHistoryList(p => p.map(h => h.id === svcId ? { ...h, status: 'verified' } : h))
    } catch (e) { console.error(e) }
  }

  const handleAcceptInvite = async (invId) => {
    if (!currentUser || !invId) return;
    try {
      await updateDoc(doc(db, 'team_invitations', String(invId)), { status: 'active' });
    } catch (e) { 
      console.error("Accept invite error:", e);
      throw e; 
    }
  }

  const handleRejectInvite = async (invId) => {
    if (!currentUser || !invId) return;
    try {
      await deleteDoc(doc(db, 'team_invitations', String(invId)));
    } catch (e) { 
      console.error("Reject invite error:", e);
      throw e;
    }
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

  if (currentUser === undefined || (currentUser && userProfile === null)) {
    return (
      <div className={`flex items-center justify-center h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-500 ${isDark ? 'dark' : ''}`}>
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
           <div className="w-16 h-16 rounded-[2rem] bg-white dark:bg-gray-800 flex items-center justify-center shadow-2xl border border-gray-100 dark:border-gray-700 animate-bounce">
              <img src="/logo.png" alt="AutoLog" className="w-10 h-10 object-contain" />
           </div>
           <div className="flex flex-col items-center gap-2">
             <div className="w-48 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#5C3EFE] animate-progress-loading" style={{ width: '40%' }}></div>
             </div>
             <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] animate-pulse">Завантаження...</p>
           </div>
        </div>
      </div>
    )
  }

  const isSharedRoute = window.location.pathname.startsWith('/share/')
  const sharedCarId = isSharedRoute ? window.location.pathname.split('/')[2] : null

  if (isSharedRoute && sharedCarId) {
    return <PublicReportView carId={sharedCarId} />
  }

  if (currentUser === null) {
    if (mode === 'landing') {
      return <LandingView onLogin={() => setMode('auth')} />
    }
    return <AuthScreen isDark={isDark} setDark={setDark} onBack={() => setMode('landing')} />
  }

  return (
    <ThemeCtx.Provider value={isDark}>
      <div className={`fixed inset-0 flex font-sans overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-white ${isDark ? 'dark' : ''}`}>
        <Sidebar tab={tab} setTab={setTab} col={col} setCol={setCol} isAdmin={isAdmin} userProfile={userProfile} showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} onLogout={() => signOut(auth)} />
        <div className="flex flex-1 flex-col min-h-0 relative bg-white dark:bg-gray-950 overflow-hidden">
          {tab !== 'ai' && (
            <Topbar isDark={isDark} setDark={setDark} incomingTransfer={incomingTransfer} onAcceptTransfer={() => setIncomingTransfer(null)} onRejectTransfer={() => setIncomingTransfer(null)} onLogout={() => signOut(auth)} currentUser={currentUser} userProfile={userProfile} col={col} setCol={setCol} pendingApprovals={historyList.filter(h => h.status === 'pending_approval' && h.userId === currentUser.uid)} bookingNotifications={bookingNotifications} incomingInvites={incomingInvites} onAcceptInvite={handleAcceptInvite} onRejectInvite={handleRejectInvite} onAcceptService={handleAcceptService} onRejectService={handleRejectService} showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} setTab={setTab} onMarkRead={markNotificationAsRead} onMarkAllRead={markAllNotificationsAsRead} />
          )}
          <main className={`flex-1 flex flex-col min-h-0 relative overflow-hidden ${tab === 'ai' ? 'bg-white dark:bg-gray-800' : 'bg-[#F8FAFC] dark:bg-gray-950'}`}>
            {tab === 'ai' 
              ? <AIView carList={carList} historyList={historyList} userProfile={userProfile} onUpdateAIUsage={onUpdateAIUsage} onGoPlans={() => setTab('plans')} onGoBookings={() => setTab('bookings')} onMenu={() => setShowMobileMenu(true)} onBack={() => setTab('dashboard')} />
              : <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                  <div className={`${tab === 'sto_bookings' ? 'max-w-[120rem]' : 'max-w-7xl'} mx-auto space-y-6`}>
                    {tab === 'dashboard' && <DashboardView carList={carList} historyList={historyList} />}
                    {tab === 'garage' && <GarageView carList={carList} onAddCar={addCar} onUpdateCar={updateCar} onSelectCar={setSelectedCar} userProfile={userProfile} onGoPlans={() => setTab('plans')} />}
                    {tab === 'bookings' && <ClientBookingsView carList={carList} />}
                    {tab === 'service' && <HistoryView historyList={historyList} carList={carList} onAddService={addService} onUpdateService={updateService} onDeleteService={deleteService} />}
                    {tab === 'team' && <TeamView teamMembers={teamMembers} limit={TEAM_LIMIT} onRemove={id => setTeamMembers(p => p.filter(m => m.id !== id))} onInvite={() => setShowInviteModal(true)} />}
                    {tab === 'plans' && <PlansView carList={carList} userProfile={userProfile} onUpdatePlan={handleUpdatePlan} currentUser={currentUser} />}
                    {tab === 'settings' && <SettingsView currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} />}
                    {tab === 'admin' && isAdmin && <AdminView />}
                    {tab === 'sto' && userProfile?.accountType === 'sto' && <STODashboardView userProfile={userProfile} setTab={setTab} />}
                    {tab === 'sto_bookings' && userProfile?.accountType === 'sto' && <STOBookingsView userProfile={userProfile} />}
                    {tab === 'sto_plans' && userProfile?.accountType === 'sto' && <STOPricingView currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} setTab={setTab} />}
                  </div>
                </div>
            }
          </main>
        </div>
        {showInviteModal && <InviteMemberModal limit={TEAM_LIMIT} currentCount={teamMembers.length} onClose={() => setShowInviteModal(false)} onInvite={async (mbr) => {
          try {
            await addDoc(collection(db, 'team_invitations'), {
              ...mbr,
              ownerId: currentUser.uid,
              fromName: userProfile?.displayName || userProfile?.name || 'Власник',
              createdAt: Date.now(),
              notified: false
            });
            setTeamMembers(p => [...p, mbr]);
          } catch (e) { console.error("Invite error:", e) }
        }} />}
        {selectedCar && !showReport && !showTransfer && <CarDetailsModal car={selectedCar} onClose={() => setSelectedCar(null)} onGoService={() => setTab('service')} onGoReport={() => setShowReport(true)} onGoTransfer={() => setShowTransfer(true)} />}
        {showReport && <CarReportModal car={selectedCar} historyList={historyList} userProfile={userProfile} onClose={() => setShowReport(false)} />}
        {showTransfer && <TransferCarModal car={selectedCar} onClose={() => setShowTransfer(false)} onTransfer={handleTransfer} />}
      </div>
    </ThemeCtx.Provider>
  )
}
