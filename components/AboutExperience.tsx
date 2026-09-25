'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { exhibitionModels } from '@/lib/exhibition-models';
import { services, steps } from '@/lib/content';
import { clamp01, pathPosition, samplePath, smootherstep, type ResolvedPose } from '@/lib/camera-pose';
import ModelStage, { type ModelStageController } from './ModelStage';
import SplitChars from './SplitChars';
import { useMotionPreference } from './useMotionPreference';
import { useRevealGroup } from './useRevealGroup';

const hilong = exhibitionModels[0];
/** Share of each segment's scroll the camera rests on a view before it moves on. */
const HOLD = .12;
/** Overview → reception is a crane move outside the booth: sideways swing (deg), pull-back (m) and rise (deg of phi) at mid-move. */
const FLIGHT = { theta: 8, back: 2, rise: 4 };
/**
 * Moves that would fly through the booth's fascia, walls and meeting-room roof
 * (reception → inside → meeting room → structure) cut instead: the canvas dips to the
 * stage colour around the middle of the move and the camera jumps while it is hidden.
 */
const CUT = [false, true, true, true];
/** Dip strength (0–1) at a position inside a cut move: fully hidden for its middle quarter. */
const dip = (local: number) => clamp01((.3 - Math.abs(local - .5)) / .18);
/** A small scroll-linked sway so the camera never sits still: ±3° outside, ~±1° in the meeting room. */
const swayFor = (radius: number) => Math.min(3, .4 * radius);
/** Stacked layout: the stage is not pinned, so only the first move plays, while it scrolls away. */
const COMPACT = '(max-width: 1023px)';
const COMPACT_END = .25;
const subscribeCompact = (notify: () => void) => {
  const media = window.matchMedia(COMPACT);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const useCompact = () => useSyncExternalStore(subscribeCompact, () => window.matchMedia(COMPACT).matches, () => false);
// The written overview (90%) was framed for a landscape poster; come closer so the booth
// fills the tall stage edge to edge. The other views keep their poses.
const views = hilong.views.map((view, index) => index === 0 ? { ...view, target: '0m 3m 0m', orbit: '-36deg 73deg 19m' } : view);
const values = [
  { title: 'Thoughtful design', copy: 'Every decision starts with purpose.' },
  { title: 'Attention to detail', copy: 'Ideas are only as good as their execution.' },
  { title: 'Working together', copy: 'Clear conversations at every stage.' },
];
const altFor = (image: string) => services.find(service => service.image === image)?.alt ?? '';
const collage = [
  { src: '/images/construction.jpg', alt: altFor('construction'), speed: 34, sizes: '(max-width: 1023px) 100vw, 52vw' },
  { src: '/images/lighting.jpg', alt: altFor('lighting'), speed: 70, sizes: '(max-width: 1023px) 60vw, 26vw' },
  { src: '/images/interior.jpg', alt: altFor('interior'), speed: 52, sizes: '(max-width: 1023px) 50vw, 22vw' },
  { src: '/images/event.jpg', alt: altFor('event'), speed: 22, sizes: '(max-width: 1023px) 90vw, 40vw' },
];
const delay = (seconds: number) => ({ '--ac-d': `${seconds}s` }) as CSSProperties;

/** An image that clips open when revealed and drifts at its own speed while scrolling. */
function Figure({src, alt, sizes, speed, className = '', priority = false}: {src: string; alt: string; sizes: string; speed: number; className?: string; priority?: boolean}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  const imageY = useTransform(scrollYProgress, [0, 1], ['-7%', '7%']);
  // The drifting frame is the <figure> itself, so the credit is its direct caption.
  return <div ref={ref} className={`ac-figure ${className}`.trim()} data-reveal="figure">
    <motion.figure className="ac-figure-frame" style={reduced ? undefined : { y }}>
      <div className="ac-figure-clip">
        <motion.div className="ac-figure-media" style={reduced ? undefined : { y: imageY }}>
          <Image src={src} alt={alt} fill sizes={sizes} priority={priority}/>
        </motion.div>
      </div>
      <figcaption className="ac-credit">AI concept image</figcaption>
    </motion.figure>
  </div>;
}

/** Process steps with a line that draws itself as the list scrolls through. */
function Steps() {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = useMotionPreference();
  const wrap = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 78%'] });
  // Run the line exactly from the first dot to the last one, whatever the layout.
  useEffect(() => {
    const box = wrap.current;
    const list = ref.current;
    if (!box || !list) return;
    const measure = () => {
      const dots = list.querySelectorAll<HTMLElement>('.ac-step-dot');
      if (dots.length < 2) return;
      // Layout offsets (dot → li → .ac-steps-wrap, both positioned) ignore the reveal
      // translate on each step, so a re-measure before the steps appear stays aligned.
      const centre = (dot: HTMLElement) => {
        const step = dot.parentElement as HTMLElement;
        return step.offsetTop + step.clientTop + dot.offsetTop + dot.offsetHeight / 2;
      };
      const first = centre(dots[0]);
      box.style.setProperty('--ac-track-top', `${first}px`);
      box.style.setProperty('--ac-track-height', `${centre(dots[dots.length - 1]) - first}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);
  const mark = useCallback((value: number) => {
    const items = ref.current?.querySelectorAll<HTMLLIElement>('.ac-step');
    items?.forEach((item, index) => item.toggleAttribute('data-active', reduced || value >= index / Math.max(1, items.length - 1) - .015));
  }, [reduced]);
  useMotionValueEvent(scrollYProgress, 'change', mark);
  useEffect(() => { mark(scrollYProgress.get()); }, [mark, scrollYProgress]);
  return <div ref={wrap} className="ac-steps-wrap">
    <span className="ac-steps-track" aria-hidden="true"><motion.span className="ac-steps-line" style={reduced ? { scaleY: 1 } : { scaleY: scrollYProgress }}/></span>
    <ol ref={ref} className="ac-steps">
      {steps.map((step, index) => <li key={step.title} className="ac-step" data-reveal="up">
        <span className="ac-step-dot" aria-hidden="true"/>
        <span className="ac-step-number">0{index + 1}</span>
        <h3>{step.title}</h3>
        <div className="ac-step-copy"><p lang="th">{step.thai}</p><p>{step.copy}</p></div>
      </li>)}
    </ol>
  </div>;
}

export default function AboutExperience() {
  const split = useRef<HTMLDivElement>(null);
  const stageCol = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [scrolledView, setView] = useState(0);
  const reduced = useMotionPreference();
  const compact = useCompact();
  // Reduced motion keeps the camera on the first view, so the caption stays there too.
  const view = reduced ? 0 : scrolledView;
  // Side by side: progress through the whole split. Stacked: the stage's own exit.
  const { scrollYProgress } = useScroll({ target: split, offset: ['start start', 'end end'] });
  const { scrollYProgress: stageExit } = useScroll({ target: stageCol, offset: ['start start', 'end 25%'] });
  useRevealGroup(content);

  // The caption follows the view the camera is actually showing on this layout.
  const syncView = useCallback(() => {
    const value = compact ? stageExit.get() * COMPACT_END : scrollYProgress.get();
    const nearest = pathPosition(views.length, value, HOLD, smootherstep).nearest;
    setView(current => current === nearest ? current : nearest);
  }, [compact, scrollYProgress, stageExit]);
  useMotionValueEvent(scrollYProgress, 'change', syncView);
  useMotionValueEvent(stageExit, 'change', syncView);
  useEffect(syncView, [syncView]);

  // Scroll progress walks the camera through HILONG's five views.
  const controller = useCallback<ModelStageController>(api => {
    const poses = views.map(pose => api.resolve(pose));
    const media = window.matchMedia(COMPACT);
    let shown = -1;
    const update = (jump = false) => {
      const value = media.matches ? stageExit.get() * COMPACT_END : scrollYProgress.get();
      const { pose, index, local, nearest } = samplePath(poses, value, HOLD, smootherstep);
      const sway = (next: ResolvedPose) => ({ ...next, theta: next.theta + swayFor(next.radius) * Math.sin(value * Math.PI * 8) });
      if (CUT[index]) {
        // Rest on the nearest view; the jump to the next one lands at mid-move, under the dip.
        api.root.style.setProperty('--ac-cut', dip(local).toFixed(3));
        api.apply(sway(poses[nearest]), { jump: jump || nearest !== shown });
        shown = nearest;
        return;
      }
      api.root.style.setProperty('--ac-cut', '0');
      // Overview → reception: swing sideways, ease back and rise mid-move (a crane
      // move). Squared so the arc vanishes near each view.
      const arc = Math.sin(Math.PI * local) ** 2;
      // Arriving straight from an interior view (an instant jump such as the Home key)
      // cuts too, rather than easing out through the booth's walls.
      const fromInside = shown > index + 1;
      api.apply(sway({ ...pose, theta: pose.theta + arc * FLIGHT.theta, radius: pose.radius + arc * FLIGHT.back, phi: pose.phi - arc * FLIGHT.rise }), { jump: jump || fromInside });
      shown = nearest;
    };
    const onMedia = () => update(true);
    update(true);
    const stopPage = scrollYProgress.on('change', () => { if (!media.matches) update(); });
    const stopStage = stageExit.on('change', () => { if (media.matches) update(); });
    media.addEventListener('change', onMedia);
    return () => {
      stopPage();
      stopStage();
      media.removeEventListener('change', onMedia);
      api.root.style.removeProperty('--ac-cut');
    };
  }, [scrollYProgress, stageExit]);

  const active = hilong.views[view] ?? hilong.views[0];
  return <div ref={split} className="ac-about">
    <div ref={stageCol} className="ac-about-stage-col">
      <div className="ac-about-stage-pin">
        <ModelStage model={hilong} initialPose={views[0]} controller={controller} className="ac-about-stage" posterPriority
          description={`Decorative 3D model of the ${hilong.name} ${hilong.code} exhibition booth. The camera moves through its views as the page scrolls.`}>
          <div className="ac-stage-caption" data-view={active.id}>
            <span className="ac-stage-label">{hilong.name} / {hilong.code} · <span className="ac-stage-view">{active.label}</span></span>
            <ol className="ac-stage-ticks" aria-hidden="true">{hilong.views.map((item, index) => <li key={item.id} data-active={index === view ? '' : undefined} data-passed={index < view ? '' : undefined}/>)}</ol>
          </div>
        </ModelStage>
      </div>
    </div>

    <div ref={content} className="ac-about-content">
      <section className="ac-about-intro" aria-labelledby="ac-about-title">
        <p className="eyebrow ac-enter" style={delay(.05)}><span/> ABOUT TIME SERVICE</p>
        <SplitChars as="h1" id="ac-about-title" variant="rise" className="ac-title" delay={.18} stagger={.024}
          lines={['The idea', 'is yours', { text: 'The commitment', italic: true }, { text: 'is ours', italic: true }]}/>
        <p className="ac-lead ac-enter" style={delay(.95)}>A design and construction partner in Bangkok, bringing creative ambition and practical thinking into the same space.</p>
      </section>

      <Figure src="/images/team.jpg" alt="AI concept of a project manager overseeing an exhibition installation" sizes="(max-width: 1023px) 100vw, 52vw" speed={26} className="ac-figure-team" priority/>

      <section className="ac-about-block" aria-labelledby="ac-story-title">
        <p className="eyebrow" data-reveal="up"><span/> ONE TEAM, FROM START TO FINISH</p>
        <SplitChars id="ac-story-title" variant="skew" className="ac-statement" lines={['More than a space', { text: 'A shared success', italic: true }]}/>
        <div className="ac-columns">
          <p lang="th" className="ac-body-thai" data-reveal="up">Time Service Designs and Constructions Co., Ltd. เชื่อว่าพื้นที่ที่ดีเริ่มต้นจากความเข้าใจ เรารับฟังเป้าหมายของคุณ และทำงานร่วมกันเพื่อเปลี่ยนแนวคิดให้กลายเป็นประสบการณ์ที่จับต้องได้</p>
          <p className="ac-body" data-reveal="up" style={delay(.12)}>Our work connects exhibition design, event production, construction, lighting, sound and interiors. We consider the whole journey: how a space is imagined, how it is made and how people experience it.</p>
        </div>
        <ol className="ac-values">
          {values.map((value, index) => <li key={value.title} data-reveal="line" style={delay(index * .12)}>
            <span className="ac-value-number">0{index + 1}</span>
            <h3>{value.title}</h3>
            <p>{value.copy}</p>
          </li>)}
        </ol>
      </section>

      <div className="ac-collage">
        {collage.map(image => <Figure key={image.src} {...image}/>)}
      </div>

      <section className="ac-about-block ac-how" aria-labelledby="ac-how-title">
        <p className="eyebrow" data-reveal="up"><span/> HOW WE WORK</p>
        <div className="ac-how-head">
          <SplitChars id="ac-how-title" variant="skew" className="ac-statement" lines={['From your vision', { text: 'To opening day', italic: true }]}/>
          <p className="ac-side-note" data-reveal="up"><span lang="th">ทุกขั้นตอน ใส่ใจทุกรายละเอียด</span><span>A clear process. A shared ambition.</span></p>
        </div>
        <Steps/>
      </section>
    </div>
  </div>;
}
