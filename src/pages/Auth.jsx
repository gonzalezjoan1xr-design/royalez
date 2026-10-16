import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'
import './Auth.css'

const COUNTRIES = [
  { code: 'US', dial: '+1' },
  { code: 'CA', dial: '+1' },
  { code: 'GB', dial: '+44' },
  { code: 'KE', dial: '+254' },
  { code: 'NG', dial: '+234' },
  { code: 'ZA', dial: '+27' },
  { code: 'IN', dial: '+91' },
  { code: 'AE', dial: '+971' },
]

export default function Auth({ mode }) {
  const isSignup = mode === 'signup'
  const nav = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: 'US',
    phone: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const dial = COUNTRIES.find((c) => c.code === form.country)?.dial ?? '+1'

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')

    if (isSignup && form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }

    setBusy(true)
    const { email, password, firstName, lastName, phone } = form
    const res = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: `${dial}${phone.replace(/\D/g, '')}`,
            },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)

    if (res.error) return setError(res.error.message)
    if (isSignup && !res.data.session)
      return setInfo('Check your email to confirm your account, then sign in.')
    nav('/dashboard')
  }

  const forgot = async () => {
    setError(''); setInfo('')
    if (!form.email) return setError('Enter your email above, then click "Forgot password?".')
    const { error: err } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (err) return setError(err.message)
    setInfo('Password reset link sent. Check your email.')
  }

  return (
    <div className="auth">
      <Link to="/" className="auth__back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <form className="auth__card auth__card--lg" onSubmit={submit}>
        <Link to="/" className="auth__logo"><Logo /></Link>

        <div className="auth__head">
          <h1>{isSignup ? 'Create an account' : 'Welcome back'}</h1>
          <p>{isSignup ? 'Start trading crypto with Horizon Markets' : 'Sign in to your Horizon Markets account'}</p>
        </div>

        {isSignup && (
          <div className="auth__row">
            <label>
              First Name
              <input value={form.firstName} onChange={set('firstName')} placeholder="John" autoComplete="given-name" required />
            </label>
            <label>
              Last Name
              <input value={form.lastName} onChange={set('lastName')} placeholder="Doe" autoComplete="family-name" required />
            </label>
          </div>
        )}

        <label>
          Email
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" required />
        </label>

        {isSignup && (
          <div className="auth__field">
            <span className="auth__label">Phone Number</span>
            <div className="auth__phone">
              <div className="auth__country">
                <select value={form.country} onChange={set('country')} aria-label="Country">
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <div className="auth__dial">
                <span>{dial}</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="(201) 555-0123"
                  autoComplete="tel-national"
                  aria-label="Phone number"
                  required
                />
              </div>
            </div>
          </div>
        )}

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder={isSignup ? 'Create a password' : 'Enter your password'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={6}
          />
        </label>

        {isSignup && (
          <label>
            Confirm Password
            <input
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>
        )}

        {!isSignup && (
          <button type="button" className="auth__forgot" onClick={forgot}>
            Forgot password?
          </button>
        )}

        {error && <div className="auth__msg auth__msg--err" role="alert">{error}</div>}
        {info && <div className="auth__msg auth__msg--ok">{info}</div>}

        <button className="auth__submit" disabled={busy}>
          {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
        </button>

        <div className="auth__switch">
          {isSignup
            ? <>Already have an account? <Link to="/login">Sign in</Link></>
            : <>Don't have an account? <Link to="/signup">Sign up</Link></>}
        </div>
      </form>
    </div>
  )
}
