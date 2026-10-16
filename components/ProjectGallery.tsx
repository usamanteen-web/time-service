'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { projectPatterns } from '@/lib/content';
import { projectIndexCover } from '@/lib/project-media';
import { ProjectCard } from './Projects';

const smooth = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };
/** Where each card moves within the pinned scroll (0–1): the first zooms out from full screen, the others arrive after it. */
const WINDOWS: [number, number][] = [[0, .55], [.3, .62], [.38, .7], [.5, .8], [.58, .88], [.66, .96]];
/** Pinning needs a wide and tall enough screen, and motion allowed. */
const PIN = '(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)';

/**
 * The projects page's six patterns, laid out as on the home page. On large
 * screens the section pins: the first card starts as a full-screen image and
 * scroll shrinks it into its slot while the other five arrive in turn, each
 * photo settling as its card lands. Elsewhere the cards open as they scroll in
 * (app/projects-page.css).
 */
export default function ProjectGallery() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = root.current, box = stage.current, list = grid.current;
    if (!section || !box || !list) return;
    const pin = window.matchMedia(PIN);
    const cards = [...list.children] as HTMLElement[];
    let cover = { tx: 0, ty: 0, s: 1, top: 0, right: 0 };
    let pinTop = 0;
    let frame = 0;

    const clear = () => {
      for (const card of cards) {
        for (const property of ['translate', 'scale', 'opacity', 'clip-path', '--k']) card.style.removeProperty(property);
      }
    };
    // Where the first card must sit to fill the stage: scaled up evenly and cropped,
    // keeping its bottom-left corner (and so its title) in view.
    const measure = () => {
      const card = cards[0];
      const W = box.clientWidth, H = box.clientHeight;
      const x = card.offsetLeft, y = card.offsetTop, w = card.offsetWidth, h = card.offsetHeight;
      const s = Math.max(W / w, H / h);
      pinTop = parseFloat(getComputedStyle(box).top) || 0;
      cover = { s, tx: (w / 2) * s - x - w / 2, ty: H - y - h / 2 - (h / 2) * s, top: Math.max(0, h - H / s), right: Math.max(0, w - W / s) };
    };
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const travel = rect.height - box.clientHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, (pinTop - rect.top) / travel)) : 1;
      cards.forEach((card, index) => {
        const [from, to] = WINDOWS[index] ?? [0, 1];
        const k = smooth((progress - from) / (to - from));
        const rest = 1 - k;
        card.style.setProperty('--k', k.toFixed(4));
        if (index === 0) {
          const scale = 1 + (cover.s - 1) * rest;
          card.style.translate = `${(cover.tx * rest).toFixed(2)}px ${(cover.ty * rest).toFixed(2)}px`;
          card.style.scale = scale.toFixed(4);
          card.style.clipPath = `inset(${(cover.top * rest).toFixed(2)}px ${(cover.right * rest).toFixed(2)}px 0 0 round ${(18 * k / scale).toFixed(2)}px)`;
        } else {
          card.style.opacity = k.toFixed(4);
          card.style.translate = `0 ${(rest * 90).toFixed(2)}px`;
          card.style.scale = (.94 + .06 * k).toFixed(4);
        }
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    // Tabbing onto a card that hasn't arrived yet scrolls just far enough for it to land.
    const onFocus = (event: FocusEvent) => {
      const index = cards.indexOf((event.target as Element).closest('.bento-card') as HTMLElement);
      if (index < 0) return;
      const rect = section.getBoundingClientRect();
      const travel = rect.height - box.clientHeight;
      const need = WINDOWS[index][1];
      if (travel > 0 && (pinTop - rect.top) / travel < need) window.scrollTo({ top: window.scrollY + rect.top - pinTop + travel * need, behavior: 'instant' });
    };
    const onResize = () => { if (!pin.matches) return; clear(); measure(); update(); };
    const apply = () => {
      list.removeEventListener('focusin', onFocus);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
      frame = 0;
      clear();
      if (!pin.matches) {
        section.removeAttribute('data-pinned');
        section.setAttribute('data-static', '');
        return;
      }
      section.removeAttribute('data-static');
      section.setAttribute('data-pinned', '');
      measure();
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      list.addEventListener('focusin', onFocus);
    };
    apply();
    pin.addEventListener('change', apply);
    return () => {
      pin.removeEventListener('change', apply);
      list.removeEventListener('focusin', onFocus);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
      clear();
      section.removeAttribute('data-pinned');
      section.removeAttribute('data-static');
    };
  }, []);

  return <section ref={root} className="pp-scroll" data-motion-skip aria-label="Project patterns">
    <div ref={stage} className="pp-stage">
      <div className="pp-intro-visual"><Image src={projectIndexCover} alt="Orange Ocean art toy pop-up store, seen from above" fill sizes="100vw" loading="eager"/></div>
      <div ref={grid} className="project-grid project-bento pp-grid">
        {projectPatterns.map((project, index) => <ProjectCard key={project.slug} project={project} index={index} bento eager={index === 0} introCover={index===0?projectIndexCover:undefined}/>)}
      </div>
    </div>
  </section>;
}
