import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import './Landing.css'

const candles = Array.from({ length: 34 }, (_, i) => {
  const base = 120 - i * 1.4 + Math.sin(i * 0.9) * 26 + Math.cos(i * 2.3) * 10
  const body = 8 + ((i * 37) % 22)
  return { x: 14 + i * 14, y: base, body, up: (i * 7) % 3 !== 0 }
})

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing__bar">
        <Logo accent />
        <div className="landing__bar-actions">
          <Link to="/login" className="btn btn--ghost">Sign in</Link>
          <Link to="/signup" className="btn btn--primary">Get started</Link>
        </div>
      </header>

      <section className="landing__hero">
        <div className="landing__copy">
          <h1>Trade With Confidence, Grow Like Royalty.</h1>
          <p>
            Royal Markets gives you live crypto prices, hands-on spot trading and rule-based
            bots in one place. Open an account, fund it, and start with the strategy that
            fits your risk.
          </p>
          <div className="landing__cta">
            <Link to="/signup" className="btn btn--primary btn--lg">Create an account</Link>
            <Link to="/login" className="btn btn--ghost btn--lg">Login</Link>
          </div>
        </div>

        <div className="landing__art" aria-hidden="true">
          <svg viewBox="0 0 520 260" className="landing__chart">
            <defs>
              <linearGradient id="rmFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#22c55e" stopOpacity="0.35" />
                <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="520" height="260" rx="18" fill="#0b1511" stroke="#1b2e26" />
            <path d={`M14 230 ${candles.map((c) => `L${c.x} ${c.y + 60}`).join(' ')} L${14 + 33 * 14} 250 L14 250 Z`} fill="url(#rmFill)" />
            {candles.map((c, i) => (
              <g key={i}>
                <line x1={c.x} x2={c.x} y1={c.y + 40} y2={c.y + 60 + c.body + 14} stroke={c.up ? '#22c55e' : '#f4525f'} />
                <rect x={c.x - 4} y={c.y + 52} width="8" height={c.body} fill={c.up ? '#22c55e' : '#f4525f'} />
              </g>
            ))}
          </svg>
          <div className="landing__ticker"><span>BTC/USDT</span><strong className="up">+2.55%</strong></div>
        </div>
      </section>
    </div>
  )
}
