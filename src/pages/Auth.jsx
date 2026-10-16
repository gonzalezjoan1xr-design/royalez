import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'
import './Auth.css'

export default function Auth({ mode }) {
  const isSignup = mode === 'signup'
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    const { email, password, username } = form
    const res = isSignup
      ? await supabase.auth.signUp({ email, password, options: { data: { username } } })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (res.error) return setError(res.error.message)
    if (isSignup && !res.data.session) return setInfo('Check your email to confirm your account, then sign in.')
    nav('/dashboard')
  }

  return (
    <div className="auth">
      <Link to="/" className="auth__logo"><Logo /></Link>
      <form className="auth__card" onSubmit={submit}>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p>{isSignup ? 'Start trading in a few minutes.' : 'Sign in to continue trading.'}</p>
        {isSignup && (
          <label>Username<input value={form.username} onChange={set('username')} required minLength={3} /></label>
        )}
        <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} required minLength={6} /></label>
        {error && <div className="auth__msg auth__msg--err">{error}</div>}
        {info && <div className="auth__msg auth__msg--ok">{info}</div>}
        <button className="auth__submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}</button>
        <div className="auth__switch">
          {isSignup ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New here? <Link to="/signup">Create an account</Link></>}
        </div>
      </form>
    </div>
  )
}
