import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import './Landing.css'

const ticker = [
  { s: 'BTC/USDT', p: '64,210.55', c: '+1.12%', up: true },
  { s: 'ETH/USDT', p: '2,458.70', c: '+0.68%', up: true },
  { s: 'BNB/USDT', p: '731.24', c: '+0.22%', up: true },
  { s: 'SOL/USDT', p: '106.41', c: '-0.92%', up: false },
  { s: 'XRP/USDT', p: '1.3414', c: '+0.49%', up: true },
  { s: 'ADA/USDT', p: '0.2310', c: '-0.31%', up: false },
]

const snapshot = [
  { s: 'BTC/USDT', c: '#f7931a', t: '₿', p: '$64,210.55', ch: '+4.18%', up: true },
  { s: 'ETH/USDT', c: '#627eea', t: 'Ξ', p: '$2,458.70', ch: '+2.07%', up: true },
  { s: 'BNB/USDT', c: '#f3ba2f', t: 'B', p: '$731.24', ch: '+1.35%', up: true },
  { s: 'SOL/USDT', c: '#14f195', t: 'S', p: '$106.41', ch: '-0.92%', up: false },
  { s: 'XRP/USDT', c: '#2b3036', t: 'X', p: '$1.34', ch: '+0.49%', up: true },
]

