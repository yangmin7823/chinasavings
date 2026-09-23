import { useState } from 'react'
import SiteNav from '../sections/SiteNav'
import SiteFooter from '../sections/SiteFooter'
import { useSeo } from './StaticPage'
import { useUnlock } from '../lib/unlock'
import { waLink, paypalUnlockLink } from '../lib/contacts'
import { SITE_PAGES } from '../content/site-content'

/* 旧站正文（预渲染产物切分）：
 *   payment.head.html  hero + intro（到被 JS 渲染的卡片容器之前）
 *   payment.tail.html  “Not sure which one to use?” 到 section 结束
 * 中间三段（3 张方式卡片 / 企业付款方式 / 推荐器）在旧站里是 JS 渲染的，
 * 预渲染时只剩空容器，因此这里按旧 bundle 的 i18n + JSX 原样重建。 */
import paymentHead from '../content/payment.head.html?raw'
import paymentTail from '../content/payment.tail.html?raw'

const P = SITE_PAGES.payment

/* 数据来源：旧站 bundle 的 en i18n 对象 `payment.methods`
 * （见 buytcn-blog-restore/_recovered_pages/old-bundle.js） */
const METHODS = [
  {
    icon: '💳',
    id: 'paypal',
    title: 'PayPal',
    tag: 'Best for small orders & deposits',
    desc: 'Convenient for smaller purchases and trial orders. Availability may depend on order value and transaction requirements.',
  },
  {
    icon: '🌎',
    id: 'wise',
    title: 'Wise',
    tag: 'Recommended for medium-sized orders',
    desc: 'A convenient international payment option that can help reduce transaction costs compared with some card or PayPal payments.',
  },
  {
    icon: '🏢',
    id: 'xtransfer',
    title: 'XTransfer',
    tag: 'Preferred for larger B2B orders',
    desc: 'Designed for international business payments — well suited to wholesale and larger sourcing orders.',
  },
] as const

/* 数据来源：旧站 bundle 的 en i18n 对象 `payment.bizMethods` */
const BIZ_METHODS = [
  { id: 'lianlian', title: 'LianLian', desc: 'May be available for eligible business orders and cross-border transactions.' },
  { id: 'worldfirst', title: 'WorldFirst', desc: 'May be available for eligible business orders and international payments.' },
  { id: 'payoneer', title: 'Payoneer', desc: 'May be available for eligible business transactions.' },
  { id: 'bank', title: 'Bank Transfer', desc: 'May be available for larger orders or business customers.' },
] as const

/* 文案：旧 bundle en i18n `payment.*` */
const T = {
  reqIntro: 'Hi BuyTCN! I would like payment details for my order using',
  reqAmountNote: 'My approximate order total is',
  reqDetails: 'Request Payment Details',
  payNow: 'Pay Online with PayPal',
  unlockToPay: 'Activate $1 to pay online',
  bizTitle: 'Business Payment Options',
  bizSub: 'Depending on availability, we may also support:',
  finderTitle: 'Which method is right for my order?',
  finderSub: 'Enter an approximate order total and we’ll show the method we usually recommend.',
  amountPh: 'Estimated order total (USD)',
  calcBtn: 'Show Recommendation',
  recHeading: 'Recommended for this order',
  altHeading: 'Other options that may be available',
}

const BY_ID: Record<string, { icon: string; title: string }> = Object.fromEntries(
  [...METHODS, ...BIZ_METHODS].map((m) => [m.id, { icon: 'icon' in m ? m.icon : '🏢', title: m.title }]),
)

/** 与该订单匹配的 WhatsApp 询价链接（旧站 kt() 同款文案拼接） */
function quoteLink(amount: number, title: string): string {
  const text =
    `${T.reqIntro} ${title}. ${T.reqAmountNote} ${amount > 0 ? '$' + amount.toLocaleString() : ''}`.trim()
  return waLink(text)
}

/**
 * 推荐逻辑 —— 1:1 复刻旧 bundle 的 jg(methods, amount, isB2B)：
 *   B2B 或金额 ≥ $2000            → XTransfer
 *   < $100                        → PayPal
 *   $100 – $1999                  → Wise
 * 旧版会先用 /api/pay-config 过滤 enabled/minOrder/maxOrder；
 * 静态恢复里三种方式对所有金额都可用，因此结果等价。
 */
