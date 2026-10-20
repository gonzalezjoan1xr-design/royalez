import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, Cpu, Key, Activity, Settings, Bot, Play, Square, Trash2, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Bots.css'

const EXT = /\.(py|js|ts|json|zip)$/i
const MAX_MB = 5
const INTERVALS = ['1 minute', '5 minutes', '15 minutes', '1 hour', '4 hours', '1 day']
const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY']
const FLAG = { EUR: 'eu', USD: 'us', GBP: 'gb', JPY: 'jp', AUD: 'au', CAD: 'ca', CHF: 'ch', NZD: 'nz' }
const RISK_BADGE = { Low: ['conservative', 'green'], Medium: ['balanced', 'blue'], High: ['aggressive', 'red'] }

// The two built-in bots
const SIMULATED_BOTS = [
  { id: 1, name: 'Bitcoin Accumulation', description: 'Dollar-cost averaging into Bitcoin on a weekly basis.', risk: 'Low', interval: 3000, lossChance: 0.24, pair: 'BTC' },
  { id: 2, name: 'ETH DCA Pro', description: 'Dynamic DCA based on RSI and volume indicators.', risk: 'Medium', interval: 3000, lossChance: 0.25, pair: 'ETH' },
]

const verifyPasskey = async (key) => key.trim().length > 0
const splitVersion = (n = '') => {
  const m = n.match(/^(.*?)\s+v(\d+(?:\.\d+)*)$/i)
  return m ? [m[1], `v${m[2]}`] : [n, null]
}
const prettyName = (file) => file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Trading Bot'

const BASE_PRICES = { BTC: 97500, ETH: 3400 }
const botIntervals = {}

