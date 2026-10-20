import { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import logo from '../Assets/justR.png'
import './VerifyEmail.css'

const LEN = 5

export default function VerifyEmail() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth()
  const nav = useNavigate()
  const [digits, setDigits] = useState(Array(LEN).fill(''))
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [cool, setCool] = useState(0)
  const refs = useRef([])
  const sentOnce = useRef(false)

  // Shows the real reason, including the HTTP status and the server's own message
  const errText = async (data, error, fallback) => {
    if (data?.error) return data.error
    const res = error?.context
    if (res && typeof res.clone === 'function') {
      let body = ''
      try {
        const j = await res.clone().json()
        body = j?.error || j?.message || j?.msg || JSON.stringify(j)
      } catch {
        try { body = await res.clone().text() } catch { /* ignore */ }
      }
      return `${body || fallback} (HTTP ${res.status})`
    }
    return error?.message || fallback
  }

  const send = async () => {
    setMsg(null)
    const { data, error } = await supabase.functions.invoke('send-code')
    if (data?.already) { await refreshProfile(); return }
    if (error || data?.error) {
      const text = await errText(data, error, 'Could not send the code.')
      setMsg({ type: 'err', text })
      if (/wait a minute/i.test(text)) setCool(60)
      return
    }
    setMsg({ type: 'ok', text: `We sent a 5-digit code to ${user?.email}` })
    setCool(60)
  }

  useEffect(() => {
    if (user && profile && profile.email_verified !== true && !sentOnce.current) {
      sentOnce.current = true
      send()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  useEffect(() => {
    if (cool <= 0) return
    const t = setTimeout(() => setCool((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cool])

  const submit = async (arr) => {
    const code = arr.join('')
    if (code.length !== LEN) return
    setBusy(true); setMsg(null)
    const { data, error } = await supabase.functions.invoke('verify-code', { body: { code } })
    if (error || data?.error) {
      setBusy(false)
      setMsg({ type: 'err', text: await errText(data, error, 'Verification failed.') })
      setDigits(Array(LEN).fill(''))
      refs.current[0]?.focus()
      return
    }
    await refreshProfile()
    setBusy(false)
    nav('/dashboard', { replace: true })
  }

  const onChange = (i, v) => {
    const d = v.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[i] = d; setDigits(next)
    if (d && i < LEN - 1) refs.current[i + 1]?.focus()
    if (d && next.every(Boolean)) submit(next)
  }
  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }
  const onPaste = (e) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN)
    if (!t) return
    e.preventDefault()
    const next = Array(LEN).fill('').map((_, i) => t[i] || '')
    setDigits(next)
    refs.current[Math.min(t.length, LEN - 1)]?.focus()
    if (t.length === LEN) submit(next)
  }

  if (loading) return <div className="app-loading">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.email_verified === true) return <Navigate to="/dashboard" replace />

  return (
    <div className="vfy">
      <div className="vfy__card">
        <div className="vfy__logo">
          <img src={logo} alt="Royal Markets" />
        </div>

        <div className="vfy__head">
          <h1>Check your email</h1>
          <p>Enter the 5-digit code Royal Markets sent to <b>{user.email}</b></p>
        </div>

        <div className="vfy__boxes" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              autoFocus={i === 0}
              disabled={busy}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
            />
          ))}
        </div>

        {msg && <div className={`vfy__msg vfy__msg--${msg.type}`} role="alert">{msg.text}</div>}

        <button type="button" className="vfy__submit" disabled={busy || digits.some((d) => !d)} onClick={() => submit(digits)}>
          {busy ? 'Verifying…' : 'Verify email'}
        </button>

        <div className="vfy__links">
          <button type="button" className="vfy__link" disabled={cool > 0} onClick={send}>
            {cool > 0 ? `Resend code in ${cool}s` : 'Resend code'}
          </button>
          <button type="button" className="vfy__link vfy__link--muted" onClick={signOut}>
            Use a different account
          </button>
        </div>
      </div>
    </div>
  )
}
