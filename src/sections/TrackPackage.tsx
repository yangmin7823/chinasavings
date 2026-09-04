import { useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useUnlock } from '../lib/unlock'
import { waLink } from '../lib/contacts'
import { CARRIERS, queryTracking, type TrackResult } from '../lib/tracking'

const STATUS_COLORS: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700 border-green-200',
  outForDelivery: 'bg-blue-100 text-blue-700 border-blue-200',
  inTransit: 'bg-amber-100 text-amber-700 border-amber-200',
  customs: 'bg-purple-100 text-purple-700 border-purple-200',
  infoReceived: 'bg-gray-100 text-gray-600 border-gray-200',
  exception: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_DOTS: Record<string, string> = {
  delivered: 'bg-green-500',
  outForDelivery: 'bg-blue-500',
  inTransit: 'bg-amber-500',
  customs: 'bg-purple-500',
  infoReceived: 'bg-gray-400',
  exception: 'bg-red-500',
}

export default function TrackPackage() {
  const { t } = useLocale()
  const { unlocked, requestUnlock } = useUnlock()
  const [trackingNo, setTrackingNo] = useState('')
  const [carrier, setCarrier] = useState('auto')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    setError(null)
    const no = trackingNo.trim()
    if (!no) {
      setError(t.track.noInput)
      return
    }
    setLoading(true)
    const res = await queryTracking({ trackingNo: no, carrierCode: carrier })
    setResult(res)
    setLoading(false)
  }

  const EVENT_LABEL: Record<string, string> = {
    delivered: t.track.stDelivered,
    out_for_delivery: t.track.stOutForDelivery,
    in_transit: t.track.stInTransit,
    customs: t.track.stCustoms,
    info_received: t.track.stInfoReceived,
    picked_up: t.track.stPickedUp,
  }

  // semantic package status → headline badge
  const BADGE_LABEL: Record<string, string> = {
    delivered: t.track.badge.delivered,
    out_for_delivery: t.track.badge.outForDelivery,
    in_transit: t.track.badge.inTransit,
    customs: t.track.badge.customs,
    info_received: t.track.badge.infoReceived,
    exception: t.track.badge.exception,
  }

  return (
    <section id="track" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
            📦 {t.nav.track}
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">{t.track.heading}</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">{t.track.sub}</p>
        </div>

        {/* Search box */}
        <form
          onSubmit={run}
          className="bg-white rounded-2xl shadow-lg shadow-blue-100/40 border border-gray-100 p-4 md:p-6 mb-5"
        >
          <div className="grid md:grid-cols-[1fr_220px_auto] gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.track.noLabel}</label>
              <input
                type="text"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                placeholder={t.track.noPh}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-800"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.track.carrierLabel}</label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-700"
              >
                <option value="auto">🔍 {t.track.carrierPh}</option>
                {CARRIERS.filter((c) => c.kind === 'intl').map((c) => (
                  <option key={c.code} value={c.code}>🌍 {c.name}</option>
                ))}
                {CARRIERS.filter((c) => c.kind === 'domestic').map((c) => (
                  <option key={c.code} value={c.code}>🇨🇳 {c.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? t.track.searching : t.track.btn}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {t.track.hint}
          </p>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-gray-50 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📦</span>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">{t.track.carrierRow}</p>
                  <p className="font-bold text-gray-900">{result.carrierName}</p>
                </div>
              </div>
              <div className="text-center md:text-end">
                <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLORS[result.status] ?? STATUS_COLORS.inTransit}`}>
                  {BADGE_LABEL[result.status] ?? result.status}
                </span>
                <p className="text-xs text-gray-400 mt-1.5" dir="ltr">{result.trackingNo}</p>
              </div>
            </div>

            {/* Meta strip */}
            <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-gray-50 text-sm">
              <div>
                <p className="text-[11px] text-gray-400 uppercase">{t.track.destLabel}</p>
                <p className="font-medium text-gray-800">📍 {result.destination}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase">{t.hero.statLabels.lines}</p>
                <p className="font-medium text-gray-800">{EVENT_LABEL[result.status] ?? result.status}</p>
              </div>
            </div>

            {/* Demo note */}
            {result.demo && (
              <div className="mx-6 mt-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-700 flex items-center gap-2">
                <span>💡</span>
                <span>{t.track.demoNote}</span>
              </div>
            )}

            {/* Timeline */}
            <div className="p-6">
              <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-500 rounded-full inline-block" />
                {t.track.timelineTitle}
              </h4>
              {result.events.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl px-5 py-6 text-center">
                  <div className="text-2xl mb-1.5">📭</div>
                  <p className="text-sm text-gray-600 font-medium">{t.track.noResult}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.track.noResultHint}</p>
                </div>
              ) : (
              <ol className="relative border-s-2 border-gray-100 ms-3 space-y-6">
                {[...result.events].reverse().map((ev, i) => {
                  const isLast = i === 0 // after reverse, first shown = most recent
                  return (
                    <li key={i} className="ms-6 relative">
                      <span
                        className={`absolute -start-[31px] top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${
                          isLast ? (STATUS_DOTS[result.status] ?? 'bg-gray-400') + ' animate-pulse' : 'bg-gray-300'
                        }`}
                      />
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className={`text-sm font-semibold ${isLast ? 'text-gray-900' : 'text-gray-600'}`}>
                          {EVENT_LABEL[ev.code] ?? ev.code}
                        </p>
                      <p className="text-xs text-gray-400" dir="ltr">{ev.time}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">📍 {ev.location}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{ev.description}</p>
                  </li>
                )
              })}
              </ol>
              )}
            </div>

            {/* Footer help */}
            <div className="px-6 pb-6">
              {unlocked ? (
                <a
                  href={waLink('')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700"
                >
                  💬 {t.track.footerText}
                </a>
              ) : (
                <button
                  onClick={requestUnlock}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  🔒 {t.unlock.ctaLabel}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <div className="text-4xl mb-3">🔎</div>
            <p className="text-gray-400 text-sm">
              {t.track.carrierLabel} — {CARRIERS.filter((c) => c.kind !== 'auto').length} {t.hero.statLabels.lines}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}