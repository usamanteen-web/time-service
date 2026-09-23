import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
import {articles} from '@/lib/journal';
import CTA from '@/components/CTA';
export function generateStaticParams(){return articles.map(a=>({slug:a.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:articles.find(a=>a.slug===slug)?.title??'Insights'};}
export default async function Article({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const a=articles.find(a=>a.slug===slug);if(!a)notFound();return <><article className="article"><Link href="/news/" className="text-link"><ArrowLeft size={17}/>All insights</Link><p className="eyebrow">{a.category}</p><h1>{a.title}</h1><p className="article-intro">{a.intro}</p><div className="article-image"><Image src={`/images/${a.image}.jpg`} alt="AI-generated concept image illustrating the article" fill priority sizes="(max-width:900px) 92vw, 900px"/></div><p className="concept-note">Illustrative concept image created with GPT Image.</p>{a.sections.map(s=><section key={s.heading}><h2>{s.heading}</h2><p>{s.body}</p></section>)}</article><CTA/></>;}
