import { Fragment, useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowUpRight, Wallet, Clock, ChevronDown, ChevronUp, Network, ArrowLeft, QrCode, Copy, Check, XCircle, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import { useAuth } from '../context/AuthContext'
import { coinIcon } from '../hooks/useTickers'
import './Deposit.css'

const MIN = 50
const CHIPS = [50, 100, 250, 500]
const HOLD_MIN = 60

// Only USDT on TRON (TRC20) is accepted.
const DEPOSIT_ADDRESS = 'TPuff85NhMAfMoALCuqkVtdgmuJb7McG6D'

const COINS = [
  { s: 'USDT', n: 'Tether', dec: 2, stable: true, nets: ['TRC20'] },
]

const NETS = {
  TRC20: { label: 'Tron (TRC20) - Low Fee', icon: 'TRX', address: DEPOSIT_ADDRESS },
}

// [label, tone, icon, spin?]
const BADGE = {
  expired: ['Expired', 'red', XCircle],
  pending: ['Waiting', 'amber', Loader2, true],
  completed: ['Completed', 'green', CheckCircle2],
  failed: ['Failed', 'red', XCircle],
}

const shortAddr = (a = '') => (a.length > 20 ? `${a.slice(0, 18)}...` : a)
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US')
const fmtUsd = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const fromRow = (r) => ({
  id: r.id, usd: r.usd_amount, symbol: r.symbol, network: r.network, address: r.address,
  amount: r.crypto_amount, status: r.status, expires: r.expires_at, created: r.created_at,
})

function Icon({ sym, size = 36 }) {
  return <img className="dep__coin" style={{ width: size, height: size }} src={coinIcon(sym)} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
}

function Dropdown({ selected, placeholder, items, onPick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const cur = items.find((i) => i.key === selected)
  const Chev = open ? ChevronUp : ChevronDown
  return (
    <div className="dep__dd" ref={ref} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
      <button type="button" className="dep__trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        {cur
          ? <span className="dep__opt"><Icon sym={cur.icon} size={30} /><b>{cur.title}</b>{cur.sub && <small>{cur.sub}</small>}</span>
          : <span className="dep__ph">{placeholder}</span>}
        <Chev size={18} />
      </button>
      {open && (
        <div className="dep__menu" role="listbox">
          {items.map((i) => (
            <button type="button" key={i.key} role="option" aria-selected={i.key === selected} className={`dep__opt ${i.key === selected ? 'is-on' : ''}`} onClick={() => { onPick(i.key); setOpen(false) }}>
              <Icon sym={i.icon} size={30} /><b>{i.title}</b>{i.sub && <small>{i.sub}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Deposit() {
  const { user, profile } = useAuth()
  const balance = Number(profile?.balance || 0)

  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [coin, setCoin] = useState('USDT')
  const [net, setNet] = useState('TRC20')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [dep, setDep] = useState(null)
  const [history, setHistory] = useState([])
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState('')
  const [checking, setChecking] = useState(false)

  // Match the navbar background on this page only; restore on leave
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = 'var(--nav-bg, #050505)'
    return () => { document.body.style.background = prev }
  }, [])

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('deposits').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data, error }) => { if (!error) setHistory((data || []).map(fromRow)) })
  }, [user])

  const copy = async (text, key) => {
    try { await navigator.clipboard.writeText(String(text)); setCopied(key); setTimeout(() => setCopied(''), 1800) } catch { /* clipboard unavailable */ }
  }

  const amountOk = Number(amount) >= MIN
  const coinInfo = COINS.find((c) => c.s === coin)
  const coinItems = COINS.map((c) => ({ key: c.s, icon: c.s, title: c.s, sub: c.n }))
  const netItems = (coinInfo?.nets || []).map((k) => ({ key: k, icon: NETS[k].icon, title: NETS[k].label }))

  const pickCoin = (s) => {
    setCoin(s)
    const c = COINS.find((x) => x.s === s)
    setNet(c.nets.length === 1 ? c.nets[0] : '')
  }

  const next = () => {
    setErr('')
    if (!amountOk) return setErr(`Minimum deposit is $${MIN}.`)
    setStep(2)
  }

  const generate = async () => {
    setErr('')
    const n = NETS[net]
    if (!coinInfo || !n) return
    if (coinInfo.s !== 'USDT' || net !== 'TRC20') return setErr('Only USDT on the Tron (TRC20) network is accepted.')
    setBusy(true)
    let price = 1
    if (!coinInfo.stable) {
      try {
        const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coinInfo.s}USDT`)
        if (!r.ok) throw new Error('price')
        price = Number((await r.json()).price)
        if (!Number.isFinite(price) || price <= 0) throw new Error('price')
      } catch { setBusy(false); return setErr('Price unavailable, try again.') }
    }
    const usd = Number(amount)
    const coinAmt = (usd / price).toFixed(coinInfo.dec) // keep as string to avoid 1e-7 style output
    const expires = new Date(Date.now() + HOLD_MIN * 60000).toISOString()
    const rec = { id: `local-${Date.now()}`, usd, symbol: coinInfo.s, network: net, address: n.address, amount: coinAmt, status: 'pending', expires, created: new Date().toISOString() }
    if (user) {
      const { data, error } = await supabase.from('deposits')
        .insert({ user_id: user.id, usd_amount: usd, symbol: coinInfo.s, network: net, address: n.address, crypto_amount: coinAmt, status: 'pending', expires_at: expires })
        .select().single()
      if (error || !data) {
        console.error('Deposit insert failed:', error)
        setBusy(false)
        return setErr(`Could not create the deposit${error?.message ? `: ${error.message}` : ''}`)
      }
      rec.id = data.id; rec.created = data.created_at || rec.created
    }
    setBusy(false); setDep(rec); setHistory((h) => [rec, ...h]); setStep(3)
    toast({ type: 'deposit', title: 'Payment created', text: 'Send the exact amount to the address shown.' })
  }

  const reset = () => { setStep(1); setDep(null); setAmount(''); setCoin('USDT'); setNet('TRC20'); setErr('') }

  const statusOf = (d) => (d.status === 'pending' && new Date(d.expires).getTime() < now ? 'expired' : d.status)
  const left = dep ? Math.max(0, Math.floor((new Date(dep.expires).getTime() - now) / 1000)) : 0
  const depStatus = dep ? statusOf(dep) : ''
  const depLive = depStatus === 'pending'

  const checkStatus = async () => {
    if (!dep) return
    setChecking(true)
    let status = dep.status
    if (user && !String(dep.id).startsWith('local-')) {
      const { data } = await supabase.from('deposits').select('status').eq('id', dep.id).single()
      if (data?.status) status = data.status
    }
    const updated = { ...dep, status }
    setDep(updated)
    setHistory((h) => h.map((x) => (x.id === dep.id ? { ...x, status } : x)))
    setChecking(false)
    const s = statusOf(updated)
    if (s === 'completed') toast({ type: 'deposit', title: 'Deposit complete', text: 'Payment received. Your balance is updated.' })
    else if (s === 'expired') toast({ type: 'err', title: 'Deposit expired', text: 'Start a new deposit.' })
    else if (s === 'failed') toast({ type: 'err', title: 'Deposit failed', text: 'Start a new deposit.' })
    else toast({ type: 'info', title: 'No payment yet', text: 'Confirmations can take a few minutes.' })
  }

  return (
    <div className="dep">
      <header className="dep__head">
        <span className="dep__tile"><ArrowUpRight size={24} /></span>
        <div>
          <h1>Deposit Crypto</h1>
          <p>Deposit cryptocurrency to fund your account</p>
        </div>
      </header>

      <div className="dep__cols">
        {/* ---------- wizard ---------- */}
        <section className="dep__card">
          <h2 className="dep__h2"><Wallet size={22} /> {step === 3 ? 'Complete Payment' : 'New Deposit'}</h2>

          <div className="dep__bal"><span>Current Balance</span><b>${balance.toFixed(2)}</b></div>

          <div className="dep__steps">
            {[1, 2, 3].map((n) => (
              <Fragment key={n}>
                {n > 1 && <i className={step >= n ? 'on' : ''} />}
                <span className={step >= n ? 'on' : ''}>{n}</span>
              </Fragment>
            ))}
          </div>

          {step === 1 && (
            <div className="dep__body">
              <div className="dep__intro"><h3>Enter Amount</h3><p>How much do you want to deposit?</p></div>
              <label className="dep__lbl" htmlFor="dep-amt">Amount (USD)</label>
              <div className="dep__amt">
                <span>$</span>
                <input id="dep-amt" type="number" inputMode="decimal" min="0" placeholder="100.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <small className={`dep__hint ${amount && !amountOk ? 'dep__hint--err' : ''}`}>Minimum deposit: ${MIN}</small>
              <div className="dep__chips">
                {CHIPS.map((c) => <button key={c} type="button" onClick={() => setAmount(String(c))}>${c}</button>)}
              </div>
              {err && <p className="dep__err">{err}</p>}
              <button className="dep__btn dep__btn--primary dep__btn--full" disabled={!amountOk} onClick={next}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div className="dep__body">
              <div className="dep__intro"><h3>Select Currency &amp; Network</h3><p>Depositing ${Number(amount).toFixed(2)}</p></div>
              <label className="dep__lbl">Select Cryptocurrency</label>
              <Dropdown selected={coin} placeholder="Select a cryptocurrency" items={coinItems} onPick={pickCoin} />
              {coinInfo && (
                <>
                  <label className="dep__lbl dep__lbl--ic"><Network size={16} /> Select Network</label>
                  <Dropdown key={coin} selected={net} placeholder="Select a network" items={netItems} onPick={setNet} />
                </>
              )}
              {err && <p className="dep__err">{err}</p>}
              <div className="dep__pair">
                <button className="dep__btn dep__btn--ghost" onClick={() => { setErr(''); setStep(1) }}><ArrowLeft size={18} /> Back</button>
                <button className="dep__btn dep__btn--primary" disabled={!coin || !net || busy} onClick={generate}>
                  <QrCode size={18} /> {busy ? 'Generating…' : 'Generate Address'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && dep && (
            <div className="dep__body">
              <div className="dep__intro"><h3>Complete Payment</h3><p>Send crypto to the address below</p></div>

              <div className="dep__pay">
                <div className="dep__time"><span>Time Remaining</span><b>{left > 0 ? mmss(left) : 'Expired'}</b></div>

                {(() => {
                  const [label, tone, Ic, spin] = BADGE[depStatus] || BADGE.pending
                  return (
                    <div className="dep__time dep__time--status">
                      <span>Status</span>
                      <span className={`dep__badge ${tone}`}><Ic size={16} className={spin ? 'dep__spin' : ''} /> {depLive ? 'Waiting for payment' : label}</span>
                    </div>
                  )
                })()}

                {depStatus === 'completed' && (
                  <p className="dep__done"><CheckCircle2 size={18} /> Payment received</p>
                )}

                {(depStatus === 'expired' || depStatus === 'failed') && (
                  <p className="dep__gone">
                    {depStatus === 'expired' ? 'This deposit has expired.' : 'This deposit failed.'} Start a new deposit to get a fresh address.
                  </p>
                )}

                {depLive && (
                  <>
                    <span className="dep__sm">Send Exactly</span>
                    <div className="dep__box">
                      <b className="dep__big">{dep.amount} {dep.symbol}</b>
                      <button type="button" onClick={() => copy(dep.amount, 'amt')} aria-label="Copy amount">{copied === 'amt' ? <Check size={20} /> : <Copy size={20} />}</button>
                    </div>
                    <p className="dep__amber">Copy and send the exact amount or your deposit won't be processed</p>

                    <span className="dep__sm">To This Address</span>
                    <div className="dep__box">
                      <code>{dep.address}</code>
                      <button type="button" onClick={() => copy(dep.address, 'addr')} aria-label="Copy address">{copied === 'addr' ? <Check size={20} /> : <Copy size={20} />}</button>
                    </div>

                    <div className="dep__qr"><QRCodeSVG value={dep.address} size={190} /></div>
                  </>
                )}
              </div>

              {depLive && (
                <div className="dep__imp">
                  <AlertCircle size={20} />
                  <div>
                    <b>Important</b>
                    <p>Send only {dep.symbol} on the {NETS[dep.network].label} network. Sending any other cryptocurrency may result in permanent loss.</p>
                  </div>
                </div>
              )}

              <div className="dep__pair">
                <button className="dep__btn dep__btn--ghost" onClick={reset}>New Deposit</button>
                <button className="dep__btn dep__btn--primary" onClick={() => { if (!checking) checkStatus() }} aria-busy={checking}>
                  <RefreshCw size={18} className={checking ? 'dep__spin' : ''} /> {checking ? 'Checking…' : 'Check Status'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ---------- history ---------- */}
        <section className="dep__card">
          <h2 className="dep__h2"><Clock size={22} /> Deposit History</h2>
          {history.length === 0 && <p className="dep__empty">No deposits yet.</p>}
          <div className="dep__list">
            {history.map((d) => {
              const [label, tone, Ic, spin] = BADGE[statusOf(d)] || BADGE.pending
              return (
                <article className="dep__item" key={d.id}>
                  <div className="dep__r1">
                    <span><Icon sym={d.symbol} size={24} /> <b>{fmtUsd(d.usd)}</b></span>
                    <span className={`dep__badge ${tone}`}><Ic size={16} className={spin ? 'dep__spin' : ''} /> {label}</span>
                  </div>
                  <div className="dep__r2">
                    <span>{shortAddr(d.address)} <button type="button" onClick={() => copy(d.address, d.id)} aria-label="Copy address">{copied === d.id ? <Check size={14} /> : <Copy size={14} />}</button></span>
                    <span>{fmtDate(d.created)}</span>
                  </div>
                  <div className="dep__r3">{d.amount} {d.symbol}</div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
