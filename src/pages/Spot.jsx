import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Spot.css'

const MAX_POINTS = 60
const PAYOUT = 1.95

export default function Spot() {
  const { user, profile, refreshProfile } = useAuth()
  const balance = Number(profile?.balance || 0)

  const [ticks, setTicks] = useState(() => {
    let p = 4971, out = []
    for (let i = 0; i < MAX_POINTS; i++) { p += (Math.random() - 0.5) * 0.9; out.push(+p.toFixed(2)) }
    return out
  })
  const [stake, setStake] = useState(50)
  const [duration, setDuration] = useState(1)
  const [mode, setMode] = useState('manual')
  const [session, setSession] = useState({ trades: 0, wins: 0, losses: 0, pnl: 0 })
  const [msg, setMsg] = useState('')
  const pending = useRef(null)
  const ticksRef = useRef(ticks)
  ticksRef.current = ticks

  const settle = async (pick, stk) => {
    const last = ticksRef.current[ticksRef.current.length - 1]
    const digit = Math.round(last * 100) % 10
    const won = (digit % 2 === 0) === (pick === 'even')
    const payout = won ? +(stk * PAYOUT).toFixed(2) : 0
    setSession((s) => ({
      trades: s.trades + 1, wins: s.wins + (won ? 1 : 0), losses: s.losses + (won ? 0 : 1),
      pnl: +(s.pnl + (won ? payout - stk : -stk)).toFixed(2),
    }))
    setMsg(won ? `Won $${(payout - stk).toFixed(2)} — last digit ${digit}` : `Lost $${stk.toFixed(2)} — last digit ${digit}`)
    if (won) {
      await supabase.from('profiles').update({ balance: Number(profile.balance) - stk + payout }).eq('id', user.id)
    }
    await supabase.from('trades').insert({ user_id: user.id, market: 'Volatility 10 Index', contract: `Even/Odd ${pick}`, stake: stk, result: won ? 'win' : 'loss', payout })
    refreshProfile()
  }

  useEffect(() => {
    const id = setInterval(() => {
      setTicks((prev) => {
        const next = +(prev[prev.length - 1] + (Math.random() - 0.5) * 0.9).toFixed(2)
        return [...prev.slice(-(MAX_POINTS - 1)), next]
      })
      const p = pending.current
      if (p) {
        p.left -= 1
        if (p.left <= 0) { pending.current = null; setTimeout(() => settle(p.pick, p.stake), 0) }
      }
    }, 1000)
    return () => clearInterval(id)
  }) // eslint-disable-line

  const place = async (pick) => {
    if (pending.current) return setMsg('Wait for the current trade to finish.')
    if (stake > balance || stake <= 0) return
    const { error } = await supabase.from('profiles').update({ balance: balance - stake }).eq('id', user.id)
    if (error) return setMsg(error.message)
    pending.current = { pick, stake, left: duration }
    setMsg(`Trade placed: ${pick} for ${duration} tick${duration > 1 ? 's' : ''}…`)
    refreshProfile()
  }

  const min = Math.min(...ticks), max = Math.max(...ticks)
  const y = (v) => 20 + (1 - (v - min) / (max - min || 1)) * 380
  const pts = ticks.map((v, i) => `${(i / (MAX_POINTS - 1)) * 1000},${y(v)}`).join(' ')
  const last = ticks[ticks.length - 1]
  const change = ((last - ticks[0]) / ticks[0]) * 100
  const insufficient = stake > balance

  return (
    <div className="spot">
      <section className="spot__chart">
        <div className="spot__pickers">
          <div className="spot__pill"><strong>Volatility 10 Index</strong><span>{last.toFixed(2)} <b className={change >= 0 ? 'up' : 'down'}>{change.toFixed(2)}%</b></span></div>
          <div className="spot__pill"><strong>Even/Odd</strong><span>Contract Type</span></div>
        </div>
        <svg viewBox="0 0 1000 420" preserveAspectRatio="none" className="spot__svg">
          {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1="0" x2="1000" y1={20 + i * 76} y2={20 + i * 76} stroke="#1b2e26" />)}
          <polygon points={`0,420 ${pts} 1000,420`} fill="rgba(34,197,94,0.07)" />
          <polyline points={pts} fill="none" stroke="#f2f7f4" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="spot__last">{last.toFixed(2)}</div>
      </section>

      <aside className="spot__panel">
        <div className="spot__bal"><span>Balance</span><strong>${balance.toFixed(2)}</strong></div>
        <div className="spot__mode">
          <button className={mode === 'auto' ? 'is-on' : ''} onClick={() => setMode('auto')}>● Auto</button>
          <button className={mode === 'manual' ? 'is-on' : ''} onClick={() => setMode('manual')}>● Manual</button>
        </div>
        <div className="spot__stake">
          <button onClick={() => setStake(Math.max(1, stake - 10))} aria-label="Decrease stake">-</button>
          <label><span>Stake</span><div>$<input type="number" min="1" value={stake} onChange={(e) => setStake(+e.target.value)} /></div></label>
          <button onClick={() => setStake(stake + 10)} aria-label="Increase stake">+</button>
        </div>
        {insufficient && <p className="spot__err">Insufficient balance</p>}
        <div className="spot__ticks">
          <div className="spot__ticks-head"><span>Ticks</span><b>{duration}</b></div>
          <div className="spot__ticks-row">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button key={n} className={duration === n ? 'is-on' : ''} onClick={() => setDuration(n)}>{n}</button>
            ))}
          </div>
        </div>
        <div className="spot__session">
          <span>Session {session.trades}t · {session.wins}W/{session.losses}L</span>
          <b className={session.pnl >= 0 ? 'up' : 'down'}>{session.pnl >= 0 ? '+' : ''}{session.pnl.toFixed(2)}</b>
        </div>
        {msg && <p className="spot__msg">{msg}</p>}
        <div className="spot__buy">
          <button className="spot__even" disabled={insufficient || mode === 'auto'} onClick={() => place('even')}>Even<small>${(stake * PAYOUT).toFixed(2)}</small></button>
          <button className="spot__odd" disabled={insufficient || mode === 'auto'} onClick={() => place('odd')}>Odd<small>${(stake * PAYOUT).toFixed(2)}</small></button>
        </div>
      </aside>
    </div>
  )
}
