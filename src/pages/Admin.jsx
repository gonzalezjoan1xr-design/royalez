import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { ShieldCheck, ArrowUpRight, ArrowDownLeft, MessageSquare, Check, X, Send, Eye, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import { useAuth } from '../context/AuthContext'
import './Admin.css'

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const when = (iso) => (iso ? new Date(iso).toLocaleString() : '')
const ID_LABEL = { national_id: 'National ID', passport: 'Passport', drivers_license: "Driver's license" }

// Full-screen layer: sits over the site header and bottom bar, so admin works without them
const SHELL = { position: 'fixed', inset: 0, zIndex: 5000, overflowY: 'auto', background: '#000' }

function Badge({ s }) {
  return <span className={`adm-badge adm-badge--${s}`}>{s}</span>
}

export default function Admin() {
  const { user } = useAuth()
  const [ok, setOk] = useState(null)
  const [tab, setTab] = useState('deposits')
  const [onlyPending, setOnlyPending] = useState(true)
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [kycs, setKycs] = useState([])
  const [messages, setMessages] = useState([])
  const [profiles, setProfiles] = useState({})
  const [busyId, setBusyId] = useState('')
  const [docs, setDocs] = useState(null) // { row, urls }
  const [sel, setSel] = useState('')
  const [reply, setReply] = useState('')
  const threadRef = useRef(null)

  // lock the page behind the admin layer while it is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.rpc('is_admin').then(({ data }) => setOk(data === true))
  }, [user])

  const who = useCallback(
    (id) => {
      const p = profiles[id]
      return p?.email || p?.username || p?.full_name || p?.name || `${String(id).slice(0, 8)}…`
    },
    [profiles]
  )

  const load = useCallback(async () => {
    const [d, w, k, m] = await Promise.all([
      supabase.from('deposits').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('withdrawals').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('kyc_verifications').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('support_messages').select('*').order('created_at', { ascending: true }).limit(2000),
    ])
    const dd = d.data || [], ww = w.data || [], kk = k.data || [], mm = m.data || []
    setDeposits(dd); setWithdrawals(ww); setKycs(kk); setMessages(mm)
    const ids = [...new Set([...dd, ...ww, ...kk, ...mm].map((r) => r.user_id))]
    if (ids.length) {
      const { data } = await supabase.from('profiles').select('*').in('id', ids)
      setProfiles(Object.fromEntries((data || []).map((p) => [p.id, p])))
    }
  }, [])

  useEffect(() => {
    if (!ok) return
    load()
    const ch = supabase.channel(`admin-${Math.random().toString(36).slice(2)}`)
    ;['deposits', 'withdrawals', 'kyc_verifications', 'support_messages'].forEach((table) =>
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, load)
    )
    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [ok, load])

  /* ---------- actions ---------- */
  const run = async (key, fn, okMsg) => {
    setBusyId(key)
    const { error } = await fn()
    setBusyId('')
    if (error) { toast({ type: 'err', title: 'Action failed', text: error.message }); return false }
    toast({ type: 'ok', title: 'Done', text: okMsg })
    load()
    return true
  }

  const confirmDeposit = (d) => {
    if (!window.confirm(`Credit ${money(d.usd_amount)} to ${who(d.user_id)} and mark this deposit completed?`)) return
    run(`d${d.id}`, () => supabase.rpc('admin_confirm_deposit', { p_id: d.id }), 'Deposit confirmed and balance updated')
  }
  const failDeposit = (d) => {
    if (!window.confirm('Mark this deposit as failed?')) return
    run(`d${d.id}`, () => supabase.rpc('admin_fail_deposit', { p_id: d.id }), 'Deposit marked failed')
  }
  const completeWithdrawal = (w) => {
    if (!window.confirm(`Confirm ${money(w.amount)} ${w.coin} withdrawal for ${who(w.user_id)}? Their balance will be reduced by this amount.`)) return
    run(`w${w.id}`, () => supabase.rpc('admin_complete_withdrawal', { p_id: w.id }), 'Withdrawal confirmed and balance reduced')
  }
  const rejectWithdrawal = (w) => {
    if (!window.confirm('Reject this withdrawal? The balance is not changed.')) return
    run(`w${w.id}`, () => supabase.rpc('admin_reject_withdrawal', { p_id: w.id }), 'Withdrawal rejected')
  }
  const approveKyc = async (k) => {
    const done = await run(`k${k.id}`, () => supabase.rpc('admin_review_kyc', { p_id: k.id, p_status: 'approved' }), 'Verification approved')
    if (done) setDocs(null)
  }
  const rejectKyc = async (k) => {
    const reason = window.prompt('Reason shown to the user:', 'The ID photo was blurry. Please upload a clearer one.')
    if (reason === null) return
    const done = await run(`k${k.id}`, () => supabase.rpc('admin_review_kyc', { p_id: k.id, p_status: 'rejected', p_reason: reason.trim() || null }), 'Verification rejected')
    if (done) setDocs(null)
  }

  const openDocs = async (k) => {
    setDocs({ row: k, urls: null })
    const sign = async (p) => (p ? (await supabase.storage.from('kyc').createSignedUrl(p, 300)).data?.signedUrl || null : null)
    const [front, back, face] = await Promise.all([sign(k.id_front_path), sign(k.id_back_path), sign(k.selfie_path)])
    setDocs({ row: k, urls: { front, back, face } })
  }

  /* ---------- chat ---------- */
  const threads = useMemo(() => {
    const map = {}
    messages.forEach((m) => {
      if (!map[m.user_id]) map[m.user_id] = { id: m.user_id, list: [], unread: 0 }
      map[m.user_id].list.push(m)
      if (m.sender === 'user' && !m.read) map[m.user_id].unread += 1
    })
    return Object.values(map).sort(
      (a, b) => new Date(b.list[b.list.length - 1].created_at) - new Date(a.list[a.list.length - 1].created_at)
    )
  }, [messages])

  const thread = threads.find((t) => t.id === sel)
  const chatUnread = threads.reduce((n, t) => n + t.unread, 0)

  useEffect(() => {
    if (tab === 'chat' && !sel && threads.length) setSel(threads[0].id)
  }, [tab, sel, threads])

  useEffect(() => {
    if (tab !== 'chat' || !sel) return
    if (messages.some((m) => m.user_id === sel && m.sender === 'user' && !m.read)) {
      supabase.from('support_messages').update({ read: true }).eq('user_id', sel).eq('sender', 'user').eq('read', false).then(() => {})
    }
  }, [tab, sel, messages])

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [thread?.list.length, sel, tab])

  const sendReply = async (e) => {
    e.preventDefault()
    const body = reply.trim()
    if (!body || !sel) return
    setReply('')
    const { error } = await supabase.from('support_messages').insert({ user_id: sel, sender: 'admin', body })
    if (error) { setReply(body); toast({ type: 'err', title: 'Message not sent', text: error.message }) } else load()
  }

  /* ---------- render ---------- */
  if (ok === null) return <div style={SHELL}><div className="adm"><p className="adm-empty">Checking access…</p></div></div>
  if (!ok) return <Navigate to="/dashboard" replace />

  const vis = (rows) => (onlyPending ? rows.filter((r) => r.status === 'pending') : rows)
  const pend = (rows) => rows.filter((r) => r.status === 'pending').length

  const TABS = [
    { id: 'deposits', label: 'Deposits', icon: ArrowUpRight, n: pend(deposits) },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownLeft, n: pend(withdrawals) },
    { id: 'kyc', label: 'Verifications', icon: ShieldCheck, n: pend(kycs) },
    { id: 'chat', label: 'Chat', icon: MessageSquare, n: chatUnread },
  ]

  return (
    <div style={SHELL}>
      <div className="adm">
        <header className="adm__head">
          <span className="adm__tile"><ShieldCheck size={24} /></span>
          <div style={{ flex: 1 }}>
            <h1>Admin Panel</h1>
            <p>Confirm deposits and withdrawals, review verifications, and answer chats</p>
          </div>
          <Link to="/dashboard" className="adm-btn"><ArrowLeft size={15} /> Dashboard</Link>
        </header>

        <nav className="adm__tabs">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={tab === t.id ? 'is-on' : ''} onClick={() => setTab(t.id)}>
              <t.icon size={17} /> {t.label}
              {t.n > 0 && <span className="adm__count">{t.n}</span>}
            </button>
          ))}
        </nav>

        {tab !== 'chat' && (
          <div className="adm__filter">
            <button type="button" className={onlyPending ? 'is-on' : ''} onClick={() => setOnlyPending(true)}>Pending</button>
            <button type="button" className={!onlyPending ? 'is-on' : ''} onClick={() => setOnlyPending(false)}>All</button>
          </div>
        )}

        {tab === 'deposits' && (
          <div className="adm__card">
            {vis(deposits).length === 0 ? <p className="adm-empty">No deposits here.</p> : (
              <div className="adm__scroll">
                <table className="adm__table">
                  <thead><tr><th>User</th><th>USD</th><th>Crypto</th><th>Network</th><th>Date</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {vis(deposits).map((d) => (
                      <tr key={d.id}>
                        <td>{who(d.user_id)}</td>
                        <td><b>{money(d.usd_amount)}</b></td>
                        <td>{d.crypto_amount} {d.symbol}</td>
                        <td>{d.network}</td>
                        <td>{when(d.created_at)}</td>
                        <td>
                          <Badge s={d.status} />
                          {d.status === 'pending' && new Date(d.expires_at) < new Date() && <small className="adm__hold"> past hold time</small>}
                        </td>
                        <td className="adm__acts">
                          {d.status === 'pending' && (
                            <>
                              <button type="button" className="adm-btn adm-btn--ok" disabled={busyId === `d${d.id}`} onClick={() => confirmDeposit(d)}><Check size={15} /> Confirm</button>
                              <button type="button" className="adm-btn adm-btn--no" disabled={busyId === `d${d.id}`} onClick={() => failDeposit(d)}><X size={15} /> Fail</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'withdrawals' && (
          <div className="adm__card">
            {vis(withdrawals).length === 0 ? <p className="adm-empty">No withdrawals here.</p> : (
              <div className="adm__scroll">
                <table className="adm__table">
                  <thead><tr><th>User</th><th>Amount</th><th>Coin / network</th><th>Address</th><th>User balance</th><th>Date</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {vis(withdrawals).map((w) => (
                      <tr key={w.id}>
                        <td>{who(w.user_id)}</td>
                        <td><b>{money(w.amount)}</b></td>
                        <td>{w.coin} · {w.network}</td>
                        <td><code className="adm__addr">{w.address}</code></td>
                        <td>{money(profiles[w.user_id]?.balance)}</td>
                        <td>{when(w.created_at)}</td>
                        <td><Badge s={w.status} /></td>
                        <td className="adm__acts">
                          {w.status === 'pending' && (
                            <>
                              <button type="button" className="adm-btn adm-btn--ok" disabled={busyId === `w${w.id}`} onClick={() => completeWithdrawal(w)}><Check size={15} /> Confirm</button>
                              <button type="button" className="adm-btn adm-btn--no" disabled={busyId === `w${w.id}`} onClick={() => rejectWithdrawal(w)}><X size={15} /> Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'kyc' && (
          <div className="adm__card">
            {vis(kycs).length === 0 ? <p className="adm-empty">No verifications here.</p> : (
              <div className="adm__scroll">
                <table className="adm__table">
                  <thead><tr><th>User</th><th>ID type</th><th>Submitted</th><th>Status</th><th>Note</th><th /></tr></thead>
                  <tbody>
                    {vis(kycs).map((k) => (
                      <tr key={k.id}>
                        <td>{who(k.user_id)}</td>
                        <td>{ID_LABEL[k.id_type] || k.id_type}</td>
                        <td>{when(k.created_at)}</td>
                        <td><Badge s={k.status} /></td>
                        <td>{k.rejection_reason || ''}</td>
                        <td className="adm__acts">
                          <button type="button" className="adm-btn" onClick={() => openDocs(k)}><Eye size={15} /> View</button>
                          {k.status === 'pending' && (
                            <>
                              <button type="button" className="adm-btn adm-btn--ok" disabled={busyId === `k${k.id}`} onClick={() => approveKyc(k)}><Check size={15} /> Approve</button>
                              <button type="button" className="adm-btn adm-btn--no" disabled={busyId === `k${k.id}`} onClick={() => rejectKyc(k)}><X size={15} /> Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'chat' && (
          <div className="adm__chat">
            <aside className="adm__threads">
              {threads.length === 0 && <p className="adm-empty">No conversations yet.</p>}
              {threads.map((t) => {
                const last = t.list[t.list.length - 1]
                return (
                  <button key={t.id} type="button" className={`adm__thread ${t.id === sel ? 'is-on' : ''}`} onClick={() => setSel(t.id)}>
                    <span className="adm__thread-top">
                      <b>{who(t.id)}</b>
                      {t.unread > 0 && <span className="adm__count">{t.unread}</span>}
                    </span>
                    <small>{last.body}</small>
                  </button>
                )
              })}
            </aside>

            <section className="adm__conv">
              {!thread ? <p className="adm-empty">Select a conversation.</p> : (
                <>
                  <div className="adm__conv-head">{who(thread.id)} <small>{profiles[thread.id]?.balance != null ? `· balance ${money(profiles[thread.id].balance)}` : ''}</small></div>
                  <div className="adm__msgs" ref={threadRef}>
                    {thread.list.map((m) => (
                      <div key={m.id} className={`adm__msg adm__msg--${m.sender}`}>
                        <div>{m.body}</div>
                        <small>{when(m.created_at)}</small>
                      </div>
                    ))}
                  </div>
                  <form className="adm__reply" onSubmit={sendReply}>
                    <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…" aria-label="Reply" />
                    <button type="submit" className="adm-btn adm-btn--ok" disabled={!reply.trim()}><Send size={15} /> Send</button>
                  </form>
                </>
              )}
            </section>
          </div>
        )}

        {docs && (
          <div className="adm__modal" onClick={() => setDocs(null)}>
            <div className="adm__modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="adm__modal-head">
                <h2>{who(docs.row.user_id)} · {ID_LABEL[docs.row.id_type] || docs.row.id_type}</h2>
                <button type="button" className="adm__x" onClick={() => setDocs(null)} aria-label="Close"><X size={20} /></button>
              </div>
              {!docs.urls ? <p className="adm-empty">Loading photos…</p> : (
                <div className="adm__photos">
                  {[['ID front', docs.urls.front], ['ID back', docs.urls.back], ['Face photo', docs.urls.face]].map(([label, url]) =>
                    url ? (
                      <figure key={label}>
                        <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={label} /></a>
                        <figcaption>{label}</figcaption>
                      </figure>
                    ) : null
                  )}
                </div>
              )}
              {docs.row.status === 'pending' && (
                <div className="adm__modal-acts">
                  <button type="button" className="adm-btn adm-btn--no" disabled={busyId === `k${docs.row.id}`} onClick={() => rejectKyc(docs.row)}><X size={15} /> Reject</button>
                  <button type="button" className="adm-btn adm-btn--ok" disabled={busyId === `k${docs.row.id}`} onClick={() => approveKyc(docs.row)}><Check size={15} /> Approve</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
