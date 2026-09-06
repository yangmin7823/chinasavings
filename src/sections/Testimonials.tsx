import { useEffect, useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useUnlock } from '../lib/unlock'

function Stars({ count, size = 'w-4 h-4' }: { count: number; size?: string }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`${size} ${i < count ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

interface Review {
  id: string
  name: string
  country: string
  rating: number
  text: string
  photo: string | null
  createdAt: number
}

export default function Testimonials() {
  const { t } = useLocale()
  const { unlocked, requestUnlock } = useUnlock()
  const [live, setLive] = useState<Review[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [fName, setFName] = useState('')
  const [fCountry, setFCountry] = useState('')
  const [fRating, setFRating] = useState(5)
  const [fText, setFText] = useState('')
  const [fPhoto, setFPhoto] = useState<string | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    fetch('/api/reviews').then((r) => r.json()).then((d) => {
      if (alive && d && Array.isArray(d.reviews)) setLive(d.reviews)
    }).catch(() => { /* offline fallback to static */ })
    return () => { alive = false }
  }, [])

  const staticReviews = t.reviews.items

  // If live reviews exist, show live (verified). Otherwise fall back to static showcase.
  const showLive = live && live.length > 0
  const display = showLive ? live! : staticReviews

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { setErr(t.reviews.photoTooBig ?? 'Photo too large'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900
        let { width, height } = img
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        setFPhoto(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const openForm = () => {
    if (!unlocked) { requestUnlock(); return }
    setErr(''); setDone(false); setShowForm(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fName.trim() || !fText.trim()) { setErr(t.reviews.formReq ?? 'Please fill name and review.'); return }
    setSubmitting(true); setErr('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fName, country: fCountry, rating: fRating, text: fText, photo: fPhoto }),
      })
      const d = await res.json()
      if (d && d.ok) {
        setDone(true)
        setFName(''); setFCountry(''); setFText(''); setFPhoto(null); setFRating(5)
      } else {
        setErr(d?.error || 'Submit failed')
      }
    } catch { setErr('Network error — please try again.') }
    setSubmitting(false)
  }

  return (
    <section id="reviews" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.reviews.heading}</h2>
          <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-white border border-gray-100 rounded-2xl px-6 py-3 shadow-sm mb-5">
            <span className="text-2xl font-extrabold text-gray-900">4.9</span>
            <Stars count={5} />
            <span className="text-sm text-gray-500">{showLive ? `${t.reviews.verifiedLabel ?? 'Verified customer reviews'} · ${live!.length}` : t.reviews.ratingLabel}</span>
          </div>
          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            ✍️ {t.reviews.writeCta ?? 'Write a Review'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(display as any[]).map((r, idx) => {
            const name = showLive ? (r as Review).name : (r as any).name
            const country = showLive ? (r as Review).country : `${(r as any).flag ?? ''} ${(r as any).country ?? ''}`
            const rating = showLive ? (r as Review).rating : (r as any).rating
            const text = showLive ? (r as Review).text : (r as any).text
            const photo = showLive ? (r as Review).photo : null
            const service = showLive ? '' : (r as any).service
            return (
              <figure key={(r as any).id ?? idx} className={`bg-white rounded-2xl p-6 border transition-all duration-300 ${!showLive && idx === 0 ? 'border-red-200 shadow-lg shadow-red-100/40' : 'border-gray-100 hover:shadow-lg'}`}>
                <svg className="w-6 h-6 text-gray-200 mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                {photo && (
                  <img src={photo} alt={name} loading="lazy" className="w-full max-h-56 object-cover rounded-xl border border-gray-100 mb-3" />
                )}
                <blockquote className="text-sm text-gray-600 leading-relaxed mb-4">{text}</blockquote>
                <figcaption className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center text-sm">
                      {String(name).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">
                        {country} {showLive && <span className="text-green-600 font-medium">· ✓ {t.reviews.verifiedBadge ?? 'Verified'}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="flex justify-end"><Stars count={rating} /></div>
                    {service && <p className="text-[10px] text-gray-400 mt-0.5">{service}</p>}
                  </div>
                </figcaption>
              </figure>
            )
          })}
        </div>

        {!showLive && (
          <p className="text-center text-xs text-gray-400 mt-8">{t.reviews.trustNote}</p>
        )}

        {showForm && (
          <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-gray-900">{t.reviews.formTitle ?? 'Share Your Experience'}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl" aria-label="Close">✕</button>
              </div>
              {done ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mt-4">
                  <div className="text-4xl mb-2">🙏</div>
                  <p className="font-bold text-green-800 mb-1">{t.reviews.thanks ?? 'Thank you!'}</p>
                  <p className="text-sm text-green-700">{t.reviews.pendingNote ?? 'Your review has been submitted and will appear once verified.'}</p>
                  <button onClick={() => setShowForm(false)} className="mt-4 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700">{t.reviews.closeBtn ?? 'Close'}</button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4 mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{t.reviews.formName ?? 'Your Name'}</label>
                      <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="e.g. John S." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{t.reviews.formCountry ?? 'Country'}</label>
                      <input value={fCountry} onChange={(e) => setFCountry(e.target.value)} placeholder="e.g. United States" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t.reviews.formRating ?? 'Rating'}</label>
                    <div className="flex gap-1" dir="ltr">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setFRating(n)} aria-label={`${n} star`}>
                          <svg className={`w-7 h-7 ${n <= fRating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t.reviews.formText ?? 'Your Review'}</label>
                    <textarea rows={4} value={fText} onChange={(e) => setFText(e.target.value)} placeholder={t.reviews.formTextPh ?? 'What did you order? How was the QC, shipping, quality?'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t.reviews.formPhoto ?? 'Photo (optional)'}</label>
                    {fPhoto ? (
                      <div className="flex items-center gap-3">
                        <img src={fPhoto} className="w-16 h-16 rounded-lg object-cover border border-gray-100" alt="preview" />
                        <button type="button" onClick={() => setFPhoto(null)} className="text-xs text-red-500 hover:underline">{t.reviews.removePhoto ?? 'Remove'}</button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-red-200 hover:text-gray-500 cursor-pointer">
                        📷 {t.reviews.uploadHint ?? 'Upload a photo of your order'}
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                      </label>
                    )}
                  </div>
                  {err && <p className="text-xs text-red-500">⚠️ {err}</p>}
                  <button type="submit" disabled={submitting} className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-2xl transition-colors">
                    {submitting ? '…' : `⭐ ${t.reviews.submitBtn ?? 'Submit Review'}`}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">{t.reviews.reviewNote ?? 'Reviews appear after verification. No spam, ever.'}</p>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
