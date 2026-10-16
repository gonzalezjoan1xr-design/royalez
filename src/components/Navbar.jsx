import { NavLink, Link } from 'react-router-dom'
import { LayoutGrid, LineChart, ArrowLeftRight, Bot, Bell, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import './Navbar.css'

const links = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { to: '/markets', label: 'Markets', Icon: LineChart },
  { to: '/spot', label: 'Spot', Icon: ArrowLeftRight },
  { to: '/bots', label: 'Bots', Icon: Bot },
]

export default function Navbar() {
  const { profile, user, signOut } = useAuth()
  const balance = Number(profile?.balance || 0)
  const name = profile?.username || user?.email?.split('@')[0] || 'trader'

  return (
    <header className="nav">
      <Link to="/dashboard"><Logo /></Link>
      <nav className="nav__links">
        {links.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}>
            <Icon size={18} /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="nav__right">
        <button className="nav__icon" aria-label="Notifications"><Bell size={20} /></button>
        <span className="nav__balance">${balance.toFixed(2)}</span>
        <span className="nav__avatar"><User size={20} /></span>
        <span className="nav__user">{name}</span>
        <button className="nav__out" onClick={signOut}>Sign out</button>
      </div>
    </header>
  )
}
