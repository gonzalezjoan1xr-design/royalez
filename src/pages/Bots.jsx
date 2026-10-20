import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, Cpu, Key, Activity, Settings, Bot, Play, Square, Trash2, ChevronDown, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Bots.css'

const EXT = /\.(py|js|ts|json|zip)$/i
const MAX_MB = 5
const INTERVALS = ['1 minute', '5 minutes', '15 minutes', '1 hour', '4 hours', '1 day']
const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY']
const FLAG = { EUR: 'eu', USD: 'us', GBP: 'gb', JPY: 'jp', AUD: 'au', CAD: 'ca', CHF: 'ch', NZD: 'nz' }

const MIN_BALANCE = 1
const MIN_ALLOCATION = 49

// ── COIN LOGOS / COLORS (only the two we need) ──────────────────────────
const COIN_LOGOS = {
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
}
const COIN_COLORS = { BTC: '#F7931A', ETH: '#627EEA' }

// ── SIMULATED PRICE FEED ───────────────────────────────────────────────
const BASE_PRICES = { BTC: 97500, ETH: 3400 }

function CoinCircle({ base, size = 36 }) {
  const [failed, setFailed] = useState(false)
  const logo = COIN_LOGOS[base]
  const color = COIN_COLORS[base] || '#333'
  const label = base.length <= 2 ? base : base.slice(0, 2)
  const fontSize = size <= 20 ? 8 : size <= 32 ? 11 : 13
  if (logo && !failed) {
    return (
      <img
        src={logo} alt={base} width={size} height={size}
        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, minWidth: size, borderRadius: '50%',
      backgroundColor: color, fontSize, fontWeight: 900, color: '#fff', flexShrink: 0,
      userSelect: 'none', lineHeight: 1, fontFamily: 'Inter,sans-serif', verticalAlign: 'middle'
    }}>{label}</span>
  )
}

