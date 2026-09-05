// Centralised contact details — only shown AFTER the customer pays the $1 unlock fee.
// Never hardcode these anywhere else in the UI before unlock.

export const CONTACTS = {
  // 电话（仅国内 / 页面不直接展示，解锁后显示）
  phoneCN: '17307401897',
  phoneCNDisplay: '+86 173 0740 1897',
  // WhatsApp（沿用旧号 +86 153 8759 2595）
  whatsappNum: '8615387592595',
  whatsappDisplay: '+86 153 8759 2595',
  // 微信 ID
  wechat: 'bshine01',
  // 邮箱（对外统一用域名邮箱 service@buytcn.com，经 Cloudflare Email Routing 转发至 yangmin7823@gmail.com）
  email: 'service@buytcn.com',
  // PayPal 收款 —— ★ $1 支付
  // 方式A：Hosted Buttons 内嵌按钮（推荐，页面内直接支付）：
  paypalClientId: 'BAA-QTpqyxkgHeTVWDEcVOYwtpCMNjH5gvH1D02OQ90qjmThu1obDPKnSGJMN4yYafmCBtgTvO5KkT15MA',
  paypalHostedId: 'L5ZG2ACWVPZ8Q',
  // 方式B：完整跳转链接（paypal.com/ncp/payment/... 或 paypal.me/xxx/1），未配置时用方式A的hosted按钮，两者皆无则回退演示
  paypalLink: 'https://www.paypal.com/ncp/payment/L5ZG2ACWVPZ8Q',
} as const

export function waLink(text: string): string {
  return `https://wa.me/${CONTACTS.whatsappNum}?text=${encodeURIComponent(text)}`
}

export function mailtoLink(subject: string, body: string): string {
  return `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// $1 unlock payment link (PayPal payment link / hosted button / PayPal.me). Returns null when not configured.
export function paypalUnlockLink(): string | null {
  if (CONTACTS.paypalLink) return CONTACTS.paypalLink
  if (CONTACTS.paypalHostedId && CONTACTS.paypalClientId) return `https://www.paypal.com/ncp/payment/${CONTACTS.paypalHostedId}`
  return null
}
