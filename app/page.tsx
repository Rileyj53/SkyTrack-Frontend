import { HomeNavbar } from "@/components/home/navbar"
import HomeHero from "@/components/home/hero"
import BentoGridDemo from "@/components/home/bento-grid-demo"
import PricingSection from "@/components/home/pricing"
import { BackgroundBeamsDemo } from "@/components/home/waitlist"

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900 scroll-smooth">
      <HomeNavbar />
      
      <main className="flex-1">
        <HomeHero />

        <BentoGridDemo />

        <PricingSection />

        <BackgroundBeamsDemo />
    
      </main>
    </div>
  )
} 