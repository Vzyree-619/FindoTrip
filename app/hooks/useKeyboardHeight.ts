import { useEffect, useState } from "react";

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      
      const currentHeight = window.visualViewport.height;
      const heightDifference = initialViewportHeight - currentHeight;
      
      if (heightDifference > 150) { // Keyboard is likely open
        setKeyboardHeight(heightDifference);
        setIsKeyboardOpen(true);
      } else {
        setKeyboardHeight(0);
        setIsKeyboardOpen(false);
      }
    };

    // Fallback for older browsers
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      if (heightDifference > 150) {
        setKeyboardHeight(heightDifference);
        setIsKeyboardOpen(true);
      } else {
        setKeyboardHeight(0);
        setIsKeyboardOpen(false);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportChange);
      } else {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return { keyboardHeight, isKeyboardOpen };
}
