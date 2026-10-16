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
    </div>
  )
}
