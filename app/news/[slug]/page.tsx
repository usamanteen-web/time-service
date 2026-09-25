import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
import {articles} from '@/lib/journal';
import CTA from '@/components/CTA';
import SplitChars from '@/components/SplitChars';
const delay=(seconds:number)=>({'--ac-d':`${seconds}s`}) as React.CSSProperties;
export function generateStaticParams(){return articles.map(a=>({slug:a.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:articles.find(a=>a.slug===slug)?.title??'Insights'};}
export default async function Article({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const a=articles.find(a=>a.slug===slug);if(!a)notFound();return <><article className="article"><Link href="/news/" className="text-link ac-enter" style={delay(0)}><ArrowLeft size={17}/>All insights</Link><p className="eyebrow ac-enter" style={delay(.08)}>{a.category}</p><SplitChars as="h1" variant="rise" delay={.15} stagger={.018} lines={[a.title]}/><p className="article-intro ac-enter" style={delay(.9)}>{a.intro}</p><div className="article-image site-clip-enter" data-motion-skip><Image src={`/images/${a.image}.jpg`} alt="AI-generated concept image illustrating the article" fill priority sizes="(max-width:900px) 92vw, 900px"/></div><p className="concept-note">Illustrative concept image created with GPT Image.</p>{a.sections.map(s=><section key={s.heading}><SplitChars variant="reveal" lines={[s.heading]} stagger={.018}/><p>{s.body}</p></section>)}</article><CTA/></>;}
