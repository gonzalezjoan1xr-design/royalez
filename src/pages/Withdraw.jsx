import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase' // adjust if your client lives elsewhere
import './Withdraw.css'

const MIN_WITHDRAWAL = 10

const COINS = [
  { id: 'USDT', name: 'Tether', color: '#26a17b', glyph: 'T' },
  { id: 'BTC', name: 'Bitcoin', color: '#f7931a', glyph: '₿' },
  { id: 'ETH', name: 'Ethereum', color: '#627eea', glyph: 'Ξ' },
]

const NETWORKS = {
  USDT: [
    { id: 'TRC20', label: 'Tron (TRC20)', fee: 1 },
    { id: 'ERC20', label: 'Ethereum (ERC20)', fee: 5 },
  ],
  BTC: [{ id: 'Bitcoin', label: 'Bitcoin', fee: 2 }],
  ETH: [{ id: 'ERC20', label: 'Ethereum (ERC20)', fee: 5 }],
}

const money = (n) => `$${Number(n).toFixed(2)}`

/* ---------- icons ---------- */
const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H5a2 2 0 0 1 0-4h13v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15V7" />
    <path d="M16 14h4" />
  </svg>
)
const ClockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)
const ArrowDownLeft = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 7 7 17" />
    <path d="M17 17H7V7" />
  </svg>
)
const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
)
const NetworkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4l9 17L21 4z" />
    <path d="M8 8l4 5 4-5" />
  </svg>
)

const CoinBadge = ({ coin }) => (
  <span className="wd-coin" style={{ background: coin.color }}>{coin.glyph}</span>
)