function randomComment(base, price) {
  const p = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const templates = [
    `Buy ${base} @ $${p}`, `Sell ${base} @ $${p}`, `Scanning ${base}/USDT order book`,
    `RSI signal confirmed on ${base}`, `Rebalancing ${base} allocation`, `Volume spike detected on ${base}`,
    `Executing DCA order for ${base}`, `Market trend: ${base} consolidating`, `Spread tightening on ${base}/USDT`,
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

function Flags({ pair }) {
  return (
    <span className="bots__flags">
      {pair.split('/').map((c) => (
        <img key={c} src={`https://flagcdn.com/w40/${FLAG[c]}.png`} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
      ))}
    </span>
  )
}

function AssetPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div className="bots__pick" ref={ref}>
      <button type="button" className="bots__ctl" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span className="bots__ctl-val"><Flags pair={value} /> {value}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="bots__menu" role="listbox">
          {PAIRS.map((p) => (
            <button type="button" key={p} role="option" aria-selected={p === value} className={p === value ? 'is-on' : ''} onClick={() => { onChange(p); setOpen(false) }}>
              <Flags pair={p} /> {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Bots() {
  const { user, profile } = useAuth()
  const balance = Number(profile?.balance || 0)

  const [bots, setBots] = useState([])
  const [note, setNote] = useState(null)
  const [busy, setBusy] = useState('')

  const [file, setFile] = useState(null)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const [passkey, setPasskey] = useState('')

  const [amount, setAmount] = useState('10')
  const [interval, setIntervalV] = useState('1 minute')
  const [asset, setAsset] = useState('EUR/USD')

  // State for the simulation
  const [simState, setSimState] = useState({})
  const [liveBalance, setLiveBalance] = useState(balance)

  useEffect(() => { setLiveBalance(balance) }, [balance])

  const handleBalanceChanged = useCallback((delta) => {
    setLiveBalance(prev => Math.max(0, prev + delta))
  }, [])

  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = 'var(--nav-bg, #050505)'
    return () => { document.body.style.background = prev }
  }, [])

  const say = (t, m) => setNote({ t, m })

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('bots')
      .select('*')
      .eq('user_id', user.id)
      // Filter out the built-in bots so they don't duplicate
      .not('name', 'in', '("Bitcoin Accumulation","ETH DCA Pro")')
      .order('id')
    setBots(data || [])
  }, [user])
  
  useEffect(() => { load() }, [load])

  /* ---------- upload & passkey ---------- */
  const pick = (f) => {
    if (!f) return
    if (!EXT.test(f.name)) return say('err', 'Unsupported file type. Use .py, .js, .ts, .json or .zip.')
    if (f.size > MAX_MB * 1024 * 1024) return say('err', `File is too large (max ${MAX_MB} MB).`)
    setNote(null); setFile(f)
  }
  const onDrop = (e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }

  const upload = async () => {
    if (!file) return inputRef.current?.click()
    setBusy('upload')
    const { error } = await supabase.from('bots').insert({
      name: prettyName(file.name), description: `Uploaded from ${file.name}`, schedule: interval, risk: 'Medium', user_id: user.id,
    })
    setBusy('')
    if (error) return say('err', error.message)
    setFile(null); if (inputRef.current) inputRef.current.value = ''
    say('ok', 'Bot added to My Bots.'); load()
  }

  const activate = async (e) => {
    e.preventDefault()
    if (!passkey.trim()) return
    setBusy('pass')
    if (!(await verifyPasskey(passkey))) { setBusy(''); return say('err', 'Invalid passkey.') }
    const { error } = await supabase.from('bots').insert({
      name: 'Pro Trading Bot v2.1', description: 'Professional algorithmic trading bot with advanced market analysis', schedule: interval, risk: 'Medium', user_id: user.id,
    })
    setBusy('')
    if (error) return say('err', error.message)
    setPasskey(''); say('ok', 'Bot activated. You can find it under My Bots.'); load()
  }

  /* ---------- simulation logic ---------- */
  const startSim = async (b) => {
    const amt = Number(amount)
    if (liveBalance <= 0) return say('err', 'Deposit funds to unlock your bots.')
    if (!(amt > 0)) return say('err', 'Enter a valid trade amount.')
    if (amt > liveBalance) return say('err', 'Trade amount is higher than your available balance.')

    // Deduct balance
    const { error: deductErr } = await supabase.rpc('deduct_balance', { p_user_id: user.id, p_amount: amt })
    if (deductErr) return say('err', deductErr.message)
    handleBalanceChanged(-amt)

    // Set state to active
    setSimState(prev => ({
      ...prev,
      [b.id]: { active: true, allocation: amt, pnl: 0, log: [{ msg: `► Bot started with $${amt.toFixed(2)} allocation`, color: '#00c853', ts: new Date().toLocaleTimeString() }] }
    }))

    const intervalKey = `${user.id}-${b.id}`

    const tick = () => {
      setSimState(prev => {
        const state = prev[b.id]
        if (!state || !state.active) return prev

        const gained = Math.random() < b.lossChance
          ? -parseFloat((2.90 + Math.random() * 0.50).toFixed(2))
          : parseFloat((3.40 + Math.random() * 1.00).toFixed(2))

        const price = BASE_PRICES[b.pair] * (1 + (Math.random() - 0.5) * 0.004)
        const newLog = [
          { msg: `${gained >= 0 ? '↑' : '↓'} Trade ${gained >= 0 ? '+' : ''}$${gained.toFixed(2)}`, color: gained >= 0 ? '#00c853' : '#ff3b5c', ts: new Date().toLocaleTimeString() },
          { msg: randomComment(b.pair, price), color: '#3b82f6', ts: new Date().toLocaleTimeString() },
          ...state.log
        ].slice(0, 15)

        // Sync with DB
        supabase.rpc('increment_balance', { p_user_id: user.id, p_delta: gained }).then()
        handleBalanceChanged(gained)

        return { ...prev, [b.id]: { ...state, pnl: state.pnl + gained, log: newLog } }
      })
    }

    if (!botIntervals[intervalKey]) {
      botIntervals[intervalKey] = setInterval(tick, b.interval)
    }
  }

  const stopSim = async (b) => {
    const intervalKey = `${user.id}-${b.id}`
    clearInterval(botIntervals[intervalKey])
    delete botIntervals[intervalKey]

    const alloc = simState[b.id]?.allocation || 0

    // Refund balance
    if (alloc > 0) {
      const { error } = await supabase.rpc('refund_allocation', { p_user_id: user.id, p_amount: alloc })
      if (!error) handleBalanceChanged(alloc)
    }

    setSimState(prev => ({
      ...prev,
      [b.id]: { active: false, allocation: 0, pnl: 0, log: [] }
    }))
  }

  return (
    <div className="bots">
      {note && <p className={`bots__note ${note.t}`}>{note.m}</p>}

      {/* ---------- upload ---------- */}
      <section className="bots__card">
        <header className="bots__chead"><Upload size={22} /> Upload Trading Bot</header>
        <div className="bots__cbody">
          <div
            className={`bots__drop ${drag ? 'is-drag' : ''}`}
            role="button" tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
          >
            <span className="bots__drop-ic"><Upload size={28} /></span>
            {file ? (
              <>
                <strong>{file.name}</strong>
                <span>{(file.size / 1024).toFixed(1)} KB, click to choose a different file</span>
              </>
            ) : (
              <>
                <strong>Drag &amp; drop your bot file here</strong>
                <span>or click to browse</span>
              </>
            )}
            <small>Supports .py, .js, .ts, .json, .zip files</small>
            <input ref={inputRef} type="file" accept=".py,.js,.ts,.json,.zip" hidden onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          <button className="bots__cta" onClick={upload} disabled={busy === 'upload'}>
            <Cpu size={18} /> {busy === 'upload' ? 'Uploading…' : 'Upload Trading Bot'}
          </button>
        </div>
      </section>

      <div className="bots__or"><span>OR</span></div>

      {/* ---------- passkey ---------- */}
      <section className="bots__card">
        <header className="bots__chead"><Key size={22} /> Activate with Passkey</header>
        <form className="bots__cbody bots__pass" onSubmit={activate}>
          <p>Already have a trading bot passkey? Enter it below to activate your bot instantly.</p>
          <div className="bots__prow">
            <label className="bots__pin">
              <Key size={18} />
              <input value={passkey} onChange={(e) => setPasskey(e.target.value)} placeholder="Enter your trading bot passkey" autoComplete="off" />
            </label>
            <button className="bots__psubmit" disabled={!passkey.trim() || busy === 'pass'}>
              <Activity size={18} /> {busy === 'pass' ? 'Checking…' : 'Submit Passkey'}
            </button>
          </div>
          <small>Passkeys are provided by authorized bot developers. Contact support if you need assistance.</small>
        </form>
      </section>

      {/* ---------- settings ---------- */}
      <section className="bots__card bots__pad">
        <h2 className="bots__h2"><Settings size={20} /> Bot Settings</h2>
        <p className="bots__sub">Configure your bot before starting</p>
        <div className="bots__fields">
          <div className="bots__field">
            <label htmlFor="bot-amt">Trade Amount ($)</label>
            <input id="bot-amt" className="bots__ctl" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="bots__field">
            <label htmlFor="bot-int">Trade Interval</label>
            <div className="bots__sel">
              <select id="bot-int" className="bots__ctl" value={interval} onChange={(e) => setIntervalV(e.target.value)}>
                {INTERVALS.map((i) => <option key={i}>{i}</option>)}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="bots__field">
            <label>Trading Asset</label>
            <AssetPicker value={asset} onChange={setAsset} />
          </div>
        </div>
      </section>

      {/* ---------- my bots ---------- */}
      <section className="bots__card bots__pad">
        <h2 className="bots__h2"><Bot size={20} /> My Bots ({bots.length + SIMULATED_BOTS.length})</h2>
        
        <div className="bots__list">
          
          {/* 1. Simulated Bots (Bitcoin & ETH) */}
          {SIMULATED_BOTS.map((b) => {
            const state = simState[b.id] || { active: false, pnl: 0, log: [] }
            const on = state.active
            const [riskLabel, riskTone] = RISK_BADGE[b.risk] || ['balanced', 'blue']

            return (
              <article className="bots__item" key={`sim-${b.id}`}>
                <span className="bots__ico"><Bot size={22} /></span>
                <div className="bots__info">
                  <h3>{b.name}</h3>
                  <p>{b.description}</p>
                </div>
                <div className="bots__badges">
                  <span className={`bots__badge ${riskTone}`}>{riskLabel}</span>
                  <span className={`bots__badge ${on ? 'green' : 'amber'}`}>{on ? 'running' : 'stopped'}</span>
                  {on && <span className={`bots__badge ${state.pnl >= 0 ? 'green' : 'red'}`}>{state.pnl >= 0 ? '+' : ''}${state.pnl.toFixed(2)}</span>}
                </div>
                <div className="bots__acts">
                  <button className={`bots__btn ${on ? 'stop' : 'start'}`} onClick={() => on ? stopSim(b) : startSim(b)}>
                    {on ? <Square size={15} /> : <Play size={15} />} {on ? 'Stop' : 'Start'}
                  </button>
                </div>

                {/* The Trading Trends / Activity Log */}
                {on && state.log.length > 0 && (
                  <div className="bots__log">
                    <div className="bots__log-head">Activity Log</div>
                    <div className="bots__log-body" style={{ maxHeight: '160px' }}>
                      {state.log.map((l, i) => (
                        <div key={i} className="bots__log-line" style={{ color: l.color }}>
                          <span className="bots__log-ts">{l.ts}</span>{l.msg}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )
          })}

          {/* 2. Uploaded Bots */}
          {bots.map((b) => {
            const [name, ver] = splitVersion(b.name)
            const [riskLabel, riskTone] = RISK_BADGE[b.risk] || [String(b.risk || '').toLowerCase(), 'blue']
            const on = b.status === 'Active'
            return (
              <article className="bots__item" key={b.id}>
                <span className="bots__ico"><Bot size={22} /></span>
                <div className="bots__info">
                  <h3>{name} {ver && <small>{ver}</small>}</h3>
                  <p>{b.description}</p>
                </div>
                <div className="bots__badges">
                  <span className={`bots__badge ${riskTone}`}>{riskLabel}</span>
                  <span className={`bots__badge ${on ? 'green' : 'amber'}`}>{on ? 'running' : 'stopped'}</span>
                </div>
                <div className="bots__acts">
                  <button className={`bots__btn ${on ? 'stop' : 'start'}`} onClick={async () => {
                    await supabase.from('bots').update({ status: on ? 'Paused' : 'Active' }).eq('id', b.id)
                    load()
                  }}>
                    {on ? <Square size={15} /> : <Play size={15} />} {on ? 'Stop' : 'Start'}
                  </button>
                  <button className="bots__btn del" onClick={async () => {
                    await supabase.from('bots').delete().eq('id', b.id)
                    load()
                  }}><Trash2 size={15} /> Delete</button>
                </div>
              </article>
            )
          })}
          
        </div>
      </section>
    </div>
  )
}
