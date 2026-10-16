'use client';
import {useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,Box,ChevronDown} from 'lucide-react';
import {modelCatalog,type CatalogModel} from '@/lib/model-catalog';
import {modelRenderGalleries} from '@/lib/media-catalog';
import ModelExplorer from './ModelExplorer';
import {ImageBento} from './RenderGallery';
import {useMotionPreference} from './useMotionPreference';
import '@/app/model-explorer.css';
import '@/app/model-atlas.css';

const collections=modelCatalog.map(model=>({model,images:[...(modelRenderGalleries[model.id]??[])].sort((a,b)=>a.src.localeCompare(b.src,undefined,{numeric:true}))}));

export default function ModelDesigns(){
  const [opened,setOpened]=useState<CatalogModel|null>(null);
  const trigger=useRef<HTMLButtonElement|null>(null);
  const reduced=useMotionPreference();
  const jump=(id:string)=>{if(!id)return;document.getElementById(id)?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});window.history.replaceState(null,'',`#${id}`);};
  const close=()=>{setOpened(null);trigger.current?.focus({preventScroll:true});};
  return <div className="model-atlas" data-motion-skip>
    <header className="atlas-intro">
      <Link className="atlas-back" href="/projects/">All projects <ArrowUpRight size={14}/></Link>
      <h1>3D Model <em>Designs</em></h1>
      <div className="atlas-intro-bottom"><p>Explore the collection from every angle.</p><div className="atlas-browse"><label htmlFor="model-jump">Browse projects</label><select id="model-jump" defaultValue="" aria-label="Jump to a project" onChange={event=>jump(event.target.value)}><option value="" disabled>All projects</option>{collections.map(({model})=><option key={model.id} value={model.id}>{model.name}</option>)}</select><ChevronDown size={14} aria-hidden="true"/></div></div>
    </header>
    <div className="atlas-collection">
      {collections.map(({model,images})=><section className="atlas-chapter" id={model.id} key={model.id} aria-labelledby={`atlas-title-${model.id}`}>
        <header className="atlas-chapter-heading"><div><h2 id={`atlas-title-${model.id}`}>{model.name}</h2></div><button className="atlas-view-model" type="button" aria-haspopup="dialog" aria-label={`Explore ${model.name} in 3D`} onClick={event=>{trigger.current=event.currentTarget;setOpened(model);}}><Box size={16}/><span>Explore in 3D</span><ArrowUpRight size={14}/></button></header>
        <ImageBento images={images} showAll hideHeading title={model.name}/>
      </section>)}
    </div>
    <footer className="atlas-footer"><p>Behind every space, a story.</p><Link href="/news/" className="atlas-back">Explore the design stories <ArrowUpRight size={16}/></Link></footer>
    {opened&&<ModelExplorer key={opened.id} model={opened} openAsDialog onClose={close}/>}
  </div>;
}
