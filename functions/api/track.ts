// Cloudflare Pages Function — secure proxy for live package tracking.
// Deploy this file at `functions/api/track.ts` in your Cloudflare Pages project.
// Frontend calls `/api/track?no=<tracking>&carrier=<carrier>`; this proxy keeps
// your tracking API key secret (never bundled into the browser).
//
// Environment variables to set in Cloudflare Pages dashboard:
//   TRACKING_PROVIDER = 17track | kd100 | trackingmore
//   17TRACK_KEY       = your 17TRACK api key (sent as header `17token`)
//   KUAIDI100_KEY     = your kuaidi100 key      (for kd100)
//   KUAIDI100_CUSTOMER= your kuaidi100 customer (for kd100)
//   TRACKINGMORE_KEY  = your trackingmore key   (for trackingmore)
//
// This proxy returns a normalized payload matching src/lib/tracking.ts TrackResult.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequest(context: any): Promise<Response> {
  const url = new URL(context.request.url)
  const no = url.searchParams.get('no') || ''
  const carrier = url.searchParams.get('carrier') || 'auto'
  if (!no) {
    return json({ error: 'missing tracking number' }, 400)
  }

  const provider = (context.env.TRACKING_PROVIDER || '17track') as string
  try {
    if (provider === '17track') return await track17(context.env, no)
    if (provider === 'kd100') return await kd100(context.env, no)
    // trackingmore
    return await trackingMore(context.env, no)
  } catch (err) {
    return json({ error: 'tracking proxy failed', detail: String(err) }, 502)
  }
}

/* ---------- 17TRACK v2.4 ----------
 * Docs: https://api.17track.net/zh-cn/doc
 * v2.4 register/gettrackinfo 请求体为 JSON 数组：[{ "number": "..." }]
 * 认证头: 17token
 * 覆盖 3400+ 承运商（菜鸟/云途/燕文 + 国内快递）.
 */
async function track17(env: Record<string, string>, no: string) {
  const key = env['17TRACK_KEY']
  if (!key) return json({ error: '17TRACK_KEY not configured', demo: true }, 503)

  const BASE = 'https://api.17track.net/track/v2.4'
  const hdrs = { 'Content-Type': 'application/json', '17token': key }

  // 1) register（可重复注册，忽略已存在错误）
  await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify([{ number: no, auto_detection: true }]),
  }).catch(() => {})

  // 2) gettrackinfo
  const res = await fetch(`${BASE}/gettrackinfo`, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify([{ number: no }]),
  })
  const data: any = await res.json()
  if (data?.code !== 0) {
    return json({ error: data?.message || '17TRACK api error', code: data?.code, demo: false }, 200)
  }

  // v2.4 实测结构：data.accepted[0].track_info
  const item = (data?.data?.accepted || data?.data || [])[0] || {}
  const ti = item?.track_info || {}
  const latest = ti?.latest_status || {}
  // events 位于 track_info.tracking.providers[] 内（可能有多个承运商，合并）
  const providers: any[] = Array.isArray(ti?.tracking?.providers) ? ti.tracking.providers : []
  const provider = providers[0]?.provider || {}
  const rawEvents: any[] = (providers.flatMap?.((p: any) => p?.events || []) as any[]) || []

  const events = rawEvents.map((e: any) => {
    const loc = e.location
    const place =
      typeof loc === 'object' && loc
        ? [loc.city, loc.state, loc.country].filter(Boolean).join(', ')
        : typeof loc === 'string' && loc
          ? loc
          : e.location_raw || ''
    return {
      time: fmt17Time(e.time_iso || e.time || e.datetime || ''),
      location: place,
      code: map17Event(String(e.status_code ?? e.status ?? '')),
      description: e.description || e.text || '',
    }
  })

  const rawStatus = String(latest?.sub_status || latest?.status || 'Pending')
  const st = map17Status(rawStatus)
  return json({
    trackingNo: no,
    carrierCode: provider?.key ? String(provider.key) : 'auto',
    carrierName: provider?.name || 'Auto-detected carrier',
    status: st.delivered ? 'delivered' : st.out ? 'out_for_delivery' : st.info ? 'info_received' : 'in_transit',
    destination: events.length ? events[events.length - 1].location : '',
    demo: false,
    events,
  })
}

