'use client';
import { useMotionPreference } from './useMotionPreference';
import {useEffect,useRef,useState} from 'react';
import {useInView} from 'framer-motion';
import {Handshake,Users,Globe2,Trophy} from 'lucide-react';
const stats=[{n:15,suffix:'+',label:'Years of experience',thai:'ปีของประสบการณ์',icon:Handshake},{n:200,suffix:'+',label:'Projects completed',thai:'โครงการที่สำเร็จ',icon:Users},{n:100,suffix:'+',label:'Trusted clients',thai:'ลูกค้าที่ไว้วางใจ',icon:Globe2},{n:99,suffix:'%',label:'Client satisfaction',thai:'ความพึงพอใจ',icon:Trophy}];
function Count({value,suffix}:{value:number;suffix:string}){
 const ref=useRef<HTMLSpanElement>(null);const visible=useInView(ref,{once:true});const reduced=useMotionPreference();const [count,setCount]=useState(value);
 useEffect(()=>{if(!visible||reduced)return;let id=0;let start:number|undefined;const tick=(time:number)=>{start??=time;const p=Math.min((time-start)/1400,1);setCount(Math.round(value*(1-Math.pow(1-p,3))));if(p<1)id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return ()=>cancelAnimationFrame(id);},[visible,reduced,value]);
 return <span ref={ref} className="stat-number" aria-label={`${value}${suffix}`}><span aria-hidden="true">{reduced?value:count}<em>{suffix}</em></span></span>;
}
export default function Statistics(){return <section className="statistics" aria-label="Time Service in numbers">{stats.map(s=><div className="stat" key={s.label}><s.icon size={25} strokeWidth={1.2}/><Count value={s.n} suffix={s.suffix}/><h3>{s.label}</h3><p lang="th">{s.thai}</p></div>)}</section>;}
