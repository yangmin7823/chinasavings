import { useEffect } from 'react'
import SiteNav from '../sections/SiteNav'
import SiteFooter from '../sections/SiteFooter'
import type { SitePage } from '../content/site-content'

/* ------------------------------------------------------------------ */
/* SEO：把恢复页的 title / description / canonical / JSON-LD 写回 head  */
/*                                                                     */
/* 落地页（index.html）的默认值先备份一次，离开静态页时还原，           */
/* 这样从 /pricing/ 返回首页不会残留“Transparent, Tiered…”的标题。      */
/* ------------------------------------------------------------------ */
type HeadDefaults = {
  title: string
  description: string
  canonical: string
  ogTitle: string
  ogDescription: string
  ogUrl: string
}

const DEFAULTS: HeadDefaults = {
  title: '',
  description: '',
  canonical: '',
  ogTitle: '',
  ogDescription: '',
  ogUrl: '',
}
let captured = false

function metaEl(attr: 'name' | 'property', key: string): HTMLMetaElement | null {
  return document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  const el = metaEl(attr, key)
  if (el) el.setAttribute('content', value)
}

function canonicalEl(): HTMLLinkElement | null {
  return document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
}

function captureDefaults(): HeadDefaults {
  return {
    title: document.title,
    description: metaEl('name', 'description')?.getAttribute('content') || '',
    canonical: canonicalEl()?.getAttribute('href') || '',
    ogTitle: metaEl('property', 'og:title')?.getAttribute('content') || '',
    ogDescription: metaEl('property', 'og:description')?.getAttribute('content') || '',
    ogUrl: metaEl('property', 'og:url')?.getAttribute('content') || '',
  }
}

function restoreDefaults(d: HeadDefaults) {
  document.title = d.title
  setMeta('name', 'description', d.description)
  if (d.canonical) {
    const el = canonicalEl()
    if (el) el.setAttribute('href', d.canonical)
  }
  setMeta('property', 'og:title', d.ogTitle)
  setMeta('property', 'og:description', d.ogDescription)
  setMeta('property', 'og:url', d.ogUrl)
}

export function useSeo(page: Pick<SitePage, 'title' | 'description' | 'canonical' | 'jsonLd'>) {
  const { title, description, canonical, jsonLd } = page

  useEffect(() => {
    if (!captured) {
      Object.assign(DEFAULTS, captureDefaults())
      captured = true
    }

    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonical)
    const c = canonicalEl()
    if (c) c.setAttribute('href', canonical)

    const nodes: HTMLScriptElement[] = []
    for (const item of jsonLd) {
      const s = document.createElement('script')
      s.type = 'application/ld+json'
      s.setAttribute('data-site-page', '1')
      s.textContent = typeof item === 'string' ? item : JSON.stringify(item)
      document.head.appendChild(s)
      nodes.push(s)
    }

    return () => {
      nodes.forEach((n) => n.remove())
      restoreDefaults(DEFAULTS)
    }
  }, [title, description, canonical, jsonLd])
}

/* ------------------------------------------------------------------ */
/* 通用静态页：SiteNav + 旧站正文（原样注入）+ SiteFooter + 浮动联系按钮 */
/* ------------------------------------------------------------------ */
export default function StaticPage({ page }: { page: SitePage }) {
  useSeo(page)

  return (
    <div className="min-h-screen bg-white">
      <SiteNav active={page.active} />
      <main dangerouslySetInnerHTML={{ __html: page.html }} />
      <SiteFooter active={page.active} />
      {page.float && <div dangerouslySetInnerHTML={{ __html: page.float }} />}
    </div>
  )
}
