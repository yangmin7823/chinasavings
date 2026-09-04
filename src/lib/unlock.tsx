import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { CONTACTS, waLink, mailtoLink } from './contacts'

const STORAGE_KEY = 'cs_unlocked_v1'

interface UnlockContextValue {
  unlocked: boolean
  /** Open the $1 unlock modal */
  requestUnlock: () => void
  closeModal: () => void
}

const UnlockContext = createContext<UnlockContextValue | null>(null)

function readFlag(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function UnlockProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale()
  const [unlocked, setUnlocked] = useState<boolean>(readFlag)
  const [modalOpen, setModalOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [justUnlocked, setJustUnlocked] = useState(false)

  const requestUnlock = useCallback(() => {
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setJustUnlocked(false)
  }, [])

  // Demo payment: simulate gateway. In production replace with PayPal/万里汇 redirect + webhook.
  const doPay = useCallback(() => {
    setPaying(true)
    window.setTimeout(() => {
      setUnlocked(true)
      setPaying(false)
      setJustUnlocked(true)
      try {
        localStorage.setItem(STORAGE_KEY, '1')
      } catch { /* ignore */ }
    }, 1200)
  }, [])

  const value = useMemo<UnlockContextValue>(
    () => ({ unlocked, requestUnlock, closeModal }),
    [unlocked, requestUnlock, closeModal],
  )

  return (
    <UnlockContext.Provider value={value}>
      {children}

      {/* $1 unlock modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-7 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-2">🔑</div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{t.unlock.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{t.unlock.subtitle}</p>

            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-sm font-bold text-red-600 mb-4">
              {t.unlock.payHighlight}
            </div>

            {justUnlocked ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-3 text-start">
                <p className="text-green-800 font-semibold mb-2 text-sm">✅ {t.unlock.successTitle}</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>💬 {t.contact.wxTitle}: <b>{CONTACTS.wechat}</b></li>
                  <li>🌐 {t.contact.waTitle}: <b>{CONTACTS.whatsappDisplay}</b>（+86）</li>
                  <li>📞 {t.unlock.phoneLabel}: <b>{CONTACTS.phoneCNDisplay}</b></li>
                  <li>✉️ {t.contact.emailTitle}: <b>{CONTACTS.email}</b></li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">{t.unlock.successNote}</p>
              </div>
            ) : (
              <>
                <button
                  onClick={doPay}
                  disabled={paying}
                  className="w-full py-3.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold rounded-2xl mb-2 transition-colors"
                >
                  {paying ? t.unlock.paying : `💳 ${t.unlock.payBtn}`}
                </button>
                <button
                  onClick={closeModal}
                  className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600"
                >
                  {t.unlock.later}
                </button>
                <p className="text-[11px] text-gray-400 mt-1">{t.unlock.securityNote}</p>
              </>
            )}
          </div>
        </div>
      )}
    </UnlockContext.Provider>
  )
}

export function useUnlock(): UnlockContextValue {
  const ctx = useContext(UnlockContext)
  if (!ctx) throw new Error('useUnlock must be used within UnlockProvider')
  return ctx
}

// Convenience: returns real contact link builders ONLY when unlocked.
export function useContactLinks() {
  const { unlocked } = useUnlock()
  const { t } = useLocale()

  if (!unlocked) {
    return {
      unlocked: false as const,
      requestUnlock: null as never,
      link: null as never,
    }
  }

  const intro = `${t.submit.whatsappIntro}\n`
  return {
    unlocked: true as const,
    whatsappDisplay: CONTACTS.whatsappDisplay,
    phoneDisplay: CONTACTS.phoneCNDisplay,
    wechat: CONTACTS.wechat,
    email: CONTACTS.email,
    wa: (text: string) => waLink(intro + text),
    mail: (sub: string, body: string) => mailtoLink(sub, intro + body),
  }
}

// A small UI helper: renders a lock button that requests unlock, or children when unlocked.
export function UnlockOr({ children }: { children: React.ReactNode }) {
  const { unlocked, requestUnlock } = useUnlock()
  const { t } = useLocale()
  if (unlocked) return <>{children}</>
  return (
    <button
      type="button"
      onClick={requestUnlock}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
    >
      🔒 {t.unlock.ctaLabel}
    </button>
  )
}
