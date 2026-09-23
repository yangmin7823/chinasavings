import { useState, useEffect } from 'react'
import { LocaleProvider } from './i18n/LocaleContext'
import { UnlockProvider } from './lib/unlock'
import Navbar from './sections/Navbar'
import Hero from './sections/Hero'
import SubmitLink from './sections/SubmitLink'
import TrustBar from './sections/TrustBar'
import PriceComparison from './sections/PriceComparison'
import HowItWorks from './sections/HowItWorks'
import Services from './sections/Services'
import TrackPackage from './sections/TrackPackage'
import Testimonials from './sections/Testimonials'
import RiskDisclosure from './sections/RiskDisclosure'
import Pricing from './sections/Pricing'
import FAQ from './sections/FAQ'
import Contact from './sections/Contact'
import Footer from './sections/Footer'
import BlogRouter from './pages/BlogRouter'
import PagesRouter from './pages/PagesRouter'
import { sitePageForPath } from './content/site-content'
import './App.css'

function Site() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <SubmitLink />
        <TrustBar />
        <PriceComparison />
        <HowItWorks />
        <Services />
        <TrackPackage />
        <Testimonials />
        <RiskDisclosure />
        <Pricing />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <LocaleProvider>
      <UnlockProvider>
        <BlogSwitch />
      </UnlockProvider>
    </LocaleProvider>
  )
}

export default App

/** /blog* 渲染博客区域；/pricing/ /payment/ /faq/ /business/ /about/ 渲染恢复的静态内容页；其余渲染原单页站点 */
function BlogSwitch() {
  const path = useSyncPath()
  if (/^\/(zh|es|fr|ar)?\/?blog(\/|$)/.test(path)) return <BlogRouter />
  if (sitePageForPath(path)) return <PagesRouter path={path} />
  return <Site />
}

/** 订阅地址变化：popstate（前进后退）+ 拦截 pushState（站内跳转） */
function useSyncPath() {
  const [path, setPath] = useState(() => window.location.pathname)
  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    window.addEventListener('popstate', sync)
    const orig = window.history.pushState.bind(window.history)
    window.history.pushState = function (...args) {
      orig(...(args as Parameters<typeof orig>))
      sync()
    }
    return () => {
      window.removeEventListener('popstate', sync)
      window.history.pushState = orig
    }
  }, [])
  return path
}


