'use client';

import { useEffect, type RefObject } from 'react';
import { useMotionPreference } from './useMotionPreference';

/**
 * Scroll reveals for every `[data-reveal]` inside `root` (styles live in
 * app/about-contact.css). The hidden state only exists once the root is armed on
 * the client, and anything already on screen is marked revealed in the same task,
 * so server HTML, reduced motion and above-the-fold content never flash.
 * Revealed elements get a `data-revealed` attribute.
 */
export function useRevealGroup(root: RefObject<HTMLElement | null>) {
  const reduced = useMotionPreference();
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    if (reduced) { scope.removeAttribute('data-reveal-armed'); return; }
    const reveal = (element: Element) => element.setAttribute('data-revealed', '');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    const limit = window.innerHeight * .92;
    for (const element of scope.querySelectorAll('[data-reveal]')) {
      if (element.hasAttribute('data-revealed')) continue;
      if (element.getBoundingClientRect().top < limit) reveal(element);
      else observer.observe(element);
    }
    scope.setAttribute('data-reveal-armed', '');
    return () => observer.disconnect();
  }, [reduced, root]);
}
