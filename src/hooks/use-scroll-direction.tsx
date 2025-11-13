
"use client";

import { useEffect, useRef } from 'react';

/**
 * A performant hook to track scroll direction and apply it as a data attribute to the body.
 * This avoids re-renders on scroll by decoupling the scroll logic from React state.
 */
export function useScrollDirection() {
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      
      if (Math.abs(scrollY - lastScrollY.current) < 10) {
        ticking.current = false;
        return;
      }

      const direction = scrollY > lastScrollY.current ? "down" : "up";
      document.body.setAttribute('data-scroll-direction', direction);
      
      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Set initial direction
    document.body.setAttribute('data-scroll-direction', 'up');

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      // Clean up the attribute when the component unmounts
      document.body.removeAttribute('data-scroll-direction');
    };
  }, []);

  // This hook now has no return value as it works via a side-effect on the DOM.
}
