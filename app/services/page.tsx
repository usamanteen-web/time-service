import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import PageIntro from '@/components/PageIntro';
import CTA from '@/components/CTA';
import SplitChars from '@/components/SplitChars';
import {services,serviceExtras} from '@/lib/content';
import {Fragment} from 'react';
const lines=(text:string)=>text.split('\n').map((line,i)=><Fragment key={i}>{i>0&&<br/>}{line}</Fragment>);
export const metadata:Metadata={title:'Our services'};
// Image labels edited on the Claude Design canvas.
const imageLabels:Record<string,string>={construction:'Project Consultant',lighting:'Lighting Design'};
export default function ServicesPage(){return <><PageIntro eyebrow="OUR EXPERTISE" title="Considered design" italic="Complete delivery" description="Five connected capabilities. One partner to bring your exhibition, event or environment to life."/><div className="service-details">{services.map(s=><section id={s.id} className="service-detail" key={s.id}><div className="service-detail-image"><Image src={`/images/${s.image}.jpg`} alt={s.alt} fill sizes="(max-width:768px) 100vw, 50vw"/><span className="image-credit">{imageLabels[s.id]??'AI concept image'}</span></div><div className="service-detail-copy"><p className="eyebrow">{s.number} / OUR SERVICES</p><SplitChars variant="skew" lines={[s.title]}/><p className="thai service-thai">{s.thai}</p><p>{lines(s.description)}</p><p lang="th">{lines(s.detail)}</p><ul>{s.includes.map((x,i)=><li key={x}>{x}{serviceExtras[s.id]?.includesThai?.[i]&&<span className="service-include-thai" lang="th">{serviceExtras[s.id]?.includesThai?.[i]}</span>}</li>)}</ul><Link href="/contact/" className="text-link">{serviceExtras[s.id]?.cta??'Discuss your project'} <ArrowUpRight size={18}/></Link></div></section>)}</div><CTA/></>;}
