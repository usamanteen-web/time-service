import ParallaxImage from './ParallaxImage';
import KineticHeading from './KineticHeading';
import Link from 'next/link';
import {ArrowUpRight,Phone} from 'lucide-react';
import {company} from '@/lib/content';
export default function CTA(){return <section className="cta-section"><ParallaxImage src="/images/pavilion.jpg" sizes="100vw" alt="" strength={45}/><div className="cta-shade"/><div className="cta-content"><p className="eyebrow"><span/> LET’S BUILD SOMETHING THAT MATTERS</p><KineticHeading first="Your vision." second="Our construction."/><p lang="th">ให้เราเป็นส่วนหนึ่งของความสำเร็จในทุกงานของคุณ</p></div><div className="cta-actions"><Link href="/contact/" className="button button-blue">Let’s talk about your project <ArrowUpRight size={20}/></Link><a href={company.phoneHref}><Phone size={17}/>{company.phone}</a></div></section>;}
