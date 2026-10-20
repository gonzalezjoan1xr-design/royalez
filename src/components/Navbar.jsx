import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutGrid, TrendingUp, BarChart3, ArrowUpRight, ArrowDownLeft, Bot,
  Search, Play, Apple, Wallet, ShieldCheck, Bell, User, LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import logo from '../Assets/justR.png'
import './Navbar.css'

const links = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { to: '/spot', label: 'Trade', Icon: TrendingUp },
  { to: '/markets', label: 'Markets', Icon: BarChart3 },
  { to: '/deposit', label: 'Deposit', Icon: ArrowUpRight },
  { to: '/withdraw', label: 'Withdraw', Icon: ArrowDownLeft },
  { to: '/bots', label: 'Bots', Icon: Bot },
]

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  
  // Local state for balance
  const [liveBalance, setLiveBalance] = useState(Number(profile?.balance || 0))

  // Sync when AuthContext updates (e.g. page load or login)
  useEffect(() => {
    setLiveBalance(Number(profile?.balance || 0))
  }, [profile?.balance])

  // Listen to custom balance update events from the Bots page
  useEffect(() => {
    const handleBalanceUpdate = (e) => {
      if (e.detail && typeof e.detail.delta === 'number') {
        setLiveBalance(prev => Math.max(0, prev + e.detail.delta))
      }
    }
    window.addEventListener('balance-update', handleBalanceUpdate)
    return () => window.removeEventListener('balance-update', handleBalanceUpdate)
  }, [])

  // Fallback: Listen to Supabase real-time DB changes (if enabled)
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`nav-balance-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new && typeof payload.new.balance !== 'undefined') {
            setLiveBalance(Number(payload.new.balance))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  const hidden = location.pathname.startsWith('/admin')

  useEffect(() => {
    document.body.classList.toggle('no-nav', hidden)
    return () => document.body.classList.remove('no-nav')
  }, [hidden])

  useEffect(() => {
    if (!user?.id) return
    let active = true
    const load = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      if (active) setUnread(count || 0)
    }
    load()
    const channel = supabase
      .channel(`navbar-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        load
      )
      .subscribe()
    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    setOpen(false)
    navigate(q ? `/markets?q=${encodeURIComponent(q)}` : '/markets')
  }

  if (hidden) return null

  const linkClass = ({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`
  const drawerLinkClass = ({ isActive }) => `drawer__link ${isActive ? 'is-active' : ''}`
  const badgeText = unread > 9 ? '9+' : unread

  return (
    <>
      <header className="nav">
        <Link to="/dashboard" className="nav__logo">
          <img src={logo} alt="Royal Markets" />
        </Link>

        <nav className="nav__links">
          {links.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={16} strokeWidth={1.8} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <form className="nav__search" onSubmit={onSearch} role="search">
          <Search size={18} strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Search markets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search markets"
          />
        </form>

        <div className="nav__right">
          <button className="nav__app" type="button">
            <Play size={16} strokeWidth={1.8} /> Get App
          </button>

          <Link to="/deposit" className="nav__balance" aria-label="Balance">
            <Wallet size={18} strokeWidth={1.8} />
            <span>${liveBalance.toFixed(2)}</span>
          </Link>

          <Link to="/verify" className="nav__icon nav__icon--green" aria-label="Verify identity">
            <ShieldCheck size={20} strokeWidth={1.8} />
          </Link>

          <Link
            to="/notifications"
            className="nav__icon nav__bell"
            aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
          >
            <Bell size={20} strokeWidth={1.8} />
            {unread > 0 && <span className="nav__badge">{badgeText}</span>}
          </Link>

          <Link to="/profile" className="nav__icon" aria-label="Profile">
            <User size={20} strokeWidth={1.8} />
          </Link>

          <button className="nav__icon nav__icon--red" onClick={signOut} aria-label="Sign out" type="button">
            <LogOut size={20} strokeWidth={1.8} />
          </button>

          <button
            className="nav__icon nav__burger"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            type="button"
          >
            <Menu size={22} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div
        className={`drawer__overlay ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="drawer__head">
          <h2>Menu</h2>
          <button className="drawer__close" onClick={() => setOpen(false)} aria-label="Close menu" type="button">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        <nav className="drawer__nav">
          {links.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={drawerLinkClass}>
              <Icon size={18} strokeWidth={1.8} /> <span>{label}</span>
            </NavLink>
          ))}
          <NavLink to="/notifications" className={drawerLinkClass}>
            <Bell size={18} strokeWidth={1.8} /> <span>Notifications{unread > 0 ? ` (${badgeText})` : ''}</span>
          </NavLink>
          <NavLink to="/profile" className={drawerLinkClass}>
            <User size={18} strokeWidth={1.8} /> <span>Profile</span>
          </NavLink>
          <NavLink to="/verify" className="drawer__link drawer__link--accent">
            <ShieldCheck size={18} strokeWidth={1.8} /> <span>Verify Identity</span>
          </NavLink>
        </nav>

        <div className="drawer__divider" />

        <Link to="/deposit" className="drawer__balance">
          <Wallet size={18} strokeWidth={1.8} />
          <span>${liveBalance.toFixed(2)}</span>
        </Link>

        <form className="drawer__search" onSubmit={onSearch} role="search">
          <Search size={18} strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Search markets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search markets"
          />
        </form>

        <div className="drawer__stores">
          <button className="drawer__store" type="button">
            <Play size={22} strokeWidth={1.8} />
            <span><small>GET IT ON</small>Google Play</span>
          </button>
          <button className="drawer__store" type="button">
            <Apple size={22} strokeWidth={1.8} />
            <span><small>Download on the</small>App Store</span>
          </button>
        </div>
      </aside>
    </>
  )
}
