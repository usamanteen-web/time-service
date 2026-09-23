import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import PageIntro from '@/components/PageIntro';
import CTA from '@/components/CTA';
import {services} from '@/lib/content';
export const metadata:Metadata={title:'Our services'};
export default function ServicesPage(){return <><PageIntro eyebrow="OUR EXPERTISE" title="Considered design." italic="Complete delivery." description="Five connected capabilities. One partner to bring your exhibition, event or environment to life."/><div className="service-details">{services.map(s=><section id={s.id} className="service-detail" key={s.id}><div className="service-detail-image"><Image src={`/images/${s.image}.jpg`} alt={s.alt} fill sizes="(max-width:768px) 100vw, 50vw"/><span className="image-credit">AI concept image</span></div><div className="service-detail-copy"><p className="eyebrow">{s.number} / OUR SERVICES</p><h2>{s.title}</h2><p className="thai service-thai">{s.thai}</p><p>{s.description}</p><p lang="th">{s.detail}</p><ul>{s.includes.map(x=><li key={x}>{x}</li>)}</ul><Link href="/contact/" className="text-link">Discuss your project <ArrowUpRight size={18}/></Link></div></section>)}</div><CTA/></>;}
