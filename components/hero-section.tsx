import Link from "next/link"
import { ArrowRight, Star, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SparklesCore } from "@/components/ui/sparkles"

export function HeroSection() {
  return (
    <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-slate-900 to-blue-900/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />

      <div className="container relative px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col space-y-8">
            <div className="space-y-6">
              <Badge
                variant="secondary"
                className="w-fit bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-0"
              >
                <Zap className="w-3 h-3 mr-1" />
                Trusted by 500+ Flight Schools
              </Badge>
              
              {/* Sparkles Hero Text */}
              <div className="relative">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl relative z-20">
                  <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                    Transform your
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Flight School
                  </span>
                </h1>
                
                {/* Sparkles Effect Behind Text */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                  <div className="w-full h-32 relative">
                    {/* Subtle gradients */}
                    <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent h-[1px] w-3/4 blur-sm" />
                    <div className="absolute inset-x-40 top-0 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent h-[2px] w-1/2 blur-sm" />
                    
                    {/* Sparkles */}
                    <SparklesCore
                      background="transparent"
                      minSize={0.3}
                      maxSize={0.8}
                      particleDensity={400}
                      className="w-full h-full"
                      particleColor="#3B82F6"
                      speed={2}
                    />
                    
                    {/* Mask to fade edges */}
                    <div className="absolute inset-0 w-full h-full [mask-image:radial-gradient(400px_150px_at_center,transparent_30%,white)]"></div>
                  </div>
                </div>
              </div>
              
              <p className="text-xl text-gray-300 leading-relaxed max-w-[600px] relative z-10">
                AI-powered scheduling, real-time analytics, and seamless student
                management. Built for the modern aviation industry.
              </p>
            </div>
            <div className="flex flex-col gap-4 min-[400px]:flex-row relative z-10">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 text-base px-8"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 hover:bg-gray-800 text-gray-200 hover:text-white text-base px-8 bg-transparent"
              >
                Watch Demo
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-gray-800"
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-400 ml-2">Join 10,000+ pilots</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-gray-400 ml-1">4.9/5 rating</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
              <div className="relative w-full max-w-[600px] overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/20 backdrop-blur-xl shadow-2xl">
                <div className="aspect-video p-1">
                  <img
                    src="/images/albatross-dashboard.jpg"
                    alt="Albatross Dashboard with Live Flight Tracking"
                    className="aspect-video w-full object-cover rounded-xl"
                    width={800}
                    height={600}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 