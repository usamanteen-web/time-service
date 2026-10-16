'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { profilePhotos } from '@/lib/profiles-data';
import { photoSrc, profileCount } from '@/lib/profiles';

type Props = {
  index: number | null;
  onIndex: (index: number) => void;
  onClose: () => void;
  /** The grid tile a photo opens from and closes back into. */
  tileFor: (index: number) => HTMLElement | null;
  reduced: boolean;
};

const EASE = 'cubic-bezier(.2,.8,.2,1)';
const OPEN = { transform: 'none', clipPath: 'inset(0px 0px round 6px)' };
/** Keyframe that lays the viewer's photo exactly over a grid tile (uniform scale, cropped like the tile). */
function over(tile: DOMRect, photo: DOMRect) {
  const s = Math.max(tile.width / photo.width, tile.height / photo.height);
  const dx = tile.left + tile.width / 2 - (photo.left + photo.width / 2);
  const dy = tile.top + tile.height / 2 - (photo.top + photo.height / 2);
  const x = Math.max(0, (photo.width - tile.width / s) / 2);
  const y = Math.max(0, (photo.height - tile.height / s) / 2);
  return { transform: `translate(${dx}px, ${dy}px) scale(${s})`, clipPath: `inset(${y}px ${x}px round ${16 / s}px)` };
}
const onScreen = (rect: DOMRect) => rect.bottom > 0 && rect.top < window.innerHeight;

/**
 * Full-screen viewer: opens out of the tapped tile and closes back into the
 * current one, with arrow keys, swipe and a scrubber across all photos.
 */
