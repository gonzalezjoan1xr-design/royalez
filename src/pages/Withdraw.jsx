import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase' // adjust if your client lives elsewhere
import './Funds.css'

const NETWORKS = { USDT: ['TRC20', 'ERC20'], BTC: ['Bitcoin'], ETH: ['ERC20'] }

export default function Withdraw() {
  const { user, profile } = useAuth()
  const balance = Number(profile?.balance || 0)

  const [coin, setCoin] = useState('USDT')
  const [network, setNetwork] = useState('TRC20')
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { type: 'ok' | 'err', text }

  const changeCoin = (c) => {
    setCoin(c)
    setNetwork(NETWORKS[c][0])
  }

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    const amt = Number(amount)

    if (!address.trim()) return setMsg({ type: 'err', text: 'Enter a destination address.' })
    if (!(amt > 0)) return setMsg({ type: 'err', text: 'Enter a valid amount.' })
    if (amt > balance) return setMsg({ type: 'err', text: 'Amount exceeds your available balance.' })

    setBusy(true)
    const { error } = await supabase.from('withdrawals').insert({
      user_id: user.id,
      coin,
      network,
      address: address.trim(),
      amount: amt,
      status: 'pending',
    })
    setBusy(false)

    if (error) return setMsg({ type: 'err', text: error.message })
    setAmount('')
    setAddress('')
    setMsg({ type: 'ok', text: 'Withdrawal request submitted. It will be reviewed and processed shortly.' })
  }

  return (
    <div className="funds">
      <h1 className="funds__title">Withdraw</h1>
      <p className="funds__sub">Available balance: <b className="funds__mono">${balance.toFixed(2)}</b></p>

      <form className="funds__card" onSubmit={submit}>
        <label className="funds__label">Asset</label>
        <div className="funds__chips">
          {Object.keys(NETWORKS).map((c) => (
            <button key={c} type="button" className={`funds__chip ${c === coin ? 'is-on' : ''}`} onClick={() => changeCoin(c)}>
              {c}
            </button>
          ))}
        </div>

        <label className="funds__label">Network</label>
        <div className="funds__chips">
          {NETWORKS[coin].map((n) => (
            <button key={n} type="button" className={`funds__chip ${n === network ? 'is-on' : ''}`} onClick={() => setNetwork(n)}>
              {n}
            </button>
          ))}
        </div>

        <label className="funds__label" htmlFor="wd-address">Destination address</label>
        <input id="wd-address" className="funds__field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Paste wallet address" />

        <label className="funds__label" htmlFor="wd-amount">Amount (USD)</label>
        <div className="funds__row">
          <input
            id="wd-amount" className="funds__field funds__mono" type="number" min="0" step="any"
            value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
          />
          <button type="button" className="funds__max" onClick={() => setAmount(balance.toFixed(2))}>Max</button>
        </div>

        {msg && <div className={`funds__msg funds__msg--${msg.type}`}>{msg.text}</div>}

        <button className="funds__submit" type="submit" disabled={busy}>
          {busy ? 'Submitting…' : 'Request withdrawal'}
        </button>
      </form>
    </div>
  )
}
