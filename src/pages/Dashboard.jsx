import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, ArrowDown } from 'lucide-react'
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

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { tickers } = useTickers()
  const [holdings, setHoldings] = useState([])
  const [watch, setWatch] = useState(['BTC', 'ETH', 'XRP'])
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('holdings').select('*').eq('user_id', user.id).then(({ data }) => setHoldings(data || []))
    supabase.from('watchlist').select('symbol').eq('user_id', user.id).then(({ data }) => data?.length && setWatch(data.map((d) => d.symbol)))
  }, [user])

  const bySym = useMemo(() => Object.fromEntries(tickers.map((t) => [t.symbol, t])), [tickers])
  const cryptoValue = holdings.reduce((sum, h) => sum + h.amount * (bySym[h.symbol]?.price || 0), 0)
  const total = cryptoValue + Number(profile?.balance || 0)

  return (
    <div className="dash">
      <section className="dash__hero">
        <span className="dash__label">PORTFOLIO VALUE</span>
        <h1>{total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</h1>
        <span className="up dash__delta"><ArrowUp size={16} /> +0.00%</span>
        <div className="dash__actions">
          <button className="dash__btn dash__btn--primary" onClick={() => setNote('Deposits are not connected yet. Add your payment provider to enable them.')}>Deposit</button>
          <button className="dash__btn" onClick={() => setNote('Withdrawals are not connected yet. Add your payment provider to enable them.')}>Withdraw</button>
        </div>
        {note && <p className="dash__note">{note}</p>}
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
                <div className="dash__px"><strong>{fmtPrice(t.price)}</strong><span className={t.change >= 0 ? 'up' : 'down'}>{t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%</span></div>
              </div>
            )
          })}
        </aside>

        <section>
          <div className="dash__head dash__head--plain"><h2>Your Crypto</h2><Link to="/markets">See All</Link></div>
          {holdings.length === 0 ? (
            <div className="dash__empty">You don't hold any crypto yet. Fund your account, then buy from <Link to="/markets">Markets</Link>.</div>
          ) : (
            <div className="dash__cards">
              {holdings.map((h) => {
                const t = bySym[h.symbol]; if (!t) return null
                return (
                  <article className="dash__card" key={h.id}>
                    <div className="dash__card-top">
                      <span className="dash__card-name"><Coin s={h.symbol} />{h.symbol}</span>
                      <span className={`dash__chip ${t.change >= 0 ? 'up' : 'down'}`}>{t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%</span>
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
