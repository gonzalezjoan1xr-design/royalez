import { useState, useEffect, useCallback } from 'react'
import { Bell, ArrowUpRight, ArrowDownLeft, ShieldCheck, CheckCheck, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './Notifications.css'

const ICONS = {
  deposit: ArrowUpRight,
  withdrawal: ArrowDownLeft,
  security: ShieldCheck,
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'Just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function Notifications() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user?.id) return
    const { data, error: err } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (err) setError(err.message)
    else {
      setError('')
      setItems(data || [])
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    load()
    if (!user?.id) return
    const channel = supabase
      .channel(`notifications-page-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        load
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, load])

  const unread = items.filter((n) => !n.read).length

  const markRead = async (n) => {
    if (n.read) return
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
  }

  const markAllRead = async () => {
    setItems((list) => list.map((x) => ({ ...x, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  }

  const remove = async (e, n) => {
    e.stopPropagation()
    setItems((list) => list.filter((x) => x.id !== n.id))
    await supabase.from('notifications').delete().eq('id', n.id)
  }

  return (
    <div className="notifs">
      <header className="notifs__head">
        <div>
          <h1>Notifications</h1>
          <p>{unread > 0 ? `${unread} unread` : 'You are all caught up'}</p>
        </div>
        <button className="notifs__readall" type="button" onClick={markAllRead} disabled={unread === 0}>
          <CheckCheck size={16} strokeWidth={1.8} /> Mark all read
        </button>
      </header>

      {loading && <div className="notifs__state">Loading…</div>}
      {error && <div className="notifs__state notifs__state--err">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="notifs__empty">
          <Bell size={32} strokeWidth={1.5} />
          <h2>No notifications yet</h2>
          <p>Deposits, withdrawals and account alerts will show up here.</p>
        </div>
      )}

      <ul className="notifs__list">
        {items.map((n) => {
          const Icon = ICONS[n.type] || Bell
          return (
            <li key={n.id}>
              <div
                className={`notifs__item ${n.read ? '' : 'is-unread'}`}
                onClick={() => markRead(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && markRead(n)}
              >
                <span className={`notifs__icon notifs__icon--${n.type}`}>
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <div className="notifs__body">
                  <h3>{n.title}</h3>
                  {n.body && <p>{n.body}</p>}
                  <time dateTime={n.created_at}>{timeAgo(n.created_at)}</time>
                </div>
                <button
                  className="notifs__delete"
                  type="button"
                  onClick={(e) => remove(e, n)}
                  aria-label="Delete notification"
                >
                  <Trash2 size={16} strokeWidth={1.8} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
