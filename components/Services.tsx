import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Blocks, CalendarRange, Building2, Lightbulb, Armchair } from 'lucide-react';
import { services } from '@/lib/content';
import KineticHeading from './KineticHeading';
import SplitChars from './SplitChars';
const serviceIcons=[Blocks,CalendarRange,Building2,Lightbulb,Armchair];
const serviceSummaries=['Turn ideas into impactful brand experiences.','Create memorable events, from concept to execution.','When challenges arise, we step in to coordinate, solve and keep the project on track','Bring spaces to life with light, sound and atmosphere.','Seamless transportation and tour services for every journey.'];
export default function Services(){
 return <section id="services" className="section services-section">
  <div className="section-heading"><div><p className="eyebrow"><span/> WHAT WE DO</p><KineticHeading first="One partner" second="Every possibility"/></div><div className="section-intro"><p className="service-intro-title">One-stop services</p><p><strong>From possibility to reality.</strong><br/>One team bringing design, production, technology and logistics together.</p><Link href="/services/" className="text-link">Explore our services <ArrowUpRight size={17}/></Link></div></div>
  <div className="service-grid">{services.map((s,i)=>{const Icon=serviceIcons[i];return <Link href={`/services/#${s.id}`} className="service-card" key={s.id}><div className="service-image"><Image src={`/images/${s.image}.jpg`} alt={s.alt} fill sizes="(max-width:600px) 88vw, (max-width:1000px) 44vw, 20vw"/><span>{s.number}</span></div><div className="service-card-copy"><Icon className="service-icon" size={20} strokeWidth={1.4}/><SplitChars as="h3" variant="reveal" lines={[s.title]} delay={.15+i*.1} stagger={.018}/><p>{serviceSummaries[i]}</p><p className="service-thai" lang="th">{s.thai}</p><span className="service-arrow"><ArrowUpRight size={18}/></span></div></Link>;})}</div>
 </section>;
}
