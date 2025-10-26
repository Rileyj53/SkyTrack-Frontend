import React from "react";
import { cn } from "@/lib/utils";
import { BackgroundGradient } from "./background-gradient";

export const BentoGrid = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className="w-full flex flex-col items-center overflow-visible">
      {/* First row - 3 items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl w-full mb-4 md:mb-6 lg:mb-8 md:auto-rows-[20rem] overflow-visible">
        {childrenArray.slice(0, 3)}
      </div>
      
      {/* Second row - 2 items centered */}
      {childrenArray.length > 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl w-full md:auto-rows-[20rem] overflow-visible">
          {childrenArray.slice(3)}
        </div>
      )}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <BackgroundGradient className={cn("rounded-xl h-full", className)}>
      <div
        className={cn(
          "group/bento rounded-xl bg-black overflow-hidden h-full",
          "transition-all duration-300 ease-out",
          "cursor-pointer"
        )}
      >
        {/* Content */}
        <div className="flex flex-col h-full p-4 md:p-6">
          {header}
          <div className="mt-auto space-y-2 md:space-y-3">
            <div className="flex items-center gap-3">
              {icon}
              <h3 className="text-lg md:text-xl font-semibold text-white">
                {title}
              </h3>
            </div>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </BackgroundGradient>
  );
}; 