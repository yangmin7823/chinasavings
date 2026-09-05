import { useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useUnlock } from '../lib/unlock'
import { LANGUAGES, CURRENCIES } from '../i18n/config'

export default function Navbar() {
  const { t, lang, setLang, currency, setCurrency } = useLocale()
  const { requestUnlock } = useUnlock()
  const [open, setOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [curOpen, setCurOpen] = useState(false)

  const navItems = [
    { label: t.nav.home, href: '#home' },
    { label: t.submit.heading, href: '#submit-link' },
    { label: t.nav.savings, href: '#prices' },
    { label: t.nav.how, href: '#how-it-works' },
    { label: t.nav.services, href: '#services' },
    { label: t.nav.track, href: '#track' },
    { label: t.nav.reviews, href: '#reviews' },
    { label: t.nav.pricing, href: '#pricing' },
    { label: t.nav.faq, href: '#faq' },
  ]

  const scrollTo = (href: string) => {
    setOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const activeLang = LANGUAGES.find((l) => l.code === lang)!
  const activeCur = CURRENCIES.find((c) => c.code === currency)!

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => { e.preventDefault(); scrollTo('#home') }}
            className="flex items-center space-x-2 flex-shrink-0 rtl:space-x-reverse"
          >
            <span className="text-2xl">🇨🇳</span>
            <span className="text-xl font-bold text-gray-900 whitespace-nowrap">
              Buy<span className="text-red-600">TCN</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden xl:flex items-center space-x-1 rtl:space-x-reverse">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); scrollTo(item.href) }}
                className="px-2.5 py-2 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setCurOpen(false) }}
                className="flex items-center gap-1.5 px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title={t.nav.language}
              >
                <span>{activeLang.flag}</span>
                <span className="hidden sm:inline text-xs font-medium uppercase tracking-wide">{lang}</span>
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute end-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setLangOpen(false) }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-start hover:bg-red-50 transition-colors ${l.code === lang ? 'text-red-600 font-semibold' : 'text-gray-700'}`}
                      >
                        <span>{l.flag}</span>
                        <span>{l.native}</span>
                        {l.code === lang && <span className="ms-auto">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Currency switcher */}
            <div className="relative">
              <button
                onClick={() => { setCurOpen(!curOpen); setLangOpen(false) }}
                className="flex items-center gap-1 px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title={t.nav.currency}
              >
                <span className="font-semibold text-xs">{activeCur.symbol}</span>
                <span className="hidden sm:inline text-xs font-medium uppercase tracking-wide">{currency}</span>
              </button>
              {curOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCurOpen(false)} />
                  <div className="absolute end-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { setCurrency(c.code); setCurOpen(false) }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-start hover:bg-red-50 transition-colors ${c.code === currency ? 'text-red-600 font-semibold' : 'text-gray-700'}`}
                      >
                        <span className="font-semibold w-6">{c.symbol}</span>
                        <span className="flex-1">
                          <span className="block text-xs font-medium uppercase">{c.code}</span>
                          <span className="block text-[11px] text-gray-400">{c.regions}</span>
                        </span>
                        {c.code === currency && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* CTA (desktop) */}
            <button
              onClick={requestUnlock}
              className="hidden md:inline-flex items-center ms-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.nav.cta} →
            </button>

            {/* Mobile hamburger */}
            <button
              className="xl:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => { setOpen(!open); setLangOpen(false); setCurOpen(false) }}
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

      {/* Mobile menu */}
      {open && (
        <div className="xl:hidden bg-white border-b border-gray-100 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {/* Quick lang + currency strip */}
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-gray-50">
              <div className="flex flex-wrap items-center gap-1 flex-1">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`px-2 py-1 rounded-lg text-xs ${l.code === lang ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-500'}`}
                    title={l.label}
                  >
                    {l.flag} {l.native}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-gray-50">
              <span className="text-[11px] text-gray-400 uppercase">{t.nav.currency}:</span>
              <div className="flex flex-wrap items-center gap-1">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`px-2 py-1 rounded-lg text-xs ${c.code === currency ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-500'}`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); scrollTo(item.href) }}
                className="block px-3 py-2 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={() => { setOpen(false); requestUnlock() }}
              className="block mt-2 w-full px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg text-center hover:bg-red-700 cursor-pointer"
            >
              {t.nav.cta} →
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}