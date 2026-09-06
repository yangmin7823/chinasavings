import { useLocale } from '../i18n/LocaleContext'
import { useUnlock } from '../lib/unlock'
import { CONTACTS, waLink, mailtoLink } from '../lib/contacts'

export default function Footer() {
  const { t } = useLocale()
  const { unlocked, requestUnlock } = useUnlock()

  const scrollTo = (href: string) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const quickLinks = [
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

  const serviceList = t.services.items.map((s) => s.title)

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="#home" onClick={(e) => { e.preventDefault(); scrollTo('#home') }} className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
              <span className="text-2xl">🇨🇳</span>
              <span className="text-xl font-bold text-white">
                Buy<span className="text-red-400">TCN</span>
              </span>
            </a>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{t.footer.about}</p>
            <a
              href="/service-card"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors mb-4"
            >
              📇 {t.footer.cardCta} →
            </a>
            <p className="text-xs text-gray-500">{t.company}</p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t.footer.quickLinks}</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={(e) => { e.preventDefault(); scrollTo(l.href) }}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t.footer.servicesTitle}</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {serviceList.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t.footer.contactTitle}</h4>
            {!unlocked ? (
              <div>
                <a
                  href={mailtoLink('', '')}
                  className="inline-flex items-center gap-1.5 text-gray-400 hover:text-blue-400 text-sm transition-colors mb-3"
                >
                  📧 {CONTACTS.email}
                </a>
                <button
                  onClick={requestUnlock}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm rounded-lg transition-colors"
                >
                  🔒 {t.unlock.ctaLabel}
                </button>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-[200px]">
                  {t.contact.touchLocked}
                </p>
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                <li>
                  <a href={waLink('')} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-400 transition-colors">
                    {t.contact.waTitle}: {CONTACTS.whatsappDisplay}
                  </a>
                </li>
                <li>
                  <a href={mailtoLink('', '')} className="text-gray-400 hover:text-white transition-colors">
                    {CONTACTS.email}
                  </a>
                </li>
                <li className="text-gray-400">
                  {t.contact.wxTitle}: {CONTACTS.wechat}
                </li>
                <li className="text-gray-500">{t.contact.companyAddr}</li>
              </ul>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 text-center sm:text-start">
            © {new Date().getFullYear()} BuyTCN. {t.footer.rights} | {t.company}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{t.footer.pay}</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full" />
            <span>Visa</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full" />
            <span>Mastercard</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">{t.footer.legal}</p>
      </div>
    </footer>
  )
}