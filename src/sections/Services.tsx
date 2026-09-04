import { useLocale } from '../i18n/LocaleContext'

export default function Services() {
  const { t } = useLocale()

  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault()
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.services.heading}</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            {t.services.subA} <strong className="text-gray-700">{t.services.subB}</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.services.items.map((s) => (
            <div
              key={s.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-red-100 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{s.desc}</p>
              <ul className="space-y-1.5">
                {s.feats.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-gray-500 mb-4">{t.services.footnote}</p>
          <a
            href="#contact"
            onClick={scrollToContact}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
          >
            {t.services.cta} →
          </a>
        </div>
      </div>
    </section>
  )
}