function randomComment(base, price) {
  const p = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const templates = [
    `Buy ${base} @ $${p}`, `Sell ${base} @ $${p}`, `Scanning ${base}/USDT order book`,
    `RSI signal confirmed on ${base}`, `Rebalancing ${base} allocation`, `Volume spike detected on ${base}`,
    `Executing DCA order for ${base}`, `Market trend: ${base} consolidating`, `Spread tightening on ${base}/USDT`,
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

// ── BOT CONFIGS ────────────────────────────────────────────────────────
const BOT_CONFIGS = [
  { id: 1, name: 'Bitcoin Accumulation', subtitle: 'Weekly • DCA', description: 'Dollar-cost averaging into Bitcoin on a weekly basis.', risk: 'Low', interval: 3000, drift: 0.14, volatility: 0.05, lossChance: 0.24, lossMult: 0.35, pair: 'BTC' },
  { id: 2, name: 'ETH DCA Pro', subtitle: 'Daily • DCA', description: 'Dynamic DCA based on RSI and volume indicators.', risk: 'Medium', interval: 3000, drift: 0.14, volatility: 0.06, lossChance: 0.25, lossMult: 0.38, pair: 'ETH' },
]

// ── GLOBAL BOT INTERVALS ──────────────────────────────────────────────
const botIntervals = {}

/* =================================================================== */
/*  BOT CARD                                                           */
/* =================================================================== */
function BotCard({ bot, balance, userId, onStatsChange, onBalanceChanged }) {
  const canRun = balance >= MIN_BALANCE
  const [active, setActive] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [allocation, setAllocation] = useState('')
  const [log, setLog] = useState([])
  const [pnl, setPnl] = useState(0)
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const allocatedRef = useRef(0)
  const winsRef = useRef(0)
  const lossesRef = useRef(0)
  const priceRef = useRef(BASE_PRICES[bot.pair] || 100)
  const intervalKey = `${userId}-${bot.id}`

  function addLog(msg, color = '#aaa') {
    setLog(prev => [{
      msg, color,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }, ...prev].slice(0, 20))
  }

  async function persist(patch) {
    try {
      const { error } = await supabase
        .from('bot_simulated_pnl')
        .upsert({
          user_id: userId,
          bot_id: bot.id,
          pnl,
          wins,
          losses,
          allocation: allocatedRef.current,
          configured,
          active,
          updated_at: new Date().toISOString(),
          ...patch,
        }, { onConflict: 'user_id,bot_id' })
      if (error) console.error('bot_simulated_pnl upsert failed:', error.message)
    } catch (err) { console.error('Persist error:', err) }
  }

  const tick = useCallback(async () => {
    try {
      if (allocatedRef.current === 0) return

      priceRef.current = priceRef.current * (1 + (Math.random() - 0.5) * 0.004)
      addLog(randomComment(bot.pair, priceRef.current), '#3b82f6')

      const total = winsRef.current + lossesRef.current
      let isLoss = false
      if (total > 0) {
        const lossRate = lossesRef.current / total
        if (lossRate < 0.24) isLoss = true
        else if (lossRate > 0.27) isLoss = false
        else isLoss = Math.random() < bot.lossChance
      } else {
        isLoss = Math.random() < bot.lossChance
      }

      const gained = isLoss
        ? -parseFloat((2.90 + Math.random() * 0.50).toFixed(2))
        : parseFloat((3.40 + Math.random() * 1.00).toFixed(2))

      setPnl(prev => {
        const next = parseFloat((prev + gained).toFixed(2))
        const newWins = gained >= 0 ? winsRef.current + 1 : winsRef.current
        const newLosses = gained < 0 ? lossesRef.current + 1 : lossesRef.current
        winsRef.current = newWins
        lossesRef.current = newLosses
        setWins(newWins)
        setLosses(newLosses)

        // persist stats
        supabase
          .from('bot_simulated_pnl')
          .upsert({
            user_id: userId,
            bot_id: bot.id,
            pnl: next,
            wins: newWins,
            losses: newLosses,
            allocation: allocatedRef.current,
            configured: true,
            active: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,bot_id' })
          .then(({ error }) => { if (error) console.error('DB upsert error:', error.message) })

        // update balance
        supabase.rpc('increment_balance', { p_user_id: userId, p_delta: gained })
          .then(({ error }) => { if (error) console.error('Balance update error:', error.message) })

        // notify parent so the hero stat refreshes
        onBalanceChanged?.(gained)

        return next
      })

      const up = gained >= 0
      addLog(`${up ? '↑' : '↓'} Trade ${up ? '+' : ''}$${gained.toFixed(2)}`, up ? '#00c853' : '#ff3b5c')
    } catch (err) {
      console.error('Error in tick:', err)
      addLog('! Bot error – check console', '#ff3b5c')
    }
  }, [bot, userId, onBalanceChanged])

  useEffect(() => {
    if (!userId) return
    const loadState = async () => {
      try {
        const { data, error } = await supabase
          .from('bot_simulated_pnl')
          .select('*')
          .eq('user_id', userId)
          .eq('bot_id', bot.id)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setPnl(data.pnl ?? 0)
          setWins(data.wins ?? 0)
          setLosses(data.losses ?? 0)
          setAllocation(data.allocation ? String(data.allocation) : '')
          setConfigured(!!data.configured)
          winsRef.current = data.wins ?? 0
          lossesRef.current = data.losses ?? 0
          allocatedRef.current = data.allocation ?? 0
          if (data.active) {
            setActive(true)
            if (!botIntervals[intervalKey]) {
              botIntervals[intervalKey] = setInterval(tick, bot.interval)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load bot state:', err)
      } finally {
        setLoaded(true)
      }
    }
    loadState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, bot.id])

  async function handleStart() {
    if (!canRun || !configured) return

    if (active) {
      clearInterval(botIntervals[intervalKey])
      delete botIntervals[intervalKey]

      // refund the allocation back to balance
      if (allocatedRef.current > 0) {
        const { error: refErr } = await supabase.rpc('refund_allocation', {
          p_user_id: userId,
          p_amount: allocatedRef.current,
        })
        if (refErr) console.error('Refund error:', refErr.message)
        else onBalanceChanged?.(allocatedRef.current)
      }

      setActive(false)
      setAllocation('')
      setConfigured(false)
      setLog([])
      setPnl(0)
      setWins(0)
      setLosses(0)
      winsRef.current = 0
      lossesRef.current = 0
      allocatedRef.current = 0
      await persist({ active: false, allocation: 0, configured: false, pnl: 0, wins: 0, losses: 0 })
      return
    }

    const alloc = parseFloat(allocation)
    if (!alloc || alloc < MIN_ALLOCATION) {
      addLog(`! Allocation must be $${MIN_ALLOCATION} or above`, '#ff3b5c')
      return
    }
    if (alloc > balance) {
      addLog('! Allocation exceeds balance', '#ff3b5c')
      return
    }

    // ── DEDUCT ALLOCATION FROM USER BALANCE ──
    const { error: deductErr } = await supabase.rpc('deduct_balance', {
      p_user_id: userId,
      p_amount: alloc,
    })
    if (deductErr) {
      addLog(`! ${deductErr.message}`, '#ff3b5c')
      return
    }
    onBalanceChanged?.(-alloc)

    allocatedRef.current = alloc
    setActive(true)
    addLog(`► Bot started with $${alloc.toFixed(2)} allocation`, '#00c853')
    await persist({ active: true, allocation: alloc, configured: true })

    if (!botIntervals[intervalKey]) {
      botIntervals[intervalKey] = setInterval(tick, bot.interval)
    }
  }

  async function handleSaveConfig() {
    const alloc = parseFloat(allocation)
    if (!alloc || alloc < MIN_ALLOCATION) {
      addLog(`! Allocation must be $${MIN_ALLOCATION} or above`, '#ff3b5c')
      return
    }
    if (alloc > balance) {
      addLog('! Allocation exceeds balance', '#ff3b5c')
      return
    }
    allocatedRef.current = alloc
    setConfigured(true)
    setShowConfig(false)
    addLog(`✔ Configured — $${alloc.toFixed(2)} allocated`, '#00c853')
    await persist({ allocation: alloc, configured: true })
  }

  useEffect(() => {
    if (!loaded) return
    onStatsChange?.(bot.id, {
      pnl,
      wins,
      losses,
      allocation: configured ? parseFloat(allocation || 0) : 0,
      active,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, pnl, wins, losses, allocation, active, configured])

  const statusLabel = active ? 'Running' : configured ? 'Ready' : 'Not Configured'
  const statusColor = active ? '#00c853' : configured ? '#ffaa00' : '#6b7280'

  if (!loaded) {
    return (
      <div className="bots__item bots__item--skeleton">
        <div className="skel-line skel-line--60" />
        <div className="skel-line skel-line--40" />
        <div className="skel-block" />
      </div>
    )
  }

  return (
    <article className={`bots__item bots__item--sim ${active ? 'is-live' : ''}`}>
      {/* header */}
      <div className="bots__sim-head">
        <span className="bots__ico"><CoinCircle base={bot.pair} size={22} /></span>
        <div className="bots__info">
          <h3>{bot.name}</h3>
          <p>{bot.subtitle} · <span className={`bots__risk ${bot.risk.toLowerCase()}`}>{bot.risk} Risk</span></p>
        </div>
        <div className="bots__badges">
          <span className="bots__badge" style={{ background: statusColor + '1a', color: statusColor, border: `1px solid ${statusColor}55` }}>
            {active && <span className="bots__dot" style={{ background: statusColor }} />}
            {statusLabel}
          </span>
          <span className={`bots__badge ${pnl >= 0 ? 'green' : 'red'}`}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
          </span>
        </div>
      </div>

      <p className="bots__desc">{bot.description}</p>

      {/* config box */}
      {showConfig && (
        <div className="bots__config">
          {!canRun && <div className="bots__alert">! Minimum balance ${MIN_BALANCE} required to run bots.</div>}
          <div className="bots__config-row">
            <div className="bots__field">
              <label htmlFor={`alloc-${bot.id}`}>Allocation size</label>
              <div className="bots__input-wrap">
                <input
                  id={`alloc-${bot.id}`}
                  type="number"
                  min={MIN_ALLOCATION}
                  max={balance}
                  placeholder={`Min ${MIN_ALLOCATION}`}
                  value={allocation}
                  onChange={e => setAllocation(e.target.value)}
                  className="bots__ctl"
                  disabled={!canRun}
                />
                <span className="bots__unit">USD</span>
              </div>
            </div>
            <div className="bots__field">
              <label>Available balance</label>
              <div className="bots__static">${Number(balance).toFixed(2)}</div>
            </div>
          </div>
          <div className="bots__hint">Minimum allocation is ${MIN_ALLOCATION}</div>
          <div className="bots__config-actions">
            <button
              className="bots__btn start"
              onClick={handleSaveConfig}
              disabled={!canRun || !allocation || parseFloat(allocation) < MIN_ALLOCATION || parseFloat(allocation) > balance}
            >
              Save Configuration
            </button>
            <button className="bots__btn" onClick={() => setShowConfig(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* actions */}
      <div className="bots__acts">
        <button
          className="bots__btn"
          onClick={() => { if (canRun) setShowConfig(v => !v) }}
          disabled={!canRun || active}
        >
          {showConfig ? 'Close' : 'Configure'}
        </button>
        <button
          className={`bots__btn ${active ? 'stop' : 'start'}`}
          onClick={handleStart}
          disabled={!canRun || !configured}
        >
          {active ? <><Square size={15} /> Stop Bot</> : <><Play size={15} /> Start Bot</>}
        </button>
      </div>

      {/* logs */}
      {log.length > 0 && (
        <div className="bots__log">
          <div className="bots__log-head">Activity Log</div>
          <div className="bots__log-body" style={{ maxHeight: active ? '220px' : '110px', transition: 'max-height .3s ease' }}>
            {log.map((l, i) => (
              <div key={i} className="bots__log-line" style={{ color: l.color }}>
                <span className="bots__log-ts">{l.ts}</span>{l.msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

/* =================================================================== */
/*  UTILS & PICKERS                                                    */
/* =================================================================== */
const verifyPasskey = async (key) => key.trim().length > 0
const splitVersion = (n = '') => {
  const m = n.match(/^(.*?)\s+v(\d+(?:\.\d+)*)$/i)
  return m ? [m[1], `v${m[2]}`] : [n, null]
}
const prettyName = (file) => file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Trading Bot'

function Flags({ pair }) {
  return (
    <span className="bots__flags">
      {pair.split('/').map(c => (
        <img key={c} src={`https://flagcdn.com/w40/${FLAG[c]}.png`} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
      ))}
    </span>
  )
}

function AssetPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div className="bots__pick" ref={ref}>
      <button type="button" className="bots__ctl" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span className="bots__ctl-val"><Flags pair={value} /> {value}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="bots__menu" role="listbox">
          {PAIRS.map(p => (
            <button type="button" key={p} role="option" aria-selected={p === value}
              className={p === value ? 'is-on' : ''}
              onClick={() => { onChange(p); setOpen(false) }}>
              <Flags pair={p} /> {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* =================================================================== */
/*  PAGE                                                               */
/* =================================================================== */
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
  const [botStats, setBotStats] = useState({})

  // local balance that mirrors profile.balance + P&L deltas
  const [liveBalance, setLiveBalance] = useState(balance)
  useEffect(() => { setLiveBalance(balance) }, [balance])

  const handleBalanceChanged = useCallback((delta) => {
    setLiveBalance(prev => Math.max(0, prev + delta))
  }, [])

  const handleStatsChange = useCallback((botId, stats) => {
    setBotStats(prev => ({ ...prev, [botId]: stats }))
  }, [])

  const aggregate = (() => {
    const all = Object.values(botStats)
    const totalPnl = all.reduce((s, x) => s + (x.pnl || 0), 0)
    const totalWins = all.reduce((s, x) => s + (x.wins || 0), 0)
    const totalLosses = all.reduce((s, x) => s + (x.losses || 0), 0)
    const totalTrades = totalWins + totalLosses
    const totalAllocated = all.reduce((s, x) => s + (x.allocation || 0), 0)
    const winRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : null
    return { totalPnl, totalTrades, totalAllocated, winRate }
  })()

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
      // Filter out the built-in DCA bots so they don't duplicate in "My Uploaded Bots"
      .not('name', 'in', '("Bitcoin Accumulation","ETH DCA Pro")')
      .order('id')
    setBots(data || [])
  }, [user])
  
  useEffect(() => { load() }, [load])

  const pick = (f) => {
    if (!f) return
    if (!EXT.test(f.name)) return say('err', 'Unsupported file type. Use .py, .js, .ts, .json or .zip.')
    if (f.size > MAX_MB * 1024 * 1024) return say('err', `File is too large (max ${MAX_MB} MB).`)
    setNote(null); setFile(f)
  }
  const onDrop = e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }

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

  const toggle = async (b) => {
    if (b.status === 'Active') {
      await supabase.from('bots').update({ status: 'Paused' }).eq('id', b.id)
      setNote(null); return load()
    }
    const amt = Number(amount)
    if (balance <= 0) return say('err', 'Deposit funds to unlock your bots.')
    if (!(amt > 0)) return say('err', 'Enter a valid trade amount.')
    if (amt > balance) return say('err', 'Trade amount is higher than your available balance.')
    await supabase.from('bots').update({ status: 'Active', schedule: interval, allocated: amt }).eq('id', b.id)
    say('ok', `${splitVersion(b.name)[0]} started on ${asset}, $${amt} every ${interval}.`); load()
  }
  
  const remove = async (b) => {
    await supabase.from('bots').delete().eq('id', b.id)
    load()
  }

  return (
    <div className="bots">
      {note && <p className={`bots__note ${note.t}`}>{note.m}</p>}

      {/* Hero stats */}
      <section className="bots__hero">
        <div className="bots__hero-stats">
          <div className="bots__stat">
            <span className="bots__stat-value">${liveBalance.toFixed(2)}</span>
            <span className="bots__stat-label">Balance</span>
          </div>
          <div className="bots__stat">
            <span className="bots__stat-value" style={{ color: aggregate.totalPnl >= 0 ? '#4ade80' : '#ff6b81' }}>
              {aggregate.totalPnl >= 0 ? '+' : ''}${aggregate.totalPnl.toFixed(2)}
            </span>
            <span className="bots__stat-label">P&amp;L</span>
          </div>
          <div className="bots__stat">
            <span className="bots__stat-value">{aggregate.winRate !== null ? `${aggregate.winRate}%` : '—'}</span>
            <span className="bots__stat-label">Win Rate</span>
          </div>
          <div className="bots__stat">
            <span className="bots__stat-value">{aggregate.totalTrades}</span>
            <span className="bots__stat-label">Trades</span>
          </div>
          <div className="bots__stat">
            <span className="bots__stat-value">${aggregate.totalAllocated.toFixed(0)}</span>
            <span className="bots__stat-label">Allocated</span>
          </div>
        </div>
      </section>

      {/* Upload */}
      <section className="bots__card">
        <header className="bots__chead"><Upload size={22} /> Upload Trading Bot</header>
        <div className="bots__cbody">
          <div
            className={`bots__drop ${drag ? 'is-drag' : ''}`}
            role="button" tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
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
            <input ref={inputRef} type="file" accept=".py,.js,.ts,.json,.zip" hidden onChange={e => pick(e.target.files?.[0])} />
          </div>
          <button className="bots__cta" onClick={upload} disabled={busy === 'upload'}>
            <Cpu size={18} /> {busy === 'upload' ? 'Uploading…' : 'Upload Trading Bot'}
          </button>
        </div>
      </section>

      <div className="bots__or"><span>OR</span></div>

      {/* Passkey */}
      <section className="bots__card">
        <header className="bots__chead"><Key size={22} /> Activate with Passkey</header>
        <form className="bots__cbody bots__pass" onSubmit={activate}>
          <p>Already have a trading bot passkey? Enter it below to activate your bot instantly.</p>
          <div className="bots__prow">
            <label className="bots__pin">
              <Key size={18} />
              <input value={passkey} onChange={e => setPasskey(e.target.value)} placeholder="Enter your trading bot passkey" autoComplete="off" />
            </label>
            <button className="bots__psubmit" disabled={!passkey.trim() || busy === 'pass'}>
              <Activity size={18} /> {busy === 'pass' ? 'Checking…' : 'Submit Passkey'}
            </button>
          </div>
          <small>Passkeys are provided by authorized bot developers. Contact support if you need assistance.</small>
        </form>
      </section>

      {/* Settings (for uploaded bots) */}
      <section className="bots__card bots__pad">
        <h2 className="bots__h2"><Settings size={20} /> Uploaded Bot Settings</h2>
        <p className="bots__sub">Configure your uploaded bots before starting</p>
        <div className="bots__fields">
          <div className="bots__field">
            <label htmlFor="bot-amt">Trade Amount ($)</label>
            <input id="bot-amt" className="bots__ctl" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="bots__field">
            <label htmlFor="bot-int">Trade Interval</label>
            <div className="bots__sel">
              <select id="bot-int" className="bots__ctl" value={interval} onChange={e => setIntervalV(e.target.value)}>
                {INTERVALS.map(i => <option key={i}>{i}</option>)}
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

      {/* ─── SIMULATED DCA BOTS ─── */}
      <section className="bots__card bots__pad">
        <h2 className="bots__h2"><Bot size={20} /> DCA Bots</h2>
        <p className="bots__sub">Dollar-cost averaging strategies with live simulation</p>
        <div className="bots__list">
          {BOT_CONFIGS.map(b => (
            <BotCard
              key={b.id}
              bot={b}
              balance={liveBalance}
              userId={user?.id}
              onStatsChange={handleStatsChange}
              onBalanceChanged={handleBalanceChanged}
            />
          ))}
        </div>
        <p className="bots__disclaimer">
          <Info size={14} /> Automated bots trade based on your configuration and market conditions. Past performance
          does not guarantee future results. Only allocate funds you can afford to have at risk.
        </p>
      </section>

      {/* ─── USER UPLOADED BOTS ─── */}
      <section className="bots__card bots__pad">
        <h2 className="bots__h2"><Bot size={20} /> My Uploaded Bots ({bots.length})</h2>
        {bots.length === 0 && <p className="bots__empty">No uploaded bots yet. Upload one or activate with a passkey.</p>}
        <div className="bots__list">
          {bots.map(b => {
            const [name, ver] = splitVersion(b.name)
            const on = b.status === 'Active'
            return (
              <article className="bots__item" key={b.id}>
                <span className="bots__ico"><Bot size={22} /></span>
                <div className="bots__info">
                  <h3>{name} {ver && <small>{ver}</small>}</h3>
                  <p>{b.description}</p>
                </div>
                <div className="bots__badges">
                  <span className={`bots__badge ${on ? 'green' : 'amber'}`}>{on ? 'running' : 'stopped'}</span>
                </div>
                <div className="bots__acts">
                  <button className={`bots__btn ${on ? 'stop' : 'start'}`} onClick={() => toggle(b)}>
                    {on ? <Square size={15} /> : <Play size={15} />} {on ? 'Stop' : 'Start'}
                  </button>
                  <button className="bots__btn del" onClick={() => remove(b)}><Trash2 size={15} /> Delete</button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
