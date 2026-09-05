import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { CONTACTS, waLink, mailtoLink, paypalUnlockLink } from './contacts'

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
  const [payClicked, setPayClicked] = useState(false)
  const [receipt, setReceipt] = useState('')
  const [receiptError, setReceiptError] = useState(false)

  // Manual confirm after PayPal redirect (real mode): customer must supply
  // their PayPal transaction ID or payment email so we can reconcile in the
  // PayPal dashboard. Grant unlock only after a non-empty value.
  const confirmPaid = useCallback(() => {
    if (!receipt.trim()) {
      setReceiptError(true)
      return
    }
    setReceiptError(false)
    setUnlocked(true)
    setJustUnlocked(true)
    setPayClicked(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch { /* ignore */ }
  }, [receipt])

  const requestUnlock = useCallback(() => {
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setJustUnlocked(false)
  }, [])

  // $1 unlock link (PayPal). When set, button renders as a real <a> so the browser
  // opens it natively (no popup blocker / no blank tab). Falls back to demo otherwise.
  const payLink = paypalUnlockLink()

  const handlePayClick = useCallback(() => {
    if (paypalUnlockLink()) {
      // 真实收款：a标签已负责打开；这里仅切换提示状态
      setPayClicked(true)
      return
    }
    // 演示模式
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
                {receipt.trim() && (
                  <div className="mt-3 bg-white border border-green-200 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-2">
                      🧾 {t.unlock.receiptField}: <b className="text-gray-800 break-all">{receipt.trim()}</b>
                    </p>
                    <p className="text-xs text-gray-500 mb-2">{t.unlock.proofHint}</p>
                    <div className="flex gap-2">
                      <a
                        href={waLink(`${t.unlock.proofMsg}\n${t.unlock.receiptField}: ${receipt.trim()}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        💬 {t.unlock.proofWa}
                      </a>
                      <a
                        href={mailtoLink(t.unlock.proofMailSub, `${t.unlock.proofMsg}\n${t.unlock.receiptField}: ${receipt.trim()}`)}
                        className="flex-1 text-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                      >
                        ✉️ {t.unlock.proofMail}
                      </a>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">{t.unlock.successNote}</p>
              </div>
            ) : payClicked ? (
              /* PayPal 已打开：要求填写交易号/付款邮箱后才能解锁 */
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3 text-start">
                  <p className="text-blue-800 font-semibold mb-1 text-sm">💳 {t.unlock.payOpenTitle}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{t.unlock.payOpenHint}</p>
                </div>
                <div className="text-start mb-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t.unlock.receiptField}</label>
                  <input
                    type="text"
                    value={receipt}
                    onChange={(e) => { setReceipt(e.target.value); if (e.target.value.trim()) setReceiptError(false) }}
                    placeholder={t.unlock.receiptPh}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm text-gray-800 outline-none transition-colors ${receiptError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-green-400'}`}
                  />
                  {receiptError && (
                    <p className="text-xs text-red-500 mt-1">⚠️ {t.unlock.receiptReq}</p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">{t.unlock.receiptHelp}</p>
                </div>
                <button
                  onClick={confirmPaid}
                  className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl mb-2 transition-colors"
                >
                  ✅ {t.unlock.payDoneBtn}
                </button>
                <button
                  onClick={() => { setPayClicked(false); closeModal() }}
                  className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600"
                >
                  {t.unlock.later}
                </button>
              </>
            ) : (
              <>
                {payLink ? (
                  /* 真实收款：用 <a> 原生新标签打开 PayPal，避免弹窗拦截/空白页 */
                  <a
                    href={payLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handlePayClick}
                    className="block w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl mb-2 text-center transition-colors"
                  >
                    💳 {t.unlock.payBtn}
                  </a>
                ) : (
                  <button
                    onClick={handlePayClick}
                    disabled={paying}
                    className="w-full py-3.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold rounded-2xl mb-2 transition-colors"
                  >
                    {paying ? t.unlock.paying : `💳 ${t.unlock.payBtn}`}
                  </button>
                )}
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
