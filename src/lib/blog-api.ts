/**
 * BuyTCN Blog — 前端 API 客户端
 *
 * 所有网络请求集中在这里，组件不直接写 fetch。
 * 接口契约与 functions/api/blog/** 一一对应。
 */

const BASE = '/api/blog'

export interface BlogListItem {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  featured_image: string | null
  reading_time: number | null
  published_at: number
  updated_at: number
  tags: string[]
}

export interface BlogFaqItem {
  q: string
  a: string
}

export interface BlogInternalLink {
  slug: string
}

export interface BlogPost extends BlogListItem {
  content: string
  seo_title: string
  seo_description: string
  primary_keyword: string
  secondary_keywords: string[]
  sources: string[]
  faq: BlogFaqItem[]
  internal_links: BlogInternalLink[]
  word_count: number
  quality_score: number | null
}

export class BlogApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'BlogApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch (e) {
    throw new BlogApiError('网络请求失败，请检查连接后重试。', 0)
  }

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    throw new BlogApiError(`服务器返回了非 JSON 响应（HTTP ${res.status}）`, res.status)
  }

  const payload = data as { ok?: boolean; error?: string }

  if (!res.ok || payload?.ok === false) {
    throw new BlogApiError(payload?.error || `请求失败（HTTP ${res.status}）`, res.status)
  }
  return data as T
}

/* ------------------------------ 公开读接口 ------------------------------ */

export interface ListParams {
  limit?: number
  page?: number
  category?: string
  tag?: string
  q?: string
}

export async function getPosts(params: ListParams = {}): Promise<{
  posts: BlogListItem[]
  meta: { total: number; page: number; pages: number; limit: number }
}> {
  const qs = new URLSearchParams()
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.page) qs.set('page', String(params.page))
  if (params.category) qs.set('category', params.category)
  if (params.tag) qs.set('tag', params.tag)
  if (params.q) qs.set('q', params.q)
  const suffix = qs.toString() ? `?${qs}` : ''
  return request(`/posts${suffix}`)
}

export async function getPost(slug: string): Promise<BlogPost> {
  const data = await request<{ post: BlogPost }>(`/posts/${encodeURIComponent(slug)}`)
  return data.post
}

export async function getCategories(): Promise<{ name: string; count: number }[]> {
  const data = await request<{ categories: { name: string; count: number }[] }>('/categories')
  return data.categories
}

/* -------------------------------- 工具 -------------------------------- */

export function formatDate(ts: number): string {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}
