'use client';
import { useMotionPreference } from './useMotionPreference';
import {motion} from 'framer-motion';
import {MessageCircle,PencilRuler,Settings2,Wrench,Check} from 'lucide-react';
import {steps} from '@/lib/content';
const icons=[MessageCircle,PencilRuler,Settings2,Wrench,Check];
export default function Process(){const reduced=useMotionPreference();return <section className="section process-section" id="process"><div className="section-heading"><div><p className="eyebrow"><span/> HOW WE WORK</p><h2>From your vision.<br/><em>To opening day.</em></h2></div><p className="section-intro thai">ทุกขั้นตอน ใส่ใจทุกรายละเอียด<br/><span>A clear process. A shared ambition.</span></p></div><ol className="process-list"><motion.div className="process-track" aria-hidden="true" initial={{scaleX:reduced?1:0}} whileInView={{scaleX:1}} viewport={{once:true}} transition={{duration:1.2}}/>{steps.map((s,i)=>{const Icon=icons[i];return <li key={s.title}><span className="process-number">0{i+1}</span><div className="process-icon"><Icon size={26} strokeWidth={1.3}/></div><h3>{s.title}</h3><p className="thai">{s.thai}</p><p className="process-copy">{s.copy}</p></li>;})}</ol></section>;}
