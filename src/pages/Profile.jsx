import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, User, Wallet, ShieldCheck, Lock, LogOut, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { WITHDRAW_AUTH_THRESHOLD } from '../lib/withdrawGate'
import './Profile.css'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const email = user?.email || ''
  const displayName = profile?.username || email.split('@')[0] || 'User'
  const balance = Number(profile?.balance || 0)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  useEffect(() => {
    setFullName(profile?.full_name || '')
    setPhone(profile?.phone || '')
  }, [profile?.full_name, profile?.phone])

  const onSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('id', user.id)
    setSaving(false)
    setMsg(error ? { type: 'err', text: error.message } : { type: 'ok', text: 'Profile updated.' })
  }

  const onPassword = async (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (password.length < 8) return setPwMsg({ type: 'err', text: 'Use at least 8 characters.' })
    if (password !== confirm) return setPwMsg({ type: 'err', text: 'Passwords do not match.' })
    setPwBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setPwBusy(false)
    if (error) return setPwMsg({ type: 'err', text: error.message })
    setPassword('')
    setConfirm('')
    setPwMsg({ type: 'ok', text: 'Password changed.' })
  }

  return (
    <div className="profile">
      <section className="profile__head">
        <div className="profile__avatar">{displayName.charAt(0)}</div>
        <div className="profile__who">
          <h1>{displayName}</h1>
          <p><Mail size={14} strokeWidth={1.8} /> {email}</p>
        </div>
        <Link to="/deposit" className="profile__balance">
          <Wallet size={16} strokeWidth={1.8} /> ${balance.toFixed(2)}
        </Link>
      </section>

      <section className="profile__card">
        <h2>Personal details</h2>
        <form className="profile__form" onSubmit={onSave}>
          <label>
            Username
            <div className="profile__input profile__input--locked">
              <User size={16} strokeWidth={1.8} />
              <input type="text" value={displayName} disabled />
            </div>
          </label>
          <label>
            Full name
            <div className="profile__input">
              <User size={16} strokeWidth={1.8} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
          </label>
          <label>
            Phone number
            <div className="profile__input">
              <Phone size={16} strokeWidth={1.8} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000 000"
                autoComplete="tel"
              />
            </div>
          </label>
          {msg && <div className={`profile__msg profile__msg--${msg.type}`}>{msg.text}</div>}
          <button className="profile__btn" type="submit" disabled={saving}>
            <Save size={16} strokeWidth={1.8} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="profile__card">
        <h2>Security</h2>
        <p className="profile__hint">
          <ShieldCheck size={16} strokeWidth={1.8} />
          Withdrawals of ${WITHDRAW_AUTH_THRESHOLD} or more need a one-time code sent to your email.
        </p>
        <form className="profile__form" onSubmit={onPassword}>
          <label>
            New password
            <div className="profile__input">
              <Lock size={16} strokeWidth={1.8} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
          </label>
          <label>
            Confirm new password
            <div className="profile__input">
              <Lock size={16} strokeWidth={1.8} />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat the password"
                autoComplete="new-password"
              />
            </div>
          </label>
          {pwMsg && <div className={`profile__msg profile__msg--${pwMsg.type}`}>{pwMsg.text}</div>}
          <button className="profile__btn" type="submit" disabled={pwBusy || !password}>
            <Lock size={16} strokeWidth={1.8} /> {pwBusy ? 'Updating…' : 'Change password'}
          </button>
        </form>
      </section>

      <button className="profile__signout" type="button" onClick={signOut}>
        <LogOut size={16} strokeWidth={1.8} /> Sign out
      </button>
    </div>
  )
}
