"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackgroundGradient } from "@/components/ui/background-gradient";

const pricingPlans = [
    {
      name: "Flying Clubs",
      description: "Simple and powerful tools for clubs and recreational pilots",
      price: "$30",
      period: "/month",
      features: [
        "Aircraft scheduling and availability management",
        "Live flight tracking with altitude and location",
        "Invoice generation and member billing",
        "Unlimited aircraft",
        "Unlimited members",
        "24/7 expert support"
      ],
      popular: false,
      gradient: "from-gray-200 to-gray-400"
    },
    {
      name: "Schools",
      description: "Comprehensive platform for managing students, instructors, and operations",
      price: "$1",
      period: "per student invoice",
      features: [
        "Everything in Flying Clubs",
        "Student progress tracking and curriculum management",
        "Instructor scheduling and compliance tracking",
        "Real-time flight and student analytics",
        "Advanced invoicing and revenue tracking",
        "Unlimited aircraft",
        "Unlimited members",
        "24/7 expert support"
      ],
      popular: true,
      gradient: "from-blue-400 to-purple-400"
    },
    {
      name: "AI Features",
      description: "Smarter scheduling, optimized training, and predictive insights",
      price: "$25",
      period: "/month",
      features: [
        "AI-powered scheduling",
        "Smart conflict resolution",
        "Optimized student training paths",
        "Predictive fleet and instructor usage",
        "Automated milestone tracking",
        "Progress insights and alerts",
        "AI-driven efficiency recommendations"
      ],
      popular: false,
      gradient: "from-purple-400 to-pink-400"
    }
  ];

export default function PricingSection() {
  return (
    <section 
      id="pricing" 
      className="w-full py-12 md:py-20 lg:py-32 bg-black relative"
    >
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6 text-center mb-12 md:mb-20">
          <Badge 
            variant="secondary" 
            className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-0 px-3 py-1 md:px-4 md:py-2"
          >
            Pricing
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl max-w-4xl">
            <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Built to grow with your flight school, not bill against it
            </span>
          </h2>
          
          <div className="max-w-3xl space-y-4 md:space-y-6">
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed">
              We designed this platform to empower aviation programs, not weigh them down with bloated software fees.
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div 
              key={index} 
              className={`group relative ${plan.popular ? "md:scale-105" : ""}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 md:-top-6 left-1/2 transform -translate-x-1/2 z-20">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-2xl px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm font-semibold">
                    <span className="relative z-10">Most Popular</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 blur-sm opacity-75 rounded-full"></div>
                  </Badge>
                </div>
              )}

              {/* Card Content */}
              {plan.popular ? (
                <BackgroundGradient className="rounded-2xl">
                  <div className="relative flex flex-col rounded-2xl bg-gray-800 backdrop-blur-sm p-5 md:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    {/* Plan Header */}
                    <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                      <h3 className="text-xl md:text-2xl font-bold text-white">{plan.name}</h3>
                      <p className="text-sm md:text-base text-gray-300">{plan.description}</p>
                      <div className="flex items-baseline">
                        <span
                          className={`text-3xl md:text-5xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}
                        >
                          {plan.price}
                        </span>
                        <span className="text-sm md:text-lg text-gray-400 ml-1">{plan.period}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-1">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="mr-3 h-4 w-4 md:h-5 md:w-5 text-green-400 flex-shrink-0" />
                          <span className="text-sm md:text-base text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </BackgroundGradient>
              ) : (
                <div
                  className="relative flex flex-col rounded-2xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5 md:p-8 transition-all duration-300 hover:border-gray-600/50 hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Plan Header */}
                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                    <h3 className="text-xl md:text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm md:text-base text-gray-300">{plan.description}</p>
                    <div className="flex items-baseline">
                      <span
                        className={`text-3xl md:text-5xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}
                      >
                        {plan.price}
                      </span>
                      <span className="text-sm md:text-lg text-gray-400 ml-1">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="mr-3 h-4 w-4 md:h-5 md:w-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm md:text-base text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Closing Statement */}
        <div className="text-center mt-12 md:mt-16">
          <p className="text-base md:text-lg text-gray-400 italic max-w-2xl mx-auto">
            Whether you're running a high-volume school or building a thriving club, you only pay for what you use and nothing more.
          </p>
        </div>
      </div>
    </section>
  );
} 