import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { markVerified, WITHDRAW_AUTH_THRESHOLD } from '../lib/withdrawGate'
import './WithdrawAuth.css'

function maskEmail(email = '') {
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(name.length - 2, 2))}@${domain}`
}

export default function WithdrawAuth() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const pending = state?.pending

  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [cooldown, setCooldown] = useState(0)
  const sentOnce = useRef(false)

  // nothing to verify (opened directly or refreshed): go back to the withdraw form
  useEffect(() => {
    if (!pending) navigate('/withdraw', { replace: true })
  }, [pending, navigate])

  const sendCode = async () => {
    setMsg(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: { shouldCreateUser: false },
    })
    if (error) {
      setMsg({ type: 'err', text: error.message })
    } else {
      setMsg({ type: 'ok', text: `We sent a 6-digit code to ${maskEmail(user.email)}.` })
      setCooldown(60)
    }
  }

  // send the first code automatically
  useEffect(() => {
    if (!user?.email || !pending || sentOnce.current) return
    sentOnce.current = true
    sendCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, pending])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const onVerify = async (e) => {
    e.preventDefault()
    if (code.length < 6) return
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.auth.verifyOtp({
      email: user.email,
      token: code,
      type: 'email',
    })
    setBusy(false)
    if (error) {
      setMsg({ type: 'err', text: 'That code is invalid or has expired. Try again or request a new one.' })
      return
    }
    markVerified()
    navigate('/withdraw', { replace: true, state: { pending, verified: true } })
  }

  if (!pending) return null

  return (
    <div className="wauth">
      <div className="wauth__card">
        <Link to="/withdraw" className="wauth__back">
          <ArrowLeft size={16} strokeWidth={1.8} /> Back to withdraw
        </Link>

        <div className="wauth__icon">
          <ShieldCheck size={28} strokeWidth={1.7} />
        </div>
        <h1>Confirm your withdrawal</h1>
        <p className="wauth__sub">
          Withdrawals of ${WITHDRAW_AUTH_THRESHOLD} or more need an extra check. Enter the code we emailed you.
        </p>

        <div className="wauth__summary">
          <span>Amount</span>
          <strong>${Number(pending.amount || 0).toFixed(2)}</strong>
        </div>

        <form className="wauth__form" onSubmit={onVerify}>
          <label htmlFor="wauth-code">
            <Mail size={14} strokeWidth={1.8} /> Verification code
          </label>
          <input
            id="wauth-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoFocus
          />

          {msg && <div className={`wauth__msg wauth__msg--${msg.type}`}>{msg.text}</div>}

          <button className="wauth__submit" type="submit" disabled={busy || code.length < 6}>
            {busy ? 'Verifying…' : 'Verify and continue'}
          </button>
        </form>

        <button className="wauth__resend" type="button" onClick={sendCode} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
