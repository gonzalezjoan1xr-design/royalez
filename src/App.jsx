import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ChatButton from './components/ChatButton'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Markets from './pages/Markets'
import Spot from './pages/Spot'
import Bots from './pages/Bots'
import Deposit from './pages/Deposit'
import Withdraw from './pages/Withdraw'
import './App.css'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading">Loading…</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const publicPage = ['/', '/login', '/signup'].includes(pathname)

  return (
    <>
      {!publicPage && user && <Navbar />}
      <main className={publicPage ? '' : 'app-main'}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/markets" element={<Protected><Markets /></Protected>} />
          <Route path="/spot" element={<Protected><Spot /></Protected>} />
          <Route path="/deposit" element={<Protected><Deposit /></Protected>} />
          <Route path="/withdraw" element={<Protected><Withdraw /></Protected>} />
          <Route path="/bots" element={<Protected><Bots /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ChatButton />
    </>
  )
}
