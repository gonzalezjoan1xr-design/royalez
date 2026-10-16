import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutGrid, TrendingUp, BarChart3, ArrowUpRight, ArrowDownLeft, Bot,
  Search, Play, Apple, Wallet, ShieldCheck, Bell, User, LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logo from '../Assets/Royal-logo.png'
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
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const balance = Number(profile?.balance || 0)
  const notifications = 4 // TODO: wire to real unread count

  // close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // lock body scroll + close on Escape while drawer is open
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

  const linkClass = ({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`
  const drawerLinkClass = ({ isActive }) => `drawer__link ${isActive ? 'is-active' : ''}`

  return (
    <>
      <header className="nav">
        <Link to="/dashboard" className="nav__logo">
          <img src={logo} alt="Royal Markets" />
        </Link>

        {/* Desktop links */}
        <nav className="nav__links">
          {links.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={16} strokeWidth={1.8} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Desktop search */}
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
            <span>${balance.toFixed(2)}</span>
          </Link>

          <Link to="/verify" className="nav__icon nav__icon--green" aria-label="Verify identity">
            <ShieldCheck size={20} strokeWidth={1.8} />
          </Link>

          <button className="nav__icon nav__bell" aria-label="Notifications" type="button">
            <Bell size={20} strokeWidth={1.8} />
            {notifications > 0 && <span className="nav__badge">{notifications}</span>}
          </button>

          <button className="nav__icon" aria-label="Profile" type="button">
            <User size={20} strokeWidth={1.8} />
          </button>

          <button className="nav__icon nav__icon--red" onClick={signOut} aria-label="Sign out" type="button">
            <LogOut size={20} strokeWidth={1.8} />
          </button>

          {/* Mobile hamburger */}
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

      {/* Mobile drawer */}
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
          <NavLink to="/verify" className="drawer__link drawer__link--accent">
            <ShieldCheck size={18} strokeWidth={1.8} /> <span>Verify Identity</span>
          </NavLink>
        </nav>

        <div className="drawer__divider" />

        <Link to="/deposit" className="drawer__balance">
          <Wallet size={18} strokeWidth={1.8} />
          <span>${balance.toFixed(2)}</span>
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
