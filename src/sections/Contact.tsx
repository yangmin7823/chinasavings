import { useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useUnlock } from '../lib/unlock'
import { CONTACTS, waLink, mailtoLink } from '../lib/contacts'

export default function Contact() {
  const { t } = useLocale()
  const { unlocked, requestUnlock } = useUnlock()
  const [sent, setSent] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!unlocked) {
      requestUnlock()
      return
    }
    setSent(true)
  }

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.contact.heading}</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t.contact.sub}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {/* Left — channels (locked until $1 unlock) */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              {t.contact.touchTitle}
              {!unlocked && <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">🔒 {t.unlock.badge}</span>}
            </h3>

            {!unlocked ? (
              /* Locked state: NO contact details exposed */
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50/60">
                <div className="text-4xl mb-3">🔒</div>
                <p className="text-gray-700 font-medium mb-2">{t.unlock.title}</p>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">{t.contact.touchLocked}</p>
                <button
                  type="button"
                  onClick={requestUnlock}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                >
                  🔑 {t.unlock.ctaLabel}
                </button>
                <p className="text-[11px] text-gray-400 mt-3">{t.unlock.securityNote}</p>
              </div>
            ) : (
              /* Unlocked state: show real channels */
              <div className="space-y-5">
                {/* WhatsApp */}
                <a
                  href={waLink('')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">💬</div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.contact.waTitle}</p>
                    <p className="text-sm text-gray-500">{CONTACTS.whatsappDisplay}</p>
                  </div>
                  <span className="ms-auto text-green-600 text-sm font-medium">→</span>
                </a>

                {/* WeChat with real QR */}
                <div>
                  <button
                    type="button"
                    onClick={() => setQrOpen(true)}
                    className="w-full flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors group text-start"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                      <img src="/wechat-qr-v2.jpg" alt={t.contact.wxTitle} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{t.contact.wxTitle}</p>
                      <p className="text-sm text-gray-500">{t.contact.wxSub}</p>
                      <p className="text-xs text-green-600 font-medium mt-0.5">📷 {t.contact.wxScan}</p>
                    </div>
                  </button>
                </div>

                {/* QR enlarge */}
                {qrOpen && (
                  <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-6" onClick={() => setQrOpen(false)}>
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
                      <div className="text-2xl mb-2">💚</div>
                      <p className="font-bold text-gray-900 text-lg mb-1">{t.contact.wxTitle}</p>
                      <p className="text-sm text-gray-500 mb-4">{t.contact.wxScan}</p>
                      <img src="/wechat-qr-v2.jpg" alt={t.contact.wxTitle} className="w-full rounded-2xl border border-gray-100 mb-4" />
                      <p className="text-sm text-gray-600 mb-4">{CONTACTS.wechat}</p>
                      <button onClick={() => setQrOpen(false)} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors" aria-label="Close">
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Email */}
                <a
                  href={mailtoLink('', '')}
                  className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">✉️</div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.contact.emailTitle}</p>
                    <p className="text-sm text-gray-500">{CONTACTS.email}</p>
                  </div>
                </a>

                {/* Phone (CN) */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center text-white text-xl">📞</div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.unlock.phoneLabel}</p>
                    <p className="text-sm text-gray-500">{CONTACTS.phoneCNDisplay}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Company info (always visible) */}
            <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm font-semibold text-gray-900 mb-1">{t.contact.companyName}</p>
              <p className="text-sm text-gray-500">{t.contact.companyAddr}</p>
              <p className="text-sm text-gray-500">{t.contact.companyNote}</p>
              <a
                href={mailtoLink('', '')}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                📧 {t.contact.supportLabel} · {CONTACTS.email}
              </a>
            </div>
          </div>

          {/* Right — form */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">{t.contact.formTitle}</h3>
            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-lg font-bold text-green-800 mb-1">{t.contact.successTitle}</p>
                <p className="text-green-700 text-sm">{t.contact.successDesc}</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.nameLabel}</label>
                    <input type="text" required placeholder={t.contact.namePh} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.emailLabel}</label>
                    <input type="email" required placeholder={t.contact.emailPh} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.interestLabel}</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-700 bg-white">
                    {t.contact.interestOpts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.descLabel}</label>
                  <textarea rows={4} placeholder={t.contact.descPh} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.qtyLabel}</label>
                    <input type="number" min={1} placeholder={t.contact.qtyPh} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.budgetLabel}</label>
                    <input type="text" placeholder={t.contact.budgetPh} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.waLabel}</label>
                  <input type="text" placeholder={t.contact.waPh} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm" />
                </div>

                {!unlocked ? (
                  <button type="submit" className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors">
                    🔑 {t.unlock.ctaLabel}
                  </button>
                ) : (
                  <button type="submit" className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
                    {t.contact.submit} →
                  </button>
                )}

                <p className="text-xs text-gray-400 text-center">{t.contact.privacy}</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}