import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft, ShieldCheck, Trophy, Info, X } from 'lucide-react'
import { supabase } from './supabase'
import './toast.css'

const ICONS = {
  ok: CheckCircle2,
  err: AlertCircle,
  info: Info,
  deposit: ArrowUpRight,
  withdrawal: ArrowDownLeft,
  security: ShieldCheck,
  win: Trophy,
  loss: AlertCircle,
}

/* ---------- tiny store ---------- */
let items = []
let seq = 0
const subs = new Set()
const emit = () => subs.forEach((f) => f(items))

export function dismissToast(id) {
  items = items.filter((i) => i.id !== id)
  emit()
}

export function toast({ type = 'info', title, text, duration = 6000 }) {
  const id = ++seq
  items = [{ id, type, title, text }, ...items].slice(0, 4)
  emit()
  if (duration) setTimeout(() => dismissToast(id), duration)
  return id
}

/* ---------- the popup itself (mounts itself, no provider needed) ---------- */
function Toaster() {
  const [list, setList] = useState(items)
  useEffect(() => {
    subs.add(setList)
    setList(items)
    return () => subs.delete(setList)
  }, [])
  if (!list.length) return null
  return (
    <div className="rmt" aria-live="polite">
      {list.map((t) => {
        const Icon = ICONS[t.type] || Info
        return (
          <div key={t.id} className={`rmt__item rmt__item--${t.type}`} role="alert">
            <Icon size={22} className="rmt__ic" />
            <div className="rmt__body">
              {t.title && <strong>{t.title}</strong>}
              {t.text && <p>{t.text}</p>}
            </div>
            <button type="button" className="rmt__x" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

if (typeof document !== 'undefined' && !document.getElementById('rm-toast-root')) {
  const el = document.createElement('div')
  el.id = 'rm-toast-root'
  document.body.appendChild(el)
  createRoot(el).render(<Toaster />)
}

/* ---------- live popups for the signed-in user ---------- */
const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const seen = new Set()
const once = (key) => (seen.has(key) ? false : (seen.add(key), true))

let channel = null
let currentUid = null

function stopListening() {
  if (channel) supabase.removeChannel(channel)
  channel = null
}

function listen(uid) {
  if (uid === currentUid) return
  stopListening()
  currentUid = uid
  if (!uid) return
  const filter = `user_id=eq.${uid}`

  channel = supabase
    .channel(`popups-${uid}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'withdrawals', filter }, ({ new: r }) => {
      if (['completed', 'approved'].includes(r.status) && once(`w${r.id}ok`)) {
        toast({ type: 'withdrawal', title: 'Withdrawal confirmed', text: `${money(r.amount)} ${r.coin || ''} has been sent to your wallet.` })
      } else if (['rejected', 'failed'].includes(r.status) && once(`w${r.id}no`)) {
        toast({ type: 'err', title: 'Withdrawal rejected', text: 'Your balance was not changed. Contact support if you need help.' })
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deposits', filter }, ({ new: r }) => {
      if (r.status === 'completed' && once(`d${r.id}ok`)) {
        toast({ type: 'deposit', title: 'Deposit confirmed', text: `${money(r.usd_amount)} was added to your balance.` })
      } else if (r.status === 'failed' && once(`d${r.id}no`)) {
        toast({ type: 'err', title: 'Deposit failed', text: 'This deposit could not be confirmed. Start a new one.' })
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'kyc_verifications', filter }, ({ new: r }) => {
      if (r.status === 'approved' && once(`k${r.id}ok`)) {
        toast({ type: 'security', title: 'Verification approved', text: 'Your ID and face verification is complete.' })
      } else if (r.status === 'rejected' && once(`k${r.id}no`)) {
        toast({ type: 'err', title: 'Verification rejected', text: r.rejection_reason || 'Please upload clearer photos and try again.' })
      }
    })
    .subscribe()
}

supabase.auth.getSession().then(({ data }) => listen(data.session?.user?.id ?? null))
supabase.auth.onAuthStateChange((_e, session) => listen(session?.user?.id ?? null))
