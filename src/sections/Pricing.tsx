import { useLocale } from '../i18n/LocaleContext'

/**
 * Homepage pricing section — intentionally a SUMMARY ONLY.
 *
 * Per owner decisions (2026-09-23):
 *   - The standalone /pricing/ page is the source of truth for fees & shipping.
 *   - The homepage must NOT show a personal/actual fee (no calculator, no "your total").
 *   - So this section shows a few summary points + link buttons to /pricing/ and /payment/.
 */
export default function Pricing() {
  const { t } = useLocale()

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.pricing.heading}</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t.pricing.sub}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <ul className="space-y-3">
            {t.pricing.summary.map((s) => (
              <li key={s} className="flex items-start gap-3 text-gray-700">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{s}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-gray-400 mt-6">{t.pricing.note}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/pricing/"
              className="inline-flex items-center px-5 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {t.pricing.ctaPricing} →
            </a>
            <a
              href="/payment/"
              className="inline-flex items-center px-5 py-3 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-800 text-sm font-medium rounded-xl transition-colors"
            >
              {t.pricing.ctaPayment} →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
