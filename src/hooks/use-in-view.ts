import { useEffect, useRef, useState } from "react";

// True once the element has scrolled into view (and stays true), for
// "fade in on scroll" effects. A negative bottom rootMargin, e.g.
// "0px 0px -60px 0px", starts it just after the element's top appears.
export function useInView<T extends Element>({
  threshold = 0,
  rootMargin = "0px",
}: { threshold?: number; rootMargin?: string } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element || inView) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [inView, threshold, rootMargin]);

  return { ref, inView };
}
