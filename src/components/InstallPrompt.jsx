import { useEffect, useState } from 'react'
import './InstallPrompt.css'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (sessionStorage.getItem('install-dismissed')) return

    if (isIOS()) {
      setIos(true)
      setShow(true)
      return
    }

    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    const onInstalled = () => {
      setShow(false)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('install-dismissed', '1')
    setShow(false)
  }

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="ip-overlay" role="dialog" aria-label="Install Royal Markets">
      <div className="ip-card">
        <img className="ip-icon" src="/pwa-192x192.png" alt="" />
        <div className="ip-text">
          <h3>Install Royal Markets</h3>
          {ios ? (
            <p>
              Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong> for
              quick access.
            </p>
          ) : (
            <p>Get faster access and a full-screen experience.</p>
          )}
        </div>
        <div className="ip-actions">
          {!ios && (
            <button className="ip-install" onClick={install}>
              Install
            </button>
          )}
          <button className="ip-later" onClick={dismiss}>
            {ios ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  )
}