/* ---------- custom dropdown ---------- */
function Dropdown({ value, options, placeholder, onChange, renderOption }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((o) => o.id === value)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="wd-select" ref={ref}>
      <button type="button" className={`wd-select__btn ${open ? 'is-open' : ''}`} onClick={() => setOpen((o) => !o)}>
        {selected ? renderOption(selected) : <span className="wd-select__placeholder">{placeholder}</span>}
        <span className="wd-select__chev"><Chevron /></span>
      </button>
      {open && (
        <ul className="wd-select__menu">
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className={`wd-select__item ${o.id === value ? 'is-on' : ''}`}
                onClick={() => { onChange(o.id); setOpen(false) }}
              >
                {renderOption(o)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------- page ---------- */
export default function Withdraw() {
  const { user, profile } = useAuth()
  const balance = Number(profile?.balance || 0)

  const [coin, setCoin] = useState('')
  const [network, setNetwork] = useState('')
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'ok' | 'err', title, text }
  const [history, setHistory] = useState([])

  // remove the layout's top/bottom spacing around this page (restored when you leave)
  const rootRef = useRef(null)
  useEffect(() => {
    const saved = []
    let el = rootRef.current?.parentElement
    while (el && el !== document.body && el !== document.documentElement) {
      const props = ['padding-top', 'padding-bottom', 'margin-top', 'margin-bottom']
      saved.push([el, props.map((p) => [p, el.style.getPropertyValue(p), el.style.getPropertyPriority(p)])])
      props.forEach((p) => el.style.setProperty(p, '0', 'important'))
      el = el.parentElement
    }
    return () => {
      saved.forEach(([node, list]) => list.forEach(([p, v, pr]) => (v ? node.style.setProperty(p, v, pr) : node.style.removeProperty(p))))
    }
  }, [])

  const networkList = coin ? NETWORKS[coin] : []
  const activeNetwork = networkList.find((n) => n.id === network)
  const fee = activeNetwork ? activeNetwork.fee : 0
  const amt = Number(amount)
  const receive = Math.max(0, (amt > 0 ? amt : 0) - fee)

  const notify = useCallback((t) => setToast(t), [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const loadHistory = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setHistory(data || [])
  }, [user])

  useEffect(() => { loadHistory() }, [loadHistory])

  const changeCoin = (c) => {
    setCoin(c)
    setNetwork(NETWORKS[c][0].id)
  }

  const submit = async (e) => {
    e.preventDefault()
    setToast(null)

    if (!address.trim()) return notify({ type: 'err', title: 'Address required', text: 'Enter a destination wallet address.' })
    if (!(amt > 0)) return notify({ type: 'err', title: 'Invalid amount', text: 'Enter a valid withdrawal amount.' })
    if (amt < MIN_WITHDRAWAL) return notify({ type: 'err', title: 'Amount too low', text: `The minimum withdrawal is ${money(MIN_WITHDRAWAL)}.` })
    if (amt > balance) return notify({ type: 'err', title: 'Insufficient Balance', text: "You don't have enough balance for this withdrawal" })

    setBusy(true)
    const { error } = await supabase.from('withdrawals').insert({
      user_id: user.id,
      coin,
      network,
      address: address.trim(),
      amount: amt,
      status: 'pending',
    })
    setBusy(false)

    if (error) return notify({ type: 'err', title: 'Withdrawal failed', text: error.message })
    setAmount('')
    setAddress('')
    notify({ type: 'ok', title: 'Withdrawal submitted', text: 'Your request will be reviewed and processed shortly.' })
    loadHistory()
  }

  return (
    <div className="wd" ref={rootRef}>
      <header className="wd__head">
        <span className="wd__head-icon"><ArrowDownLeft /></span>
        <div>
          <h1 className="wd__title">Withdraw Crypto</h1>
          <p className="wd__sub">Withdraw your cryptocurrency to an external wallet</p>
        </div>
      </header>

      <div className="wd__grid">
        {/* New withdrawal */}
        <section className="wd-card">
          <h2 className="wd-card__title"><WalletIcon /> New Withdrawal</h2>

          <div className="wd-balance">
            <span>Available Balance</span>
            <strong>{money(balance)}</strong>
          </div>

          <form className="wd-form" onSubmit={submit}>
            <label className="wd-label">Select Currency</label>
            <Dropdown
              value={coin}
              options={COINS}
              placeholder="Select a cryptocurrency"
              onChange={changeCoin}
              renderOption={(c) => (
                <span className="wd-opt">
                  <CoinBadge coin={c} />
                  <span className="wd-opt__main">{c.id}</span>
                  <span className="wd-opt__muted">{c.name}</span>
                </span>
              )}
            />

            {coin && (
              <>
                <label className="wd-label">Select Network</label>
                <Dropdown
                  value={network}
                  options={networkList}
                  placeholder="Select a network"
                  onChange={setNetwork}
                  renderOption={(n) => (
                    <span className="wd-opt">
                      <span className="wd-net"><NetworkIcon /></span>
                      <span className="wd-opt__main">{n.label}</span>
                      <span className="wd-opt__muted wd-opt__muted--sm">Fee: ${n.fee}</span>
                    </span>
                  )}
                />

                <label className="wd-label" htmlFor="wd-address">Withdrawal Address</label>
                <input
                  id="wd-address" className="wd-input" value={address}
                  onChange={(e) => setAddress(e.target.value)} placeholder="Enter wallet address"
                  autoComplete="off" spellCheck="false"
                />

                <label className="wd-label" htmlFor="wd-amount">Amount (USD)</label>
                <div className="wd-amount">
                  <span className="wd-amount__sign">$</span>
                  <input
                    id="wd-amount" className="wd-input wd-input--amount" type="number" min="0" step="any"
                    value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                  />
                </div>
                <p className="wd-hint">Minimum withdrawal: {money(MIN_WITHDRAWAL).replace('.00', '')}</p>

                <div className="wd-summary">
                  <div className="wd-summary__row">
                    <span>Network Fee</span>
                    <b>${fee}</b>
                  </div>
                  <div className="wd-summary__row wd-summary__row--total">
                    <span>You will receive</span>
                    <b>{money(receive)}</b>
                  </div>
                </div>

                <button className="wd-submit" type="submit" disabled={busy}>
                  {busy ? 'Submitting…' : 'Submit Withdrawal'}
                </button>
              </>
            )}
          </form>
        </section>

        {/* History */}
        <section className="wd-card">
          <h2 className="wd-card__title"><ClockIcon /> Withdrawal History</h2>

          {history.length === 0 ? (
            <div className="wd-empty">
              <span className="wd-empty__icon"><ArrowDownLeft size={40} /></span>
              <p>No withdrawal history</p>
            </div>
          ) : (
            <ul className="wd-history">
              {history.map((w) => (
                <li key={w.id} className="wd-history__item">
                  <div>
                    <div className="wd-history__amt">{money(w.amount)} <span>{w.coin} · {w.network}</span></div>
                    <div className="wd-history__meta">
                      {w.created_at ? new Date(w.created_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <span className={`wd-status wd-status--${w.status}`}>{w.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {toast && (
        <div className={`wd-toast wd-toast--${toast.type}`} role="alert">
          <button type="button" className="wd-toast__close" onClick={() => setToast(null)} aria-label="Dismiss">×</button>
          <strong>{toast.title}</strong>
          <p>{toast.text}</p>
        </div>
      )}
    </div>
  )
}
