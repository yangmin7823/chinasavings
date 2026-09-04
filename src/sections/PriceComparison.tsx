import { useLocale } from '../i18n/LocaleContext'

// USD baseline amounts; icons + keys resolved from dict for names
const PRODUCTS = [
  { key: 'iphone', icon: '📱', us: 1199, cn: 699 },
  { key: 'nike', icon: '👟', us: 115, cn: 45 },
  { key: 'lv', icon: '👜', us: 1650, cn: 520 },
  { key: 'airpods', icon: '🎧', us: 249, cn: 119 },
  { key: 'dyson', icon: '🧹', us: 749, cn: 299 },
  { key: 'dress', icon: '👗', us: 300, cn: 89 },
  { key: 'dji', icon: '🚁', us: 1099, cn: 599 },
  { key: 'huawei', icon: '📟', us: 999, cn: 499 },
]

export default function PriceComparison() {
  const { t, fmt } = useLocale()

  return (
    <section id="prices" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t.prices.headingA} <span className="text-red-600">{t.prices.headingB}</span>
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t.prices.sub}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRODUCTS.map((p) => {
            const name = t.prices.pnames[p.key as keyof typeof t.prices.pnames]
            const save = Math.round((1 - p.cn / p.us) * 100)
            return (
              <div
                key={p.key}
                className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:border-red-100 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-3 leading-snug min-h-[2.5rem]">{name}</h3>
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{t.prices.usLabel}</p>
                    <p className="text-sm text-gray-400 line-through">{fmt(p.us)}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-gray-400 mb-0.5">{t.hero.cnLabel}</p>
                    <p className="text-xl font-bold text-red-600">{fmt(p.cn)}</p>
                  </div>
                </div>
                <div className="bg-green-50 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg text-center">
                  {t.prices.saveLabel} {save}%
                </div>
                <div className="absolute inset-0 bg-red-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">{t.prices.footnote}</p>
      </div>
    </section>
  )
}