/**
 * Blog 路由入口
 *
 * 设计原则：不引入 react-router（保持原项目零路由依赖的轻量特性）。
 * 用 pathname 判断 + history.pushState 拦截站内链接，实现 blog 区域的路由：
 *
 *   /blog                        → BlogList
 *   /blog/                       → BlogList
 *   /blog/category/<name>        → BlogList（带分类筛选）
 *   /blog/admin                  → BlogAdmin
 *   /blog/<slug>                 → BlogPost
 *
 * 非 /blog 开头的路径返回 null，交由原来的单页站点渲染。
 */

import { useEffect, useState } from 'react'
import BlogList from './BlogList'
import BlogPost from './BlogPost'
import BlogAdmin from './BlogAdmin'

/** 去掉语言前缀：/zh/blog/xxx → /blog/xxx */
function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(zh|es|fr|ar)(?=\/|$)/, '') || '/'
}

export function useBlogRoute() {
  const [path, setPath] = useState(() => stripLocale(window.location.pathname))

  useEffect(() => {
    const onPop = () => setPath(stripLocale(window.location.pathname))

    // 拦截站内 <a> 点击，避免整页刷新（保持 SPA 体验）
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement)?.closest?.('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('//')) return
      // 仅接管 blog 区域内的跳转
      const target = stripLocale(href.split('?')[0].split('#')[0])
      const current = stripLocale(window.location.pathname)
      if (!target.startsWith('/blog') && !current.startsWith('/blog')) return
      e.preventDefault()
      window.history.pushState({}, '', href)
      setPath(stripLocale(href.split('?')[0].split('#')[0]))
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }

    window.addEventListener('popstate', onPop)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return path
}

/** 根据路径渲染对应页面；不是 blog 路径则返回 null */
export default function BlogRouter() {
  const path = useBlogRoute()

  if (!path.startsWith('/blog')) return null

  // 归一化末尾斜杠
  const clean = path.replace(/\/+$/, '') || '/blog'
  // /blog 或 /blog/
  if (clean === '/blog') return <BlogList key="blog-all" />
  // /blog/admin
  if (clean === '/blog/admin') return <BlogAdmin key="blog-admin" />
  // /blog/category/<name> —— 旧站 URL，交给列表页做初筛
  if (clean.startsWith('/blog/category/')) {
    const raw = clean.slice('/blog/category/'.length)
    let name = raw
    try {
      name = decodeURIComponent(raw)
    } catch {
      /* 保留原始值 */
    }
    return <BlogList key={`blog-cat-${name}`} initialCategory={name} />
  }
  // /blog/<slug>
  const slug = clean.slice('/blog/'.length)
  if (slug) return <BlogPost key={`blog-post-${slug}`} slug={slug} />

  return <BlogList key="blog-all" />
}
