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
    </div>
  )
}
