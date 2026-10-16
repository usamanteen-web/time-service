'use client';
import { useMotionPreference } from './useMotionPreference';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowDown, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Chars } from './SplitChars';
import './ScrollVideoHero.css';

const firstFrame='/images/hero/jiuli-video-poster.jpg';
const completedFrame='/images/hero/jiuli-video-complete.jpg';
const enter=(seconds:number)=>({'--ac-d':`${seconds}s`}) as React.CSSProperties;

/** A paused, frame-seeked film: the visitor's scroll is the only playback control. */
function ScrollFilm({progress}:{progress:MotionValue<number>}) {
  const video=useRef<HTMLVideoElement>(null);
  const reduced=useMotionPreference();
  const [ready,setReady]=useState(false);
  const [failed,setFailed]=useState(false);

  useEffect(()=>{
    const media=video.current;
    if(!media||reduced)return;
    let frame=0;
    let previous=0;
    let cursor=0;
    let disposed=false;
    const request=new AbortController();
    let objectUrl:string|undefined;
    const frameTime=1/24;
    const target=()=>Math.max(0,Math.min(1,progress.get()))*Math.max(0,media.duration-frameTime);
    const tick=(now:number)=>{
      frame=0;
      if(disposed||document.hidden||media.readyState<2||!Number.isFinite(media.duration))return;
      const elapsed=previous?Math.min(64,now-previous):16;
      previous=now;
      const destination=target();
      cursor+=(destination-cursor)*(1-Math.exp(-elapsed/100));
      if(Math.abs(destination-cursor)<frameTime/2)cursor=destination;
      // Do not interrupt the decoder with a new seek before the previous frame is ready.
      if(!media.seeking&&Math.abs(media.currentTime-cursor)>frameTime/2)media.currentTime=cursor;
      if(Math.abs(destination-cursor)>frameTime/2||Math.abs(destination-media.currentTime)>frameTime/2)frame=requestAnimationFrame(tick);
    };
    const wake=()=>{if(!frame&&!disposed&&!document.hidden){previous=0;frame=requestAnimationFrame(tick);}};
    const loaded=()=>{setReady(true);wake();};
    const error=()=>{setFailed(true);setReady(false);};
    const visibility=()=>{
      if(document.hidden){cancelAnimationFrame(frame);frame=0;}
      else wake();
    };
    setReady(false);
    setFailed(false);
    media.addEventListener('loadeddata',loaded);
    media.addEventListener('canplay',wake);
    media.addEventListener('seeked',wake);
    media.addEventListener('error',error);
    document.addEventListener('visibilitychange',visibility);
    const unsubscribe=progress.on('change',wake);
    const source=window.matchMedia('(max-width: 767px)').matches?'/videos/jiuli/hero-scroll-540.mp4':'/videos/jiuli/hero-scroll-1080.mp4';
    // Some static hosts (including Pages) ignore Range requests. A complete
    // response becomes a local blob so the browser can still seek every frame.
    // Hosts supporting ranges keep native progressive video loading.
    const loadSource=async()=>{
      try {
        const response=await fetch(source,{headers:{Range:'bytes=0-0'},signal:request.signal});
        if(!response.ok)throw new Error(`Video request failed: ${response.status}`);
        let playableSource=source;
        if(response.status===206){
          await response.body?.cancel();
        }else{
          const data=await response.blob();
          if(disposed)return;
          objectUrl=URL.createObjectURL(data);
          playableSource=objectUrl;
        }
        if(disposed)return;
        media.src=playableSource;
        media.load();
      }catch{
        if(!disposed)error();
      }
    };
    void loadSource();
    return()=>{
      disposed=true;
      request.abort();
      cancelAnimationFrame(frame);
      unsubscribe();
      media.removeEventListener('loadeddata',loaded);
      media.removeEventListener('canplay',wake);
      media.removeEventListener('seeked',wake);
      media.removeEventListener('error',error);
      document.removeEventListener('visibilitychange',visibility);
      media.pause();
      media.removeAttribute('src');
      media.load();
      if(objectUrl)URL.revokeObjectURL(objectUrl);
    };
  },[progress,reduced]);

  return <div className="hero-film" aria-hidden="true">
    {/* Keep a real frame visible before decoding and when motion is disabled. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="hero-film-poster" src={reduced||failed?completedFrame:firstFrame} alt="" width={1920} height={1080} fetchPriority="high"/>
    <video ref={video} className="hero-film-video" data-ready={ready&&!reduced?'':undefined} poster={firstFrame} preload="auto" muted playsInline controls={false} disablePictureInPicture disableRemotePlayback tabIndex={-1}/>
  </div>;
}

function HeroLine({progress,children,direction=1}:{progress:MotionValue<number>;children:React.ReactNode;direction?:number}) {
  const reduced=useMotionPreference();
  const x=useTransform(()=>reduced?0:Math.min(progress.get()/.2,1)*direction*75);
  const rotateX=useTransform(()=>reduced?0:Math.min(progress.get()/.2,1)*direction*12);
  return <motion.span className="hero-kinetic-line" style={{x,rotateX}}>{children}</motion.span>;
}

function Chapter({progress, start, end, children, first=false}: {progress:MotionValue<number>;start:number;end:number;children:React.ReactNode;first?:boolean}) {
  const reduced=useMotionPreference();
  const y=useTransform(progress,[start,end],[12,-18]);
  // The chapter on screen gets data-active, which (re)plays its letter-by-letter rise.
  // Let the brief fade finish even if scrolling stops exactly at a chapter boundary.
  const isOn=(p:number)=>p>=start&&(end===1||p<end);
  const [active,setActive]=useState(()=>isOn(progress.get()));
  useMotionValueEvent(progress,'change',p=>{const on=isOn(p);setActive(current=>current===on?current:on);});
  return <motion.div className={`hero-chapter ${first?'hero-chapter-first':''}`} initial={{opacity:first?1:0}} animate={{opacity:active?1:0}} transition={{duration:reduced?0:.22}} style={{y}} aria-hidden={!first} data-active={active?'':undefined}>{children}</motion.div>;
}

export default function ScrollVideoHero(){
  const container=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:container,offset:['start start','end end']});
  const storyProgress=useMotionValue(0);
  const scaleX=useTransform(storyProgress,[0,1],[0,1]);
  useMotionValueEvent(scrollYProgress,'change',p=>storyProgress.set(p));
  return <section id="hero" ref={container} className="hero-scroll hero-scroll-film" aria-label="From idea to reality — scroll to explore JIULI">
    <div className="hero-sticky">
      <div className="hero-media">
        <ScrollFilm progress={storyProgress}/>
      </div>
      <div className="hero-shade"/>
      <div className="hero-topline site-enter" style={enter(.1)}><span>EXHIBITION · EVENT · CONSTRUCTION</span><span>BANGKOK · THAILAND</span></div>
      <div className="hero-story">
        <Chapter progress={storyProgress} start={0} end={.20} first><h1 aria-label="Space Ideas Experiences"><HeroLine progress={storyProgress} direction={-1}><Chars text="Space"/></HeroLine><HeroLine progress={storyProgress}><em><Chars text="Ideas" start={5}/></em></HeroLine><HeroLine progress={storyProgress} direction={-.5}><Chars text="Experiences" start={10}/></HeroLine></h1></Chapter>
        <Chapter progress={storyProgress} start={.20} end={.40}><p className="chapter-kicker">FROM CONCEPT TO COMPLETION</p><h2 aria-label="Exhibition by design"><Chars text="Exhibition"/><br/><em><Chars text="by design" start={10}/></em></h2></Chapter>
        <Chapter progress={storyProgress} start={.40} end={.60}><h2 aria-label="Design Production Installation"><Chars text="Design"/><br/><Chars text="Production" start={6}/><br/><em><Chars text="Installation" start={16}/></em></h2></Chapter>
        <Chapter progress={storyProgress} start={.60} end={.80}><p className="chapter-kicker">WE DON’T JUST DESIGN IT</p><h2 aria-label="We build it"><Chars text="We"/><br/><em><Chars text="build it" start={2}/></em></h2></Chapter>
        <Chapter progress={storyProgress} start={.80} end={.955}><h2 aria-label="Building ideas into reality"><Chars text="Building ideas"/><br/><em><Chars text="into reality" start={13}/></em></h2></Chapter>
        <Chapter progress={storyProgress} start={.955} end={1}><p className="chapter-kicker">THE NEXT CHAPTER</p><h2 aria-label="Discover our world"><Chars text="Discover"/><br/><em><Chars text="our world" start={8}/></em></h2></Chapter>
      </div>
      <a className="hero-3d-link glass-chip site-enter" style={enter(1.15)} href="#experience"><span className="hero-project-label"><small>A DIFFERENT PERSPECTIVE</small><strong>Explore our spaces</strong><span>Interactive 3D experience</span></span><span className="hero-project-arrow"><ArrowUpRight size={20}/></span></a>
      <div className="hero-bottom">
        <div className="hero-description site-enter" style={enter(.85)}><strong>We build more than structures<br/>We build your success</strong><p>Your partner in exhibition, event and construction<br/>From the first idea to the final detail</p></div>
        <div className="hero-actions site-enter" style={enter(1)}><a className="button button-light" href="#projects">Explore our work <ArrowRight size={18}/></a></div>
      </div>
      <div className="hero-footer site-enter" style={enter(1.3)}><a href="#services"><ArrowDown size={15}/><span>SCROLL TO EXPLORE</span></a><div className="hero-progress"><span>IDEA</span><div><motion.span style={{scaleX}}/></div><span>REALITY</span></div></div>
    </div>
  </section>;
}
