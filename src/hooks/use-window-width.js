import { useEffect, useState } from "react";

export default function useWindowWidth({ useHeight = false } = {}) {
  // Initialize with safe defaults for SSR
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [mounted, setMounted] = useState(false);

  const handleResize = () => {
    if (typeof window !== "undefined") {
      setWidth(window.innerWidth);
      useHeight && setHeight(window.innerHeight);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [useHeight]);

  // Return safe values during SSR
  if (!mounted) {
    return useHeight ? [0, 0] : 0;
  }

  if (!useHeight) return width;
  return [width, height];
}
