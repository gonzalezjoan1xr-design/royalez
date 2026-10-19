import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, User, Shield, ShieldCheck, Lock, LogOut, Save, Pencil, Calendar, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useKyc, KYC_WITHDRAW_THRESHOLD } from '../lib/kyc'
import './Profile.css'

const KYC_TEXT = {
  none: `Withdrawals of $${KYC_WITHDRAW_THRESHOLD} or more need ID and face verification. Verify now`,
  pending: 'Your ID and face verification is under review.',
  approved: 'Identity verified. You can withdraw any amount.',
  rejected: 'Your verification was rejected. Tap to submit it again.',
}

// [label, badge class]
const KYC_BADGE = {
  none: ['Not Verified', ''],
  pending: ['Pending', 'profile__badge--wait'],
  approved: ['Verified', 'profile__badge--ok'],
  rejected: ['Rejected', 'profile__badge--bad'],
}

const splitName = (full = '') => {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  return [parts[0] || '', parts.slice(1).join(' ')]
}
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—')

function Row({ icon: Icon, label, children }) {
  return (
    <div className="profile__row">
      <span className="profile__label"><Icon strokeWidth={1.8} /> {label}</span>
      {children}
    </div>
  )
}

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const { status: kycStatus } = useKyc()
  const email = user?.email || ''

  const [firstSaved, lastSaved] = splitName(profile?.full_name)
  const [editing, setEditing] = useState(false)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  useEffect(() => {
    const [f, l] = splitName(profile?.full_name)
    setFirst(f)
    setLast(l)
    setPhone(profile?.phone || '')
  }, [profile?.full_name, profile?.phone])

  const cancelEdit = () => {
    setFirst(firstSaved)
    setLast(lastSaved)
    setPhone(profile?.phone || '')
    setEditing(false)
  }

  const onSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: `${first.trim()} ${last.trim()}`.trim(), phone: phone.trim() })
      .eq('id', user.id)
    setSaving(false)
    if (error) return setMsg({ type: 'err', text: error.message })
    setMsg({ type: 'ok', text: 'Profile updated.' })
    setEditing(false)
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

  const [kycLabel, kycClass] = KYC_BADGE[kycStatus] || KYC_BADGE.none
  const val = (v) => (v ? <span className="profile__value">{v}</span> : <span className="profile__value profile__value--empty">—</span>)

  return (
    <div className="profile">
      <div className="profile__top">
        <h1 className="profile__title">Profile</h1>
        <p className="profile__subtitle">Manage your account information</p>
      </div>

      {/* ---------- personal information ---------- */}
      <section className="profile__card">
        <div className="profile__chead">
          <span className="profile__ico profile__ico--green"><User strokeWidth={1.8} /></span>
          <div className="profile__ctext">
            <h2>Personal Information</h2>
            <p>Your basic profile details</p>
          </div>
          <button
            type="button" className="profile__edit" aria-label={editing ? 'Cancel editing' : 'Edit profile'}
            onClick={() => (editing ? cancelEdit() : (setMsg(null), setEditing(true)))}
          >
            {editing ? <X strokeWidth={1.8} /> : <Pencil strokeWidth={1.8} />}
          </button>
        </div>

        <form onSubmit={onSave}>
          <div className="profile__rows">
            <Row icon={User} label="First Name">
              {editing
                ? <input className="profile__field" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="First name" autoComplete="given-name" />
                : val(first)}
            </Row>
            <Row icon={User} label="Last Name">
              {editing
                ? <input className="profile__field" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Last name" autoComplete="family-name" />
                : val(last)}
            </Row>
            <Row icon={Mail} label="Email">{val(email)}</Row>
            <Row icon={Phone} label="Phone">
              {editing
                ? <input className="profile__field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000 000" autoComplete="tel" />
                : val(profile?.phone)}
            </Row>
          </div>

          {msg && <div className={`profile__msg profile__msg--${msg.type}`}>{msg.text}</div>}
          {editing && (
            <div className="profile__actions">
              <button className="profile__btn" type="submit" disabled={saving}>
                <Save size={16} strokeWidth={1.8} /> {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button className="profile__btn profile__btn--ghost" type="button" onClick={cancelEdit}>Cancel</button>
            </div>
          )}
        </form>
      </section>

      {/* ---------- account information ---------- */}
      <section className="profile__card">
        <div className="profile__chead">
          <span className="profile__ico profile__ico--blue"><Shield strokeWidth={1.8} /></span>
          <div className="profile__ctext">
            <h2>Account Information</h2>
            <p>Your account details</p>
          </div>
        </div>

        <div className="profile__rows">
          <Row icon={Calendar} label="Member Since"><span className="profile__value">{fmtDate(user?.created_at)}</span></Row>
          <Row icon={Shield} label="Account Status">
            <Link to="/verify" className={`profile__badge ${kycClass}`} style={{ textDecoration: 'none' }}>{kycLabel}</Link>
          </Row>
          <Row icon={User} label="User ID"><span className="profile__value profile__value--mono" title={user?.id}>{user?.id || '—'}</span></Row>
        </div>
      </section>

      {/* ---------- security ---------- */}
      <section className="profile__card">
        <div className="profile__chead">
          <span className="profile__ico profile__ico--amber"><Lock strokeWidth={1.8} /></span>
          <div className="profile__ctext">
            <h2>Security</h2>
            <p>Verification and password</p>
          </div>
        </div>

        <Link to="/verify" className="profile__hint">
          <ShieldCheck size={16} strokeWidth={1.8} />
          {KYC_TEXT[kycStatus] || KYC_TEXT.none}
        </Link>

        <form className="profile__form" onSubmit={onPassword}>
          <label>
            New password
            <div className="profile__input">
              <Lock strokeWidth={1.8} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
            </div>
          </label>
          <label>
            Confirm new password
            <div className="profile__input">
              <Lock strokeWidth={1.8} />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat the password" autoComplete="new-password" />
            </div>
          </label>
          {pwMsg && <div className={`profile__msg profile__msg--${pwMsg.type}`} style={{ marginTop: 0 }}>{pwMsg.text}</div>}
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
