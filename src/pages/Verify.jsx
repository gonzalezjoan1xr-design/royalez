import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Camera, FileText, Upload, Check, Clock, AlertTriangle, RotateCcw, ArrowLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useKyc, KYC_WITHDRAW_THRESHOLD } from '../lib/kyc'
import './Verify.css'

const ID_TYPES = [
  { id: 'national_id', label: 'National ID', back: true },
  { id: 'passport', label: 'Passport', back: false },
  { id: 'drivers_license', label: "Driver's license", back: true },
]

const MAX_MB = 8
const STEPS = ['ID document', 'Face check', 'Review']

const INTRO = [
  { icon: '🪪', title: 'Government-issued ID', text: "Passport, national ID, or driver's license" },
  { icon: '🤳', title: 'Live selfie', text: 'A photo of your face taken in real time' },
  { icon: '⏱️', title: 'Quick process', text: 'Takes less than 2 minutes to complete' },
]

function usePreview(file) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!file) {
      setUrl('')
      return
    }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

/* Full-screen black shell with the top bar, shared by every state */
function Shell({ onBack, children }) {
  return (
    <div className="kyc">
      <header className="kyc__bar">
        <button type="button" className="kyc__back" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={20} strokeWidth={1.8} />
        </button>
        <span className="kyc__bar-title">Identity Verification</span>
      </header>
      <main className="kyc__main">{children}</main>
    </div>
  )
}

function FileDrop({ label, hint, file, onPick }) {
  const preview = usePreview(file)
  const inputRef = useRef(null)
  return (
    <div className="kyc-drop">
      <span className="kyc-drop__label">{label}</span>
      <button
        type="button"
        className={`kyc-drop__box ${preview ? 'has-img' : ''}`}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt={label} />
        ) : (
          <span className="kyc-drop__empty">
            <Upload size={22} strokeWidth={1.7} />
            <b>Tap to upload</b>
            <small>{hint}</small>
          </span>
        )}
      </button>
      {preview && (
        <button type="button" className="kyc-link" onClick={() => inputRef.current?.click()}>
          Replace photo
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) onPick(f)
        }}
      />
    </div>
  )
}

