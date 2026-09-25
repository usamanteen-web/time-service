'use client';

import { useCallback, useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { exhibitionModels } from '@/lib/exhibition-models';
import { company, people } from '@/lib/content';
import { smoothstep } from '@/lib/camera-pose';
import ModelStage, { type ModelStageController } from './ModelStage';
import SplitChars from './SplitChars';
import { useMotionPreference } from './useMotionPreference';

const jiuli = exhibitionModels[1];
// Closer and a touch lower than the landscape overview, so the booth fills the tall
// stage edge to edge (immersive, not a product shot) while the camera sways around it.
const pose = { ...jiuli.views[0], target: '0m 2.2m 0m', orbit: '31deg 70deg 15m' };
const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`;
const delay = (seconds: number) => ({ '--ac-d': `${seconds}s` }) as CSSProperties;
const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

/** Drift: a slow sway around the booth (degrees, seconds). Lean: how far the camera follows the pointer. */
const DRIFT = { theta: 12, phi: 2.5, period: 20, rampIn: 3 };
const LEAN = { theta: 6, phi: 3 };
/** Fraction of the gap to the pointer left after one second — lower follows faster. */
const LEAN_LAG = .06;

/**
 * `.ac-enter` items fade up in sequence from first paint (pure CSS, so nothing flashes
 * before hydration). Items that start below the fold would finish their entrance
 * unseen, so hold those on their first frame and play them as they scroll into view.
 */
function useHeldEntrances(root: RefObject<HTMLElement | null>) {
  const reduced = useMotionPreference();
  useEffect(() => {
    const scope = root.current;
    if (!scope || reduced || typeof scope.getAnimations !== 'function') return;
    const held = new Map<Element, Animation[]>();
    const delayOf = (animation: Animation) => Number(animation.effect?.getTiming().delay ?? 0);
    const observer = new IntersectionObserver(entries => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const animations = held.get(entry.target) ?? [];
        held.delete(entry.target);
        for (const animation of animations) {
          animation.currentTime = Math.max(0, delayOf(animation) - (90 + order * 110));
          animation.play();
        }
        order++;
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    const fold = window.innerHeight * .94;
    for (const element of scope.querySelectorAll('.ac-enter')) {
      if (element.getBoundingClientRect().top < fold) continue;
      const waiting = element.getAnimations().filter(animation => Number(animation.currentTime ?? 0) < delayOf(animation));
      if (!waiting.length) continue;
      waiting.forEach(animation => animation.pause());
      held.set(element, waiting);
      observer.observe(element);
    }
    return () => {
      observer.disconnect();
      held.forEach(animations => animations.forEach(animation => animation.play()));
    };
  }, [reduced, root]);
}

export default function ContactExperience() {
  const root = useRef<HTMLDivElement>(null);
  useHeldEntrances(root);

  // Runs once the model has loaded; ModelStage skips it under reduced motion.
  const controller = useCallback<ModelStageController>(api => {
    const base = api.resolve(pose);
    const aim = { x: 0, y: 0 };
    const lean = { x: 0, y: 0 };
    let frame = 0;
    let last = 0;
    let clock = 0;
    let onScreen = true;

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      aim.x = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth) * 2 - 1));
      aim.y = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight) * 2 - 1));
    };
    const onLeave = () => { aim.x = 0; aim.y = 0; };
    const tick = (now: number) => {
      const step = last ? Math.min(.1, (now - last) / 1000) : 0;
      last = now;
      clock += step;
      const follow = 1 - Math.pow(LEAN_LAG, step);
      lean.x += (aim.x - lean.x) * follow;
      lean.y += (aim.y - lean.y) * follow;
      const sway = smoothstep(clock / DRIFT.rampIn);
      const angle = (clock / DRIFT.period) * Math.PI * 2;
      api.apply({
        ...base,
        theta: base.theta + Math.sin(angle) * DRIFT.theta * sway + lean.x * LEAN.theta,
        phi: base.phi + Math.sin(angle * .7) * DRIFT.phi * sway + lean.y * LEAN.phi,
      });
      frame = requestAnimationFrame(tick);
    };
    const start = () => { if (!frame && onScreen && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const onVisibility = () => { if (document.hidden) stop(); else start(); };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start(); else stop();
    });

    api.apply(base, { jump: true });
    observer.observe(api.root);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('blur', onLeave);
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('blur', onLeave);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <div ref={root} className="ac-contact">
    <div className="ac-contact-stage-col">
      <div className="ac-contact-stage-pin">
        <ModelStage model={jiuli} initialPose={pose} controller={controller} className="ac-contact-stage" posterPriority interpolationDecay={120}
          posterSizes="(max-width: 1023px) 100vw, 50vw"
          description={`Decorative 3D model of the ${jiuli.name} ${jiuli.code} exhibition booth, slowly turning.`}>
          <div className="ac-stage-caption">
            <span className="ac-stage-label">{jiuli.name} / {jiuli.code} · <span className="ac-stage-view ac-stage-area">{jiuli.area}</span></span>
          </div>
        </ModelStage>
      </div>
    </div>

    <div className="ac-contact-content">
      <section className="ac-contact-intro" aria-labelledby="ac-contact-title">
        <p className="eyebrow ac-enter" style={delay(.05)}><span/> START A CONVERSATION</p>
        <SplitChars as="h1" id="ac-contact-title" variant="rise" className="ac-title" delay={.18} stagger={.026}
          lines={['Your next big idea', { text: 'starts here', italic: true }]}/>
        <p className="ac-contact-description ac-enter" style={delay(.85)}>Tell us what you have in mind. Let’s explore how to bring it to life.</p>
      </section>

      <div className="ac-contact-grid">
        <section className="ac-contact-block ac-enter" style={delay(1.05)} aria-labelledby="ac-find-us">
          <h2 id="ac-find-us" className="ac-contact-label">FIND US</h2>
          <p className="ac-contact-city">Bangkok, Thailand</p>
          <p className="ac-contact-address">{company.address}</p>
          <a className="ac-contact-link" href={mapsHref} target="_blank" rel="noreferrer">
            <span className="ac-contact-icon" aria-hidden="true"><MapPin size={14} strokeWidth={1.8}/></span>
            <span>Open in Google Maps</span><NewTab/>
            <ArrowUpRight className="ac-contact-arrow" size={15} strokeWidth={1.8} aria-hidden="true"/>
          </a>
        </section>

        <section className="ac-contact-block ac-enter" style={delay(1.2)} aria-labelledby="ac-enquiry">
          <h2 id="ac-enquiry" className="ac-contact-label">HAVE AN ENQUIRY?</h2>
          <p lang="th" className="ac-contact-thai">พูดคุยกับเราเกี่ยวกับโปรเจกต์ของคุณ</p>
          <a className="ac-contact-method" href={company.phoneHref}>
            <span className="ac-contact-icon" aria-hidden="true"><Phone size={14} strokeWidth={1.8}/></span>
            <span><small>CALL OUR TEAM</small><strong>{company.phone}</strong></span>
            <ArrowUpRight className="ac-contact-arrow" size={15} strokeWidth={1.8} aria-hidden="true"/>
          </a>
          <a className="ac-contact-method" href="https://wa.me/66661124227" target="_blank" rel="noreferrer">
            <span className="ac-contact-icon" aria-hidden="true"><MessageCircle size={14} strokeWidth={1.8}/></span>
            <span><small>LET’S CHAT</small><strong>WhatsApp</strong><NewTab/></span>
            <ArrowUpRight className="ac-contact-arrow" size={15} strokeWidth={1.8} aria-hidden="true"/>
          </a>
        </section>
      </div>

      <section className="ac-contact-team ac-enter" style={delay(1.35)} aria-labelledby="ac-team">
        <h2 id="ac-team" className="ac-contact-label">LET’S TALK</h2>
        <ul className="ac-people">
          {people.map((person, index) => <li key={person.email} className="ac-enter" style={delay(1.45 + index * .1)}>
            <h3>{person.name}</h3>
            <div className="ac-person-links">
              <a href={`tel:${person.tel}`}><span className="ac-contact-icon" aria-hidden="true"><Phone size={12} strokeWidth={1.8}/></span><span>Tel. : {person.phone}</span></a>
              <a href={`mailto:${person.email}`}><span className="ac-contact-icon" aria-hidden="true"><Mail size={12} strokeWidth={1.8}/></span><span>E-mail : {person.email}</span></a>
            </div>
          </li>)}
        </ul>
      </section>

      <aside className="ac-contact-note ac-enter" style={delay(1.8)} aria-labelledby="ac-note">
        <h2 id="ac-note">A few details to get started</h2>
        <p>Your project type, venue, preferred dates and approximate scope will help us understand your idea.</p>
        <p lang="th">เตรียมประเภทงาน สถานที่ วันจัดงาน และขอบเขตคร่าว ๆ แล้วติดต่อทีมงานได้เลย</p>
      </aside>
    </div>
  </div>;
}
