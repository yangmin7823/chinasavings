import { useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'

export default function FAQ() {
  const { t } = useLocale()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.faq.heading}</h2>
          <p className="text-xl text-gray-500">{t.faq.sub}</p>
        </div>

        <div className="space-y-3">
          {t.faq.items.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors"
            >
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-start"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-medium text-gray-900 pe-4">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}