import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import logoImg from '../Assets/justR.png'
import heroImg from '../Assets/hero.jpg'
import phoneImg from '../Assets/Phone.jpeg'
import './Landing.css'

// Coin logos (inline SVG, 32x32)
const COIN_ICONS = {
  btc: (<><g fill="none" fillRule="evenodd"><circle cx="16" cy="16" r="16" fill="#F7931A"/><path fill="#FFF" fillRule="nonzero" d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"/></g></>),
  eth: (<><g fill="none" fillRule="evenodd"><circle cx="16" cy="16" r="16" fill="#627EEA"/><g fill="#FFF" fillRule="nonzero"><path fillOpacity=".602" d="M16.498 4v8.87l7.497 3.35z"/><path d="M16.498 4L9 16.22l7.498-3.35z"/><path fillOpacity=".602" d="M16.498 21.968v6.027L24 17.616z"/><path d="M16.498 27.995v-6.028L9 17.616z"/><path fillOpacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.348z"/><path fillOpacity=".602" d="M9 16.22l7.498 4.353v-7.701z"/></g></g></>),
  bnb: (<><g fill="none"><circle cx="16" cy="16" r="16" fill="#F3BA2F"/><path fill="#FFF" d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.259L16 26l-6.144-6.144-.003-.003 2.263-2.257zM21.48 16l2.26-2.26L26 16l-2.26 2.26L21.48 16zm-3.188-.002h.002V16L16 18.294l-2.291-2.29-.004-.004.004-.003.401-.402.195-.195L16 13.706l2.293 2.293z"/></g></>),
  sol: (<><g fill="none"><circle fill="#66F9A1" cx="16" cy="16" r="16"/><path d="M9.925 19.687a.59.59 0 01.415-.17h14.366a.29.29 0 01.207.497l-2.838 2.815a.59.59 0 01-.415.171H7.294a.291.291 0 01-.207-.498l2.838-2.815zm0-10.517A.59.59 0 0110.34 9h14.366c.261 0 .392.314.207.498l-2.838 2.815a.59.59 0 01-.415.17H7.294a.291.291 0 01-.207-.497L9.925 9.17zm12.15 5.225a.59.59 0 00-.415-.17H7.294a.291.291 0 00-.207.498l2.838 2.815c.11.109.26.17.415.17h14.366a.291.291 0 00.207-.498l-2.838-2.815z" fill="#FFF"/></g></>),
  xrp: (<><g fill="none"><circle cx="16" cy="16" r="16" fill="#23292F"/><path d="M23.07 8h2.89l-6.015 5.957a5.621 5.621 0 01-7.89 0L6.035 8H8.93l4.57 4.523a3.556 3.556 0 004.996 0L23.07 8zM8.895 24.563H6l6.055-5.993a5.621 5.621 0 017.89 0L26 24.562h-2.895L18.5 20a3.556 3.556 0 00-4.996 0l-4.61 4.563z" fill="#FFF"/></g></>),
  doge: (<><g fill="none" fillRule="evenodd"><circle cx="16" cy="16" r="16" fill="#C3A634"/><path fill="#FFF" d="M13.248 14.61h4.314v2.286h-4.314v4.818h2.721c1.077 0 1.958-.145 2.644-.437.686-.291 1.224-.694 1.615-1.21a4.4 4.4 0 00.796-1.815 11.4 11.4 0 00.21-2.252 11.4 11.4 0 00-.21-2.252 4.396 4.396 0 00-.796-1.815c-.391-.516-.93-.919-1.615-1.21-.686-.292-1.567-.437-2.644-.437h-2.721v4.325zm-2.766 2.286H9v-2.285h1.482V8h6.549c1.21 0 2.257.21 3.142.627.885.419 1.607.99 2.168 1.715.56.724.977 1.572 1.25 2.543.273.971.409 2.01.409 3.115a11.47 11.47 0 01-.41 3.115c-.272.97-.689 1.819-1.25 2.543-.56.725-1.282 1.296-2.167 1.715-.885.418-1.933.627-3.142.627h-6.549v-7.104z"/></g></>),
  ada: (<><g fill="none"><circle cx="16" cy="16" r="16" fill="#0D1E30"/><path d="M15.725 6.06c.479-.247 1.064.324.81.795-.149.384-.71.486-.996.193-.303-.28-.204-.836.186-.989zm-5.155.546c.291-.118.66.144.63.457.03.338-.39.588-.687.427-.393-.15-.348-.778.057-.884zm10.558.893c-.455-.054-.527-.758-.09-.9.34-.162.652.143.702.46-.072.27-.302.518-.612.44zm-9.385 1.265c.487-.303 1.181.148 1.106.705-.025.561-.783.887-1.211.507-.414-.298-.351-.982.105-1.212zm7.43.322c.217-.55 1.097-.568 1.344-.032.245.417-.056.934-.491 1.076-.577.106-1.124-.508-.853-1.044zm-4.069 1.013c-.005-.474.433-.826.89-.859.304.06.634.187.764.488.243.416.027.987-.41 1.178-.2.11-.438.069-.656.056-.333-.16-.614-.477-.588-.863zm-7.666.69c.445-.27 1.045.22.876.696-.092.411-.654.578-.975.316-.343-.246-.289-.837.1-1.013zm16.462-.002c.377-.288 1 .043.954.511.026.427-.513.75-.887.53-.412-.183-.455-.807-.067-1.04zm-6.64.851c.622-.22 1.362.043 1.716.59.468.667.22 1.683-.507 2.066-.752.453-1.851.07-2.13-.758-.315-.74.145-1.666.92-1.898zm-3.653.073c.69-.32 1.619-.052 1.952.642.392.676.089 1.617-.612 1.966-.702.393-1.693.095-2.032-.63-.381-.702-.043-1.655.692-1.978zM9.95 12.94c.053-.437.472-.722.895-.752a.98.98 0 01.87.857c-.03.45-.383.888-.867.886-.533.045-1-.477-.898-.991zm10.802-.656c.547-.313 1.306.142 1.282.76.037.655-.803 1.116-1.347.732-.566-.32-.522-1.22.065-1.492zm-8.63 2.307c.638-.173 1.37.123 1.683.701.343.582.203 1.39-.33 1.818-.685.626-1.946.374-2.31-.48-.419-.783.09-1.833.956-2.04zm6.927-.003c.621-.175 1.351.06 1.685.617.442.637.231 1.588-.426 1.998-.69.477-1.756.227-2.136-.519-.46-.771.003-1.861.877-2.096zm-11.04.726c.552-.205 1.164.394.94.933-.136.49-.839.672-1.202.31-.425-.34-.268-1.095.262-1.243zm14.969.782a.836.836 0 01.788-.874c.378.06.746.36.716.765.035.535-.62.898-1.084.647-.217-.109-.328-.328-.42-.538zM5.294 15.58c.332-.143.743.14.667.503-.018.411-.635.57-.861.226-.2-.239-.08-.606.194-.73zm20.949-.009c.234-.163.61-.046.702.223.157.294-.131.696-.467.647-.472.042-.624-.665-.235-.87zm-12.317 1.973c.874-.223 1.814.494 1.82 1.38.056.895-.87 1.688-1.764 1.482-.692-.11-1.235-.766-1.212-1.453-.002-.658.502-1.27 1.156-1.409zm3.462-.001c.887-.244 1.855.486 1.841 1.392.047.878-.85 1.645-1.726 1.47-.825-.104-1.433-.995-1.203-1.783.116-.524.562-.95 1.088-1.08zm-6.676.545c.614-.103 1.19.57.941 1.144-.182.612-1.086.777-1.486.278-.468-.48-.118-1.356.545-1.422zm10.154.027c.548-.226 1.22.24 1.178.825.022.643-.808 1.087-1.343.711-.607-.337-.496-1.33.165-1.536zm2.838 2.8c-.214-.393.175-.914.62-.841.22-.004.375.167.516.311.029.233.078.511-.119.69-.267.333-.872.238-1.017-.16zm-16.268-.732c.415-.271 1.012.134.918.61-.05.423-.59.664-.945.424-.382-.217-.368-.836.027-1.034zm8.193.883c.543-.235 1.235.23 1.183.818.04.65-.815 1.1-1.346.71-.59-.335-.491-1.321.163-1.528zm-3.794.871c.462-.239 1.082.174 1.04.684.014.418-.4.774-.82.712-.347-.007-.573-.314-.685-.605.006-.317.139-.67.465-.79zm7.686.008c.476-.29 1.152.126 1.107.67.012.57-.752.934-1.195.56-.428-.293-.376-.997.088-1.23zm1.337 3.25c-.212-.314.037-.693.38-.765.277.055.57.26.511.574-.04.427-.674.557-.891.192zm-10.611-.273c.084-.25.288-.497.587-.432.435.03.564.676.183.875-.342.227-.74-.084-.77-.443zm5.12.287c.083-.37.568-.549.888-.353.212.09.274.322.328.52a8.822 8.822 0 00-.08.31c-.131.152-.3.305-.518.3-.405.047-.771-.404-.619-.777z" fill="#FFF"/></g></>),
  trx: (<><g fill="none"><circle fill="#EF0027" cx="16" cy="16" r="16"/><path d="M21.932 9.913L7.5 7.257l7.595 19.112 10.583-12.894-3.746-3.562zm-.232 1.17l2.208 2.099-6.038 1.093 3.83-3.192zm-5.142 2.973l-6.364-5.278 10.402 1.914-4.038 3.364zm-.453.934l-1.038 8.58L9.472 9.487l6.633 5.502zm.96.455l6.687-1.21-7.67 9.343.983-8.133z" fill="#FFF"/></g></>),
}

function CoinIcon({ k, className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      {COIN_ICONS[k]}
    </svg>
  )
}

const ticker = [
  { s: 'BTC/USDT', p: '64,210.55', c: '+1.12%', up: true },
  { s: 'ETH/USDT', p: '2,458.70', c: '+0.68%', up: true },
  { s: 'BNB/USDT', p: '731.24', c: '+0.22%', up: true },
  { s: 'SOL/USDT', p: '106.41', c: '-0.92%', up: false },
  { s: 'XRP/USDT', p: '1.3414', c: '+0.49%', up: true },
  { s: 'ADA/USDT', p: '0.2310', c: '-0.31%', up: false },
]

const snapshot = [
  { s: 'BTC/USDT', icon: 'btc', p: '$64,210.55', ch: '+4.18%', up: true },
  { s: 'ETH/USDT', icon: 'eth', p: '$2,458.70', ch: '+2.07%', up: true },
  { s: 'BNB/USDT', icon: 'bnb', p: '$731.24', ch: '+1.35%', up: true },
  { s: 'SOL/USDT', icon: 'sol', p: '$106.41', ch: '-0.92%', up: false },
  { s: 'XRP/USDT', icon: 'xrp', p: '$1.34', ch: '+0.49%', up: true },
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
  { k: 'BTC', n: 'Bitcoin', icon: 'btc', p: '$64,210.55', ch: '+2.41%', h: '$64,880.00', l: '$62,540.10', up: true },
  { k: 'ETH', n: 'Ethereum', icon: 'eth', p: '$2,458.70', ch: '+1.18%', h: '$2,491.30', l: '$2,376.45', up: true },
  { k: 'BNB', n: 'BNB', icon: 'bnb', p: '$731.24', ch: '+0.64%', h: '$738.90', l: '$719.15', up: true },
  { k: 'SOL', n: 'Solana', icon: 'sol', p: '$106.41', ch: '-0.92%', h: '$109.20', l: '$103.85', up: false },
  { k: 'XRP', n: 'Ripple', icon: 'xrp', p: '$1.3414', ch: '+0.49%', h: '$1.3620', l: '$1.2990', up: true },
  { k: 'DOGE', n: 'Dogecoin', icon: 'doge', p: '$0.082300', ch: '+0.37%', h: '$0.084100', l: '$0.079800', up: true },
  { k: 'ADA', n: 'Cardano', icon: 'ada', p: '$0.231000', ch: '-0.31%', h: '$0.236400', l: '$0.224900', up: false },
  { k: 'TRX', n: 'TRON', icon: 'trx', p: '$0.336000', ch: '+0.12%', h: '$0.338700', l: '$0.331200', up: true },
]

const figures = [
  { v: '35,000+', l: 'Verified members',
    i: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14.3c2 .7 3.5 2.6 3.5 5.7" /></> },
  { v: '$1.8B+', l: 'Monthly turnover',
    i: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
  { v: '80+', l: 'Coin markets',
    i: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></> },
  { v: '99.95%', l: 'Platform availability',
    i: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></> },
]

export default function Landing() {
  // The navbar stylesheet adds padding-top to <body> for its fixed header.
  // The landing page has its own fixed header, so remove that extra space here.
  useEffect(() => {
    document.body.classList.add('is-landing')
    return () => document.body.classList.remove('is-landing')
  }, [])

  return (
    <div className="landing">
      <header className="landing__bar">
        <Link to="/" className="landing__logo" aria-label="Royal Markets home">
          <img src={logoImg} alt="Royal Markets" />
        </Link>
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

      {/* hero.jpg is the section background (styled in Landing.css via --hero-img) */}
      <section className="landing__hero" style={{ '--hero-img': `url(${heroImg})` }}>
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
                <CoinIcon k={r.icon} className="about__coin" />
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
          <img className="why__img" src={phoneImg} alt="Royal Markets trading app on a phone" loading="lazy" />
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
                      <CoinIcon k={m.icon} className="prices__coin" />
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

      <section className="closing">
        <div className="closing__stats">
          {figures.map((f) => (
            <div key={f.l} className="closing__stat">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{f.i}</svg>
              <strong>{f.v}</strong>
              <span>{f.l}</span>
            </div>
          ))}
        </div>

        <div className="closing__cta">
          <h2>Your First Trade Starts Here</h2>
          <p>
            Become part of a growing community of traders on Royal Markets. Register in
            minutes and place your first order today.
          </p>
          <div className="closing__buttons">
            <Link to="/signup" className="btn btn--primary closing__main">Open Your Account</Link>
            <Link to="/login" className="btn btn--ghost closing__alt">Log in</Link>
          </div>
          <small>Free to join. No hidden setup costs.</small>
        </div>
      </section>

      <section className="legal">
        <div className="legal__inner">
          <p>
            <strong>Royal Markets Ltd</strong> is a licensed securities dealer incorporated in the{" "}
            <strong>Republic of Vanuatu</strong>, company number <strong>700412</strong>, and
            regulated by the <strong>Vanuatu Financial Services Commission (VFSC)</strong> under
            licence <strong>40213</strong>. Its registered address is{" "}
            <strong>1st Floor, B&P House, Kumul Highway, Port Vila, Vanuatu</strong>.
          </p>
          <p>
            <strong>Royal Markets B.V.</strong> operates as a securities intermediary in the{" "}
            <strong>Netherlands</strong>, company number <strong>87654321</strong>, and holds
            authorisation from the{" "}
            <strong>Netherlands Authority for the Financial Markets (AFM)</strong> under licence{" "}
            <strong>120487</strong>. Its registered address is{" "}
            <strong>Keizersgracht 241, 1016 EA Amsterdam, Netherlands</strong>.
          </p>
          <p>
            <strong>Royal Markets (Intl) Ltd</strong> is approved by the{" "}
            <strong>Financial Services Commission (FSC) of Mauritius</strong> with company number{" "}
            <strong>C148209</strong> and an investment business licence, reference{" "}
            <strong>GB22200456</strong>.
          </p>
          <p>Each company listed here is permitted to trade under the Royal Markets name and logo.</p>
          <p className="legal__risk">
            <strong>Risk notice:</strong> Our offering includes leveraged products that are traded
            over the counter rather than on an exchange. Because of leverage, you can lose your
            capital quickly, and these products may not suit every investor. Royal Markets accepts
            no responsibility for losses or damages, in whole or in part, that arise from your
            investment decisions.
          </p>
          <p>
            Services are not available to people living in sanctioned or restricted regions,
            including but not limited to the{" "}
            <strong>
              United States of America (including all U.S. territories), Canada, North Korea,
              Iran, Syria, Cuba, the Crimea region, Sudan, Afghanistan, and any jurisdiction
              identified by the Financial Action Task Force (FATF) as having strategic
              deficiencies
            </strong>.
          </p>
          <p>
            Nothing on this website is investment advice, a personal recommendation or an offer to
            buy or sell. Any action you take after visiting the site is your own, voluntary choice.
            The content should not be read as an invitation to enter into, or acquire, any of our
            financial products.
          </p>
          <p>
            Site content may only be reproduced with written consent from Royal Markets. We follow
            the Payment Card Industry Data Security Standard (PCI DSS) and run regular
            vulnerability checks and penetration tests as our business model requires.
          </p>
        </div>
      </section>

      <footer className="foot">
        <Link to="/" className="foot__logo" aria-label="Royal Markets home">
          <img src={logoImg} alt="Royal Markets" />
        </Link>
        <nav className="foot__nav" aria-label="Footer">
          <Link to="/markets">Markets</Link>
          <Link to="/trade">Spot trading</Link>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Register</Link>
        </nav>
        <span className="foot__copy">&copy; {new Date().getFullYear()} Royal Markets. All rights reserved.</span>
      </footer>
    </div>
  )
}
