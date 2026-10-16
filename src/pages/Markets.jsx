import { useEffect, useMemo, useState } from 'react'
import { Search, Star, TrendingUp, TrendingDown, Flame, Zap, ArrowUpDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import useTickers, { COINS, coinIcon, fmtPrice, fmtBig } from '../hooks/useTickers'
import './Markets.css'

const STABLE = /^(USDC|FDUSD|TUSD|USDP|BUSD|DAI|AEUR|EUR|USDE|XUSD|UST)$/
const COLS = [['name', 'Name'], ['price', 'Price'], ['change', '24h'], ['volume', 'Volume'], ['cap', 'Market Cap']]

function Mini({ list, kind }) {
  const gain = kind === 'gain'
  const Icon = gain ? Flame : Zap
  return (
    <section className="mk__box">
      <h2><Icon size={20} className={gain ? 'up' : 'down'} /> {gain ? 'Top Gainers' : 'Top Losers'}</h2>
      <div className="mk__minis">
        {list.map((t) => (
          <div className="mk__mini" key={t.symbol}>
            <img src={coinIcon(t.symbol)} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
            <strong>{t.symbol}</strong>
            <span className="mk__mini-px">{fmtPrice(t.price)}</span>
            <span className={`mk__chip ${gain ? 'up' : 'down'}`}>
              {gain ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Markets() {
  const { user } = useAuth()
  const { tickers, live } = useTickers()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [stars, setStars] = useState(new Set())
  const [sort, setSort] = useState({ key: 'cap', dir: 'desc' })

  // top 100 USDT pairs by 24h volume (live tickers win where we have them)
  const [extra, setExtra] = useState([])
  useEffect(() => {
    let off = false
    const load = () => fetch('https://api.binance.com/api/v3/ticker/24hr')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((all) => {
        if (off) return
        setExtra(all
          .filter((x) => x.symbol.endsWith('USDT') && !/(UP|DOWN|BULL|BEAR)USDT$/.test(x.symbol))
          .map((x) => ({ symbol: x.symbol.slice(0, -4), price: +x.lastPrice, change: +x.priceChangePercent, volume: +x.quoteVolume }))
          .filter((x) => !STABLE.test(x.symbol) && x.price > 0)
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 100))
      })
      .catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => { off = true; clearInterval(id) }
  }, [])

  // market caps (CoinGecko public API, best effort)
  const [caps, setCaps] = useState({})
  useEffect(() => {
    let off = false
    const load = () => fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows) => {
        if (off) return
        const m = {}
        rows.forEach((c) => { const s = c.symbol.toUpperCase(); if (m[s] == null) m[s] = c.market_cap })
        setCaps(m)
      })
      .catch(() => {})
    load()
    const id = setInterval(load, 300000)
    return () => { off = true; clearInterval(id) }
  }, [])

  const coins = useMemo(() => {
    const have = new Set(tickers.map((x) => x.symbol))
    return [...tickers, ...extra.filter((x) => !have.has(x.symbol))]
      .slice(0, 100)
      .map((x) => ({ ...x, cap: caps[x.symbol] ?? null }))
  }, [tickers, extra, caps])

  useEffect(() => {
    if (!user) return
    supabase.from('watchlist').select('symbol').eq('user_id', user.id).then(({ data }) => setStars(new Set((data || []).map((d) => d.symbol))))
  }, [user])

  const toggle = async (s) => {
    if (!user) return
    const next = new Set(stars)
    if (next.has(s)) { next.delete(s); await supabase.from('watchlist').delete().eq('user_id', user.id).eq('symbol', s) }
    else { next.add(s); await supabase.from('watchlist').insert({ user_id: user.id, symbol: s }) }
    setStars(next)
  }

  const byChange = useMemo(() => [...coins].sort((a, b) => b.change - a.change), [coins])

  const rows = useMemo(() => {
    let r = coins.filter((t) => `${t.symbol} ${COINS[t.symbol] || ''}`.toLowerCase().includes(q.toLowerCase()))
    if (tab === 'fav') r = r.filter((t) => stars.has(t.symbol))
    if (tab === 'gain') r = r.filter((t) => t.change >= 0)
    if (tab === 'lose') r = r.filter((t) => t.change < 0)
    const { key, dir } = sort
    const m = dir === 'asc' ? 1 : -1
    return [...r].sort((a, b) => {
      if (key === 'name') return m * a.symbol.localeCompare(b.symbol)
      // no market cap yet → fall back to volume so the list is still ordered
      if (key === 'cap') return m * ((a.cap ?? -1) - (b.cap ?? -1) || a.volume - b.volume)
      return m * ((a[key] ?? 0) - (b[key] ?? 0))
    })
  }, [coins, q, tab, stars, sort])

  const sortBy = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))

  return (
    <div className="mk">
      <div className="mk__top">
        <Mini list={byChange.slice(0, 3)} kind="gain" />
        <Mini list={byChange.slice(-3).reverse()} kind="lose" />
      </div>

      <section className="mk__panel">
        <div className="mk__bar">
          <div className="mk__tabs">
            <button className={tab === 'all' ? 'is-on' : ''} onClick={() => setTab('all')}>All</button>
            <button className={`mk__tab-star ${tab === 'fav' ? 'is-on' : ''}`} onClick={() => setTab('fav')} aria-label="Favourites"><Star size={16} /></button>
            <button className={tab === 'gain' ? 'is-on' : ''} onClick={() => setTab('gain')}>Gainers</button>
            <button className={tab === 'lose' ? 'is-on' : ''} onClick={() => setTab('lose')}>Losers</button>
          </div>
          <label className="mk__search"><Search size={18} /><input placeholder="Search markets..." value={q} onChange={(e) => setQ(e.target.value)} /></label>
        </div>
        {!live && <p className="mk__warn">Live prices unavailable — showing sample data.</p>}

        <div className="mk__scroll">
          <div className="mk__table">
            <div className="mk__tr mk__th">
              <span />
              {COLS.map(([k, label]) => (
                <button key={k} className={`mk__sort ${sort.key === k ? 'is-on' : ''} ${k === 'name' ? '' : 'num'}`} onClick={() => sortBy(k)}>
                  {label} <ArrowUpDown size={14} />
                </button>
              ))}
              <span className="num">Action</span>
            </div>

            {rows.map((t) => (
              <div className="mk__tr" key={t.symbol}>
                <button className={`mk__star ${stars.has(t.symbol) ? 'is-on' : ''}`} onClick={() => toggle(t.symbol)} aria-label="Toggle favourite"><Star size={20} fill={stars.has(t.symbol) ? 'currentColor' : 'none'} /></button>
                <span className="mk__name"><img src={coinIcon(t.symbol)} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} /><strong>{t.symbol}</strong></span>
                <strong className="num mono mk__px">{fmtPrice(t.price)}</strong>
                <span className={`num mono mk__ch ${t.change >= 0 ? 'up' : 'down'}`}>
                  {t.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
                </span>
                <span className="num mono mk__muted">{fmtBig(t.volume)}</span>
                <span className="num mono mk__muted">{t.cap ? fmtBig(t.cap) : '—'}</span>
                <span className="num"><Link to="/spot" className="mk__trade">Trade</Link></span>
              </div>
            ))}
            {rows.length === 0 && <div className="mk__none">No markets match.</div>}
          </div>
        </div>
      </section>
    </div>
  )
}
