import { useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { CONTACTS, waLink, mailtoLink } from '../lib/contacts'

/**
 * 右侧悬浮联系面板（随屏幕滚动常驻）+ 右上角分享按钮。
 * - 客户无需解锁即可看到 WhatsApp / Email / WeChat（含二维码）
 * - 桌面：联系面板固定右侧垂直居中；分享按钮固定在屏幕右上角（导航栏下方）
 * - 手机：联系面板贴右下；分享按钮贴右上，互不遮挡
 * - 所有标签随当前语言切换
 */

type SocialName = 'facebook' | 'instagram' | 'x' | 'reddit' | 'tumblr'

function socialTargets() {
  const url = window.location.href
  const page = window.location.hostname
  const title = document.title
  const desc =
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    'BuyTCN — Taobao agent & buy from China at local prices.'
  const text = `${title} — ${desc}`
  const igWeb = `https://www.instagram.com/${page.replace(/\.+\w*$/g, '').toLowerCase()}/`

  const open = (u: string) => window.open(u, '_blank', 'noopener,noreferrer')

  return {
    list: [
      {
        key: 'facebook' as SocialName,
        label: 'Facebook',
        icon: (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M24 12.073c0-6.628-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.782.235 2.782.235v2.98h-1.55c-1.52 0-1.963.94-1.963 1.905v2.259h3.32l-.535 3.47h-2.785v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        ),
        color: '#1877F2',
        onClick: () =>
          open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
      },
      {
        key: 'instagram' as SocialName,
        label: 'Instagram',
        icon: (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.331 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.947-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.552-10.404a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        ),
        color: '#E4405F',
        onClick: async () => {
          try {
            await navigator.clipboard.writeText(url)
          } catch { /* ignore */ }
          // Instagram 无 Web 分享链接：复制链接后引导到 Instagram
          open(igWeb)
        },
      },
      {
        key: 'x' as SocialName,
        label: 'X',
        icon: (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
        color: '#0f172a',
        onClick: () =>
          open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`),
      },
      {
        key: 'reddit' as SocialName,
        label: 'Reddit',
        icon: (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M22 11.8c0-2.3-2.7-4.2-6-4.2-.4 0-.8 0-1.1.1a5.8 5.8 0 00-2.4-1.4L13.7 4c.1-.4.1-.7 0-1-.1-.5-.7-.8-1.6-.8L10 2.2c-1 0-1.6.4-1.7.9l.2 1.3.3.1c-.8.3-1.6.8-2.2 1.4-.4-.1-.8-.1-1.2-.1-3.3 0-6 1.9-6 4.2s2.7 4.2 6 4.2c.4 0 .8 0 1.2-.1.9.9 2.2 1.5 3.7 1.5s2.8-.6 3.7-1.5c.4.1.8.1 1.2.1 3.3 0 6-1.9 6-4.2zM6.5 11.5a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm11 0a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm-5.5 2.3c-1.5 0-2.8-.7-3.5-1.8 1-.4 2.2-.6 3.5-.6s2.5.2 3.5.6c-.7 1.1-2 1.8-3.5 1.8zm0-3.3c-1.4 0-2.5.7-2.5 1.6s1.1 1.6 2.5 1.6 2.5-.7 2.5-1.6-1.1-1.6-2.5-1.6zM8.9 18h6.2c.5 0 .9.4.9.9s-.4.9-.9.9h-1.2v1.9a.9.9 0 01-1.8 0v-1.9h-.4v1.9a.9.9 0 01-1.8 0v-1.9H8.9a.9.9 0 010-1.8z" />
          </svg>
        ),
        color: '#FF4500',
        onClick: () =>
          open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`),
      },
      {
        key: 'tumblr' as SocialName,
        label: 'Tumblr',
        icon: (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M14.2 21.2H9.8v-5.5h.8v-.9h-3.8V3.6c.1-.8.4-1.5.9-2.1h5.3V4h-3.2c-.1 0-.2.1-.2.2v3.4h3.7v3.7h-3.7v4.4h4.4v5.5zm7.8-12.9l-1.6 5.4h-5.2l1.6-5.4z" />
          </svg>
        ),
        color: '#36465D',
        onClick: () =>
          open(`https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodeURIComponent(url)}`),
      },
    ],
    igWeb,
  }
}

export default function FloatingContact() {
  const { t, lang } = useLocale()
  const [qrOpen, setQrOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const labels: Record<SocialName, string> =
    lang === 'zh'
      ? { facebook: 'Facebook', instagram: 'Instagram', x: 'X（推特）', reddit: 'Reddit', tumblr: 'Tumblr' }
      : lang === 'es'
      ? { facebook: 'Facebook', instagram: 'Instagram', x: 'X', reddit: 'Reddit', tumblr: 'Tumblr' }
      : lang === 'fr'
      ? { facebook: 'Facebook', instagram: 'Instagram', x: 'X', reddit: 'Reddit', tumblr: 'Tumblr' }
      : lang === 'ar'
      ? { facebook: 'فيسبوك', instagram: 'إنستغرام', x: 'إكس', reddit: 'ريديت', tumblr: 'تامبلر' }
      : { facebook: 'Facebook', instagram: 'Instagram', x: 'X (Twitter)', reddit: 'Reddit', tumblr: 'Tumblr' }

  // 当前语言下每个平台的提示文案
  const hint =
    lang === 'zh'
      ? { fb: '分享到 Facebook', ig: '复制链接并打开 Instagram', x: '分享到 X', rd: '分享到 Reddit', tb: '分享到 Tumblr', done: '链接已复制！到 Instagram 粘贴分享' }
      : lang === 'es'
      ? { fb: 'Compartir en Facebook', ig: 'Copia el enlace y abre Instagram', x: 'Compartir en X', rd: 'Compartir en Reddit', tb: 'Compartir en Tumblr', done: '¡Enlace copiado! Pégalo en Instagram' }
      : lang === 'fr'
      ? { fb: 'Partager sur Facebook', ig: 'Copiez le lien et ouvrez Instagram', x: 'Partager sur X', rd: 'Partager sur Reddit', tb: 'Partager sur Tumblr', done: 'Lien copié ! Collez-le dans Instagram' }
      : lang === 'ar'
      ? { fb: 'مشاركة على فيسبوك', ig: 'انسخ الرابط وافتح إنستغرام', x: 'مشاركة على إكس', rd: 'مشاركة على ريديت', tb: 'مشاركة على تامبلر', done: 'تم نسخ الرابط! ألصقه في إنستغرام' }
      : { fb: 'Share on Facebook', ig: 'Copy link and open Instagram', x: 'Share on X', rd: 'Share on Reddit', tb: 'Share on Tumblr', done: 'Link copied! Paste it in Instagram' }

  const socials = socialTargets()

  return (
    <>
      {/* ===== 右侧悬浮联系面板（随滚动常驻） ===== */}
      <div className="fixed z-40 hidden md:flex flex-col items-end gap-2 top-1/2 -translate-y-1/2 end-4">
        {/* WhatsApp */}
        <a
          href={waLink('Hi BuyTCN! I would like to buy from China.')}
          target="_blank"
          rel="noopener noreferrer"
          title={hint.fb.replace('Facebook', 'WhatsApp')}
          className="group w-[240px] bg-white/95 backdrop-blur border border-gray-100 shadow-lg rounded-2xl p-3 flex items-center gap-3 hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.1.55 4.09 1.62 5.83L2 22l4.42-1.57a13.7 13.7 0 006.03 1.45h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02A9.83 9.83 0 0012.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-2.63.93.94-2.56-.2-.31a8.24 8.24 0 01-1.26-4.4c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-gray-900 leading-tight">WhatsApp</p>
            <p className="text-xs text-gray-500 truncate">{CONTACTS.whatsappDisplay}</p>
          </div>
        </a>

        {/* Email */}
        <a
          href={mailtoLink('BuyTCN inquiry', '')}
          className="group w-[240px] bg-white/95 backdrop-blur border border-gray-100 shadow-lg rounded-2xl p-3 flex items-center gap-3 hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-gray-900 leading-tight">Email</p>
            <p className="text-xs text-gray-500 truncate">{CONTACTS.email}</p>
          </div>
        </a>

        {/* WeChat */}
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="group w-[240px] bg-white/95 backdrop-blur border border-gray-100 shadow-lg rounded-2xl p-3 flex items-center gap-3 hover:shadow-xl hover:-translate-y-0.5 transition-all text-start cursor-pointer"
        >
          <div className="w-10 h-10 bg-[#07C160] rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
              <path d="M8.7 4C5 4 2 6.6 2 9.8c0 1.8 1 3.4 2.5 4.4l-.6 2 2.2-1.1c.8.3 1.7.4 2.6.4h.4c-.2-.5-.4-1-.4-1.6 0-2.6 2.5-4.7 5.6-4.7h.4C14.5 5.9 11.9 4 8.7 4zM6.5 8.4a.9.9 0 110-1.8.9.9 0 010 1.8zm4.4 0a.9.9 0 110-1.8.9.9 0 010 1.8zM22 14c0-2.7-2.5-4.9-5.6-4.9S10.8 11.3 10.8 14s2.5 4.9 5.6 4.9c.7 0 1.4-.1 2-.3l1.9 1-.5-1.7C20.9 16.9 22 15.6 22 14zm-7.5-1.4a.8.8 0 110-1.6.8.8 0 010 1.6zm3.8 0a.8.8 0 110-1.6.8.8 0 010 1.6z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-gray-900 leading-tight">WeChat</p>
            <p className="text-xs text-gray-500 truncate">{t.contact.wxTitle} · {CONTACTS.wechat}</p>
          </div>
          <span className="ms-auto text-[10px] font-semibold text-[#07C160]">QR</span>
        </button>
      </div>

      {/* ===== 右上角分享（桌面：屏幕右上角；手机：右下堆叠在联系条上方） ===== */}
      <div className="md:fixed md:top-24 md:end-4 md:z-40 flex md:block">
        {/* 桌面圆形按钮 */}
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setShareOpen(!shareOpen)}
            aria-label="Share this page"
            className="w-11 h-11 bg-white/95 backdrop-blur border border-gray-100 shadow-lg rounded-full flex items-center justify-center text-gray-700 hover:text-red-600 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
          </button>
          {shareOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
              <div className="absolute end-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide px-2 py-1.5">
                  {lang === 'zh' ? '分享此页面' : 'Share this page'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {socials.list.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        s.onClick()
                        if (s.key === 'instagram') {
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2500)
                        } else {
                          setShareOpen(false)
                        }
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      title={hint[s.key === 'facebook' ? 'fb' : s.key === 'x' ? 'x' : s.key === 'reddit' ? 'rd' : s.key === 'tumblr' ? 'tb' : 'ig']}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      >
                        {s.icon}
                      </span>
                      <span className="truncate">{labels[s.key]}</span>
                    </button>
                  ))}
                </div>
                {copied && <p className="text-[11px] text-green-600 font-semibold px-2 pt-1.5">{hint.done}</p>}
              </div>
            </>
          )}
        </div>

        {/* 移动端：右下角小条（联系面板也在右下，堆叠其上方） */}
        <div className="md:hidden fixed bottom-3 end-3 z-40 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setShareOpen(!shareOpen)}
            aria-label="Share this page"
            className="w-10 h-10 bg-white shadow-lg border border-gray-100 rounded-full flex items-center justify-center text-gray-700 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
          </button>
          <div className="flex flex-col gap-2">
            <a
              href={waLink('Hi BuyTCN! I would like to buy from China.')}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-11 h-11 bg-[#25D366] shadow-lg rounded-full flex items-center justify-center text-white cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.1.55 4.09 1.62 5.83L2 22l4.42-1.57a13.7 13.7 0 006.03 1.45h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02A9.83 9.83 0 0012.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-2.63.93.94-2.56-.2-.31a8.24 8.24 0 01-1.26-4.4c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24z" />
              </svg>
            </a>
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              aria-label="WeChat"
              className="w-11 h-11 bg-[#07C160] shadow-lg rounded-full flex items-center justify-center text-white cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M8.7 4C5 4 2 6.6 2 9.8c0 1.8 1 3.4 2.5 4.4l-.6 2 2.2-1.1c.8.3 1.7.4 2.6.4h.4c-.2-.5-.4-1-.4-1.6 0-2.6 2.5-4.7 5.6-4.7h.4C14.5 5.9 11.9 4 8.7 4zM6.5 8.4a.9.9 0 110-1.8.9.9 0 010 1.8zm4.4 0a.9.9 0 110-1.8.9.9 0 010 1.8zM22 14c0-2.7-2.5-4.9-5.6-4.9S10.8 11.3 10.8 14s2.5 4.9 5.6 4.9c.7 0 1.4-.1 2-.3l1.9 1-.5-1.7C20.9 16.9 22 15.6 22 14zm-7.5-1.4a.8.8 0 110-1.6.8.8 0 010 1.6zm3.8 0a.8.8 0 110-1.6.8.8 0 010 1.6z" />
              </svg>
            </button>
            <a
              href={mailtoLink('BuyTCN inquiry', '')}
              aria-label="Email"
              className="w-11 h-11 bg-blue-500 shadow-lg rounded-full flex items-center justify-center text-white cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </a>
          </div>
        </div>
        {/* 移动端分享弹窗 */}
        {shareOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setShareOpen(false)}>
            <div
              className="bg-white w-full rounded-t-3xl p-5 pb-8 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-900">
                  {lang === 'zh' ? '分享 BuyTCN' : lang === 'es' ? 'Compartir BuyTCN' : lang === 'fr' ? 'Partager BuyTCN' : lang === 'ar' ? 'مشاركة BuyTCN' : 'Share BuyTCN'}
                </p>
                <button type="button" onClick={() => setShareOpen(false)} aria-label="Close" className="text-gray-400 text-lg">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {socials.list.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={async () => {
                      s.onClick()
                      if (s.key === 'instagram') {
                        setCopied(true)
                        setTimeout(() => { setShareOpen(false); setCopied(false) }, 1500)
                      } else {
                        setShareOpen(false)
                      }
                    }}
                    className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: s.color }}>
                      {s.icon}
                    </span>
                    <div className="text-start min-w-0">
                      <p className="truncate">{labels[s.key]}</p>
                      <p className="text-[10px] text-gray-400 font-normal truncate">
                        {hint[s.key === 'facebook' ? 'fb' : s.key === 'x' ? 'x' : s.key === 'reddit' ? 'rd' : s.key === 'tumblr' ? 'tb' : 'ig']}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {copied && <p className="mt-3 text-xs text-green-600 font-semibold">{hint.done}</p>}
            </div>
          </div>
        )}
      </div>

      {/* ===== WeChat 二维码弹窗 ===== */}
      {qrOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-6" onClick={() => setQrOpen(false)}>
          <div className="bg-white rounded-3xl p-7 max-w-xs w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-2xl mb-1.5">💚</div>
            <p className="font-bold text-gray-900 text-base mb-0.5">{t.contact.wxTitle}</p>
            <p className="text-xs text-gray-500 mb-3">{t.contact.wxScan}</p>
            <img
              src="/wechat-qr-v2.jpg"
              alt="WeChat QR"
              className="w-full rounded-2xl border border-gray-100 mb-3"
            />
            <p className="text-sm text-gray-700 mb-1">
              WeChat ID: <b className="text-[#07C160]">{CONTACTS.wechat}</b>
            </p>
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="mt-3 px-6 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 transition-colors cursor-pointer"
            >
              ✕ {lang === 'zh' ? '关闭' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
