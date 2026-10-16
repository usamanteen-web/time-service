'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Expand } from 'lucide-react';
import { chapterCount, galleryTiles, photoSrc, profileCount, PHOTOS_PER_CHAPTER, type GalleryTile } from '@/lib/profiles';
import ProfileLightbox from './ProfileLightbox';
import { useMotionPreference } from './useMotionPreference';

/** Chapter card background: world map with the TIME globe, from the design Teen supplied (text removed; the card sets its own). */
const chapterNumber = (n: number) => String(n).padStart(2, '0');
const photoNumber = (n: number) => String(n).padStart(3, '0');
const CHAPTER_PLATE = '/images/profiles/chapter-plate.jpg';
const CHAPTER_PLATE_SMALL = '/images/profiles/chapter-plate-700.jpg';
/** Explicit placement for each breakpoint (desktop 12 columns, tablet 6, phone 2). */
const place = ({ spans: { d, t, m } }: GalleryTile) => ({
  '--dc': d.col + 1, '--dw': d.w, '--dr': d.row + 1, '--dh': d.h,
  '--tc': t.col + 1, '--tw': t.w, '--tr': t.row + 1, '--th': t.h,
  '--mc': m.col + 1, '--mw': m.w, '--mr': m.row + 1, '--mh': m.h,
}) as CSSProperties;
/** Rough rendered width of a tile, so the browser picks the 900px or full photo. */
const sizes = ({ spans: { d, t, m } }: GalleryTile) =>
  `(max-width: 767px) ${m.w * 50}vw, (max-width: 1023px) ${Math.round(t.w / 6 * 100)}vw, ${Math.round(d.w / 12 * 92)}vw`;

/**
 * The TIME SERVICE PROFILES archive as a bento grid in album order. Every tile
 * opens and settles as it scrolls through the viewport (CSS view timelines,
 * with a one-shot fallback), tilts and brightens under the pointer, and opens
 * the full-screen viewer. A sticky rail tracks progress through the archive.
 */
export default function ProfileBento({ id = 'profiles' }: { id?: string }) {
  const reduced = useMotionPreference();
  const grid = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  // Chapter cards lead their first photo across the rail's reading line.
  useEffect(() => {
    const root = grid.current;
    if (!root) return;
    const crossing = new Map<Element, number>();
    const onCrossing: IntersectionObserverCallback = entries => {
      for (const entry of entries) {
        const { photo, chapterStart } = (entry.target as HTMLElement).dataset;
        const index = Number(photo ?? chapterStart);
        if (entry.isIntersecting) crossing.set(entry.target, index); else crossing.delete(entry.target);
      }
      if (crossing.size) setCurrent(Math.max(...crossing.values()));
    };
    let observer: IntersectionObserver;
    const observe = () => {
      observer?.disconnect();
      crossing.clear();
      // Percentage root margins use width; pixels keep this at the same
      // vertical reading position when a phone changes orientation.
      const height = window.innerHeight;
      observer = new IntersectionObserver(onCrossing, {
        rootMargin: `-${Math.round(height * .45)}px 0px -${Math.round(height * .54)}px 0px`,
      });
      root.querySelectorAll('[data-photo], [data-chapter-start]').forEach(tile => observer.observe(tile));
    };
    observe();
    window.addEventListener('resize', observe);
    return () => { observer.disconnect(); window.removeEventListener('resize', observe); };
  }, []);

  // Browsers without scroll-driven animations get a one-shot reveal instead.
  useEffect(() => {
    const root = grid.current;
    if (!root || reduced || CSS.supports('animation-timeline: view()')) return;
    const items = [...root.querySelectorAll<HTMLElement>('.pf-tile, .pf-chapter')];
    const fold = window.innerHeight;
    items.forEach(item => { if (item.getBoundingClientRect().top < fold) item.setAttribute('data-in', ''); });
    root.setAttribute('data-fallback', '');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.setAttribute('data-in', '');
      observer.unobserve(entry.target);
    }), { rootMargin: '0px 0px -6% 0px' });
    items.filter(item => !item.hasAttribute('data-in')).forEach(item => observer.observe(item));
    return () => { observer.disconnect(); root.removeAttribute('data-fallback'); };
  }, [reduced]);

  const tileFor = useCallback((index: number) => grid.current?.querySelector<HTMLElement>(`[data-photo="${index}"]`) ?? null, []);
  const onClose = useCallback(() => setOpen(null), []);
  const jump = (chapter: number) => document.getElementById(`${id}-ch-${chapter}`)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  const chapter = Math.floor(current / PHOTOS_PER_CHAPTER) + 1;

  return <div className="pf-archive">
    <div className="pf-rail">
      <p className="pf-rail-chapter">Chapter {chapterNumber(chapter)} <span>/ {chapterNumber(chapterCount)}</span></p>
      <span className="pf-rail-bar" aria-hidden="true"><span style={{ scale: `${(current + 1) / profileCount} 1` }}/></span>
      <nav className="pf-rail-chapters" aria-label="Jump to a chapter">
        {Array.from({ length: chapterCount }, (_, i) => i + 1).map(c =>
          <button key={c} type="button" aria-current={c === chapter ? 'true' : undefined} onClick={() => jump(c)} aria-label={`Jump to archive chapter ${c}`}>{chapterNumber(c)}</button>)}
      </nav>
    </div>

    <div ref={grid} className="pf-grid">
      {galleryTiles.map(tile => {
        if (tile.kind === 'chapter') return <div key={`ch-${tile.chapter}`} id={`${id}-ch-${tile.chapter}`} className="pf-chapter" data-chapter-start={tile.from - 1} style={place(tile)}>
          <span className="pf-chapter-bg" aria-hidden="true">
            <img src={CHAPTER_PLATE} srcSet={`${CHAPTER_PLATE_SMALL} 700w, ${CHAPTER_PLATE} 1395w`} sizes={sizes(tile)} width={1395} height={1015} alt="" loading="lazy" decoding="async" draggable={false}/>
          </span>
          <h2 className="sr-only">Chapter {tile.chapter}, photos {tile.from} to {tile.to}</h2>
          <span className="pf-chapter-label" aria-hidden="true">TIME SERVICE / CHAPTER {chapterNumber(tile.chapter)}</span>
          <strong className="pf-chapter-number" aria-hidden="true">{chapterNumber(tile.chapter)}</strong>
          <span className="pf-chapter-title" aria-hidden="true">Spaces<br/>in practice</span>
          <span className="pf-chapter-bar" aria-hidden="true"><span/></span>
        </div>;
        const { photo, index } = tile;
        return <button key={photo.n} type="button" className="pf-tile" data-tilt data-photo={index} style={{ ...place(tile), '--tone': photo.tone } as CSSProperties}
          onClick={() => setOpen(index)} aria-haspopup="dialog" aria-label={`Open photo ${index + 1} of ${profileCount}`}>
          <span className="pf-frame">
            <span className="pf-lens">
              <img src={photoSrc(photo.n, 900)} srcSet={`${photoSrc(photo.n, 900)} 900w, ${photoSrc(photo.n)} ${photo.w}w`} sizes={sizes(tile)}
                width={photo.w} height={photo.h} alt="" loading="lazy" decoding="async" draggable={false}/>
            </span>
            <span className="pf-shine" aria-hidden="true"/>
            <span className="pf-cap" aria-hidden="true"><span>{photoNumber(index + 1)}</span><Expand size={15} strokeWidth={1.7}/></span>
          </span>
        </button>;
      })}
    </div>

    <ProfileLightbox index={open} onIndex={setOpen} onClose={onClose} tileFor={tileFor} reduced={reduced}/>
  </div>;
}
