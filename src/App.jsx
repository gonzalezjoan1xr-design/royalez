import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ChatButton from './components/ChatButton'
import InstallPrompt from './components/InstallPrompt'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Markets from './pages/Markets'
import Spot from './pages/Spot'
import Bots from './pages/Bots'
import Deposit from './pages/Deposit'
import Withdraw from './pages/Withdraw'
import Verify from './pages/Verify'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Admin from './pages/Admin'
import './App.css'

function Protected({ children }) {
  const { user, loading, profileLoading, emailVerified } = useAuth()
  if (loading || (user && profileLoading)) return <div className="app-loading">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (emailVerified === false) return <Navigate to="/verify-email" replace />
  return children
}

export default function App() {
  const { user, emailVerified } = useAuth()
  const { pathname } = useLocation()
  const publicPage = ['/', '/login', '/signup', '/verify-email'].includes(pathname)
  const adminPage = pathname.startsWith('/admin')

  return (
    <>
      {!publicPage && user && emailVerified !== false && <Navbar />}
      <main className={publicPage ? '' : 'app-main'}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/markets" element={<Protected><Markets /></Protected>} />
          <Route path="/spot" element={<Protected><Spot /></Protected>} />
          <Route path="/deposit" element={<Protected><Deposit /></Protected>} />
          <Route path="/withdraw" element={<Protected><Withdraw /></Protected>} />
          <Route path="/verify" element={<Protected><Verify /></Protected>} />
          <Route path="/bots" element={<Protected><Bots /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!adminPage && emailVerified !== false && <ChatButton />}
      {!adminPage && <InstallPrompt />}
    </>
  )
}
