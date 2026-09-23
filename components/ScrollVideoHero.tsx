'use client';
import { useMotionPreference } from './useMotionPreference';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';

function HeroLine({progress,children,direction=1}:{progress:MotionValue<number>;children:React.ReactNode;direction?:number}) {
  const reduced=useMotionPreference();
  const x=useTransform(()=>reduced?0:Math.min(progress.get()/.2,1)*direction*75);
  const rotateX=useTransform(()=>reduced?0:Math.min(progress.get()/.2,1)*direction*12);
  return <motion.span className="hero-kinetic-line" style={{x,rotateX}}>{children}</motion.span>;
}

function Chapter({progress, start, end, children, first=false}: {progress:MotionValue<number>;start:number;end:number;children:React.ReactNode;first?:boolean}) {
  const opacity=useTransform(progress, first?[0,end-.035,end]:end===1?[start,start+.015,1]:[start,start+.025,end-.025,end], first?[1,1,0]:end===1?[0,1,1]:[0,1,1,0]);
  const y=useTransform(progress,[start,end],[12,-18]);
  return <motion.div className={`hero-chapter ${first?'hero-chapter-first':''}`} style={{opacity,y}} aria-hidden={!first}>{children}</motion.div>;
}

export default function ScrollVideoHero(){
  const container=useRef<HTMLElement>(null);
  const video=useRef<HTMLVideoElement>(null);
  const raf=useRef<number>(0);
  const target=useRef(0);
  const frame=useRef(0);
  const progressLabel=useRef<HTMLSpanElement>(null);
  const reduced=useMotionPreference();
  const [failed,setFailed]=useState(false);
  const {scrollYProgress}=useScroll({target:container,offset:['start start','end end']});
  // Keep the text and video on the same measured scroll position across browsers.
  const storyProgress=useMotionValue(0);
  const scaleX=useTransform(storyProgress,[0,1],[0,1]);
  const sync=()=>{
    const el=video.current;
    if(!el || !Number.isFinite(el.duration) || reduced || failed) return;
    target.current=Math.max(0,Math.min(scrollYProgress.get(),1))*Math.max(0,el.duration-1/24);
    if(raf.current) return;
    const step=()=>{
      const v=video.current;
      if(!v){raf.current=0;return;}
      const diff=target.current-frame.current;
      frame.current=Math.abs(diff)<.018?target.current:frame.current+diff*.26;
      if(!v.seeking || Math.abs(diff)<.018) v.currentTime=frame.current;
      if(Math.abs(target.current-frame.current)>.001) raf.current=requestAnimationFrame(step);
      else {v.currentTime=target.current;raf.current=0;}
    };
    raf.current=requestAnimationFrame(step);
  };
  useMotionValueEvent(scrollYProgress,'change',(p)=>{storyProgress.set(p);if(progressLabel.current)progressLabel.current.textContent=`${String(Math.round(p*100)).padStart(2,'0')}%`;sync();});
  useEffect(()=>{
    const el=video.current;
    if(!el || reduced) return;
    el.src=window.matchMedia('(max-width: 767px)').matches?'/videos/hero-scroll-mobile.mp4':'/videos/hero-scroll-optimized.mp4';
    el.load();
    return ()=>{cancelAnimationFrame(raf.current);raf.current=0;};
  },[reduced]);
  useEffect(()=>()=>{cancelAnimationFrame(raf.current);raf.current=0;},[]);
  // The media-query CSS owns reduced-motion height, keeping anchor positions
  // identical before and after hydration. Only video failure changes this class.
  return <section id="hero" ref={container} className={`hero-scroll ${failed?'hero-static':''}`} aria-label="From idea to reality — scroll to explore">
    <div className="hero-sticky">
      <Image className="hero-poster" src="/images/hero-poster.jpg" alt="Completed Time Service exhibition booth inside a convention hall" fill priority sizes="100vw"/>
      {!reduced && !failed && <video ref={video} className="hero-video" muted playsInline preload="auto" poster="/images/hero-poster.jpg" aria-hidden="true" onLoadedMetadata={()=>{video.current?.pause();sync();}} onPlay={()=>video.current?.pause()} onError={()=>setFailed(true)}/>}
      <div className="hero-shade"/>
      <div className="hero-topline"><span>SPACES WITH PURPOSE. EXPERIENCES THAT STAY.</span><span>BANGKOK · THAILAND</span></div>
      <div className="hero-story">
        <Chapter progress={storyProgress} start={0} end={.20} first><h1><HeroLine progress={storyProgress} direction={-1}>Space.</HeroLine><HeroLine progress={storyProgress}><em>Ideas.</em></HeroLine><HeroLine progress={storyProgress} direction={-.5}>Experiences.</HeroLine></h1></Chapter>
        <Chapter progress={storyProgress} start={.20} end={.40}><p className="chapter-kicker">FROM CONCEPT TO COMPLETION</p><h2>Exhibition<br/><em>by design.</em></h2></Chapter>
        <Chapter progress={storyProgress} start={.40} end={.60}><h2>Design.<br/>Production.<br/><em>Installation.</em></h2></Chapter>
        <Chapter progress={storyProgress} start={.60} end={.80}><p className="chapter-kicker">WE DON’T JUST DESIGN IT.</p><h2>We<br/><em>build it.</em></h2></Chapter>
        <Chapter progress={storyProgress} start={.80} end={.955}><h2>Building ideas<br/><em>into reality.</em></h2></Chapter>
        <Chapter progress={storyProgress} start={.955} end={1}><p className="chapter-kicker">THE NEXT CHAPTER</p><h2>Discover<br/><em>our world.</em></h2></Chapter>
      </div>
      <a className="hero-3d-link glass-chip" href="#experience"><span className="hero-3d-orbit" aria-hidden="true"/> Explore in 3D <ArrowUpRight size={15}/></a>
      <div className="hero-bottom">
        <div className="hero-description"><strong>We build more than structures.<br/>We build your success.</strong><p>Your partner in exhibition, event and construction.<br/>From the first idea to the final detail.</p></div>
        <a className="button button-light" href="#projects">Explore our work <ArrowUpRight size={18}/></a>
      </div>
      <div className="hero-footer"><a href="#services"><ArrowDown size={15}/><span>SCROLL TO EXPLORE</span></a><div className="hero-progress"><span>IDEA</span><div><motion.span style={{scaleX}}/></div><span>REALITY</span><span ref={progressLabel} className="progress-value">00%</span></div><span className="hero-index">01 — 06</span></div>
    </div>
  </section>;
}
