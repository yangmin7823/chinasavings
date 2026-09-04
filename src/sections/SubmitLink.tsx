import { useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useUnlock } from '../lib/unlock'
import { waLink, mailtoLink } from '../lib/contacts'

export default function SubmitLink() {
  const { t } = useLocale()
  const { unlocked, requestUnlock } = useUnlock()
  const [link, setLink] = useState('')
  const [qty, setQty] = useState('1')
  const [notes, setNotes] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = (via: 'wa' | 'email') => {
    const no = link.trim()
    if (!no) {
      setErr(t.submit.linkRequired)
      return
    }
    setErr(null)
    if (!unlocked) {
      requestUnlock()
      return
    }
    setSent(true)

    const lines = [t.submit.whatsappIntro, no]
    if (qty && qty !== '1') lines.push(`\nQty: ${qty}`)
    if (notes.trim()) lines.push(`\nNotes: ${notes.trim()}`)
    const msg = lines.join('\n')

    if (via === 'wa') {
      window.open(waLink(msg), '_blank', 'noopener')
    } else {
      const subject = `[Quote Request] ${no.slice(0, 80)}`
      window.location.href = mailtoLink(subject, msg)
    }
  }

  const steps = t.submit.howItems

  return (
    <section id="submit-link" className="py-20 bg-gradient-to-br from-orange-50 via-white to-red-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: form */}
          <div>
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-full px-4 py-1.5 text-xs font-bold mb-5">
              🔗 {t.submit.badge}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">{t.submit.heading}</h2>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">{t.submit.sub}</p>

            <div className="bg-white rounded-2xl shadow-xl shadow-red-100/40 border border-gray-100 p-6 md:p-8">
              <form
                onSubmit={(e) => { e.preventDefault(); submit('wa') }}
                className="space-y-5"
              >
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    {t.submit.linkLabel}
                  </label>
                  <textarea
                    value={link}
                    onChange={(e) => { setLink(e.target.value); setSent(false) }}
                    rows={3}
                    placeholder={t.submit.linkPh}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-gray-800 resize-none bg-gray-50/50 ${
                      err ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      {t.submit.qtyLabel}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      {t.submit.notesLabel}
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t.submit.notesPh}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-gray-800"
                    />
                  </div>
                </div>

                {/* Send buttons */}
                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all text-lg shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">💬</span> {t.submit.sendBtn}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">{t.submit.sendBtnSub}</p>
                  <div className="text-center text-xs text-gray-500 mt-2">
                    {t.submit.emailAlt}{' '}
                    {unlocked ? (
                      <button
                        type="button"
                        onClick={() => submit('email')}
                        className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2"
                      >
                        {t.contact.emailSub}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={requestUnlock}
                        className="font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                      >
                        🔒 {t.unlock.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {sent && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 flex items-center gap-2">
                  <span>✅</span> {t.submit.successNote}
                </div>
              )}
            </div>
          </div>

          {/* Right: how it works + price hook */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">{t.submit.howTitle}</h3>
            <div className="space-y-5">
              {steps.map((s, i) => (
                <div key={s.title} className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{s.icon}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-0.5">
                      <span className="text-orange-500 font-extrabold me-1.5">0{i + 1}</span>
                      {s.title}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price hook banner */}
            <div className="mt-8 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-6 text-white">
              <h4 className="font-bold text-lg mb-1.5">💡 {t.submit.whyTitle}</h4>
              <p className="text-red-50 text-sm leading-relaxed">{t.submit.whyText}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}