const reasons = [
  { t: 'Rapid Payouts', d: 'Withdrawals are handled in moments, so your money reaches you without delays or hassle.',
    i: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></> },
  { t: 'Tight, Steady Spreads', d: 'Enjoy narrow and stable spreads that hold up even when the market gets turbulent.',
    i: <><path d="M4.5 18a8.5 8.5 0 1115 0" /><path d="M12 18l4-6" /></> },
  { t: 'Help Whenever You Need It', d: 'Reach a knowledgeable team at any hour by chat, phone or email, in several languages.',
    i: <><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></> },
  { t: 'No Charges For Holding Overnight', d: 'Keep popular positions open past the close without paying extra. Conditions may apply.',
    i: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" /> },
  { t: 'Accurate Order Fills', d: 'Orders are matched at high speed with very little difference from the price you saw.',
    i: <><circle cx="12" cy="14" r="7" /><path d="M12 14V10M9 3h6" /></> },
  { t: 'Bank-Level Account Safety', d: 'Client balances are kept in separate accounts backed by strong data protection.',
    i: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></> },
]

const market = [
  { k: 'BTC', n: 'Bitcoin', c: '#f7931a', g: '₿', p: '$64,210.55', ch: '+2.41%', h: '$64,880.00', l: '$62,540.10', up: true },
  { k: 'ETH', n: 'Ethereum', c: '#627eea', g: 'Ξ', p: '$2,458.70', ch: '+1.18%', h: '$2,491.30', l: '$2,376.45', up: true },
  { k: 'BNB', n: 'BNB', c: '#f3ba2f', g: 'B', p: '$731.24', ch: '+0.64%', h: '$738.90', l: '$719.15', up: true },
  { k: 'SOL', n: 'Solana', c: '#9945ff', g: 'S', p: '$106.41', ch: '-0.92%', h: '$109.20', l: '$103.85', up: false },
  { k: 'XRP', n: 'Ripple', c: '#2b3036', g: 'X', p: '$1.3414', ch: '+0.49%', h: '$1.3620', l: '$1.2990', up: true },
  { k: 'DOGE', n: 'Dogecoin', c: '#c2a633', g: 'Ð', p: '$0.082300', ch: '+0.37%', h: '$0.084100', l: '$0.079800', up: true },
  { k: 'ADA', n: 'Cardano', c: '#1ec8c0', g: 'A', p: '$0.231000', ch: '-0.31%', h: '$0.236400', l: '$0.224900', up: false },
  { k: 'TRX', n: 'TRON', c: '#2a2a2a', g: 'T', p: '$0.336000', ch: '+0.12%', h: '$0.338700', l: '$0.331200', up: true },
]

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing__bar">
        <Logo accent />
        <div className="landing__bar-actions">
          <Link to="/login" className="landing__signin">Sign in</Link>
          <Link to="/signup" className="btn btn--sm landing__start">Get started</Link>
        </div>
      </header>

      <div className="landing__tape" aria-hidden="true">
        <div className="landing__tape-track">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="landing__tape-item">
              <b>{t.s}</b> {t.p}{' '}
              <em className={t.up ? 'up' : 'down'}>{t.c}</em>
            </span>
          ))}
        </div>
      </div>

      <section className="landing__hero">
        <div className="landing__copy">
          <span className="landing__eyebrow">Your doorway to digital assets</span>
          <h1>Trade Smarter, Build Lasting Value</h1>
          <p>
            Follow live crypto prices, place spot orders and run rule-based bots from a
            single dashboard. Open an account, add funds, and pick the approach that
            matches your risk.
          </p>
          <div className="landing__cta">
            <Link to="/signup" className="btn btn--primary">Create account</Link>
            <Link to="/login" className="btn btn--ghost">Log in</Link>
          </div>
        </div>

        <div className="landing__art">
          <div className="landing__placeholder" role="img" aria-label="Image placeholder">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="M21 16l-5-5-8 9" />
            </svg>
            <span>Image placeholder</span>
          </div>
        </div>
      </section>
      <section className="about">
        <div className="about__copy">
          <span className="about__eyebrow">Why Royal Markets</span>
          <h2>Everything You Need To Trade With Clarity</h2>
          <p>
            Follow the market as it moves and act with tools built for serious traders.
            One workspace brings your prices, orders and automated strategies together.
          </p>

          <div className="about__features">
            <div className="about__feature">
              <span className="about__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
              </span>
              <div>
                <h3>Instant Execution</h3>
                <p>Orders fill in moments, priced from the live order book.</p>
              </div>
            </div>
            <div className="about__feature">
              <span className="about__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
              </span>
              <div>
                <h3>Protected Funds</h3>
                <p>Layered safeguards keep your balance and account locked down.</p>
              </div>
            </div>
          </div>

          <Link to="/signup" className="btn btn--primary about__btn">Explore Features</Link>

          <div className="about__stat">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14.3c2 .7 3.5 2.6 3.5 5.7" /></svg>
            <strong>20,000+</strong>
            <span>Registered traders</span>
          </div>
        </div>

        <div className="about__panel">
          <h3 className="about__panel-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 20V10M12 20V4M19 20v-7" /></svg>
            Market Snapshot
          </h3>
          <ul className="about__rows">
            {snapshot.map((r) => (
              <li key={r.s} className="about__row">
                <span className="about__coin" style={{ background: r.c }} aria-hidden="true">{r.t}</span>
                <span className="about__pair">{r.s}</span>
                <span className="about__quote">
                  <b>{r.p}</b>
                  <em className={r.up ? 'up' : 'down'}>{r.ch}</em>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="perks">
        <div className="perks__head">
          <span className="perks__eyebrow">Built For Traders</span>
          <h2>Tools That Keep You Ahead</h2>
          <p>
            Live prices and dependable features give you a clear view of every move
            and the speed to act on it.
          </p>
        </div>

        <div className="perks__grid">
          <article className="perks__card">
            <span className="perks__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-6" /></svg>
            </span>
            <h3>Detailed Price Charts</h3>
            <p>Study candlestick history with volume data and switch between time ranges in one tap.</p>
          </article>

          <article className="perks__card">
            <span className="perks__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-8 6 16 3-8h4" /></svg>
            </span>
            <h3>Always-On Market Watch</h3>
            <p>Stay informed day and night with streaming quotes, depth views and the latest fills.</p>
          </article>

          <article className="perks__card">
            <span className="perks__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
            </span>
            <h3>Fast Order Placement</h3>
            <p>Send market or limit orders in seconds through a quick, responsive engine.</p>
          </article>
        </div>
      </section>
      <section className="why">
        <div className="why__list">
          <span className="why__eyebrow">Our Advantages</span>
          <h2>Built To Earn Your Trust</h2>
          <ul>
            {reasons.map((r, i) => (
              <li key={r.t} className={`why__item${i === reasons.length - 1 ? ' why__item--lit' : ''}`}>
                <span className="why__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{r.i}</svg>
                </span>
                <div>
                  <h3>{r.t}</h3>
                  <p>{r.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="why__art">
          <div className="why__phone" role="img" aria-label="Image placeholder">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="M21 16l-5-5-8 9" />
            </svg>
            <span>Image placeholder</span>
          </div>
        </div>
      </section>
      <section className="prices">
        <div className="prices__head">
          <span className="prices__eyebrow">Market Pulse</span>
          <h2>Live Crypto Rates</h2>
        </div>

        <div className="prices__scroll">
          <table className="prices__table">
            <thead>
              <tr>
                <th>Coin</th>
                <th>Last price</th>
                <th>Change (24h)</th>
                <th>Peak (24h)</th>
                <th>Floor (24h)</th>
              </tr>
            </thead>
            <tbody>
              {market.map((m) => (
                <tr key={m.k}>
                  <td>
                    <div className="prices__asset">
                      <span className="prices__coin" style={{ background: m.c }} aria-hidden="true">{m.g}</span>
                      <div>
                        <strong>{m.k}</strong>
                        <small>{m.n}</small>
                      </div>
                    </div>
                  </td>
                  <td className="prices__num prices__num--main">{m.p}</td>
                  <td className={`prices__chg ${m.up ? 'up' : 'down'}`}>{m.ch}</td>
                  <td className="prices__num">{m.h}</td>
                  <td className="prices__num">{m.l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
