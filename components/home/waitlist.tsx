"use client";
import React, { useState } from "react";
import { BackgroundBeams } from "@/components/home/background-beams";

export function BackgroundBeamsDemo() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({
          email: email,
          source: "Landing page"
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setEmail("");
      } else {
        throw new Error("Failed to join waitlist");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-[40rem] w-full bg-black relative flex flex-col items-center justify-center antialiased">
        <div className="max-w-2xl mx-auto p-4 text-center">
          <h1 className="relative z-10 text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 text-white">
            You're in! 🎉
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed relative z-10">
            Thank you for joining our waitlist. We'll keep you updated on our progress and notify you when we launch.
          </p>
        </div>
        <BackgroundBeams />
      </div>
    );
  }

  return (
    <div className="h-[40rem] w-full bg-black relative flex flex-col items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="relative z-10 text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 text-white text-center">
          Join the waitlist
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed text-center relative z-10">
        We're building the smartest platform in aviation training. Join the waitlist to get early access, feature previews, and priority onboarding when we launch.
        </p>
        <form onSubmit={handleSubmit} className="relative z-10 mt-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full px-4 py-3 md:px-6 md:py-4 text-lg rounded-xl border-2 border-gray-700 bg-gray-900/50 backdrop-blur-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-all duration-200 shadow-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 px-4 py-3 md:px-6 md:py-4 text-lg font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-lg focus:outline-none"
          >
            {isLoading ? "Joining..." : "Join Waitlist"}
          </button>
          {error && (
            <p className="mt-3 text-red-400 text-center">{error}</p>
          )}
        </form>
      </div>
      <BackgroundBeams />
    </div>
  );
} 