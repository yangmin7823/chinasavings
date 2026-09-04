import { useLocale } from '../i18n/LocaleContext'

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < count ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  const { t } = useLocale()

  return (
    <section id="reviews" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.reviews.heading}</h2>
          <div className="inline-flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-6 py-3 shadow-sm">
            <span className="text-2xl font-extrabold text-gray-900">4.9</span>
            <Stars count={5} />
            <span className="text-sm text-gray-500">{t.reviews.ratingLabel}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.reviews.items.map((r, idx) => (
            <figure
              key={r.name}
              className={`bg-white rounded-2xl p-6 border transition-all duration-300 ${
                idx === 0 ? 'border-red-200 shadow-lg shadow-red-100/40' : 'border-gray-100 hover:shadow-lg'
              }`}
            >
              <svg className="w-6 h-6 text-gray-200 mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <blockquote className="text-sm text-gray-600 leading-relaxed mb-4">{r.text}</blockquote>
              <figcaption className="flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center text-sm">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400">
                      {r.flag} {r.country}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <div className="flex justify-end"><Stars count={r.rating} /></div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{r.service}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">{t.reviews.trustNote}</p>
      </div>
    </section>
  )
}