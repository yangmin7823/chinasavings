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
        <Site />
      </UnlockProvider>
    </LocaleProvider>
  )
}

export default App