'use client';
import { useMotionPreference } from './useMotionPreference';
import {useEffect,useRef,useState} from 'react';
import {Handshake,Users,Globe2,Trophy} from 'lucide-react';
const stats=[{n:18,suffix:'+',label:'Years of experience',thai:'ปีของประสบการณ์',icon:Handshake},{n:10000,suffix:'+',label:'Projects completed',thai:'โครงการที่สำเร็จ',icon:Users},{n:3500,suffix:'+',label:'Trusted clients',thai:'ลูกค้าที่ไว้วางใจ',icon:Globe2},{n:98,suffix:'%',label:'Client satisfaction',thai:'ความพึงพอใจ',icon:Trophy}];
const numberFormat=new Intl.NumberFormat('en-US');

function Count({value,suffix,progress}:{value:number;suffix:string;progress:number}){
 const count=progress===1?value:Math.floor(value*progress);
 return <span className="stat-number stats-number" aria-label={`${numberFormat.format(value)}${suffix}`}><span aria-hidden="true">{numberFormat.format(count)}<em>{suffix}</em></span></span>;
}

export default function Statistics(){
 const section=useRef<HTMLElement>(null);
 const reduced=useMotionPreference();
 const [progress,setProgress]=useState(0);

 useEffect(()=>{
  const element=section.current;
  if(!element||reduced)return;
  let frameId=0;
  let played=false;
  let startedAt:number|undefined;

  const tick=(time:number)=>{
   startedAt??=time;
   const elapsed=Math.min((time-startedAt)/1800,1);
   // One shared ease keeps every value moving and finishing together.
   const eased=elapsed<.5?4*elapsed**3:1-(-2*elapsed+2)**3/2;
   setProgress(elapsed===1?1:eased);
   if(elapsed<1)frameId=requestAnimationFrame(tick);
   else frameId=0;
  };

  const observer=new IntersectionObserver(([entry])=>{
   if(!entry.isIntersecting||entry.intersectionRatio===0){
    cancelAnimationFrame(frameId);
    frameId=0;
    played=false;
    startedAt=undefined;
    setProgress(0);
   }else if(entry.intersectionRatio>=.45&&!played){
    played=true;
    startedAt=undefined;
    setProgress(0);
    frameId=requestAnimationFrame(tick);
   }
  },{threshold:[0,.45]});

  // Prepare the next entrance before the section becomes visible.
  setProgress(0);
  observer.observe(element);
  return()=>{observer.disconnect();cancelAnimationFrame(frameId);};
 },[reduced]);

 return <section ref={section} id="statistics" className="statistics" aria-label="Time Service in numbers">{stats.map(s=><div className="stat" key={s.label}><s.icon size={25} strokeWidth={1.2} aria-hidden="true"/><Count value={s.n} suffix={s.suffix} progress={reduced?1:progress}/><h3>{s.label}</h3><p lang="th">{s.thai}</p></div>)}</section>;
}
