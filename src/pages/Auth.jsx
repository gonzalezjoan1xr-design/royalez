import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, ChevronRight } from 'lucide-react'
import * as kycLib from '../lib/kyc'
import './Verify.css'

// Safe if ../lib/kyc is missing or doesn't export useKyc
const useKyc = kycLib.useKyc || (() => ({ status: 'none' }))

const STEPS = [
  { icon: '🪪', title: 'Government-issued ID', text: "Passport, national ID, or driver's license" },
  { icon: '🤳', title: 'Live selfie', text: 'A photo of your face taken in real time' },
  { icon: '⏱️', title: 'Quick process', text: 'Takes less than 2 minutes to complete' },
]

const STATUS_NOTE = {
  pending: 'Your ID and face verification is under review.',
  approved: 'Identity verified. You can withdraw any amount.',
}

/**
 * onStart: called when the user taps "Start Verification".
 * Defaults to navigating to /verify/start. Change the path to your capture/upload route,
 * or pass your own handler: <Verify onStart={() => ...} />
 */
export default function Verify({ onStart }) {
  const nav = useNavigate()
  const { status } = useKyc() || {}
  const locked = status === 'pending' || status === 'approved'

  const start = () => (onStart ? onStart() : nav('/verify/start'))

  return (
    <div className="verify">
      <header className="verify__bar">
        <button type="button" className="verify__back" onClick={() => nav(-1)} aria-label="Go back">
          <ArrowLeft size={20} strokeWidth={1.8} />
        </button>
        <span className="verify__bar-title">Identity Verification</span>
      </header>

      <main className="verify__main">
        <span className="verify__hero" aria-hidden="true">
          <Upload size={28} strokeWidth={1.8} />
        </span>

        <h1 className="verify__title">Verify Your Identity</h1>
        <p className="verify__sub">
          Complete a quick identity check to unlock <strong>higher withdrawal limits</strong> and
          gain full access to all platform features.
        </p>

        <ul className="verify__steps">
          {STEPS.map((s) => (
            <li key={s.title} className="verify__step">
              <span className="verify__emoji" aria-hidden="true">{s.icon}</span>
              <div>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="verify__privacy">
          <span className="verify__emoji" aria-hidden="true">🔒</span>
          <p>
            Your documents are <strong>used solely for identity verification</strong> and are
            permanently deleted from our systems once verification is complete. We do not share
            your data with third parties.
          </p>
        </div>

        {STATUS_NOTE[status] && <div className="verify__note">{STATUS_NOTE[status]}</div>}

        <button type="button" className="verify__start" onClick={start} disabled={locked}>
          {status === 'approved' ? 'Verified' : status === 'pending' ? 'Under review' : 'Start Verification'}
          {!locked && <ChevronRight size={16} strokeWidth={2} />}
        </button>
      </main>
    </div>
  )
}
