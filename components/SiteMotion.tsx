'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useMotionPreference } from './useMotionPreference';

/** Blocks that slide up as they scroll into view (styles in app/site-motion.css). */
const UP = [
  // Section and page furniture
  '.section-heading .eyebrow', '.section-intro', '.concept-note', '.concept-disclosure', '.project-filters',
  // Cards: the image opens (CLIP) and the parts inside follow one by one
  '.service-card-copy > :not(h3)', '.project-meta p', '.project-arrow',
  '.journal-card > .eyebrow', '.journal-card > p', '.journal-card > .text-link',
  // Home sections
  '.featured-project-eyebrow', '.featured-project-description', '.featured-project-link', '.featured-project-footer',
  '.spatial-topline', '.spatial-intro', '.spatial-thai', '.spatial-explore-button', '.spatial-bottom > span',
  '.about-copy > p', '.about-copy > a', '.about-signature', '.stat', '.process-list li',
  '.cta-content > p', '.cta-actions', '.cta-quote',
  // Inner pages
  '.service-detail-copy > *:not(h2)', '.project-detail-notes > div', '.next-project > span', '.next-project > svg',
  '.article > section > p', '.article > .concept-note',
  // Footer
  '.footer-grid > div', '.footer-bottom',
].join(',');
/** Images that open out from a clipped window. */
const CLIP = ['.service-image', '.project-image', '.journal-image', '.about-image', '.service-detail-image', '.project-detail-visual', '.article-image'].join(',');
/** Areas with their own motion: About/Contact, the hero, the 3D viewer frame and the scrolling word band. */
const SKIP = '.ac-about, .ac-contact, .hero-scroll, .spatial-stage, .model-dialog, .kinetic-band, [data-motion-skip]';
/** Lists whose items arrive together: items stagger, and so do the parts inside each item. */
const GROUP = '.service-grid, .project-grid, .journal-grid, .process-list, .statistics, .footer-grid, .project-detail-notes, .spatial-narrative';
const docOrder = (a: Element, b: Element) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

/**
 * Site-wide scroll reveals. Elements are only hidden once this has run on the
 * client, and anything already on screen is shown at once, so server HTML and
 * reduced motion never flash or stay hidden. Siblings arriving together stagger.
 */
export default function SiteMotion() {
  const pathname = usePathname();
  const reduced = useMotionPreference();

  useEffect(() => {
    const body = document.body;
    if (reduced) { body.removeAttribute('data-motion-armed'); return; }
    const pending = new Set<HTMLElement>();
    const reveal = (element: HTMLElement) => { pending.delete(element); element.setAttribute('data-motion-in', ''); };
    // Siblings that arrive together get a short stagger.
    const revealGroup = (elements: HTMLElement[]) => {
      const groups = new Map<Element | null, HTMLElement[]>();
      for (const element of elements) {
        const key = element.closest(GROUP) ?? element.parentElement;
        groups.set(key, [...(groups.get(key) ?? []), element]);
      }
      groups.forEach((list, container) => {
        list.sort(docOrder);
        // Position of each element's item (card / step / column) within this batch.
        const items: Element[] = [];
        const inner = new Map<Element, number>();
        for (const element of list) {
          let item: Element = element;
          while (container && item.parentElement && item.parentElement !== container) item = item.parentElement;
          if (!items.includes(item)) items.push(item);
          const order = inner.get(item) ?? 0;
          inner.set(item, order + 1);
          const delay = Math.min(items.indexOf(item) * .1, .5) + Math.min(order * .07, .35);
          element.style.setProperty('--motion-d', `${delay.toFixed(2)}s`);
          reveal(element);
        }
      });
    };
    const observer = new IntersectionObserver(entries => {
      const arrived = entries.filter(entry => entry.isIntersecting).map(entry => entry.target as HTMLElement);
      arrived.forEach(element => observer.unobserve(element));
      revealGroup(arrived);
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

    let frame = 0;
    let checking = 0;
    const scan = () => {
      frame = 0;
      const limit = window.innerHeight * .92;
      for (const element of document.querySelectorAll<HTMLElement>(`${UP}, ${CLIP}`)) {
        if (element.hasAttribute('data-motion-in') || pending.has(element) || element.closest(SKIP)) continue;
        element.setAttribute('data-motion', element.matches(CLIP) ? 'clip' : 'up');
        if (element.getBoundingClientRect().top < limit) reveal(element);
        else { pending.add(element); observer.observe(element); }
      }
    };
    // A fast scroll (or a busy frame) can carry an element from below the fold to
    // above it without it ever intersecting, so also sweep on scroll.
    const sweep = () => {
      checking = 0;
      const limit = window.innerHeight * .92;
      const passed = [...pending].filter(element => element.getBoundingClientRect().top < limit);
      passed.forEach(element => observer.unobserve(element));
      revealGroup(passed);
    };
    const onScroll = () => { if (!checking && pending.size) checking = requestAnimationFrame(sweep); };
    scan();
    body.setAttribute('data-motion-armed', '');
    window.addEventListener('scroll', onScroll, { passive: true });
    // Pick up cards that appear later (e.g. the project filters).
    const mutations = new MutationObserver(() => { if (!frame) frame = requestAnimationFrame(scan); });
    const main = document.getElementById('main');
    if (main) mutations.observe(main, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(checking);
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
      mutations.disconnect();
      // Anything still waiting is shown again if this effect re-runs.
      pending.forEach(element => element.removeAttribute('data-motion'));
    };
  }, [pathname, reduced]);

  return null;
}
