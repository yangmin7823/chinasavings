import { useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useUnlock } from '../lib/unlock'
import { waLink } from '../lib/contacts'

const PLATFORMS = ['Taobao', '淘宝', '1688', 'Weidian', '闲鱼', 'Pinduoduo', '拼多多', 'Tmall', '天猫', 'JD', '京东']

const HERO_STATS: { value: string; key: 'avg' | 'products' | 'lines' | 'start' }[] = [
  { value: '70%', key: 'avg' },
  { value: '1B+', key: 'products' },
  { value: '100+', key: 'lines' },
  { value: '$0', key: 'start' },
]

// Product comparisons as USD amounts — rendered in active currency via fmt()
const HERO_COMPARISONS = [
  { icon: '📱', us: 1199, cn: 699 },
  { icon: '👟', us: 115, cn: 45 },
  { icon: '👜', us: 1650, cn: 520 },
  { icon: '🎧', us: 249, cn: 119 },
]

export default function Hero() {
  const { t, fmt } = useLocale()
  const { unlocked, requestUnlock } = useUnlock()
  const [link, setLink] = useState('')
  const [estimated, setEstimated] = useState(false)

  // Contact is only reachable after the $1 unlock.
  const handleEstimate = (e: React.FormEvent) => {
    e.preventDefault()
    const no = link.trim()
    if (!no) return
    if (!unlocked) {
      requestUnlock()
      return
    }
    setEstimated(true)
    const text = `${t.submit.whatsappIntro}\n${no}`
    window.open(waLink(text), '_blank', 'noopener')
  }

  return (
    <section id="home" className="relative bg-gradient-to-br from-red-50 via-white to-orange-50 pt-16 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -end-40 w-80 h-80 bg-red-100 rounded-full opacity-40" />
        <div className="absolute -bottom-40 -start-40 w-96 h-96 bg-orange-100 rounded-full opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            {t.hero.trustBadge}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-5">
              {t.hero.title1}
              <br />
              <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                {t.hero.title2}
              </span>
              <br />
              {t.hero.title3}
            </h1>

            <p className="text-lg text-gray-600 mb-4 leading-relaxed max-w-lg">{t.hero.subtitle}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {t.hero.highlights.map((h) => (
                <span key={h} className="inline-flex items-center gap-1.5 bg-white border border-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {h}
                </span>
              ))}
            </div>

            {/* Paste link estimate box */}
            <form
              onSubmit={handleEstimate}
              className="bg-white p-2 rounded-2xl shadow-lg shadow-red-100/50 border border-gray-100 flex flex-col sm:flex-row gap-2 mb-3"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
                </svg>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => { setLink(e.target.value); setEstimated(false) }}
                  placeholder={t.hero.placeholder}
                  className="w-full py-2.5 text-sm outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                {t.hero.estimateBtn} →
              </button>
            </form>

            {estimated && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3 flex items-start gap-3">
                <span className="text-lg">✅</span>
                <div className="text-sm">
                  <p className="font-semibold text-green-800">{t.hero.estimateTitle}</p>
                  <p className="text-green-700">{t.hero.estimateDesc}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button
                onClick={requestUnlock}
                className="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                {t.hero.cta}
                <svg className="w-4 h-4 ms-1.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span className="text-xs text-gray-400">{t.unlock.payHighlight}</span>
            </div>

            <div className="grid grid-cols-4 gap-4 max-w-lg">
              {HERO_STATS.map((s) => (
                <div key={s.key}>
                  <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
                  <div className="text-[11px] text-gray-500 leading-tight">{t.hero.statLabels[s.key]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — price comparison card */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-red-100/40 p-8">
              <div className="text-center mb-6">
                <h3 className="font-bold text-gray-900 text-lg">{t.hero.priceTitle}</h3>
                <p className="text-xs text-gray-400 mt-1">{t.hero.priceSub}</p>
              </div>

              <div className="space-y-4">
                {HERO_COMPARISONS.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-xl">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">{t.hero.usLabel}</p>
                      <p className="text-xs text-gray-400">
                        <span className="line-through me-2">{fmt(p.us)}</span>
                        <span className="text-red-600 font-bold">{fmt(p.cn)}</span>
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                      −{Math.round((1 - p.cn / p.us) * 100)}%
                    </span>
                  </div>
                ))}
              </div>

              <a
                href="#prices"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#prices')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="mt-6 block text-center text-sm font-medium text-red-600 hover:text-red-700"
              >
                {t.hero.seeMore}
              </a>
            </div>
          </div>
        </div>

        {/* Platform strip */}
        <div className="mt-14 pt-8 border-t border-gray-200/60">
          <p className="text-center text-xs text-gray-400 mb-4 tracking-wide uppercase">{t.hero.sourceLabel}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PLATFORMS.map((p) => (
              <span key={p} className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-default">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}