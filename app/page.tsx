import { HomeNavbar } from "@/components/home/navbar"
import HomeHero from "@/components/home/hero"
import BentoGridDemo from "@/components/home/bento-grid-demo"
import PricingSection from "@/components/home/pricing"
import { BackgroundBeamsDemo } from "@/components/home/waitlist"

export default function DemoPage() {
  return (
    <div className="w-full min-h-screen min-h-[100dvh] flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900 scroll-smooth overflow-x-hidden">
      <HomeNavbar />
      
      <main className="flex-1 w-full">
        <HomeHero />

        <BentoGridDemo />

        <PricingSection />

        <div className="w-full">
          <BackgroundBeamsDemo />
        </div>
    
      </main>
    </div>
  )
} 