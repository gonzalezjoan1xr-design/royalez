import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Zap, Wallet, Activity, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import useTickers, { COINS, coinIcon, fmtPrice } from '../hooks/useTickers'
import './Dashboard.css'

function Spark({ up }) {
  const pts = Array.from({ length: 24 }, (_, i) => `${i * 12},${38 - i * 0.6 - Math.sin(i * 0.8) * 4 * (up ? 1 : -1)}`).join(' ')
  return (
    <svg viewBox="0 0 276 44" className="dash__spark" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={up ? '#22c55e' : '#f4525f'} strokeWidth="2" />
    </svg>
  )
}

function Coin({ s }) {
  return <img className="dash__coin" src={coinIcon(s)} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
}

const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

function compact(n) {
  if (!n) return '—'
  const units = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]
  for (const [v, u] of units) if (n >= v) return `$${(n / v).toFixed(2)} ${u}`
  return `$${n.toFixed(2)}`
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { tickers } = useTickers()
  const [holdings, setHoldings] = useState([])
  const [watch, setWatch] = useState(['BTC', 'ETH', 'XRP'])

  useEffect(() => {
    if (!user) return
    supabase.from('holdings').select('*').eq('user_id', user.id).then(({ data }) => setHoldings(data || []))
    supabase.from('watchlist').select('symbol').eq('user_id', user.id).then(({ data }) => data?.length && setWatch(data.map((d) => d.symbol)))
  }, [user])

  const bySym = useMemo(() => Object.fromEntries(tickers.map((t) => [t.symbol, t])), [tickers])
  const cryptoValue = holdings.reduce((sum, h) => sum + h.amount * (bySym[h.symbol]?.price || 0), 0)
  const total = cryptoValue + Number(profile?.balance || 0)
  const name = profile?.username || user?.email?.split('@')[0] || 'trader'

  const gainer = tickers.length ? tickers.reduce((a, b) => (b.change > a.change ? b : a)) : null
  const loser = tickers.length ? tickers.reduce((a, b) => (b.change < a.change ? b : a)) : null
  const volume = tickers.reduce((s, t) => s + (Number(t.volume) || 0), 0)
  const trending = [...tickers].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6)

  return (
    <div className="dash">
      <section className="dash__hero">
        <div className="dash__hero-top">
          <div>
            <h1>Welcome back, {name}</h1>
            <p className="dash__sub">Here's the latest market overview.</p>
          </div>
          <div className="dash__hero-btns">
            <Link to="/markets" className="dash__btn"><BarChart3 size={16} /> Markets</Link>
            <Link to="/spot" className="dash__btn dash__btn--primary"><Zap size={16} /> Trade Now</Link>
          </div>
        </div>

        <div className="dash__stats">
          <div className="dash__stat">
            <div className="dash__stat-label"><Wallet size={16} /> Total Balance</div>
            <div className="dash__stat-val">{total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-label"><Activity size={16} /> 24h Volume</div>
            <div className="dash__stat-val">{compact(volume)}</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-label up"><TrendingUp size={16} /> <span>Top Gainer</span></div>
            <div className="dash__stat-pair">
              <strong>{gainer?.symbol || '—'}</strong>
              {gainer && <span className="up">{pct(gainer.change)}</span>}
            </div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-label down"><TrendingDown size={16} /> <span>Top Loser</span></div>
            <div className="dash__stat-pair">
              <strong>{loser?.symbol || '—'}</strong>
              {loser && <span className="down">{pct(loser.change)}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="dash__section">
        <div className="dash__head dash__head--plain">
          <h2>Trending Assets</h2>
          <Link to="/markets" className="dash__viewall">View All <ArrowRight size={16} /></Link>
        </div>
        <div className="dash__cards">
          {trending.map((t) => (
            <article className="dash__card" key={t.symbol}>
              <div className="dash__card-top">
                <span className="dash__card-name">
                  <Coin s={t.symbol} />
                  <span className="dash__card-id"><strong>{t.symbol}</strong><small>{COINS[t.symbol]}</small></span>
                </span>
                <span className={`dash__chip ${t.change >= 0 ? 'up' : 'down'}`}>{pct(t.change)}</span>
              </div>
              <div className="dash__big">{fmtPrice(t.price)}</div>
              <Spark up={t.change >= 0} />
            </article>
          ))}
        </div>
      </section>

      <div className="dash__grid">
        <aside className="dash__panel">
          <div className="dash__head"><h2>Watchlist</h2><Link to="/markets">See All</Link></div>
          {watch.map((s) => {
            const t = bySym[s]; if (!t) return null
            return (
              <div className="dash__row" key={s}>
                <Coin s={s} />
                <div className="dash__sym"><strong>{s}</strong><span>{COINS[s]}</span></div>
                <div className="dash__px"><strong>{fmtPrice(t.price)}</strong><span className={t.change >= 0 ? 'up' : 'down'}>{pct(t.change)}</span></div>
              </div>
            )
          })}
        </aside>

        <section className="dash__holdings">
          <div className="dash__head dash__head--plain"><h2>Your Crypto</h2><Link to="/markets">See All</Link></div>
          {holdings.length === 0 ? (
            <div className="dash__empty">You don't hold any crypto yet. <Link to="/deposit">Fund your account</Link>, then buy from <Link to="/markets">Markets</Link>.</div>
          ) : (
            <div className="dash__cards dash__cards--sm">
              {holdings.map((h) => {
                const t = bySym[h.symbol]; if (!t) return null
                return (
                  <article className="dash__card" key={h.id}>
                    <div className="dash__card-top">
                      <span className="dash__card-name"><Coin s={h.symbol} /><strong>{h.symbol}</strong></span>
                      <span className={`dash__chip ${t.change >= 0 ? 'up' : 'down'}`}>{pct(t.change)}</span>
                    </div>
                    <div className="dash__big">{fmtPrice(t.price)}</div>
                    <div className="dash__meta">Amount: <b>{h.amount} {h.symbol}</b></div>
                    <div className="dash__meta">Value: <b>{fmtPrice(h.amount * t.price)}</b></div>
                    <Spark up={t.change >= 0} />
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
