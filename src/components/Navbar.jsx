import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, TrendingUp, BarChart3, ArrowUpRight, ArrowDownLeft, Bot,
  Search, Download, Wallet, ShieldCheck, Bell, User, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
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
  const [query, setQuery] = useState('')
  const balance = Number(profile?.balance || 0)
  const notifications = 2 // TODO: wire to real unread count

  const onSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/markets?q=${encodeURIComponent(q)}` : '/markets')
  }

  return (
    <header className="nav">
      <Link to="/dashboard" className="nav__logo"><Logo /></Link>

      <nav className="nav__links">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.8} /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <form className="nav__search" onSubmit={onSearch} role="search">
        <Search size={20} strokeWidth={1.8} />
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
          <Download size={18} strokeWidth={1.8} /> Get App
        </button>

        <Link to="/deposit" className="nav__balance" aria-label="Balance">
          <Wallet size={20} strokeWidth={1.8} />
          <span>${balance.toFixed(2)}</span>
        </Link>

        <button className="nav__icon nav__icon--green" aria-label="Security" type="button">
          <ShieldCheck size={22} strokeWidth={1.8} />
        </button>

        <button className="nav__icon nav__bell" aria-label="Notifications" type="button">
          <Bell size={22} strokeWidth={1.8} />
          {notifications > 0 && <span className="nav__badge">{notifications}</span>}
        </button>

        <button className="nav__icon" aria-label="Profile" type="button">
          <User size={22} strokeWidth={1.8} />
        </button>

        <button className="nav__icon nav__icon--red" onClick={signOut} aria-label="Sign out" type="button">
          <LogOut size={22} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  )
}
