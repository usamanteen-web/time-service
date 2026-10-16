'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { useMotionValueEvent, useScroll } from 'framer-motion';
import { profilePhotos } from '@/lib/profiles-data';
import { photoSrc } from '@/lib/profiles';
import { projectCovers, projectCoverAlt } from '@/lib/project-media';
import { useMotionPreference } from './useMotionPreference';

/** The approved cover anchors six archive photos; each layer grows by its own factor. */
const LAYERS = [4.3, 5, 6, 5, 6, 8, 9];
/** How far each photo leans with the pointer (px at the edge of the screen); the centre one stays put so it can fill the screen. */
const DEPTH = [0, 16, 22, 14, 20, 26, 30];

/**
 * Scrollytelling opener: a collage of the first photos, pinned while the
 * scroll zooms into the centre photo until it fills the screen and hands over
 * to chapter 01. The collage also leans with the pointer. Scroll progress is
 * written to one CSS variable (--zp); app/profiles.css derives every layer's
 * scale and the captions' fades from it.
 */
export default function ProfileZoom() {
  const reduced = useMotionPreference();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end end'] });
  const write = (value: number) => stage.current?.style.setProperty('--zp', reduced ? '0' : value.toFixed(4));
  useMotionValueEvent(scrollYProgress, 'change', write);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => write(scrollYProgress.get()), [reduced]);

  // Pointer lean, eased and paused while the stage is off screen.
  useEffect(() => {
    const element = stage.current;
    if (!element || reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const aim = { x: 0, y: 0 }, now = { x: 0, y: 0 };
    let frame = 0, visible = false;
    const tick = () => {
      now.x += (aim.x - now.x) * .08;
      now.y += (aim.y - now.y) * .08;
      element.style.setProperty('--px', now.x.toFixed(4));
      element.style.setProperty('--py', now.y.toFixed(4));
      frame = Math.abs(aim.x - now.x) + Math.abs(aim.y - now.y) > .001 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (event: PointerEvent) => {
      if (!visible) return;
      aim.x = event.clientX / innerWidth * 2 - 1;
      aim.y = event.clientY / innerHeight * 2 - 1;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(element);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame); };
  }, [reduced]);

  return <section ref={root} className="pf-zoom" data-still={reduced ? '' : undefined} aria-label="Opening collage">
    <div ref={stage} className="pf-zoom-sticky">
      {LAYERS.map((scale, index) => <div key={index} className={`pf-zl pf-zl-${index}`} style={{ '--s': scale } as CSSProperties}>
        <div className="pf-zl-photo" style={{ '--depth': DEPTH[index] } as CSSProperties}>
          <img src={index === 0 ? projectCovers['time-service-profiles'] : photoSrc(profilePhotos[index - 1].n, 900)} alt={index === 0 ? projectCoverAlt['time-service-profiles'] : ''} draggable={false} fetchPriority={index === 0 ? 'high' : undefined}/>
        </div>
      </div>)}
      <div className="pf-zoom-dim" aria-hidden="true"/>
      <div className="pf-zoom-intro">
        <span>Time Service · The project archive</span>
        <span className="pf-zoom-cue" aria-hidden="true">Scroll to step inside</span>
      </div>
      <div className="pf-zoom-outro" aria-hidden="true">
        <span>From the exhibition floor</span>
        <strong>Step inside</strong>
      </div>
    </div>
  </section>;
}
