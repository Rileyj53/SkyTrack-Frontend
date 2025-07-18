import { cn } from "@/lib/utils";
import React from "react";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}) => {
  return (
    <div className={cn("relative p-[2px] group", containerClassName)}>
      {/* Animated gradient border */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl z-[1] opacity-60 group-hover:opacity-100 blur-md transition duration-500 will-change-transform",
          animate && "animate-gradient",
          "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:400%_400%]"
        )}
      />
      {/* Solid gradient border */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl z-[1] opacity-50 group-hover:opacity-100 transition duration-500 will-change-transform",
          animate && "animate-gradient",
          "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:400%_400%]"
        )}
      />

      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}; 