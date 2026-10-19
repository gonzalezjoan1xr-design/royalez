import { Component, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, User, Shield, ShieldCheck, Save, Pencil, Calendar, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import * as kycLib from '../lib/kyc'
import './Profile.css'

// Safe against a missing export in ../lib/kyc (a missing named import blanks the whole app in Vite)
const useKyc = kycLib.useKyc || (() => ({ status: 'none' }))

// [label, badge class]
const KYC_BADGE = {
  none: ['Not Verified', ''],
  pending: ['Pending', 'profile__badge--wait'],
  approved: ['Verified', 'profile__badge--ok'],
  rejected: ['Rejected', 'profile__badge--bad'],
}

// false = personal details start blank so each user fills in their own (saving still writes to Supabase)
// true  = pre-fill the form with what is already stored in the profiles table
const SHOW_SAVED_DETAILS = false

// Handles null as well as undefined
const splitName = (full) => {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean)
  return [parts[0] || '', parts.slice(1).join(' ')]
}

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function Row({ icon: Icon, label, children }) {
  return (
    <div className="profile__row">
      <span className="profile__label"><Icon strokeWidth={1.8} /> {label}</span>
      {children}
    </div>
  )
}

/* Shows the real error on the page instead of a blank screen */
class ProfileBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Profile crashed:', error, info) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="profile">
        <div className="profile__msg profile__msg--err">
          Profile could not load: {String(this.state.error?.message || this.state.error)}
        </div>
      </div>
    )
  }
}

function ProfileInner() {
  const auth = useAuth() || {}
  const { user, profile } = auth
  const kyc = useKyc() || {}
  const kycStatus = kyc.status || 'none'
  const email = user?.email || ''

  const [firstSaved, lastSaved] = SHOW_SAVED_DETAILS ? splitName(profile?.full_name) : ['', '']
  const phoneSaved = SHOW_SAVED_DETAILS ? profile?.phone || '' : ''
  const [editing, setEditing] = useState(false)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [local, setLocal] = useState(null) // shows saved values immediately, before auth refetches


  useEffect(() => {
    const [f, l] = SHOW_SAVED_DETAILS ? splitName(profile?.full_name) : ['', '']
    setFirst(f)
    setLast(l)
    setPhone(SHOW_SAVED_DETAILS ? profile?.phone || '' : '')
    setLocal(null)
  }, [profile?.full_name, profile?.phone])

  const shown = local || { first: firstSaved, last: lastSaved, phone: phoneSaved }

  const cancelEdit = () => {
    setFirst(shown.first)
    setLast(shown.last)
    setPhone(shown.phone)
    setEditing(false)
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMsg(null)
    const next = { first: first.trim(), last: last.trim(), phone: phone.trim() }
    // upsert also works when the profile row doesn't exist yet
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: `${next.first} ${next.last}`.trim(), phone: next.phone })
    setSaving(false)
    if (error) return setMsg({ type: 'err', text: error.message })
    setLocal(next)
    setMsg({ type: 'ok', text: 'Profile updated.' })
    setEditing(false)
  }


  const [kycLabel, kycClass] = KYC_BADGE[kycStatus] || KYC_BADGE.none
  const val = (v) =>
    v ? <span className="profile__value">{v}</span> : <span className="profile__value profile__value--empty">—</span>

  // Never render nothing: show a state while the user loads
  if (!user) {
    return (
      <div className="profile">
        <div className="profile__top">
          <h1 className="profile__title">Profile</h1>
          <p className="profile__subtitle">Loading your account…</p>
        </div>
        <Link to="/login" className="profile__hint">
          <ShieldCheck size={16} strokeWidth={1.8} />
          Not signed in? Go to sign in.
        </Link>
      </div>
    )
  }

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
            type="button"
            className="profile__edit"
            aria-label={editing ? 'Cancel editing' : 'Edit profile'}
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
                : val(shown.first)}
            </Row>
            <Row icon={User} label="Last Name">
              {editing
                ? <input className="profile__field" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Last name" autoComplete="family-name" />
                : val(shown.last)}
            </Row>
            <Row icon={Mail} label="Email">{val(email)}</Row>
            <Row icon={Phone} label="Phone">
              {editing
                ? <input className="profile__field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000 000" autoComplete="tel" />
                : val(shown.phone)}
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


    </div>
  )
}

export default function Profile() {
  return (
    <ProfileBoundary>
      <ProfileInner />
    </ProfileBoundary>
  )
}
