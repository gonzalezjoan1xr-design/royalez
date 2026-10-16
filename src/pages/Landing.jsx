import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import './Landing.css'

const candles = Array.from({ length: 34 }, (_, i) => {
  const base = 120 - i * 1.4 + Math.sin(i * 0.9) * 26 + Math.cos(i * 2.3) * 10
  const body = 8 + ((i * 37) % 22)
  return { x: 14 + i * 14, y: base, body, up: (i * 7) % 3 !== 0 }
})

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
          <Link to="/signup" className="btn btn--primary btn--sm">Get started</Link>
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

        <div className="landing__art" aria-hidden="true">
          <svg viewBox="0 0 520 260" className="landing__chart">
            <defs>
              <linearGradient id="rmFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#00e676" stopOpacity="0.3" />
                <stop offset="1" stopColor="#00e676" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="520" height="260" rx="14" fill="rgba(0,0,0,0.55)" stroke="#16251d" />
            <path d={`M14 230 ${candles.map((c) => `L${c.x} ${c.y + 60}`).join(' ')} L${14 + 33 * 14} 250 L14 250 Z`} fill="url(#rmFill)" />
            {candles.map((c, i) => (
              <g key={i}>
                <line x1={c.x} x2={c.x} y1={c.y + 40} y2={c.y + 60 + c.body + 14} stroke={c.up ? '#00c47a' : '#f4525f'} />
                <rect x={c.x - 4} y={c.y + 52} width="8" height={c.body} fill={c.up ? '#00c47a' : '#f4525f'} />
              </g>
            ))}
          </svg>
          <div className="landing__badge"><span>BTC/USDT</span><strong className="up">+2.55%</strong></div>
        </div>
      </section>
    </div>
  )
}
