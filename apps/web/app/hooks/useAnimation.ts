'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAnimationFrameOptions {
  duration?: number;
  easing?: (t: number) => number;
}

export function useAnimationFrame(
  callback: (progress: number) => void,
  options: UseAnimationFrameOptions = {}
) {
  const { duration = 1000, easing = (t) => t } = options;
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = null;
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      callback(easedProgress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsRunning(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, duration, easing, callback]);

  return { start, stop, isRunning };
}

// 缓动函数
export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  bounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
};

// 计数动画Hook
interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  decimals?: number;
  easing?: (t: number) => number;
}

export function useCountUp(options: UseCountUpOptions) {
  const { start = 0, end, duration = 2000, decimals = 0, easing = easings.easeOut } = options;
  const [value, setValue] = useState(start);

  const { start: startAnimation } = useAnimationFrame(
    (progress) => {
      const currentValue = start + (end - start) * progress;
      setValue(Number(currentValue.toFixed(decimals)));
    },
    { duration, easing }
  );

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  return value;
}

// 滚动动画Hook
interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
}

// 视差滚动Hook
export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;
      const relativeScroll = scrolled - elementTop + window.innerHeight;
      setOffset(relativeScroll * speed);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, offset };
}

// 弹簧物理Hook
interface UseSpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export function useSpring(targetValue: number, options: UseSpringOptions = {}) {
  const { stiffness = 100, damping = 10, mass = 1 } = options;
  const [currentValue, setCurrentValue] = useState(targetValue);
  const velocityRef = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      const displacement = targetValue - currentValue;
      const springForce = displacement * stiffness;
      const dampingForce = velocityRef.current * damping;
      const acceleration = (springForce - dampingForce) / mass;

      velocityRef.current += acceleration * 0.016;
      const newValue = currentValue + velocityRef.current * 0.016;

      if (Math.abs(targetValue - newValue) < 0.01 && Math.abs(velocityRef.current) < 0.01) {
        setCurrentValue(targetValue);
        return;
      }

      setCurrentValue(newValue);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, stiffness, damping, mass, currentValue]);

  return currentValue;
}

// 拖拽物理Hook
interface UseDraggableOptions {
  bounce?: boolean;
  bounds?: { left?: number; right?: number; top?: number; bottom?: number };
}

export function useDraggable(options: UseDraggableOptions = {}) {
  const { bounce = true, bounds } = options;
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementStartRef = useRef({ x: 0, y: 0 });
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      elementStartRef.current = { ...position };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      let newX = elementStartRef.current.x + dx;
      let newY = elementStartRef.current.y + dy;

      if (bounds) {
        if (bounds.left !== undefined) newX = Math.max(bounds.left, newX);
        if (bounds.right !== undefined) newX = Math.min(bounds.right, newX);
        if (bounds.top !== undefined) newY = Math.max(bounds.top, newY);
        if (bounds.bottom !== undefined) newY = Math.min(bounds.bottom, newY);
      }

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    element.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, bounds]);

  return { ref, position, isDragging, setPosition };
}
