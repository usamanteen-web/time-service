'use client';

import { useEffect } from 'react';

/** Pointer-only polish: event delegation also covers newly filtered cards. */
export default function MotionEnhancements() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let active: HTMLElement | null = null;
    let bounds: DOMRect | null = null;
    let raf = 0;
    let x = 0;
    let y = 0;

    const reset = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (active) {
        for (const property of ['--magnetic-x', '--magnetic-y', '--tilt-x', '--tilt-y', '--shine-x', '--shine-y']) active.style.removeProperty(property);
        active.removeAttribute('data-pointer-active');
      }
      active = null;
      bounds = null;
    };
    const move = (event: PointerEvent) => {
      if (preference.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const target = (event.target as Element).closest<HTMLElement>('.button, [data-tilt]');
      if (target !== active) {
        reset();
        if (target) {
          active = target;
          bounds = target.getBoundingClientRect();
          target.setAttribute('data-pointer-active', 'true');
        }
      }
      if (!active || !bounds) return;
      x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
      y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / bounds.height - .5));
      if (raf) return;
      raf = requestAnimationFrame(() => {
        if (active?.matches('.button')) {
          active.style.setProperty('--magnetic-x', `${x * 10}px`);
          active.style.setProperty('--magnetic-y', `${y * 8}px`);
        } else if (active) {
          active.style.setProperty('--tilt-x', `${-y * 5}deg`);
          active.style.setProperty('--tilt-y', `${x * 5}deg`);
        }
        active?.style.setProperty('--shine-x', `${(x + .5) * 100}%`);
        active?.style.setProperty('--shine-y', `${(y + .5) * 100}%`);
        raf = 0;
      });
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', reset);
    window.addEventListener('scroll', reset, { passive: true });
    window.addEventListener('blur', reset);
    preference.addEventListener('change', reset);
    finePointer.addEventListener('change', reset);
    return () => {
      reset();
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', reset);
      window.removeEventListener('scroll', reset);
      window.removeEventListener('blur', reset);
      preference.removeEventListener('change', reset);
      finePointer.removeEventListener('change', reset);
    };
  }, []);
  return null;
}
