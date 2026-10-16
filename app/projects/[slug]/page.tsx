import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {displayProject,profileProject,projectPatterns,projects} from '@/lib/content';
import {categoryGalleries} from '@/lib/media-catalog';
import {categoryDescriptions,projectCategory,projectCovers,projectHref} from '@/lib/project-media';
import CTA from '@/components/CTA';
import SplitChars from '@/components/SplitChars';
import ProfilesPage from '@/components/ProfilesPage';
import ModelDesigns from '@/components/ModelDesigns';
import {ImageBento} from '@/components/RenderGallery';
import CategoryExperience, {type CategoryVariant} from '@/components/CategoryExperience';

const categoryVariants:Record<string,CategoryVariant>={'living-canopy':'systems','a-moment-in-blue':'events','material-dialogue':'displays','structure-and-light':'vehicles'};
const categoryHero:Record<string,string>={
  'living-canopy':'/images/catalog/models/korea-pavilion/03-standard-block-detail.webp',
  'material-dialogue':'/images/catalog/models/art-toy/concept-03.webp',
};
export function generateStaticParams(){return [profileProject,...projects].map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=[profileProject,...projects].find(p=>p.slug===slug);return {title:p?displayProject(p).title:'Concept'};}
export default async function ProjectPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(slug===profileProject.slug)return <ProfilesPage/>;
  if(slug==='blue-horizon')return <><ModelDesigns/><CTA/></>;
  const concept=projects.find(p=>p.slug===slug);if(!concept)notFound();const p=displayProject(concept);
  const photos=categoryGalleries[projectCategory[slug]]??[];
  const next=projectPatterns[(projectPatterns.findIndex(x=>x.slug===slug)+1)%projectPatterns.length];
  if(categoryVariants[slug]&&photos.length)return <>
    <CategoryExperience variant={categoryVariants[slug]} title={p.title} category={p.category} description={categoryDescriptions[slug]??p.description} photos={photos} cover={categoryHero[slug]??projectCovers[slug]??`/images/${p.image}.jpg`}/>
    <Link href={projectHref(next.slug)} className="next-project"><span>EXPLORE NEXT</span><SplitChars as="strong" variant="reveal" lines={[next.title]} stagger={.03}/></Link><CTA/>
  </>;
  return <>
    <section className="project-detail-intro"><Link href="/projects/" className="text-link">All projects</Link><p className="eyebrow">{p.category} / THE COLLECTION</p><SplitChars as="h1" variant="rise" delay={.15} stagger={.024} lines={[p.title]}/><p>{categoryDescriptions[slug]??p.description}</p></section>
    <div className="project-detail-visual site-clip-enter" data-motion-skip><Image src={projectCovers[slug]??`/images/${p.image}.jpg`} alt={`${p.title} concept cover`} fill priority sizes="100vw"/></div>
    {photos.length>0?<section className="category-gallery"><ImageBento images={photos} title="Inside the collection"/></section>:<section className="project-detail-notes"><div><span>PROJECT TYPE</span><p>{p.size}</p></div><div><span>VISUALISATION</span><p>Design concept</p></div></section>}
    <Link href={projectHref(next.slug)} className="next-project"><span>EXPLORE NEXT</span><SplitChars as="strong" variant="reveal" lines={[next.title]} stagger={.03}/></Link><CTA/>
  </>;
}
