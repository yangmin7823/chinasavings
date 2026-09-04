import { useLocale } from '../i18n/LocaleContext'

export default function RiskDisclosure() {
  const { t } = useLocale()

  return (
    <section id="guarantees" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">{t.guarantees.heading}</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">{t.guarantees.sub}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.guarantees.items.map((g) => (
            <div
              key={g.title}
              className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-green-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {g.icon}
                </div>
                <h3 className="font-bold text-gray-900">{g.title}</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">{t.guarantees.bannerTitle}</h3>
          <p className="text-red-50 max-w-2xl mx-auto">{t.guarantees.bannerSub}</p>
        </div>
      </div>
    </section>
  )
}