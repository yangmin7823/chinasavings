import { useLocale } from '../i18n/LocaleContext'

// Tiered service fee (based on total order value in USD)
function serviceFee(cost: number): number {
  if (cost < 100) return 20            // < $100 → $20 min
  if (cost <= 500) return cost * 0.15  // $100–500 → 15%
  if (cost <= 2000) return cost * 0.10 // $500–2000 → 10%
  if (cost <= 5000) return cost * 0.08 // $2000–5000 → 8%
  return cost * 0.05                   // $5000+ → 5–8% (use 5% for example)
}

// Example rows (USD baseline) — totals computed live, shown in active currency
const EXAMPLE_ROWS: { key: 'nike' | 'iphone' | 'dress'; us: number; cost: number; ship: number }[] = [
  { key: 'nike', us: 115, cost: 35, ship: 10 },
  { key: 'iphone', us: 1199, cost: 599, ship: 15 },
  { key: 'dress', us: 300, cost: 65, ship: 12 },
]

// Shipping rate table (per-weight USD baselines)
const RATE_ROWS: { line: string; destKey: 'usa' | 'ger' | 'uk' | 'bra' | 'jpn' | 'wld'; first: number; cont: number | null; unit: string; etaDays: string; customsKey: 'stable' | 'ddp' | 'bulk' }[] = [
  { line: 'CN-US Express', destKey: 'usa', first: 11.9, cont: 6.5, unit: '/500g', etaDays: '8–12', customsKey: 'stable' },
  { line: 'CN-EU Tariffless', destKey: 'ger', first: 12.69, cont: 6.72, unit: '/500g', etaDays: '10', customsKey: 'ddp' },
  { line: 'CN-UK Line', destKey: 'uk', first: 13.5, cont: 6.9, unit: '/500g', etaDays: '8–11', customsKey: 'stable' },
  { line: 'CN-BR Express', destKey: 'bra', first: 5.97, cont: 1.94, unit: '/100g', etaDays: '18–20', customsKey: 'stable' },
  { line: 'CN-JP Economy', destKey: 'jpn', first: 4.9, cont: 2.3, unit: '/500g', etaDays: '6–9', customsKey: 'stable' },
  { line: 'Sea Freight', destKey: 'wld', first: 2.5, cont: null, unit: '/kg', etaDays: '20–30', customsKey: 'bulk' },
]

function Card({
  icon, title, badge, priceLabel, perNote, desc, feats, featured, tiers,
}: {
  icon: string
  title: string
  badge?: string
  priceLabel: string
  perNote: string
  desc: string
  feats: string[]
  featured?: boolean
  tiers?: { band: string; rate: string }[]
}) {
  return (
    <div
      className={`rounded-2xl p-8 border transition-all flex flex-col ${
        featured
          ? 'bg-white border-2 border-red-500 shadow-lg shadow-red-100 relative scale-105'
          : 'bg-white border-gray-100 hover:shadow-lg hover:border-red-100'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 inset-x-0 mx-auto w-max bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full">
          {badge}
        </div>
      )}
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-4xl font-extrabold text-red-600">{priceLabel}</span>
        {perNote && <span className="text-gray-400 text-sm">{perNote}</span>}
      </div>
      <p className="text-gray-500 text-sm mb-5">{desc}</p>

      {/* Tier table when present */}
      {tiers && (
        <div className="mb-5 rounded-xl overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <tbody>
              {tiers.map((tr, i) => (
                <tr key={tr.band} className={i % 2 ? 'bg-gray-50/60' : 'bg-white'}>
                  <td className="py-2 px-4 text-gray-600">{tr.band}</td>
                  <td className="py-2 px-4 text-end font-bold text-red-600 whitespace-nowrap">{tr.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul className="space-y-2 mt-auto">
        {feats.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Pricing() {
  const { t, fmt } = useLocale()
  const pnames = t.prices.pnames

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.pricing.heading}</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t.pricing.sub}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 items-stretch">
          <Card icon="🔑" title={t.pricing.membership.name} priceLabel={t.pricing.membership.priceLabel} perNote={t.pricing.membership.perNote} desc={t.pricing.membership.desc} feats={t.pricing.membership.feats} />
          <Card icon="💰" title={t.pricing.service.name} badge={t.pricing.service.badge} priceLabel={t.pricing.service.priceLabel} perNote={t.pricing.service.perNote} desc={t.pricing.service.desc} tiers={t.pricing.service.tiers} feats={t.pricing.service.feats} featured />
          <Card icon="🚚" title={t.pricing.shipping.name} priceLabel={t.pricing.shipping.priceLabel} perNote="" desc={t.pricing.shipping.desc} feats={t.pricing.shipping.feats} />
        </div>

        {/* Worked example */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t.pricing.exampleTitle}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {t.pricing.exCols.map((c, i) => (
                    <th key={c} className={`py-3 px-4 text-gray-500 font-medium ${i === 0 ? 'text-start' : 'text-end'}`}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_ROWS.map((r) => {
                  const fee = serviceFee(r.cost)
                  const total = r.cost + fee + r.ship
                  const save = Math.round((1 - total / r.us) * 100)
                  return (
                    <tr key={r.key} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900 text-start">{pnames[r.key]}</td>
                      <td className="py-3 px-4 text-end text-gray-400 line-through">{fmt(r.us)}</td>
                      <td className="py-3 px-4 text-end text-gray-700">{fmt(r.cost)}</td>
                      <td className="py-3 px-4 text-end text-gray-700">{fmt(fee)}</td>
                      <td className="py-3 px-4 text-end text-gray-700">{fmt(r.ship)}</td>
                      <td className="py-3 px-4 text-end font-bold text-red-600">{fmt(total)}</td>
                      <td className="py-3 px-4 text-end font-bold text-green-600">{save}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipping rates */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t.pricing.ratesTitle}</h3>
          <p className="text-center text-sm text-gray-400 mb-6">{t.pricing.ratesSub}</p>
          <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {t.pricing.rateCols.map((c, i) => (
                    <th key={c} className={`py-3 px-4 text-gray-500 font-medium ${i <= 1 ? 'text-start' : 'text-end'}`}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RATE_ROWS.map((r) => (
                  <tr key={r.line} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 text-start">{r.line}</td>
                    <td className="py-3 px-4 text-gray-700 text-start">{t.pricing.dests[r.destKey]}</td>
                    <td className="py-3 px-4 text-end text-gray-700">
                      {fmt(r.first)}
                      <span className="text-xs text-gray-400">{r.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-end text-gray-700">
                      {r.cont !== null ? <>{fmt(r.cont)}<span className="text-xs text-gray-400">{r.unit}</span></> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-end font-medium text-green-600">
                      {r.etaDays} {t.pricing.days}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs text-end">{t.pricing.customs[r.customsKey]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">{t.pricing.rateNote}</p>
        </div>
      </div>
    </section>
  )
}