import { useLocale } from '../i18n/LocaleContext'

export default function TrustBar() {
  const { t } = useLocale()
  return (
    <section className="py-10 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {t.trust.items.map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-2">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}