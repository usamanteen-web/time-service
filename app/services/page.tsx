import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import PageIntro from '@/components/PageIntro';
import CTA from '@/components/CTA';
import SplitChars from '@/components/SplitChars';
import {services,serviceExtras} from '@/lib/content';
import {serviceImage} from '@/lib/service-media';
import {Fragment} from 'react';
import '../service-factory.css';
const lines=(text:string)=>text.split('\n').map((line,i)=><Fragment key={i}>{i>0&&<br/>}{line}</Fragment>);
export const metadata:Metadata={title:'Our services'};
// Contextual labels for the service photographs.
const imageLabels:Record<string,string>={exhibition:'Exhibition Design',event:'Event Organizer',construction:'Our Factory',lighting:'Lighting Design',interior:'Vehicles & Tour'};
export default function ServicesPage(){return <><PageIntro eyebrow="OUR EXPERTISE" title="Considered design" italic="Complete delivery" description="Five connected capabilities. One partner to bring your exhibition, event or environment to life."/><div className="service-details">{services.map(s=><section id={s.id} className="service-detail" key={s.id}><div className="service-detail-image"><Image src={serviceImage(s).src} alt={serviceImage(s).alt} fill sizes="(max-width:768px) 100vw, 50vw"/><span className="image-credit">{imageLabels[s.id]??s.title}</span></div><div className="service-detail-copy"><p className="eyebrow">{s.number} / OUR SERVICES</p><SplitChars variant="skew" lines={[s.title]}/><p className="thai service-thai">{s.thai}</p><p>{lines(s.description)}</p><p lang="th">{lines(s.detail)}</p>{s.id==='exhibition'&&<><p className="service-production-path" aria-label="Design, production, installation"><span>Design</span><span aria-hidden="true">→</span><span>Production</span><span aria-hidden="true">→</span><span>Installation</span></p><aside className="service-factory-proof" aria-label="Four in-house factories"><div className="service-factory-figure"><strong>04</strong><span>IN-HOUSE<br/>FACTORIES</span></div><p>From fabrication and finishing to quality control, every detail is managed by our own production teams.</p></aside></>}<ul>{s.includes.map((x,i)=><li key={x}>{x}{serviceExtras[s.id]?.includesThai?.[i]&&<span className="service-include-thai" lang="th">{serviceExtras[s.id]?.includesThai?.[i]}</span>}</li>)}</ul><Link href="/contact/" className="text-link">{serviceExtras[s.id]?.cta??'Discuss your project'} <ArrowUpRight size={18}/></Link></div></section>)}</div><CTA/></>;}
