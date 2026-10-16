'use client';

import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight,ArrowDown} from 'lucide-react';
import { useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { getModelById } from '@/lib/model-catalog';
import { steps } from '@/lib/content';
import ModelStage from './ModelStage';
import FactoryEditorial from './FactoryEditorial';
import {useAboutCamera} from './useAboutCamera';
import { useMotionPreference } from './useMotionPreference';
import { useRevealGroup } from './useRevealGroup';
import SplitChars from './SplitChars';

const marun = getModelById('marun')!;
const values = [
  { title: 'Thoughtful design', copy: 'Every decision starts with purpose.' },
  { title: 'Attention to detail', copy: 'Ideas are only as good as their execution.' },
  { title: 'Working together', copy: 'Clear conversations at every stage.' },
];
const delay = (seconds: number) => ({ '--ac-d': `${seconds}s` }) as CSSProperties;

/** Use the same letter choreography as the other pages, driven by scroll after the opener. */
function StoryHeading({id, lines, intro = false}: {id:string; lines:string[]; intro?:boolean}) {
  return <SplitChars id={id} as={intro ? 'h1' : 'h2'} className={intro ? 'ac-title' : 'ac-statement'}
    variant={intro ? 'rise' : 'skew'} delay={.08} stagger={.017} offset={['start 96%', 'start 64%']}
    lines={lines.map((text,index) => ({text, italic:index > 0}))}/>;
}

/** An image that clips open when revealed and drifts at its own speed while scrolling. */
function Figure({src, alt, caption, sizes, speed, className = '', priority = false}: {src: string; alt: string; caption: string; sizes: string; speed: number; className?: string; priority?: boolean}) {
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
      <figcaption className="ac-credit">{caption}</figcaption>
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
  // The complete story, including the factory chapter, directs the pinned camera.
  const { scrollYProgress } = useScroll({ target: split, offset: ['start start', 'end end'] });
  const { scrollYProgress: stageExit } = useScroll({ target: stageCol, offset: ['start start', 'end 25%'] });
  useRevealGroup(content);

  const {controller,view,views,initialPose}=useAboutCamera(scrollYProgress,stageExit);
  const active=views[view]??views[0];
  return <div ref={split} className="ac-about">
    <div ref={stageCol} className="ac-about-stage-col">
      <div className="ac-about-stage-pin">
        <ModelStage model={marun} initialPose={initialPose} controller={controller} interpolationDecay={60} className="ac-about-stage" posterPriority
          description={`Decorative 3D model of the ${marun.name} ${marun.code} exhibition booth. The camera moves through its views as the page scrolls.`}>
          <div className="ac-stage-heading" aria-hidden="true"><span>MARUN</span><span>A closer perspective</span></div>
          <div className="ac-stage-caption" data-view={active.id}>
            <span className="ac-stage-label"><span className="ac-stage-view">{active.label}</span></span>
            <ol className="ac-stage-ticks" aria-hidden="true">{views.map((item, index) => <li key={item.id} data-active={index === view ? '' : undefined} data-passed={index < view ? '' : undefined}/>)}</ol>
          </div>
        </ModelStage>
      </div>
    </div>

    <div ref={content} className="ac-about-content">
      <section className="ac-about-intro" aria-labelledby="ac-about-title">
        <p className="eyebrow ac-enter" style={delay(.05)}><span/> ABOUT TIME SERVICE</p>
        <StoryHeading id="ac-about-title" lines={['The idea is yours.', 'The commitment', 'is ours.']} intro/>
        <p className="ac-lead ac-enter" style={delay(.55)}>We bring your exhibition to life, from the first design to the final installation.</p>
        <p className="ac-intro-thai ac-enter" style={delay(.7)} lang="th">จากไอเดียของคุณ สู่พื้นที่ที่สร้างขึ้นจริง ด้วยทีมออกแบบและผลิตของเราเอง</p>
        <a className="ac-about-scroll-hint ac-enter" href="#ac-story-title" style={delay(.9)}><ArrowDown size={15}/><span>Scroll to discover the story</span></a>
      </section>

      <Figure src="/images/about-orffa.jpg" alt="ORFFA exhibition stand designed and constructed by Time Service" caption="Exhibition Design & Construction" sizes="(max-width: 1023px) 100vw, 52vw" speed={26} className="ac-figure-team" priority/>

      <section className="ac-about-block" aria-labelledby="ac-story-title">
        <p className="eyebrow" data-reveal="up"><span/> ONE TEAM, FROM START TO FINISH</p>
        <StoryHeading id="ac-story-title" lines={['One team.', 'Every stage.']}/>
        <div className="ac-columns">
          <p lang="th" className="ac-body-thai" data-reveal="up">พื้นที่ที่ดีเริ่มจากความเข้าใจแบรนด์ เรารับฟังเป้าหมาย ออกแบบประสบการณ์ และดูแลงานผลิตจนถึงการติดตั้ง เพื่อให้รายละเอียดที่วางไว้ในแบบเกิดขึ้นจริง</p>
          <p className="ac-body" data-reveal="up" style={delay(.12)}>Design, fabrication and installation belong to the same story. Our team connects these stages, keeping the creative idea in view as materials become a finished space.</p>
        </div>
        <ol className="ac-values">
          {values.map((value, index) => <li key={value.title} data-reveal="line" style={delay(index * .12)}>
            <span className="ac-value-number">0{index + 1}</span>
            <h3>{value.title}</h3>
            <p>{value.copy}</p>
          </li>)}
        </ol>
      </section>

      <FactoryEditorial/>

      <section className="ac-about-block ac-recognition" aria-labelledby="ac-recognition-title">
        <p className="eyebrow" data-reveal="up"><span/> MARUN · RECOGNITION</p>
        <StoryHeading id="ac-recognition-title" lines={['Design that', 'stands out.']}/>
        <p className="ac-recognition-note">Best Design and Construction</p>
        <div className="ac-columns">
          <p className="ac-body-thai" lang="th" data-reveal="up">บูธ MARUN ได้รับ Certificate Best Design and Construction ผลงานบูธสองชั้นที่เชื่อมพื้นที่ต้อนรับ การนำเสนอแบรนด์ และพื้นที่พบปะไว้ด้วยกัน ตั้งแต่ภาพรวมของสถาปัตยกรรมไปจนถึงรายละเอียดการก่อสร้าง</p>
          <p className="ac-body" data-reveal="up">The MARUN stand received a Best Design and Construction certificate. Its two-level architecture brings reception, brand presentation and meeting spaces into one connected experience—an approach that carries the design through to the finished construction.</p>
        </div>
        <a className="text-link ac-recognition-link" href="/news/double-decker-exhibition-stands/" data-reveal="up">Explore the MARUN story</a>
      </section>

      <section className="ac-about-block ac-how" aria-labelledby="ac-how-title">
        <p className="eyebrow" data-reveal="up"><span/> HOW WE WORK</p>
        <div className="ac-how-head">
          <StoryHeading id="ac-how-title" lines={['From your vision', 'to opening day.']}/>
          <p className="ac-side-note" data-reveal="up"><span lang="th">ทุกขั้นตอน ใส่ใจทุกรายละเอียด</span><span>A clear process. A shared ambition.</span></p>
        </div>
        <Steps/>
      </section>

      <section className="ac-about-finale" aria-labelledby="ac-finale-title">
        <p className="eyebrow" data-reveal="up">LET’S BUILD TOGETHER</p>
        <StoryHeading id="ac-finale-title" lines={['Your next idea.', 'Let’s build it.']}/>
        <p data-reveal="up">From the first conversation to opening day, our team brings the design, production and installation together.</p>
        <p lang="th" data-reveal="up">จากแนวคิดแรกถึงวันเปิดงาน ให้ทีมของเราดูแลทุกขั้นตอนเพื่อทำให้ภาพที่คุณตั้งใจเกิดขึ้นจริง</p>
        <div className="ac-about-finale-links" data-reveal="up"><Link className="button button-blue" href="/contact/">Discuss your project <ArrowUpRight size={18}/></Link><Link className="text-link" href="/projects/">Explore our work <ArrowUpRight size={18}/></Link></div>
      </section>
    </div>
  </div>;
}