/* ---------- Kuaidi100 快递100 (poll free tier) ---------- */
async function kd100(env: Record<string, string>, no: string) {
  const key = env['KUAIDI100_KEY']
  const customer = env['KUAIDI100_CUSTOMER']
  if (!key || !customer) return json({ error: 'KUAIDI100_KEY not configured', demo: true }, 503)

  const crypto = await import('node:crypto')
  const param = JSON.stringify({ com: 'auto', num: no, resultv2: '4' })
  const sign = crypto.createHash('md5').update(param + key + customer).digest('hex').toUpperCase()

  const res = await fetch('https://poll.kuaidi100.com/poll/query.do', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ customer, sign, param }),
  })
  const data: any = await res.json()
  const events = (data?.data || []).map((e: any) => ({
    time: e.ftime || e.time || '',
    location: e.areaName || '',
    code: mapKd100(e.status || ''),
    description: e.context || '',
  }))

  return json({
    trackingNo: no,
    carrierCode: data?.com || 'auto',
    carrierName: data?.com || 'Auto-detected carrier',
    status: (data?.state === '3') ? 'delivered' : (data?.state === '4') ? 'exception' : 'in_transit',
    destination: events[events.length - 1]?.location || '',
    demo: false,
    events,
  })
}

/* ---------- TrackingMore ---------- */
async function trackingMore(env: Record<string, string>, no: string) {
  const key = env['TRACKINGMORE_KEY']
  if (!key) return json({ error: 'TRACKINGMORE_KEY not configured', demo: true }, 503)
  const res = await fetch('https://api.trackingmore.com/v4/trackings/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Trackingmore-Api-Key': key },
    body: JSON.stringify({ tracking_number: no }),
  })
  const data: any = await res.json()
  const t = data?.data || {}
  const events = (t?.events || []).map((e: any) => ({
    time: e.datetime || '',
    location: e.location || '',
    code: mapTM(e.status || ''),
    description: e.description || '',
  }))
  return json({
    trackingNo: no,
    carrierCode: t?.carrier_code || 'auto',
    carrierName: t?.carrier_code || 'Auto-detected carrier',
    status: t?.status || 'in_transit',
    destination: events[events.length - 1]?.location || '',
    demo: false,
    events,
  })
}

/* ---------- normalizers ---------- */
// 17TRACK ISO(UTC) → 客户本地友好时间
function fmt17Time(t: string): string {
  if (!t) return ''
  const d = new Date(t)
  if (isNaN(d.getTime())) return t.replace('T', ' ').slice(0, 16)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
// 17TRACK event-level status → semantic code for the timeline UI
function map17Event(code: string): string {
  const s = String(code)
  if (/delivered|10/i.test(s)) return 'delivered'
  if (/out.?for.?delivery|7/i.test(s)) return 'out_for_delivery'
  if (/info.?received|1|pending/i.test(s)) return 'info_received'
  if (/customs|清关|11|12/i.test(s)) return 'customs'
  if (/exception|exception|13|2/i.test(s)) return 'exception'
  if (/picked|揽收/i.test(s)) return 'picked_up'
  return 'in_transit'
}

function map17Status(code: string | number): { delivered: boolean; out: boolean; info: boolean } {
  const s = String(code)
  return {
    delivered: s === 'Delivered' || s === '10',
    out: s === 'Out for delivery' || s === '7',
    info: s === 'InfoReceived' || s === '1' || s === 'Pending',
  }
}

function mapKd100(status: string): string {
  // kuaidi100 states: 0在途 1揽收 2疑难 3签收 4退签 5派件 6退回 7转投 10待清关 11清关中 12已清关 13清关异常
  if (status === '3') return 'delivered'
  if (status === '5') return 'out_for_delivery'
  if (status === '1') return 'info_received'
  if (status === '11' || status === '12') return 'customs'
  if (status === '2' || status === '4' || status === '13') return 'exception'
  return 'in_transit'
}

function mapTM(status: string): string {
  const s = (status || '').toLowerCase()
  if (s.includes('delivered')) return 'delivered'
  if (s.includes('out for delivery')) return 'out_for_delivery'
  if (s.includes('pending') || s.includes('info received')) return 'info_received'
  if (s.includes('customs')) return 'customs'
  if (s.includes('exception') || s.includes('failed')) return 'exception'
  return 'in_transit'
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
