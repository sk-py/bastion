import { useEffect, useState } from "react";

export const useViewport = () => {
  const [viewportHeight, setViewportHeight] = useState("100dvh");

  useEffect(() => {
    const updateViewport = () => {
      if (window.visualViewport) {
        // visualViewport.height accurately reflects the space above the soft keyboard
        setViewportHeight(`${window.visualViewport.height}px`);
      } else {
        setViewportHeight(`${window.innerHeight}px`);
      }
    };

    updateViewport();

    // Listen for keyboard open/close events
    window.visualViewport?.addEventListener("resize", updateViewport);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewport);
    };
  }, []);

  return viewportHeight;
};
