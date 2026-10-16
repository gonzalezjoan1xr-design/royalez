import { MessageSquare } from 'lucide-react'
import './ChatButton.css'
export default function ChatButton() {
  return (
    <a className="chat-btn" href="mailto:support@royalmarkets.com" aria-label="Contact support">
      <MessageSquare size={30} />
    </a>
  )
}
