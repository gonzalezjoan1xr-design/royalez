import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronDown, Menu, ThumbsUp, Paperclip, Smile } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './ChatButton.css'

const SUPPORT_EMAIL = 'support@royalmarkets.com'
const QUICK_REPLIES = ['I have a question', 'Tell me more']

const BubbleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M12 2.5c-5.2 0-9.5 3.6-9.5 8.1 0 2.3 1.1 4.4 3 5.9-.1 1.2-.6 2.5-1.6 3.6a.5.5 0 0 0 .4.8c2.2-.1 4-.9 5.2-1.8.8.2 1.6.3 2.5.3 5.2 0 9.5-3.6 9.5-8.1S17.200 2.500 12 2.500z" />
    <path d="M8.500 11c.8 1.400 2 2.100 3.500 2.100s2.700-.7 3.500-2.100" fill="none" stroke="var(--green)" strokeWidth="1.600" strokeLinecap="round" />
  </svg>
)

const Avatar = () => (
  <span className="cb-avatar" aria-hidden="true">
    <svg viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="20" fill="#eef2f0" />
      <circle cx="20" cy="16" r="6.500" fill="#d9a88a" />
      <path d="M13.500 15c0-4 2.800-6.500 6.500-6.500s6.500 2.500 6.500 6.500c-1.500-2-3.500-3-6.500-3s-5 1-6.500 3z" fill="#4a3426" />
      <path d="M8 38c0-6.500 5-10.500 12-10.500S32 31.500 32 38z" fill="#fff" stroke="#dfe6e2" />
    </svg>
  </span>
)

const AgentBubble = ({ children }) => (
  <div className="cb-row">
    <Avatar />
    <div className="cb-col">
      <span className="cb-name">Customer Support</span>
      <div className="cb-bubble cb-bubble--agent">{children}</div>
    </div>
  </div>
)

export default function ChatButton() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [unread, setUnread] = useState(1)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const [guestNote, setGuestNote] = useState(false)
  const bodyRef = useRef(null)
  const openRef = useRef(false)

  useEffect(() => { openRef.current = open }, [open])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, open, guestNote])

  // load history and receive support replies live
  useEffect(() => {
    if (!user?.id) { setMessages([]); return }
    let live = true
    supabase.from('support_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
      .then(({ data }) => { if (live) setMessages(data || []) })
    const channel = supabase
      .channel(`support-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${user.id}` }, (p) => {
        setMessages((m) => (m.some((x) => x.id === p.new.id) ? m : [...m, p.new]))
        if (p.new.sender === 'admin' && !openRef.current) setUnread((u) => u + 1)
      })
      .subscribe()
    return () => { live = false; supabase.removeChannel(channel) }
  }, [user?.id])

  const toggle = () => {
    setOpen((o) => !o)
    setMenu(false)
    setUnread(0)
  }

  const send = async (value) => {
    const body = value.trim()
    if (!body) return
    if (!user) { setGuestNote(true); setText(''); return }
    setText('')
    const { data, error } = await supabase
      .from('support_messages')
      .insert({ user_id: user.id, sender: 'user', body })
      .select()
      .single()
    if (error) { setText(body); return }
    setMessages((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]))
  }

  return (
    <>
      {open && (
        <section className="cb-panel" role="dialog" aria-label="Customer Support">
          <header className="cb-head">
            <button type="button" className="cb-head__btn" onClick={toggle} aria-label="Close chat">
              <ChevronLeft size={22} />
            </button>
            <h2 className="cb-head__title">Customer Support</h2>
            <button type="button" className="cb-head__btn" onClick={() => setMenu((v) => !v)} aria-label="Menu">
              <Menu size={22} />
            </button>
            {menu && (
              <div className="cb-menu">
                <a href={`mailto:${SUPPORT_EMAIL}`}>Email support</a>
              </div>
            )}
          </header>

          <div className="cb-body" ref={bodyRef}>
            <div className="cb-spacer" />
            <AgentBubble>👋 Hi! How can we help?</AgentBubble>

            {messages.length === 0 && !guestNote && (
              <div className="cb-quick">
                {QUICK_REPLIES.map((q) => (
                  <button key={q} type="button" className="cb-quick__btn" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) =>
              m.sender === 'user' ? (
                <div key={m.id} className="cb-me">
                  <div className="cb-bubble cb-bubble--me">{m.body}</div>
                </div>
              ) : (
                <AgentBubble key={m.id}>{m.body}</AgentBubble>
              )
            )}

            {guestNote && <AgentBubble>Please log in to chat with support.</AgentBubble>}
          </div>

          <footer className="cb-foot">
            <input
              className="cb-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(text) }}
              placeholder="Type here and press enter.."
              aria-label="Message"
            />
            <button type="button" className="cb-foot__icon" aria-label="Like"><ThumbsUp size={20} /></button>
            <a className="cb-foot__icon" href={`mailto:${SUPPORT_EMAIL}`} aria-label="Attach a file by email"><Paperclip size={20} /></a>
            <button type="button" className="cb-foot__icon" aria-label="Emoji" onClick={() => setText((t) => t + '🙂')}>
              <Smile size={20} />
            </button>
          </footer>
        </section>
      )}

      <button type="button" className="chat-btn" onClick={toggle} aria-label={open ? 'Close support chat' : 'Open support chat'}>
        {open ? <ChevronDown size={34} color="#fff" strokeWidth={2.400} /> : <BubbleIcon />}
        {!open && unread > 0 && <span className="chat-btn__badge">{unread}</span>}
      </button>
    </>
  )
}
