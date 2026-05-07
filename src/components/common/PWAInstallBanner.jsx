import React, { useEffect, useState } from 'react'
import { X, Download, Share, Plus } from 'lucide-react'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}
function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
}

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [showIOS, setShowIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return
    if (sessionStorage.getItem('pwa-dismissed')) return

    if (isIOS()) {
      setTimeout(() => setShowIOS(true), 3000)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('pwa-dismissed', '1')
    setDismissed(true)
    setShowIOS(false)
    setPrompt(null)
  }

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
    else dismiss()
  }

  if (dismissed) return null

  // Android/Chrome install banner
  if (prompt) {
    return (
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, width: 'calc(100% - 32px)', maxWidth: 480,
        background: 'var(--bg-card)', border: '1px solid var(--line-2)',
        borderRadius: '1.5rem', padding: '16px 20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', gap: 14,
        animation: 'slideUp 400ms cubic-bezier(.22,1,.36,1) both'
      }}>
        <style>{`@keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
          background: 'var(--brand-soft)', display: 'grid', placeItems: 'center'
        }}>
          <img src="/pwa-192x192.png" alt="AutoLog" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>Встановити AutoLog</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Швидкий доступ з екрану телефону</div>
        </div>
        <button onClick={install} style={{
          padding: '8px 16px', borderRadius: 12, background: 'var(--brand)',
          color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          boxShadow: '0 4px 16px rgba(92,62,254,.35)'
        }}>
          <Download size={14} /> Встановити
        </button>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, flexShrink: 0 }}>
          <X size={18} />
        </button>
      </div>
    )
  }

  // iOS instruction banner
  if (showIOS) {
    return (
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, width: 'calc(100% - 32px)', maxWidth: 480,
        background: 'var(--bg-card)', border: '1px solid var(--line-2)',
        borderRadius: '1.5rem', padding: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 400ms cubic-bezier(.22,1,.36,1) both'
      }}>
        <style>{`@keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
              <img src="/pwa-192x192.png" alt="AutoLog" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>Встановити AutoLog на iPhone</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Два простих кроки</div>
            </div>
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px',
            background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--line-2)'
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--brand-soft)',
              color: 'var(--brand)', display: 'grid', placeItems: 'center', flexShrink: 0
            }}>
              <Share size={15} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>1. Натисніть <span style={{ color: 'var(--brand)' }}>«Поділитись»</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Кнопка внизу екрану Safari</div>
            </div>
          </div>
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px',
            background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--line-2)'
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--brand-soft)',
              color: 'var(--brand)', display: 'grid', placeItems: 'center', flexShrink: 0
            }}>
              <Plus size={15} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>2. Виберіть <span style={{ color: 'var(--brand)' }}>«На екран "Початок"»</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Прокрутіть меню вниз і натисніть «Додати»</div>
            </div>
          </div>
        </div>
        {/* iOS arrow indicator */}
        <div style={{
          marginTop: 12, textAlign: 'center', fontSize: 11, color: 'var(--text-3)', fontWeight: 600
        }}>
          ↓ Кнопка «Поділитись» знаходиться внизу Safari
        </div>
      </div>
    )
  }

  return null
}