function recommend(amount: number, isB2B: boolean): { rec: string[]; alt: string[] } {
  const all = METHODS.map((m) => m.id) as unknown as string[]
  const rec: string[] = []
  if (isB2B || amount >= 2000) rec.push('xtransfer')
  else if (amount < 100) rec.push('paypal')
  else rec.push('wise')
  return { rec, alt: all.filter((id) => !rec.includes(id)) }
}

export default function PaymentPage() {
  useSeo(P)
  const { unlocked, requestUnlock } = useUnlock()

  const [amountRaw, setAmountRaw] = useState('')
  const [isB2B, setIsB2B] = useState(false)
  const [result, setResult] = useState<{ rec: string[]; alt: string[] } | null>(null)

  const amount = Number.parseFloat(amountRaw)
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0
  const payLink = paypalUnlockLink()

  return (
    <div className="min-h-screen bg-white">
      <SiteNav active={P.active} />

      {/* ① 旧站正文上半段（hero + intro）—— 原样注入 */}
      <main dangerouslySetInnerHTML={{ __html: paymentHead }} />

      <div className="bg-gray-50 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ② 3 张付款方式卡片 */}
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {METHODS.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="text-3xl mb-3">{m.icon}</div>
                <h2 className="text-lg font-bold text-gray-900">{m.title}</h2>
                {m.tag && <p className="text-xs font-semibold text-red-600 mt-1 mb-2">{m.tag}</p>}
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{m.desc}</p>

                {m.id === 'paypal' && (
                  <div className="mb-3">
                    {unlocked ? (
                      <a
                        href={payLink || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-[#ffc439] hover:bg-[#ffc439]/90 text-gray-900 text-sm font-bold rounded-xl transition-colors"
                      >
                        ⚡ {T.payNow}
                      </a>
                    ) : (
                      <button
                        onClick={requestUnlock}
                        className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        🔒 {T.unlockToPay}
                      </button>
                    )}
                  </div>
                )}

                <a
                  href={quoteLink(safeAmount, m.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  💬 {T.reqDetails}
                </a>
              </div>
            ))}
          </div>

          {/* ③ 企业付款方式 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-7 mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-1">🏢 {T.bizTitle}</h2>
            <p className="text-sm text-gray-500 mb-5">{T.bizSub}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {BIZ_METHODS.map((m) => (
                <div key={m.id} className="rounded-xl bg-gray-50 p-4 flex flex-col">
                  <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                  <p className="text-xs text-gray-500 mt-1 mb-2">{m.desc}</p>
                  <a
                    href={quoteLink(safeAmount, m.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-colors"
                  >
                    💬 {T.reqDetails}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* ④ 付款方式推荐器（旧站交互，阈值同上） */}
          <div className="bg-white rounded-2xl border border-gray-100 p-7 mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-1">🧭 {T.finderTitle}</h2>
            <p className="text-sm text-gray-500 mb-5">{T.finderSub}</p>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-gray-600 mb-1">{T.amountPh}</label>
                <input
                  value={amountRaw}
                  onChange={(e) => {
                    setAmountRaw(e.target.value)
                    setResult(null)
                  }}
                  placeholder={T.amountPh}
                  inputMode="decimal"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 pb-2">
                <input
                  type="checkbox"
                  checked={isB2B}
                  onChange={(e) => {
                    setIsB2B(e.target.checked)
                    setResult(null)
                  }}
                  className="w-4 h-4 accent-red-600"
                />
                B2B
              </label>
              <button
                onClick={() => setResult(recommend(safeAmount, isB2B))}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                {T.calcBtn}
              </button>
            </div>

            {result && (
              <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-5">
                <p className="text-sm font-bold text-green-800 mb-2">{T.recHeading}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {result.rec.length === 0 && <span className="text-sm text-gray-500">—</span>}
                  {result.rec.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full"
                    >
                      {BY_ID[id]?.icon} {BY_ID[id]?.title || id}
                    </span>
                  ))}
                </div>
                {result.alt.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 mb-1.5">{T.altHeading}</p>
                    <div className="flex flex-wrap gap-2">
                      {result.alt.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full"
                        >
                          {BY_ID[id]?.icon} {BY_ID[id]?.title || id}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ⑤ 旧站正文下半段（不确定选哪种 / 订单确认 / 取消退款）—— 原样注入 */}
          <div dangerouslySetInnerHTML={{ __html: paymentTail }} />
        </div>
      </div>

      <SiteFooter active={P.active} />

      {/* 浮动联系按钮（旧站原样注入） */}
      {P.float && <div dangerouslySetInnerHTML={{ __html: P.float }} />}
    </div>
  )
}