export default function ProfileLightbox({ index, onIndex, onClose, tileFor, reduced }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const figure = useRef<HTMLElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; dx: number; onPhoto: boolean } | null>(null);
  const closing = useRef(false);
  const [dir, setDir] = useState(0);
  const [settled, setSettled] = useState(true);
  const openIndex = index ?? 0;
  const photo = profilePhotos[openIndex];

  // Open: show the dialog, then fly the photo out of its tile.
  const isOpen = index !== null;
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!isOpen || !element || element.open) return;
    closing.current = false;
    setDir(0);
    document.documentElement.style.overflow = 'hidden';
    element.showModal();
    const tile = tileFor(openIndex);
    const target = figure.current;
    if (reduced || !tile || !target) return;
    const from = tile.getBoundingClientRect();
    if (!onScreen(from)) return;
    target.animate([over(from, target.getBoundingClientRect()), OPEN], { duration: 560, easing: EASE });
    shade.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
    element.querySelectorAll('.pf-lb-chrome').forEach((part, order) =>
      part.animate([{ opacity: 0, translate: '0 12px' }, { opacity: 1, translate: '0 0' }], { duration: 420, delay: 220 + order * 60, easing: EASE, fill: 'backwards' }));
    // Only on open; stepping between photos is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const close = useCallback(async () => {
    const element = dialog.current;
    if (!element || closing.current) return;
    closing.current = true;
    const tile = tileFor(openIndex);
    // Bring the current photo's tile on screen behind the viewer, so it can land there.
    if (tile && !onScreen(tile.getBoundingClientRect())) tile.scrollIntoView({ block: 'center', behavior: 'instant' });
    const target = figure.current;
    if (!reduced && tile && target) {
      const landing = over(tile.getBoundingClientRect(), target.getBoundingClientRect());
      await Promise.all([
        target.animate([OPEN, landing], { duration: 460, easing: EASE, fill: 'forwards' }).finished,
        shade.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-in', fill: 'forwards' }).finished,
        ...[...element.querySelectorAll('.pf-lb-chrome')].map(part => part.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished),
      ]).catch(() => undefined);
    }
    element.close();
    element.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    document.documentElement.style.overflow = '';
    onClose();
    tile?.focus({ preventScroll: true });
  }, [onClose, openIndex, reduced, tileFor]);

  const step = useCallback((by: number) => {
    setDir(by > 0 ? 1 : -1);
    onIndex((openIndex + by + profileCount) % profileCount);
  }, [onIndex, openIndex]);

  // Full-size photo once the index stops changing (scrubbing stays on the light versions).
  useEffect(() => {
    if (!isOpen) return;
    setSettled(false);
    const timer = window.setTimeout(() => {
      setSettled(true);
      for (const near of [openIndex - 1, openIndex + 1]) new Image().src = photoSrc(profilePhotos[(near + profileCount) % profileCount].n);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [isOpen, openIndex]);

  useEffect(() => () => { document.documentElement.style.overflow = ''; }, []);

  const onKey = (event: KeyboardEvent<HTMLDialogElement>) => {
    if ((event.target as HTMLElement).matches('input')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    else if (event.key === 'Home') { event.preventDefault(); setDir(-1); onIndex(0); }
    else if (event.key === 'End') { event.preventDefault(); setDir(1); onIndex(profileCount - 1); }
  };

  // Swipe: the photo follows the finger, and a long enough pull moves one photo.
  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, dx: 0, onPhoto: !!figure.current?.contains(event.target as Node) };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    state.dx = event.clientX - state.x;
    figure.current?.style.setProperty('translate', `${state.dx * .85}px 0`);
  };
  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    drag.current = null;
    const target = figure.current;
    if (Math.abs(state.dx) > 60) { step(state.dx < 0 ? 1 : -1); return; }
    if (target && state.dx) target.animate([{ translate: `${state.dx * .85}px 0` }, { translate: '0 0' }], { duration: 320, easing: EASE });
    target?.style.removeProperty('translate');
    // A tap on the dark area around the photo closes the viewer.
    if (Math.abs(state.dx) < 6 && !state.onPhoto) void close();
  };

  return <dialog ref={dialog} className="pf-lightbox" aria-label="TIME SERVICE PROFILES photo viewer"
    onCancel={event => { event.preventDefault(); void close(); }} onKeyDown={onKey}>
    <div ref={shade} className="pf-lb-shade" aria-hidden="true"/>
    {isOpen && <>
      <div className="pf-lb-top pf-lb-chrome">
        <p className="pf-lb-title">Time Service Profiles</p>
        <span className="pf-lb-count" aria-live="polite" aria-label={`Photo ${openIndex + 1} of ${profileCount}`}>{String(openIndex + 1).padStart(3, '0')} <span>/ {profileCount}</span></span>
        <button type="button" className="pf-lb-close" onClick={() => void close()} aria-label="Close viewer"><X size={20} strokeWidth={1.6}/></button>
      </div>
      <div className="pf-lb-stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <figure ref={figure} key={openIndex} className="pf-lb-figure" data-dir={dir}
          style={{ '--ar': `${photo.w} / ${photo.h}`, '--tone': photo.tone } as CSSProperties}>
          <img className="pf-lb-light" src={photoSrc(photo.n, 900)} alt="" draggable={false}/>
          {settled && <img className="pf-lb-full" src={photoSrc(photo.n)} alt={`TIME SERVICE PROFILES, photo ${openIndex + 1} of ${profileCount}`} draggable={false}
            ref={image => { if (image?.complete) image.dataset.loaded = ''; }}
            onLoad={event => { event.currentTarget.dataset.loaded = ''; }}/>}
        </figure>
      </div>
      <button type="button" className="pf-lb-nav pf-lb-prev pf-lb-chrome" onClick={() => step(-1)} aria-label="Previous photo"><ArrowLeft size={20} strokeWidth={1.6}/></button>
      <button type="button" className="pf-lb-nav pf-lb-next pf-lb-chrome" onClick={() => step(1)} aria-label="Next photo"><ArrowRight size={20} strokeWidth={1.6}/></button>
      <div className="pf-lb-bottom pf-lb-chrome">
        <label className="pf-lb-scrub">
          <span className="sr-only">Photo number</span>
          <span className="pf-lb-limit" aria-hidden="true">001</span>
          <input type="range" min={1} max={profileCount} value={openIndex + 1}
            style={{ '--fill': `${(openIndex / (profileCount - 1)) * 100}%` } as CSSProperties}
            onChange={event => { const next = Number(event.target.value) - 1; setDir(next > openIndex ? 1 : -1); onIndex(next); }}/>
          <span className="pf-lb-limit" aria-hidden="true">{profileCount}</span>
        </label>
        <span className="pf-lb-hint" aria-hidden="true">← → · swipe · Esc</span>
      </div>
    </>}
  </dialog>;
}
