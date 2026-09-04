import { useLocale } from '../i18n/LocaleContext'

export default function HowItWorks() {
  const { t } = useLocale()
  const steps = t.how.steps.map((s, i) => ({ ...s, num: i + 1 }))

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">{t.how.heading}</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">{t.how.sub}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => {
            const highlight = i === 0
            return (
              <div key={s.num} className="relative">
                <div
                  className={`h-full rounded-2xl p-6 border transition-all duration-300 ${
                    highlight
                      ? 'bg-red-600 text-white shadow-lg shadow-red-200 border-red-600'
                      : 'bg-white border-gray-100 hover:shadow-lg hover:border-red-100'
                  }`}
                >
                  <div className={`text-4xl font-extrabold mb-3 ${highlight ? 'text-white/20' : 'text-gray-100'}`}>
                    0{s.num}
                  </div>
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className={`text-lg font-bold mb-2 ${highlight ? 'text-white' : 'text-gray-900'}`}>{s.title}</h3>
                  <p className={`text-sm leading-relaxed ${highlight ? 'text-red-50' : 'text-gray-500'}`}>{s.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -end-5 z-10 -translate-y-1/2">
                      <svg className={`w-5 h-5 rtl:rotate-180 ${highlight ? 'text-red-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-center text-sm text-gray-500 mb-4">{t.how.detailTitle}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {t.how.chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-600"
              >
                <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}