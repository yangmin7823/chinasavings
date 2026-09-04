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
  // 邮箱
  email: 'yangmin7823@gmail.com',
} as const

export function waLink(text: string): string {
  return `https://wa.me/${CONTACTS.whatsappNum}?text=${encodeURIComponent(text)}`
}

export function mailtoLink(subject: string, body: string): string {
  return `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
