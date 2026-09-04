// ===== Package Tracking Service Layer =====
// Unified structure for both demo (mock) mode and real carrier-aggreggator API mode.
//
// REAL MODE: To enable live tracking, deploy the Cloudflare Pages Function at
// `functions/api/track.ts` and set these environment variables in Cloudflare:
//   TRACKING_PROVIDER=17track   (or kd100 / trackingmore)
//   17TRACK_KEY=xxxx            (17TRACK API key, header `17token`)
// Then this module calls `/api/track?no=xxx&carrier=xxx` and returns live data.
// Without keys this page runs in DEMO mode with sample tracking data.

export interface Carrier {
  code: string
  name: string
  kind: 'domestic' | 'intl' | 'auto'
}

export const CARRIERS: Carrier[] = [
  { code: 'auto', name: 'Auto Detect', kind: 'auto' },
  // International / cross-border (China → worldwide: what your customers use)
  { code: 'cainiao', name: 'Cainiao (菜鸟)', kind: 'intl' },
  { code: 'yanwen', name: 'Yanwen (燕文)', kind: 'intl' },
  { code: 'yunexpress', name: 'YunExpress (云途)', kind: 'intl' },
  { code: 'usps', name: 'USPS', kind: 'intl' },
  { code: 'dhl', name: 'DHL Express', kind: 'intl' },
  { code: 'fedex', name: 'FedEx', kind: 'intl' },
  { code: 'ups', name: 'UPS', kind: 'intl' },
  { code: 'dpd', name: 'DPD', kind: 'intl' },
  // Domestic China express (Taobao/1688/PDD → our warehouse)
  { code: 'shunfeng', name: 'SF Express (顺丰)', kind: 'domestic' },
  { code: 'zhongtong', name: 'ZTO (中通)', kind: 'domestic' },
  { code: 'yuantong', name: 'YTO (圆通)', kind: 'domestic' },
  { code: 'yunda', name: 'Yunda (韵达)', kind: 'domestic' },
  { code: 'jd', name: 'JD Logistics (京东物流)', kind: 'domestic' },
  { code: 'ems', name: 'China EMS', kind: 'domestic' },
]

export interface TrackEvent {
  time: string
  location: string
  // semantic event code, one of:
  // 'delivered' | 'out_for_delivery' | 'in_transit' | 'customs' | 'info_received' | 'picked_up'
  code: string
  description: string
}

export type PackageStatus = 'info_received' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception'

export interface TrackResult {
  trackingNo: string
  carrierCode: string
  carrierName: string
  status: PackageStatus
  destination: string
  demo: boolean
  events: TrackEvent[]
}

export interface QueryParams {
  trackingNo: string
  carrierCode: string
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Query one tracking number.
 * Demo mode (no live key configured): returns a deterministic sample journey so
 * the full UI can be tested. Go live by deploying functions/api/track.ts + env keys.
 */
export async function queryTracking(params: QueryParams): Promise<TrackResult> {
  const { trackingNo, carrierCode } = params
  const carrier = CARRIERS.find((c) => c.code === carrierCode) ?? CARRIERS[0]

  try {
    // Always attempt the serverless proxy first (real mode after deployment).
    const res = await fetch(
      `/api/track?no=${encodeURIComponent(trackingNo)}&carrier=${encodeURIComponent(carrier.code)}`,
      { signal: AbortSignal.timeout(3500) },
    )
    if (res.ok) {
      const data = await res.json()
      if (data && data.events) return { ...data, demo: false }
    }
  } catch {
    /* serverless proxy not deployed → demo mode below */
  }

  await delay(700)
  return buildDemo(trackingNo, carrier)
}

/** Simple stable hash of the tracking number → pick a journey "progress" so
 *  different numbers show different realistic states. */
function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function fmtTime(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 16)
}

function buildDemo(trackingNo: string, carrier: Carrier): TrackResult {
  const intl = carrier.kind !== 'domestic'
  const now = new Date()
  const H = 3600000

  // Full staged journey template (intl parcel China → customer country)
  const stageTimes = intl
    ? [96, 72, 60, 48, 30, 18, 6, 0]       // hours ago
    : [48, 30, 12, 2]
  const stage = (hashSeed(trackingNo) % stageTimes.length) + 1 // 1..N → how far along

  const ev = (i: number, location: string, code: string, description: string): TrackEvent => ({
    time: fmtTime(new Date(now.getTime() - stageTimes[i] * H)),
    location,
    code,
    description,
  })

  let events: TrackEvent[]
  let status: PackageStatus = 'info_received'
  let destination = ''

  if (intl) {
    destination = 'United States'
    events = [
      ev(0, 'Shenzhen, CN', 'info_received', `Shipment info received by ${carrier.name}`),
      ev(1, 'Shenzhen, CN', 'in_transit', 'Arrived at consolidation warehouse — QC photos taken'),
      ev(2, 'Guangzhou, CN', 'in_transit', 'Departed consolidation warehouse → international hub'),
      ev(3, 'Guangzhou, CN', 'customs', 'Export customs cleared'),
      ev(4, 'In flight ✈️', 'in_transit', 'International flight departed'),
      ev(5, 'Destination country', 'customs', 'Import customs processing — duties included (DDP)'),
      ev(6, 'Destination country', 'out_for_delivery', 'With local courier — out for delivery'),
      ev(7, 'Your city', 'delivered', 'Delivered & signed. Enjoy!'),
    ]
    if (stage >= 8) status = 'delivered'
    else if (stage >= 7) status = 'out_for_delivery'
    else if (stage >= 5) status = 'in_transit'
    else if (stage >= 2) status = 'in_transit'
    events = events.slice(0, stage)
  } else {
    destination = 'Changsha, China (our warehouse)'
    events = [
      ev(0, 'Yiwu, CN', 'picked_up', `Seller shipped via ${carrier.name}`),
      ev(1, 'Hangzhou, CN', 'in_transit', 'Arrived at regional sorting center'),
      ev(2, 'Changsha, CN', 'in_transit', 'In transit to ChinaSavings warehouse'),
      ev(3, 'Changsha, CN', 'delivered', 'Delivered to warehouse — QC scheduled'),
    ]
    if (stage >= 4) status = 'delivered'
    else if (stage >= 2) status = 'in_transit'
    events = events.slice(0, stage)
  }

  return {
    trackingNo,
    carrierCode: carrier.code,
    carrierName: carrier.name,
    status,
    destination,
    demo: true,
    events,
  }
}
