import { useState } from 'react'
import { CONTACTS, waLink } from '../lib/contacts'

export default function PaymentQr({ onPaid }: { onPaid?: () => void }) {
  const [showContacts, setShowContacts] = useState(false)
  return (
    <div className="mx-auto max-w-xl text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Pay BuyTCN by QR code</h1>
      <p className="text-xl font-semibold text-blue-700 mb-3">For this payment: CNY ¥70 = US$10</p>
      <p className="text-base text-gray-600 mb-5">Save this QR code and scan it with Alipay or a supported remittance app. For other order amounts, confirm the amount with BuyTCN before paying.</p>
      <a href="/payments/alipay-collect.png" target="_blank" rel="noopener noreferrer">
        <img src="/payments/alipay-collect.png" alt="BuyTCN Alipay+ Flash Collect QR code, recipient MIN YANG, CNY 70" className="mx-auto w-full max-w-sm rounded-2xl" />
      </a>
      <a href="/payments/alipay-collect.png" download="BuyTCN-payment-QR.png" className="inline-block my-4 text-blue-700 underline">Download QR code</a>
      <button type="button" onClick={() => { setShowContacts(true); onPaid?.() }} className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">I have paid — contact BuyTCN</button>
      {showContacts && (
        <div className="mt-5 rounded-xl bg-blue-50 p-5 text-left" aria-live="polite">
          <h2 className="text-xl font-bold mb-3">Send your payment receipt</h2>
          <p className="mb-3 text-gray-700">Include your order or sourcing request number. BuyTCN will confirm receipt of funds manually.</p>
          <p className="mb-2">WhatsApp: <a href={waLink('Hi BuyTCN, I have paid by QR code. I would like to send my receipt and order details.')} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{CONTACTS.whatsappDisplay}</a></p>
          <p>Email: <a href={`mailto:${CONTACTS.email}`} className="text-blue-700 underline">{CONTACTS.email}</a></p>
          <p className="text-sm text-gray-600 mt-3">Clicking this button does not confirm payment. We begin work after verifying the funds.</p>
        </div>
      )}
    </div>
  )
}
