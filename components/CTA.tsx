import ParallaxImage from './ParallaxImage';
import KineticHeading from './KineticHeading';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
/** `title` lets a page keep its own heading punctuation (as edited on the canvas). */
export default function CTA({title=['Your vision','Our construction']}:{title?:[string,string]}){return <section className="cta-section"><ParallaxImage src="/images/interior.jpg" sizes="100vw" alt="" strength={45}/><div className="cta-shade"/><div className="cta-content"><p className="eyebrow"><span/> LET’S BUILD TOGETHER</p><KineticHeading first={title[0]} second={title[1]}/><p>From concept to completion, your partner in<br/>exhibition, event and construction.</p><p className="cta-thai" lang="th">ให้เราเป็นส่วนหนึ่งของความสำเร็จในทุกงานของคุณ</p><div className="cta-actions"><Link href="/contact/" className="button button-light">Get in touch <ArrowUpRight size={18}/></Link><Link href="/projects/" className="text-link light">View our work <ArrowUpRight size={17}/></Link></div></div><p className="cta-quote">“Build your design<br/><em>Build your Branding</em>”</p></section>;}
