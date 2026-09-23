/**
 * Blog 专用页脚 —— 1:1 还原自原站 /blog/ 预渲染产物：
 *   深色底 bg-gray-900，4 栏：品牌栏 + Shopping + Business + Support
 *   底部：版权 + About Us / 运营主体
 */
const COLS = [
  {
    title: 'Shopping',
    links: [
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Pricing', href: '/pricing/' },
      { label: 'Real Orders', href: '/#real-orders' },
      { label: 'FAQ', href: '/faq/' },
      { label: 'China Sourcing Guide', href: '/blog/' },
    ],
  },
  {
    title: 'Business',
    links: [
      { label: 'China Sourcing', href: '/china-sourcing-agent' },
      { label: 'Bulk Purchasing', href: '/buy-from-1688' },
      { label: 'Quality Inspection', href: '/china-product-inspection' },
      { label: 'For Business', href: '/business/' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '/#contact' },
      { label: 'Payment', href: '/payment/' },
      { label: 'Shipping', href: '/#track' },
    ],
  },
]

export default function BlogFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* 品牌栏 */}
          <div className="md:col-span-1">
            <a href="/#home" className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
              <span className="text-2xl">🇨🇳</span>
              <span className="text-xl font-bold text-white">
                Buy<span className="text-red-400">TCN</span>
              </span>
            </a>
            <p className="text-sm font-semibold text-gray-300 mb-1">Your Personal Buyer in China.</p>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              We buy it, inspect it, and ship it to you — from Chinese marketplaces to your door.
            </p>
            <a
              href="/service-card"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors mb-3"
            >
              📇 View Our Service Card →
            </a>
            <div className="space-y-1.5 text-sm text-gray-400">
              <a
                href="https://wa.me/8615387592595?text="
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-green-400 transition-colors"
              >
                💬 WhatsApp: +86 153 8759 2595
              </a>
              <a
                href="mailto:service@buytcn.com?subject=&body="
                className="block hover:text-white transition-colors"
              >
                📧 service@buytcn.com
              </a>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                {col.title === 'Support' && (
                  <li className="text-sm text-gray-400">WeChat: bshine01</li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <p className="text-sm text-gray-300 font-semibold text-center mb-3">
            🇨🇳 Shop China. We Handle the Rest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} BuyTCN · Bshine Ltd. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <a
                href="/about/"
                className="text-gray-500 hover:text-gray-300 transition-colors underline decoration-gray-700 underline-offset-2"
              >
                About Us
              </a>
              <span className="text-gray-700">·</span>
              <span>
                Operated by Bshine Ltd — Changsha Baichen Enterprise Development Co., Ltd ·
                Changsha, Hunan, China
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
