import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft,ArrowUpRight} from 'lucide-react';
import {projects} from '@/lib/content';
import CTA from '@/components/CTA';
import SplitChars from '@/components/SplitChars';
const delay=(seconds:number)=>({'--ac-d':`${seconds}s`}) as React.CSSProperties;
export function generateStaticParams(){return projects.map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:projects.find(p=>p.slug===slug)?.title??'Concept'};}
export default async function ProjectPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=projects.find(p=>p.slug===slug);if(!p)notFound();const next=projects[(projects.indexOf(p)+1)%projects.length];return <><section className="project-detail-intro"><Link href="/projects/" className="text-link ac-enter" style={delay(0)}><ArrowLeft size={17}/>All concepts</Link><p className="eyebrow ac-enter" style={delay(.08)}>{p.category} / AI CONCEPT</p><SplitChars as="h1" variant="rise" delay={.15} stagger={.024} lines={[p.title]}/><p className="ac-enter" style={delay(.7)}>{p.description}</p></section><div className="project-detail-visual site-clip-enter" data-motion-skip><Image src={`/images/${p.image}.jpg`} alt={`${p.title}, an AI-generated spatial design concept`} fill priority sizes="100vw"/></div><section className="project-detail-notes"><div><span>PROJECT TYPE</span><p>{p.size}</p></div><div><span>VISUALISATION</span><p>Created with GPT Image</p></div><div><span>ABOUT THIS IMAGE</span><p>An illustrative design direction. No real client or completed construction project is represented.</p></div></section><Link href={`/projects/${next.slug}/`} className="next-project"><span>EXPLORE NEXT</span><SplitChars as="strong" variant="reveal" lines={[next.title]} stagger={.03}/><ArrowUpRight size={38}/></Link><CTA/></>;}
