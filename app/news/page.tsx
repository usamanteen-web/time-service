import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {articles} from '@/lib/journal';
import PageIntro from '@/components/PageIntro';
import CTA from '@/components/CTA';
export const metadata:Metadata={title:'News & insights'};
export default function NewsPage(){return <><PageIntro eyebrow="NEWS & INSIGHTS" title="Behind the spaces." italic="Ahead of the ideas." description="Notes on planning, design and the process of bringing a space to life."/><section className="section journal-grid">{articles.map(a=><Link href={`/news/${a.slug}/`} className="journal-card" key={a.slug}><div className="journal-image"><Image src={`/images/${a.image}.jpg`} alt={`AI concept illustration for ${a.title}`} fill sizes="(max-width:768px) 92vw, 31vw"/></div><p className="eyebrow">{a.category}</p><h2>{a.title}</h2><p>{a.intro}</p><span className="text-link">Read the story <ArrowUpRight size={17}/></span></Link>)}</section><CTA/></>;}
