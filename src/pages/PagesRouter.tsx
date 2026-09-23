import { useEffect } from 'react'
import StaticPage from './StaticPage'
import PaymentPage from './PaymentPage'
import { sitePageForPath } from '../content/site-content'

/**
 * PagesRouter — 静态内容页路由（新增，不改动 BlogRouter / landing Site）
 *
 * 覆盖：
 *   /pricing/   /payment/   /faq/   /business/   /about/
 * 末尾斜杠可选；/zh/xx 之类的语言前缀会被剥掉后再匹配（当前只恢复了英文版）。
 *
 * 匹配不到时返回 null，由 App 的 BlogSwitch 回落到原单页站点。
 */

/** 拼出「不整页刷新」的站内跳转：目标是否由 SPA 接管 */
function shouldIntercept(href: string): boolean {
  if (!href.startsWith('/') || href.startsWith('//')) return false
  const path = href.split('#')[0].split('?')[0]
  // 真实静态文件（public/ 下的产物）交给浏览器原生跳转
  if (path.startsWith('/assets/')) return false
  if (path === '/service-card') return false
  if (/\.[a-z0-9]{2,5}$/i.test(path)) return false
  return true
}

/** 平滑滚动到锚点；目标元素可能还没渲染出来，所以重试若干帧 */
function scrollToHash(hash: string) {
  if (!hash || hash === '#') return
  const id = hash.slice(1)
  let tries = 0
  const tick = () => {
    let el: HTMLElement | null = null
    try {
      el = document.getElementById(id) || (document.querySelector(`[name="${id}"]`) as HTMLElement | null)
    } catch {
      el = document.getElementById(id)
    }
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (tries++ < 90) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

/**
 * 站内点击拦截：把 /pricing/、/#contact、#process 这类链接变成 SPA 跳转，
 * 避免整页刷新。BlogRouter 自己的拦截器若已处理（defaultPrevented），这里直接跳过。
 */
function useSpaLinks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement)?.closest?.('a') as HTMLAnchorElement | null
      if (!a) return
      if (a.target && a.target !== '_self') return
      if (a.hasAttribute('download')) return
      const href = a.getAttribute('href')
      if (!href) return

      // 纯锚点：#process
      if (href.startsWith('#')) {
        e.preventDefault()
        window.history.pushState({}, '', window.location.pathname + window.location.search + href)
        scrollToHash(href)
        return
      }

      if (!shouldIntercept(href)) return

      e.preventDefault()
      const hash = href.includes('#') ? '#' + href.split('#')[1] : ''
      window.history.pushState({}, '', href)
      if (hash) {
        scrollToHash(hash)
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' })
        window.scrollTo(0, 0)
      }
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
}

export default function PagesRouter({ path }: { path: string }) {
  useSpaLinks()
  const page = sitePageForPath(path)
  if (!page) return null
  if (page.key === 'payment') return <PaymentPage key="payment" />
  return <StaticPage key={page.key} page={page} />
}
