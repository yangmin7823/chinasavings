import { useEffect, useState } from 'react'

/**
 * Blog 专用导航 —— 结构还原自原站 Navbar：
 *   How It Works / See How BuyTCN Works / Guide(当前) / For Business / Pricing / Payments / FAQ
 * 链接用绝对路径（从 /blog/ 回首页需带 /）
 */
const NAV = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'See How BuyTCN Works', href: '/#real-orders' },
  { label: 'Guide', href: '/blog/', active: true },
  { label: 'For Business', href: '/business/' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'Payments', href: '/payment/' },
  { label: 'FAQ', href: '/faq/' },
]

export default function BlogNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b transition-shadow ${
        scrolled ? 'border-gray-200 shadow-sm' : 'border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          <a href="/" className="flex items-center space-x-2 flex-shrink-0 rtl:space-x-reverse">
            <span className="text-2xl">🇨🇳</span>
            <span className="text-xl font-bold text-gray-900 whitespace-nowrap">
              Buy<span className="text-red-600">TCN</span>
            </span>
          </a>

          <div className="hidden xl:flex items-center space-x-1 rtl:space-x-reverse">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`px-2.5 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                  item.active
                    ? 'text-red-600 font-semibold bg-red-50'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href="/#submit-link"
              className="hidden md:inline-flex items-center ms-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Get a Free Quote →
            </a>

            <button
              className="xl:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="xl:hidden bg-white border-b border-gray-100">
          <div className="px-4 py-3 space-y-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 text-sm rounded-lg ${
                  item.active ? 'text-red-600 font-semibold bg-red-50' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/#submit-link"
              className="block mt-2 w-full px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg text-center hover:bg-red-700"
            >
              Get a Free Quote →
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
