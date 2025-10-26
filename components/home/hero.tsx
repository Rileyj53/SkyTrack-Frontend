"use client";
import React, { useState, useEffect } from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import heroData from "./hero.json";

// Function to get random phrase
const getRandomPhrase = () => {
  const randomIndex = Math.floor(Math.random() * heroData.length);
  return heroData[randomIndex];
};

export default function HomeHero() {
  const [currentPhrase, setCurrentPhrase] = useState<typeof heroData[0] | null>(null);

  useEffect(() => {
    // Only set the phrase after client-side mount
    setCurrentPhrase(getRandomPhrase());
  }, []);

  const renderText = () => {
    if (!currentPhrase) return ""; // Don't render anything until client-side

    const { text, highlight } = currentPhrase;
    
    if (!highlight) {
      return text;
    }

    // Split text by the highlight word and rebuild with styling
    const parts = text.split(highlight);
    
    if (parts.length === 1) {
      // No highlight word found
      return text;
    }

    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {highlight}
          </span>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="h-[35rem] sm:h-[30rem] md:h-[65rem] lg:h-[65rem] w-full bg-black flex flex-col items-center justify-center overflow-hidden">
      <h1 
        className="font-black text-center text-white relative z-20 px-2 w-full md:whitespace-nowrap leading-tight"
        style={{ fontSize: 'clamp(2rem, 4.6vw, 8rem)' }}
      >
        {renderText()}
      </h1>
      <div className="w-[40rem] h-40 relative">
        {/* Gradients */}
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

        {/* Core component */}
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />

        {/* Radial Gradient to prevent sharp edges */}
        <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
      </div>
    </div>
  );
} 