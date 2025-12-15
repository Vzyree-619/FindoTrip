import React, { useState } from "react";
import { clsx } from "./utils";

export type ProgressiveImageProps = {
  src: string;
  lowResSrc?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
};

export function ProgressiveImage({
  src,
  lowResSrc,
  alt = "",
  className,
  onClick,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  return (
    <div className={clsx("relative overflow-hidden", className)} onClick={onClick}>
      {/* Low-res placeholder */}
      {lowResSrc && !isLoaded && (
        <img
          src={lowResSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
        />
      )}
      
      {/* High-res image */}
      <img
        src={src}
        alt={alt}
        className={clsx(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsError(true)}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gray-200" />
      )}
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-gray-100">
          <div className="text-gray-400 text-sm">Failed to load</div>
        </div>
      )}
    </div>
  );
}

export default ProgressiveImage;
