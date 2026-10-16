import { useEffect, useMemo, useState } from 'react'
import { Search, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import useTickers, { COINS, coinIcon, fmtPrice, fmtBig } from '../hooks/useTickers'
import './Markets.css'

function Mini({ list, kind }) {
  return (
    <section className="mk__box">
      <h2>{kind === 'gain' ? 'Top Gainers' : 'Top Losers'}</h2>
      {list.map((t) => (
        <div className="mk__mini" key={t.symbol}>
          <img src={coinIcon(t.symbol)} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
          <strong>{t.symbol}</strong>
          <span className="mk__mini-px">{fmtPrice(t.price)}</span>
          <span className={`mk__chip ${kind === 'gain' ? 'up' : 'down'}`}>
            {kind === 'gain' ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
          </span>
        </div>
      ))}
    </section>
  )
}

export default function Markets() {
  const { user } = useAuth()
  const { tickers, live } = useTickers()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [stars, setStars] = useState(new Set())

  useEffect(() => {
    if (!user) return
    supabase.from('watchlist').select('symbol').eq('user_id', user.id).then(({ data }) => setStars(new Set((data || []).map((d) => d.symbol))))
  }, [user])

  const toggle = async (s) => {
    const next = new Set(stars)
    if (next.has(s)) { next.delete(s); await supabase.from('watchlist').delete().eq('user_id', user.id).eq('symbol', s) }
    else { next.add(s); await supabase.from('watchlist').insert({ user_id: user.id, symbol: s }) }
    setStars(next)
  }

  const sorted = [...tickers].sort((a, b) => b.change - a.change)
  const rows = useMemo(() => {
    let r = tickers.filter((t) => (t.symbol + COINS[t.symbol]).toLowerCase().includes(q.toLowerCase()))
    if (tab === 'fav') r = r.filter((t) => stars.has(t.symbol))
    if (tab === 'gain') r = r.filter((t) => t.change >= 0).sort((a, b) => b.change - a.change)
    if (tab === 'lose') r = r.filter((t) => t.change < 0).sort((a, b) => a.change - b.change)
    return r
  }, [tickers, q, tab, stars])

  return (
    <div className="mk">
      <div className="mk__top">
        <Mini list={sorted.slice(0, 3)} kind="gain" />
        <Mini list={sorted.slice(-3).reverse()} kind="lose" />
      </div>

      <div className="mk__bar">
        <div className="mk__tabs">
          {[['all', 'All'], ['fav', '★'], ['gain', 'Gainers'], ['lose', 'Losers']].map(([k, l]) => (
            <button key={k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <label className="mk__search"><Search size={18} /><input placeholder="Search markets..." value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </div>
      {!live && <p className="mk__warn">Live prices unavailable — showing sample data.</p>}

      <div className="mk__table">
        <div className="mk__tr mk__th"><span /><span>NAME</span><span>PRICE</span><span>24H</span><span>VOLUME</span><span>ACTION</span></div>
        {rows.map((t) => (
          <div className="mk__tr" key={t.symbol}>
            <button className={`mk__star ${stars.has(t.symbol) ? 'is-on' : ''}`} onClick={() => toggle(t.symbol)} aria-label="Toggle favourite"><Star size={18} fill={stars.has(t.symbol) ? 'currentColor' : 'none'} /></button>
            <span className="mk__name"><img src={coinIcon(t.symbol)} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} /><span><strong>{t.symbol}</strong><small>{t.symbol}/USDT</small></span></span>
            <strong>{fmtPrice(t.price)}</strong>
            <span className={`mono ${t.change >= 0 ? 'up' : 'down'}`}>{t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%</span>
            <span className="mk__muted">{fmtBig(t.volume)}</span>
            <Link to="/spot" className="mk__trade">Trade</Link>
          </div>
        ))}
        {rows.length === 0 && <div className="mk__none">No markets match.</div>}
      </div>
    </div>
  )
}
