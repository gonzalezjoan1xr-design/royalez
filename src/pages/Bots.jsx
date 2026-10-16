import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Bots.css'

const RISK_CLASS = { Low: 'up', Medium: 'warn', High: 'down' }

export default function Bots() {
  const { user, profile } = useAuth()
  const [bots, setBots] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', schedule: 'Weekly', risk: 'Low', description: '' })
  const [note, setNote] = useState('')
  const balance = Number(profile?.balance || 0)

  const load = useCallback(async () => {
    const { data } = await supabase.from('bots').select('*').eq('user_id', user.id).order('id')
    setBots(data || [])
  }, [user])
  useEffect(() => { load() }, [load])

  const create = async (e) => {
    e.preventDefault()
    await supabase.from('bots').insert({ ...form, user_id: user.id })
    setOpen(false); setForm({ name: '', schedule: 'Weekly', risk: 'Low', description: '' }); load()
  }

  const toggle = async (b) => {
    if (balance <= 0) return setNote('Deposit funds to unlock your bots.')
    setNote('')
    await supabase.from('bots').update({ status: b.status === 'Active' ? 'Paused' : 'Active' }).eq('id', b.id)
    load()
  }

  const totals = bots.reduce((a, b) => ({ pnl: a.pnl + Number(b.pnl), wins: a.wins + b.wins, losses: a.losses + b.losses, alloc: a.alloc + Number(b.allocated) }), { pnl: 0, wins: 0, losses: 0, alloc: 0 })
  const trades = totals.wins + totals.losses
  const rate = trades ? `${Math.round((totals.wins / trades) * 100)}%` : '—'
  const locked = balance <= 0

  return (
    <div className="bots">
      <section className="bots__hero">
        <h1>Automated Trading</h1>
        <p>Create and manage algorithmic trading strategies</p>
        <div className="bots__stats">
          <div><b>{bots.length}</b><span>Total Bots</span></div>
          <div><b>${balance.toFixed(2)}</b><span>Available Balance</span></div>
          <div><b className="up">{totals.pnl >= 0 ? '+' : '-'}${Math.abs(totals.pnl).toFixed(2)}</b><span>P&amp;L</span></div>
          <div><b>{rate}</b><span>Win Rate</span></div>
          <div><b>{trades}</b><span>Trades</span></div>
          <div><b>${totals.alloc.toFixed(0)}</b><span>Allocated</span></div>
          <div><b className={locked ? 'down' : 'up'}>{locked ? 'Locked' : 'Ready'}</b><span>Bot Status</span></div>
        </div>
      </section>

      <div className="bots__head">
        <div><h2>Dollar-Cost Averaging Bots</h2><p>Regular purchases of assets regardless of price</p></div>
        <button className="bots__new" onClick={() => setOpen(true)}>Create New Bot</button>
      </div>
      {note && <p className="bots__note">{note}</p>}

      <div className="bots__grid">
        {bots.map((b) => (
          <article className="bots__card" key={b.id}>
            <div className="bots__top"><h3>{b.name}</h3><span className="bots__status">{b.status}</span></div>
            <div className="bots__sub">{b.schedule} • DCA</div>
            <p>{b.description}</p>
            <div className="bots__metrics">
              <div><span>Risk</span><b className={RISK_CLASS[b.risk]}>{b.risk}</b></div>
              <div><span>P&amp;L</span><b className="up">+${Number(b.pnl).toFixed(2)}</b></div>
              <div><span>Wins</span><b>{b.wins}</b></div>
              <div><span>Losses</span><b className="down">{b.losses}</b></div>
            </div>
            <div className="bots__metrics">
              <div><span>Win Rate</span><b>{b.wins + b.losses ? `${Math.round((b.wins / (b.wins + b.losses)) * 100)}%` : '—'}</b></div>
              <div><span>Allocated</span><b>${Number(b.allocated).toFixed(0)}</b></div>
            </div>
            <button className="bots__toggle" onClick={() => toggle(b)}>{b.status === 'Active' ? 'Pause bot' : 'Start bot'}</button>
          </article>
        ))}
      </div>

      {open && (
        <div className="bots__modal" onClick={() => setOpen(false)}>
          <form className="bots__form" onClick={(e) => e.stopPropagation()} onSubmit={create}>
            <h3>Create New Bot</h3>
            <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label>Schedule<select value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })}><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label>
            <label>Risk<select value={form.risk} onChange={(e) => setForm({ ...form, risk: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label>
            <div className="bots__form-actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="bots__new">Create bot</button></div>
          </form>
        </div>
      )}
    </div>
  )
}
