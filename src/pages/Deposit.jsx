import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import './Funds.css'

// Replace these with your real wallet addresses (or load per-user ones from your
// `deposit_addresses` table).
const COINS = {
  USDT: { network: 'TRC20', address: 'YOUR_USDT_TRC20_ADDRESS', min: 10 },
  BTC: { network: 'Bitcoin', address: 'YOUR_BTC_ADDRESS', min: 0.0005 },
  ETH: { network: 'ERC20', address: 'YOUR_ETH_ADDRESS', min: 0.005 },
}

export default function Deposit() {
  const [coin, setCoin] = useState('USDT')
  const [copied, setCopied] = useState(false)
  const info = COINS[coin]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(info.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="funds">
      <h1 className="funds__title">Deposit</h1>
      <p className="funds__sub">Send crypto to the address below. Funds are credited after network confirmation.</p>

      <div className="funds__card">
        <label className="funds__label">Select asset</label>
        <div className="funds__chips">
          {Object.keys(COINS).map((c) => (
            <button key={c} type="button" className={`funds__chip ${c === coin ? 'is-on' : ''}`} onClick={() => setCoin(c)}>
              {c}
            </button>
          ))}
        </div>

        <label className="funds__label">Network</label>
        <div className="funds__field funds__field--static">{info.network}</div>

        <label className="funds__label">Deposit address</label>
        <div className="funds__address">
          <code>{info.address}</code>
          <button type="button" onClick={copy} aria-label="Copy address">
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        <div className="funds__warn">
          <AlertTriangle size={18} />
          <span>
            Only send {coin} on the {info.network} network. Minimum deposit: {info.min} {coin}.
            Sending other assets or using another network may result in permanent loss.
          </span>
        </div>
      </div>
    </div>
  )
}
