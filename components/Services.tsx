import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { services } from '@/lib/content';
import KineticHeading from './KineticHeading';
export default function Services(){
 return <section id="services" className="section services-section">
  <div className="section-heading"><div><p className="eyebrow"><span/> WHAT WE DO</p><KineticHeading first="One partner." second="Every possibility."/></div><div className="section-intro"><p className="thai">ครบวงจร เพื่อทุกความสำเร็จของคุณ</p><p>From a bold first idea to a space that works.<br/>Our expertise brings it all together.</p><Link href="/services/" className="text-link">Explore our services <ArrowUpRight size={17}/></Link></div></div>
  <div className="service-grid">{services.map(s=><Link href={`/services/#${s.id}`} className="service-card" key={s.id}><div className="service-image"><Image src={`/images/${s.image}.jpg`} alt={s.alt} fill sizes="(max-width:600px) 88vw, (max-width:1000px) 44vw, 20vw"/><span>{s.number}</span><ArrowUpRight className="service-arrow" size={21}/></div><h3>{s.title}</h3><p lang="th">{s.thai}</p><span className="service-line"/></Link>)}</div>
 </section>;
}