export default function Verify() {
  const { user } = useAuth()
  const { record, status, loading, refresh } = useKyc()
  const location = useLocation()
  const nav = useNavigate()
  const fromWithdraw = location.state?.reason === 'withdraw'

  const [started, setStarted] = useState(false) // false = intro screen
  const [step, setStep] = useState(1)
  const [idType, setIdType] = useState('national_id')
  const [idFront, setIdFront] = useState(null)
  const [idBack, setIdBack] = useState(null)
  const [selfie, setSelfie] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const typeInfo = ID_TYPES.find((t) => t.id === idType)
  const frontPreview = usePreview(idFront)
  const backPreview = usePreview(idBack)
  const selfiePreview = usePreview(selfie)

  // Keep the whole viewport pure black while this page is open
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = [html.style.background, body.style.background]
    html.style.background = '#000'
    body.style.background = '#000'
    return () => {
      html.style.background = prev[0]
      body.style.background = prev[1]
    }
  }, [])

  /* ---------- camera ---------- */
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cam, setCam] = useState('idle') // idle | starting | live | error
  const selfieInputRef = useRef(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCam('idle')
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCam('error')
      return
    }
    setCam('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setCam('live')
    } catch {
      setCam('error')
    }
  }, [])

  const canShowWizard = status === 'none' || status === 'rejected'

  useEffect(() => {
    if (canShowWizard && started && step === 2 && !selfie) startCamera()
    return () => stopCamera()
  }, [canShowWizard, started, step, selfie, startCamera, stopCamera])

  const takePhoto = () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const size = Math.min(v.videoWidth, v.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = 720
    canvas.height = 720
    const ctx = canvas.getContext('2d')
    ctx.drawImage(v, (v.videoWidth - size) / 2, (v.videoHeight - size) / 2, size, size, 0, 0, 720, 720)
    canvas.toBlob(
      (blob) => {
        if (blob) setSelfie(new File([blob], 'face.jpg', { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.9
    )
  }

  /* ---------- helpers ---------- */
  const pickImage = (setter) => (file) => {
    setError('')
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Each photo must be under ${MAX_MB} MB.`)
    setter(file)
  }

  const changeType = (id) => {
    setIdType(id)
    if (!ID_TYPES.find((t) => t.id === id).back) setIdBack(null)
  }

  const step1Ready = Boolean(idFront) && (!typeInfo.back || Boolean(idBack))

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const base = `${user.id}/${Date.now()}`
      const upload = async (file, name) => {
        const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
        const path = `${base}-${name}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('kyc')
          .upload(path, file, { contentType: file.type, upsert: false })
        if (upErr) throw upErr
        return path
      }
      const frontPath = await upload(idFront, 'id-front')
      const backPath = typeInfo.back && idBack ? await upload(idBack, 'id-back') : null
      const facePath = await upload(selfie, 'face')

      const { error: insErr } = await supabase.from('kyc_verifications').insert({
        user_id: user.id,
        id_type: idType,
        id_front_path: frontPath,
        id_back_path: backPath,
        selfie_path: facePath,
        status: 'pending',
      })
      if (insErr) throw insErr
      await refresh()
    } catch (e) {
      setError(e?.message || 'Upload failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Back arrow: previous step, then intro, then leave the page
  const goBack = () => {
    setError('')
    if (canShowWizard && started) {
      if (step > 1) setStep(step - 1)
      else setStarted(false)
      return
    }
    nav(-1)
  }

  /* ---------- states ---------- */
  if (loading) {
    return (
      <Shell onBack={() => nav(-1)}>
        <div className="kyc__state">Loading…</div>
      </Shell>
    )
  }

  if (status === 'approved') {
    return (
      <Shell onBack={goBack}>
        <span className="kyc__hero"><ShieldCheck size={28} strokeWidth={1.8} /></span>
        <h1 className="kyc__title">You are verified</h1>
        <p className="kyc__sub">Your ID and face verification is approved. You can withdraw any amount.</p>
        <div className="kyc__actions">
          <Link to="/withdraw" className="kyc-btn">Go to withdraw</Link>
          <Link to="/dashboard" className="kyc-btn kyc-btn--ghost">Dashboard</Link>
        </div>
      </Shell>
    )
  }

  if (status === 'pending') {
    return (
      <Shell onBack={goBack}>
        <span className="kyc__hero kyc__hero--wait"><Clock size={28} strokeWidth={1.8} /></span>
        <h1 className="kyc__title">Verification under review</h1>
        <p className="kyc__sub">
          We received your ID and face photo and are reviewing them. We will send you a notification as
          soon as the review is done.
        </p>
        <div className="kyc__actions">
          <Link to="/notifications" className="kyc-btn kyc-btn--ghost">View notifications</Link>
          <Link to="/dashboard" className="kyc-btn kyc-btn--ghost">Dashboard</Link>
        </div>
      </Shell>
    )
  }

  /* ---------- intro (matches the screenshot) ---------- */
  if (!started) {
    return (
      <Shell onBack={goBack}>
        <span className="kyc__hero" aria-hidden="true">
          <Upload size={28} strokeWidth={1.8} />
        </span>

        <h1 className="kyc__title">Verify Your Identity</h1>
        <p className="kyc__sub">
          Complete a quick identity check to unlock <strong>higher withdrawal limits</strong> and
          gain full access to all platform features.
        </p>

        {fromWithdraw && (
          <div className="kyc__banner kyc__banner--info">
            <ShieldCheck size={18} strokeWidth={1.8} />
            Your withdrawal needs verification first. Complete the steps, then return to Withdraw.
          </div>
        )}
        {status === 'rejected' && (
          <div className="kyc__banner kyc__banner--err">
            <AlertTriangle size={18} strokeWidth={1.8} />
            <span>
              <b>Your last submission was rejected.</b>{' '}
              {record?.rejection_reason || 'Please submit clear photos again.'}
            </span>
          </div>
        )}

        <ul className="kyc__list">
          {INTRO.map((s) => (
            <li key={s.title} className="kyc__item">
              <span className="kyc__emoji" aria-hidden="true">{s.icon}</span>
              <div>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="kyc__privacy">
          <span className="kyc__emoji" aria-hidden="true">🔒</span>
          <p>
            Your documents are <strong>used solely for identity verification</strong> and are
            permanently deleted from our systems once verification is complete. We do not share
            your data with third parties.
          </p>
        </div>

        <button type="button" className="kyc-btn kyc-btn--block" onClick={() => setStarted(true)}>
          Start Verification
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </Shell>
    )
  }

  /* ---------- wizard ---------- */
  return (
    <Shell onBack={goBack}>
      <h1 className="kyc__title kyc__title--sm">Verify your identity</h1>
      <p className="kyc__sub">
        ID document and a live face photo. Required for withdrawals of ${KYC_WITHDRAW_THRESHOLD} or more.
      </p>

      <ol className="kyc__steps">
        {STEPS.map((label, i) => {
          const n = i + 1
          return (
            <li key={label} className={step === n ? 'is-on' : step > n ? 'is-done' : ''}>
              <span>{step > n ? <Check size={14} strokeWidth={2.4} /> : n}</span>
              {label}
            </li>
          )
        })}
      </ol>

      <div className="kyc__card">
        {step === 1 && (
          <>
            <h2><FileText size={18} strokeWidth={1.8} /> Upload your ID</h2>
            <div className="kyc__types">
              {ID_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={t.id === idType ? 'is-on' : ''}
                  onClick={() => changeType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className={`kyc__drops ${typeInfo.back ? '' : 'kyc__drops--one'}`}>
              <FileDrop
                label={typeInfo.back ? 'Front of ID' : 'Photo page'}
                hint="All four corners visible"
                file={idFront}
                onPick={pickImage(setIdFront)}
              />
              {typeInfo.back && (
                <FileDrop label="Back of ID" hint="All four corners visible" file={idBack} onPick={pickImage(setIdBack)} />
              )}
            </div>
            <ul className="kyc__tips">
              <li>Use the original document, not a copy or a screenshot.</li>
              <li>Make sure the text is sharp and there is no glare.</li>
            </ul>
          </>
        )}

        {step === 2 && (
          <>
            <h2><Camera size={18} strokeWidth={1.8} /> Face check</h2>
            <div className="kyc__face">
              {selfiePreview ? (
                <img src={selfiePreview} alt="Your face" className="kyc__face-media" />
              ) : (
                <>
                  <video ref={videoRef} className={`kyc__face-media ${cam === 'live' ? '' : 'is-hidden'}`} playsInline muted autoPlay />
                  {cam !== 'live' && (
                    <div className="kyc__face-state">
                      {cam === 'error' ? (
                        <>
                          <AlertTriangle size={24} strokeWidth={1.7} />
                          <span>We could not open the camera. Allow camera access in your browser, or upload a photo instead.</span>
                        </>
                      ) : (
                        <span>Starting camera…</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="kyc__face-actions">
              {selfiePreview ? (
                <button type="button" className="kyc-btn kyc-btn--ghost" onClick={() => setSelfie(null)}>
                  <RotateCcw size={16} strokeWidth={1.8} /> Retake
                </button>
              ) : (
                <>
                  <button type="button" className="kyc-btn" onClick={takePhoto} disabled={cam !== 'live'}>
                    <Camera size={16} strokeWidth={1.8} /> Take photo
                  </button>
                  <button type="button" className="kyc-btn kyc-btn--ghost" onClick={() => selfieInputRef.current?.click()}>
                    <Upload size={16} strokeWidth={1.8} /> Upload instead
                  </button>
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      e.target.value = ''
                      if (f) pickImage(setSelfie)(f)
                    }}
                  />
                </>
              )}
            </div>
            <ul className="kyc__tips">
              <li>Look straight at the camera in good light.</li>
              <li>Remove sunglasses, hats and masks.</li>
            </ul>
          </>
        )}

        {step === 3 && (
          <>
            <h2><Check size={18} strokeWidth={1.8} /> Review and submit</h2>
            <div className="kyc__review">
              <figure>
                <img src={frontPreview} alt="ID front" />
                <figcaption>{typeInfo.label}{typeInfo.back ? ' (front)' : ''}</figcaption>
              </figure>
              {typeInfo.back && (
                <figure>
                  <img src={backPreview} alt="ID back" />
                  <figcaption>{typeInfo.label} (back)</figcaption>
                </figure>
              )}
              <figure className="kyc__review-face">
                <img src={selfiePreview} alt="Your face" />
                <figcaption>Face photo</figcaption>
              </figure>
            </div>
            <p className="kyc__note">
              Your photos are stored privately and only used to verify your identity.
            </p>
          </>
        )}

        {error && <div className="kyc__banner kyc__banner--err">{error}</div>}

        <div className="kyc__nav">
          {step > 1 ? (
            <button type="button" className="kyc-btn kyc-btn--ghost" onClick={() => setStep(step - 1)} disabled={busy}>
              <ArrowLeft size={16} strokeWidth={1.8} /> Back
            </button>
          ) : (
            <span />
          )}
          {step < 3 && (
            <button
              type="button"
              className="kyc-btn"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !step1Ready : !selfie}
            >
              Continue
            </button>
          )}
          {step === 3 && (
            <button type="button" className="kyc-btn" onClick={submit} disabled={busy}>
              {busy ? 'Uploading…' : 'Submit for review'}
            </button>
          )}
        </div>
      </div>
    </Shell>
  )
}
