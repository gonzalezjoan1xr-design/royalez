import { useEffect, useState } from 'react'

export const COINS = {
  BTC: 'Bitcoin', ETH: 'Ethereum', XRP: 'XRP', SOL: 'Solana', BNB: 'BNB', ADA: 'Cardano',
  AVAX: 'Avalanche', LTC: 'Litecoin', DOGE: 'Dogecoin', PEPE: 'Pepe', FET: 'Fetch.ai', SEI: 'Sei',
}
export const coinIcon = (s) => `https://assets.coincap.io/assets/icons/${s.toLowerCase()}@2x.png`

const FALLBACK = Object.keys(COINS).map((s, i) => ({
  symbol: s,
  price: [97000, 3400, 2.3, 180, 650, 0.95, 42, 108, 0.32, 0.000018, 2.1, 0.48][i],
  change: 0, volume: 0,
}))

export default function useTickers() {
  const [tickers, setTickers] = useState(FALLBACK)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const syms = Object.keys(COINS).map((s) => `"${s}USDT"`).join(',')
        const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${syms}]`)
        const d = await r.json()
        if (stop || !Array.isArray(d)) return
        setTickers(d.map((t) => ({
          symbol: t.symbol.replace('USDT', ''),
          price: +t.lastPrice, change: +t.priceChangePercent, volume: +t.quoteVolume,
        })))
        setLive(true)
      } catch { /* keep fallback */ }
    }
    load()
    const id = setInterval(load, 10000)
    return () => { stop = true; clearInterval(id) }
  }, [])

  return { tickers, live }
}

export const fmtPrice = (p) =>
  p >= 1 ? p.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '$' + p.toFixed(p < 0.001 ? 8 : 4)
export const fmtBig = (n) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${n.toFixed(0)}`
