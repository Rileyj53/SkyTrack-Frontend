"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { BackgroundBeams } from "@/components/home/background-beams";
import {
  MapPin,
  GraduationCap,
  BarChart3,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";

export default function BentoGridDemo() {
  return (
    <div className="w-full py-12 md:py-20 bg-black px-4 relative overflow-hidden">
      {/* Background Beams */}
      <BackgroundBeams />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-white">
          Your Entire Flight School. One Seamless Platform.
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Simplify daily operations, enhance training, and scale with confidence using tools built for the future of aviation.
          </p>
        </div>
        
        <BentoGrid>
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
            />
          ))}
        </BentoGrid>
      </div>
    </div>
  );
}

const IconHeader = ({ IconComponent, gradient }: { IconComponent: React.ElementType; gradient: string }) => (
  <div className="flex flex-1 w-full h-full min-h-[4rem] md:min-h-[6rem] rounded-lg items-start justify-start p-2 md:p-4">
    <div className={`rounded-xl bg-gradient-to-r ${gradient} p-2 md:p-4 shadow-lg`}>
      <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-white" />
    </div>
  </div>
);

const items = [
  {
    title: "Live Flight Tracking",
    description: (
      <>
        <span className="md:hidden">Real-time aircraft monitoring for student flight oversight</span>
        <span className="hidden md:inline">See every aircraft in the sky in real time to monitor student flights with confidence and precision</span>
      </>
    ),
    header: <IconHeader IconComponent={MapPin} gradient="from-blue-500 to-cyan-500" />,
  },
  {
    title: "Student Progress Tracking",
    description: (
      <>
        <span className="md:hidden">AI-powered training milestones and schedule optimization</span>
        <span className="hidden md:inline">Monitor training milestones, flight hours, and performance in real time while AI keeps students on track with optimized schedules and insights.</span>
      </>
    ),
    header: <IconHeader IconComponent={GraduationCap} gradient="from-emerald-500 to-green-500" />,
  },
  {
    title: "Real-Time Analytics", 
    description: (
      <>
        <span className="md:hidden">AI insights for scheduling and operational efficiency</span>
        <span className="hidden md:inline">Monitor key metrics across your school and unlock AI-powered insights to improve scheduling, training, and operational efficiency.</span>
      </>
    ),
    header: <IconHeader IconComponent={BarChart3} gradient="from-purple-500 to-pink-500" />,
  },
  {
    title: "Financial Management",
    description: (
      <>
        <span className="md:hidden">Flexible billing and centralized financial tracking</span>
        <span className="hidden md:inline">Track student costs and school revenue with flexible billing options and a centralized view of your finances.</span>
      </>
    ),
    header: <IconHeader IconComponent={CreditCard} gradient="from-amber-500 to-orange-500" />,
  },
  {
    title: "Dashboard",
    description: (
      <>
        <span className="md:hidden">Real-time overview for faster, smarter decisions</span>
        <span className="hidden md:inline">Stay in control with a real-time overview of flights, students, and aircraft to make faster, smarter decisions.</span>
      </>
    ),
    header: <IconHeader IconComponent={LayoutDashboard} gradient="from-rose-500 to-red-500" />,
  },
]; 