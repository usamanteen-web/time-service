import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { profileProject, projectPatterns } from '@/lib/content';
import CTA from './CTA';
import ProfileBento from './ProfileBento';
import ProfileZoom from './ProfileZoom';
import SplitChars from './SplitChars';

const delay = (seconds: number) => ({ '--ac-d': `${seconds}s` }) as React.CSSProperties;

/** /projects/time-service-profiles/ — the photo archive behind the home page's first project card. */
export default function ProfilesPage() {
  const next = projectPatterns[1];
  return <>
    <section className="pf-intro">
      <Link href="/projects/" className="text-link ac-enter" style={delay(0)}><ArrowLeft size={17}/>All projects</Link>
      <p className="eyebrow ac-enter" style={delay(.08)}><span/> {profileProject.category} / Photo archive</p>
      <SplitChars as="h1" variant="rise" delay={.15} stagger={.03} lines={['Time Service', { text: 'Profiles', italic: true }]}/>
      <div className="pf-intro-copy">
        <p className="ac-enter" style={delay(.75)}>{profileProject.description}</p>
      </div>
    </section>
    <ProfileZoom/>
    <section className="pf-section" aria-label="Photo archive">
      <ProfileBento/>
    </section>
    <Link href={`/projects/${next.slug}/`} className="next-project"><span>EXPLORE NEXT</span><SplitChars as="strong" variant="reveal" lines={[next.title]} stagger={.03}/><ArrowUpRight size={38}/></Link>
    <CTA/>
  </>;
}
