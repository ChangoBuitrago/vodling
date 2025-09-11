import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const useFadeIn = (delay: number = 0) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          delay,
          ease: "power2.out" 
        }
      );
    }
  }, [delay]);

  return ref;
};

export const useSlideIn = (direction: 'left' | 'right' | 'up' | 'down' = 'up', delay: number = 0) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const fromProps = {
        left: { x: -50, opacity: 0 },
        right: { x: 50, opacity: 0 },
        up: { y: 50, opacity: 0 },
        down: { y: -50, opacity: 0 }
      };

      gsap.fromTo(
        ref.current,
        fromProps[direction],
        { 
          x: 0, 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          delay,
          ease: "power2.out" 
        }
      );
    }
  }, [direction, delay]);

  return ref;
};

export const usePulse = (delay: number = 0) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.to(ref.current, {
        scale: 1.05,
        duration: 2,
        delay,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      });
    }
  }, [delay]);

  return ref;
};

export const useStaggerChildren = (delay: number = 0) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const children = ref.current.children;
      gsap.fromTo(
        children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay,
          stagger: 0.1,
          ease: "power2.out"
        }
      );
    }
  }, [delay]);

  return ref;
};

export const useCounterAnimation = (endValue: number, duration: number = 2) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { textContent: 0 },
        {
          textContent: endValue,
          duration,
          ease: "power2.out",
          snap: { textContent: 1 },
          onUpdate: function() {
            const value = Math.round(parseFloat(this.targets()[0].textContent));
            this.targets()[0].textContent = value.toLocaleString();
          }
        }
      );
    }
  }, [endValue, duration]);

  return ref;
};

export const useHoverAnimation = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      
      const handleMouseEnter = () => {
        gsap.to(element, {
          y: -5,
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out"
        });
      };

      const handleMouseLeave = () => {
        gsap.to(element, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  return ref;
};

export const useGlowEffect = (color: string = '#4F46E5') => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      
      const handleMouseEnter = () => {
        gsap.to(element, {
          boxShadow: `0 0 30px ${color}50`,
          duration: 0.3,
          ease: "power2.out"
        });
      };

      const handleMouseLeave = () => {
        gsap.to(element, {
          boxShadow: '0 0 0px transparent',
          duration: 0.3,
          ease: "power2.out"
        });
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [color]);

  return ref;
};
