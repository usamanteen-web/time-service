import type {CSSProperties} from 'react';
import SplitChars from './SplitChars';
const delay=(seconds:number)=>({'--ac-d':`${seconds}s`}) as CSSProperties;
export default function PageIntro({eyebrow,title,italic,description}:{eyebrow:string;title:string;italic:string;description:string}){return <section className="page-intro"><p className="eyebrow ac-enter" style={delay(.05)}><span/>{eyebrow}</p><SplitChars as="h1" variant="rise" delay={.15} stagger={.022} lines={[title,{text:italic,italic:true}]}/><p className="page-description ac-enter" style={delay(.85)}>{description}</p></section>;}
