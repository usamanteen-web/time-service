'use client';
import { useMotionPreference } from './useMotionPreference';
import {useEffect,useRef,useState} from 'react';
import {motion} from 'framer-motion';
import {MessageCircle,PencilRuler,Settings2,Wrench,Check} from 'lucide-react';
import {steps} from '@/lib/content';
import SplitChars from './SplitChars';
const icons=[MessageCircle,PencilRuler,Settings2,Wrench,Check];

/**
 * How we work. On wide screens the section pins while you scroll and the dark
 * highlight walks from step 1 to step 5; once past the last step every step
 * returns to white. Narrow screens follow the list's own scroll position.
 */
export default function Process(){
 const reduced=useMotionPreference();
 const wrap=useRef<HTMLDivElement>(null);
 const list=useRef<HTMLOListElement>(null);
 const [active,setActive]=useState(-1);
 useEffect(()=>{
  if(reduced){setActive(-1);return;}
  const wide=window.matchMedia('(min-width: 1024px)');
  const count=steps.length;
  const clamp=(value:number)=>Math.min(1,Math.max(0,value));
  // Measured on every scroll so layout shifts above (the pinned 3D section) never skew it.
  const progress=()=>{
   if(wide.matches&&wrap.current){const r=wrap.current.getBoundingClientRect(),section=wrap.current.firstElementChild as HTMLElement;return clamp(-r.top/Math.max(1,r.height-section.offsetHeight));}
   if(!list.current)return 0;
   const r=list.current.getBoundingClientRect(),start=window.innerHeight*.75,end=window.innerHeight*.4;
   return clamp((start-r.top)/Math.max(1,r.height+start-end));
  };
  let frame=0;
  const update=()=>{
   frame=0;
   const value=progress();
   // One slot per step plus a final slot where every step is white again.
   const next=value>=count/(count+1)?-1:Math.min(count-1,Math.floor(value*(count+1)));
   setActive(current=>current===next?current:next);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  update();
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  wide.addEventListener('change',schedule);
  return ()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);wide.removeEventListener('change',schedule);};
 },[reduced]);
 return <div ref={wrap} className="process-scrolly"><section className="section process-section" id="process"><div className="section-heading"><div><p className="eyebrow"><span/> HOW WE WORK</p><SplitChars variant="skew" lines={['From your vision',{text:'To opening day',italic:true}]}/></div><p className="section-intro thai">ทุกขั้นตอน ใส่ใจทุกรายละเอียด<br/><span>A clear process. A shared ambition</span></p></div><ol ref={list} className="process-list"><motion.div className="process-track" aria-hidden="true" initial={{scaleX:reduced?1:0}} whileInView={{scaleX:1}} viewport={{once:true}} transition={{duration:1.2}}/>{steps.map((s,i)=>{const Icon=icons[i];return <li key={s.title} data-active={i===active?'':undefined} aria-current={i===active?'step':undefined}><span className="process-number">0{i+1}</span><div className="process-icon"><Icon size={26} strokeWidth={1.3}/></div><SplitChars as="h3" variant="reveal" lines={[s.title]} delay={.15+i*.1} stagger={.03}/><p className="thai">{s.thai}</p><p className="process-copy">{s.copy}</p></li>;})}</ol></section><div className="process-scrolly-space" aria-hidden="true"/></div>;
}
