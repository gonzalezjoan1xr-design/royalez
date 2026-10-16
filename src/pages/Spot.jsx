import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Star, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import useTickers, { COINS, coinIcon } from '../hooks/useTickers'
import './Spot.css'

const TF = { '1H': '1h', '4H': '4h', '1D': '1d', '1W': '1w', '1M': '1M' }
const N = 60
const FEE = 0.001
const W = 800
const H = 400

const num = (p, d) => {
  if (p == null || Number.isNaN(p)) return '—'
  const dec = d ?? (p >= 1000 ? 2 : p >= 1 ? 4 : 6)
  return p.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
const compact = (n) => {
  if (!n) return '—'
  for (const [v, u] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) if (n >= v) return `$${(n / v).toFixed(2)}${u}`
  return `$${n.toFixed(2)}`
}
const rnd = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x) }

function genCandles(price) {
  const closes = [price]
  for (let i = 1; i < N; i++) closes.unshift(closes[0] * (1 + (Math.random() - 0.5) * 0.03))
  return closes.map((c, i) => {
    const o = i ? closes[i - 1] : c * 0.99
    return { o, c, h: Math.max(o, c) * (1 + Math.random() * 0.008), l: Math.min(o, c) * (1 - Math.random() * 0.008) }
  })
}

export default function Spot() {
  const { user, profile, refreshProfile } = useAuth()
  const { tickers } = useTickers()
  const balance = Number(profile?.balance || 0)

  const [symbol, setSymbol] = useState('BTC')
  const [q, setQ] = useState('')
  const [favs, setFavs] = useState(() => new Set(['BTC', 'ETH']))
  const [tf, setTf] = useState('1D')
  const [ctype, setCtype] = useState('Candle')
  const [candles, setCandles] = useState(null)
  const [stats, setStats] = useState(null)
  const [obView, setObView] = useState('both')
  const [tick, setTick] = useState(0)
  const [trades, setTrades] = useState([])
  const [side, setSide] = useState('buy')
  const [otype, setOtype] = useState('limit')
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [holdings, setHoldings] = useState([])
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const bySym = useMemo(() => Object.fromEntries(tickers.map((t) => [t.symbol, t])), [tickers])
  const t = bySym[symbol]
  const live = t?.price
  const priceRef = useRef(0)
  priceRef.current = live || 0

  useEffect(() => { if (tickers.length && !bySym[symbol]) setSymbol(tickers[0].symbol) }, [tickers]) // eslint-disable-line

  const loadHoldings = () => {
    if (!user) return
    supabase.from('holdings').select('*').eq('user_id', user.id).then(({ data }) => setHoldings(data || []))
  }
  useEffect(loadHoldings, [user]) // eslint-disable-line

  // reset the limit price when the pair changes
  const pricedFor = useRef('')
  useEffect(() => {
    if (live && pricedFor.current !== symbol) { pricedFor.current = symbol; setPrice(String(live)); setAmount('') }
  }, [symbol, live])

  // candles + 24h stats (Binance public API, with a simulated fallback)
  useEffect(() => {
    let off = false
    setCandles(null)
    const pair = `${symbol}USDT`
    Promise.all([
      fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${TF[tf]}&limit=${N}`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([k, s]) => {
        if (off) return
        setCandles(k.map((x) => ({ o: +x[1], h: +x[2], l: +x[3], c: +x[4] })))
        setStats(s ? { high: +s.highPrice, low: +s.lowPrice, vol: +s.quoteVolume } : null)
      })
      .catch(() => { if (!off) { setCandles(genCandles(priceRef.current || 100)); setStats(null) } })
    return () => { off = true }
  }, [symbol, tf])

  // clock: drives order book + recent trades
  useEffect(() => { const id = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(id) }, [])
  useEffect(() => {
    const p = priceRef.current
    if (!p || tick % 3) return
    setTrades((prev) => [{ id: tick, price: p * (1 + (rnd(tick, 3) - 0.5) * 0.0008), amount: 0.02 + rnd(tick, 5) * 0.6, buy: rnd(tick, 7) > 0.5, time: new Date().toLocaleTimeString('en-GB') }, ...prev].slice(0, 14))
  }, [tick])

  const vis = useMemo(() => {
    if (!candles || !live) return candles || []
    return candles.map((c, i) => (i === candles.length - 1 ? { ...c, c: live, h: Math.max(c.h, live), l: Math.min(c.l, live) } : c))
  }, [candles, live])

  const book = useMemo(() => {
    if (!live) return { asks: [], bids: [], max: 1 }
    const step = live * 0.0004
    const n = obView === 'both' ? 8 : 16
    const mk = (dir) => Array.from({ length: n }, (_, i) => {
      const p = live + dir * (i + 1) * step
      const a = 0.2 + rnd(i + (dir > 0 ? 0 : 50), Math.floor(tick / 2)) * 1.8
      return { p, a, tot: p * a }
    })
    const asks = mk(1).reverse(), bids = mk(-1)
    return { asks, bids, max: Math.max(...asks.map((r) => r.a), ...bids.map((r) => r.a)) }
  }, [live, tick, obView])

  // chart geometry
  const hi = vis.length ? Math.max(...vis.map((c) => c.h)) : 1
  const lo = vis.length ? Math.min(...vis.map((c) => c.l)) : 0
  const pad = (hi - lo) * 0.06 || 1
  const top = hi + pad, bot = lo - pad
  const Y = (v) => (1 - (v - bot) / (top - bot)) * H
  const X = (i) => (i + 0.5) * (W / (vis.length || 1))
  const linePts = vis.map((c, i) => `${X(i)},${Y(c.c)}`).join(' ')

  // order form
  const px = (otype === 'market' ? live : Number(price)) || 0
  const amt = Number(amount) || 0
  const total = px * amt
  const fee = total * FEE
  const held = Number(holdings.find((h) => h.symbol === symbol)?.amount || 0)
  const avail = side === 'buy' ? balance : held
  const pct = avail > 0 ? Math.min(100, ((side === 'buy' ? total + fee : amt) / avail) * 100) : 0
  const setPct = (p) => {
    if (!px || !avail) return
    const a = side === 'buy' ? (avail * p / 100) / (px * (1 + FEE)) : (avail * p) / 100
    setAmount(String(Math.floor(a * 1e6) / 1e6))
  }

  const submit = async () => {
    setMsg(null)
    if (!live) return setMsg({ t: 'err', m: 'Price unavailable, try again.' })
    if (!(amt > 0) || !(px > 0)) return setMsg({ t: 'err', m: 'Enter a valid amount.' })
    if (otype === 'limit' && side === 'buy' && px < live) return setMsg({ t: 'err', m: 'Limit buy is below the market price, so it was not filled.' })
    if (otype === 'limit' && side === 'sell' && px > live) return setMsg({ t: 'err', m: 'Limit sell is above the market price, so it was not filled.' })
    const cost = live * amt
    if (side === 'buy' && cost * (1 + FEE) > balance) return setMsg({ t: 'err', m: 'Insufficient USDT balance.' })
    if (side === 'sell' && amt > held) return setMsg({ t: 'err', m: `Insufficient ${symbol} balance.` })

    setBusy(true)
    const row = holdings.find((h) => h.symbol === symbol)
    const newAmt = side === 'buy' ? held + amt : held - amt
    let res
    if (row) res = newAmt > 1e-9
      ? await supabase.from('holdings').update({ amount: newAmt }).eq('id', row.id)
      : await supabase.from('holdings').delete().eq('id', row.id)
    else res = await supabase.from('holdings').insert({ user_id: user.id, symbol, amount: newAmt })
    if (res.error) { setBusy(false); return setMsg({ t: 'err', m: res.error.message }) }

    const newBal = side === 'buy' ? balance - cost * (1 + FEE) : balance + cost * (1 - FEE)
    const { error } = await supabase.from('profiles').update({ balance: newBal }).eq('id', user.id)
    setBusy(false)
    if (error) return setMsg({ t: 'err', m: error.message })
    setAmount('')
    loadHoldings(); refreshProfile()
    setMsg({ t: 'ok', m: `${side === 'buy' ? 'Bought' : 'Sold'} ${amt} ${symbol} at $${num(live)}` })
  }

  const list = tickers.filter((x) => `${x.symbol} ${COINS[x.symbol] || ''}`.toLowerCase().includes(q.toLowerCase()))
  const change = t?.change ?? 0
  const up = change >= 0
  const sHigh = stats?.high ?? (vis.length ? hi : null)
  const sLow = stats?.low ?? (vis.length ? lo : null)

  return (
    <div className="spot">
      {/* ---------- markets list ---------- */}
      <aside className="spot__markets">
        <h2>Markets</h2>
        <label className="spot__search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." /></label>
        <div className="spot__mhead"><span>Pair</span><span>Price</span><span>24h</span></div>
        <div className="spot__mlist">
          {list.map((x) => (
            <div key={x.symbol} className={`spot__mrow ${x.symbol === symbol ? 'is-on' : ''}`} onClick={() => setSymbol(x.symbol)}>
              <button className={`spot__star ${favs.has(x.symbol) ? 'is-fav' : ''}`} aria-label="Favourite"
                onClick={(e) => { e.stopPropagation(); setFavs((f) => { const n = new Set(f); n.has(x.symbol) ? n.delete(x.symbol) : n.add(x.symbol); return n }) }}>
                <Star size={16} />
              </button>
              <img src={coinIcon(x.symbol)} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
              <div className="spot__mid"><strong>{x.symbol}</strong><small>{COINS[x.symbol]}</small></div>
              <span className="spot__mpx">${num(x.price, x.price >= 1 ? 2 : 4)}</span>
              <span className={`spot__mch ${x.change >= 0 ? 'up' : 'down'}`}>{x.change >= 0 ? '+' : ''}{x.change.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </aside>

      <section className="spot__main">
        {/* ---------- pair header ---------- */}
        <header className="spot__top">
          <img className="spot__ticon" src={coinIcon(symbol)} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
          <div className="spot__tname"><strong>{symbol}/USDT</strong><small>{COINS[symbol]}</small></div>
          <div className="spot__tprice">${num(live)}</div>
          <div className={`spot__tch ${up ? 'up' : 'down'}`}>{up ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {up ? '+' : ''}{change.toFixed(2)}%</div>
          <div className="spot__tstats">
            <div><small>24h High</small><b>${num(sHigh)}</b></div>
            <div><small>24h Low</small><b>${num(sLow)}</b></div>
            <div><small>24h Volume</small><b>{compact(stats?.vol)}</b></div>
          </div>
        </header>

        <div className="spot__body">
          {/* ---------- chart ---------- */}
          <div className="spot__chart">
            <div className="spot__ctrl">
              <strong>{symbol}/USDT</strong>
              <div className="spot__seg spot__seg--flat">
                {Object.keys(TF).map((k) => <button key={k} className={tf === k ? 'is-on' : ''} onClick={() => setTf(k)}>{k}</button>)}
              </div>
              <div className="spot__seg">
                {['Candle', 'Line', 'Area'].map((k) => <button key={k} className={ctype === k ? 'is-on' : ''} onClick={() => setCtype(k)}>{k}</button>)}
              </div>
            </div>
            <div className="spot__plot">
              {!vis.length ? <div className="spot__loading">Loading chart…</div> : (
                <>
                  <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="spot__svg">
                    {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="0" x2={W} y1={(i / 4) * H} y2={(i / 4) * H} className="spot__grid" />)}
                    {ctype === 'Candle' && vis.map((c, i) => (
                      <g key={i} className={`cd ${c.c >= c.o ? 'up' : 'down'}`}>
                        <line x1={X(i)} x2={X(i)} y1={Y(c.h)} y2={Y(c.l)} />
                        <rect x={X(i) - 4} width="8" y={Math.min(Y(c.o), Y(c.c))} height={Math.max(1.5, Math.abs(Y(c.o) - Y(c.c)))} />
                      </g>
                    ))}
                    {ctype === 'Area' && <polygon points={`${X(0)},${H} ${linePts} ${X(vis.length - 1)},${H}`} className="spot__area" />}
                    {ctype !== 'Candle' && <polyline points={linePts} className="spot__line" />}
                  </svg>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="spot__ylab" style={{ top: `${(i / 4) * 100}%` }}>${num(top - ((top - bot) * i) / 4, top > 1000 ? 0 : undefined)}</span>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* ---------- order book + trades ---------- */}
          <div className="spot__book">
            <div className="spot__bhead">
              <h3>Order Book</h3>
              <div className="spot__seg">
                {[['both', 'Both'], ['bids', 'Bids'], ['asks', 'Asks']].map(([k, l]) => <button key={k} className={obView === k ? 'is-on' : ''} onClick={() => setObView(k)}>{l}</button>)}
              </div>
            </div>
            <div className="spot__cols"><span>Price</span><span>Amount</span><span>Total</span></div>
            <div className="spot__rows">
              {obView !== 'bids' && book.asks.map((r, i) => (
                <div key={`a${i}`} className="spot__orow ask" style={{ '--w': `${(r.a / book.max) * 100}%` }}><span>{num(r.p)}</span><span>{r.a.toFixed(4)}</span><span>{num(r.tot, 2)}</span></div>
              ))}
              <div className="spot__midp">{num(live)}</div>
              {obView !== 'asks' && book.bids.map((r, i) => (
                <div key={`b${i}`} className="spot__orow bid" style={{ '--w': `${(r.a / book.max) * 100}%` }}><span>{num(r.p)}</span><span>{r.a.toFixed(4)}</span><span>{num(r.tot, 2)}</span></div>
              ))}
            </div>
            <div className="spot__bhead spot__bhead--sub"><h3>Recent Trades</h3></div>
            <div className="spot__cols"><span>Price</span><span>Amount</span><span>Time</span></div>
            <div className="spot__rows spot__rows--trades">
              {trades.map((r) => (
                <div key={r.id} className={`spot__orow ${r.buy ? 'bidtxt' : 'asktxt'}`}><span>{num(r.price)}</span><span>{r.amount.toFixed(4)}</span><span>{r.time}</span></div>
              ))}
            </div>
          </div>

          {/* ---------- order form ---------- */}
          <div className="spot__form">
            <div className="spot__sides">
              <button className={side === 'buy' ? 'is-buy' : ''} onClick={() => { setSide('buy'); setAmount(''); setMsg(null) }}>Buy</button>
              <button className={side === 'sell' ? 'is-sell' : ''} onClick={() => { setSide('sell'); setAmount(''); setMsg(null) }}>Sell</button>
            </div>
            <div className="spot__seg spot__seg--wide">
              <button className={otype === 'limit' ? 'is-on' : ''} onClick={() => setOtype('limit')}>Limit</button>
              <button className={otype === 'market' ? 'is-on' : ''} onClick={() => setOtype('market')}>Market</button>
            </div>

            <label className="spot__lbl">Price (USDT)</label>
            {otype === 'limit'
              ? <input className="spot__inp" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
              : <input className="spot__inp" value="Market price" disabled />}

            <label className="spot__lbl">Amount ({symbol})</label>
            <input className="spot__inp" type="number" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />

            <input className="spot__range" type="range" min="0" max="100" value={pct} onChange={(e) => setPct(+e.target.value)} />
            <div className="spot__pcts">{[25, 50, 75, 100].map((p) => <button key={p} onClick={() => setPct(p)}>{p}%</button>)}</div>

            <label className="spot__lbl">Total (USDT)</label>
            <input className="spot__inp" value={total ? num(total, 2) : '0.00'} readOnly />

            <div className="spot__line2"><span>Fee (0.1%)</span><b>${fee.toFixed(4)}</b></div>
            <div className="spot__line2"><span><Wallet size={14} /> Available ({side === 'buy' ? 'USDT' : symbol})</span><b>{side === 'buy' ? num(balance, 2) : held} {side === 'buy' ? 'USDT' : symbol}</b></div>

            {msg && <p className={`spot__msg ${msg.t}`}>{msg.m}</p>}
            <button className={`spot__submit ${side}`} disabled={busy} onClick={submit}>{busy ? 'Processing…' : `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
