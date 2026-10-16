'use client';
import {useEffect,useRef,useState} from 'react';
import {X,ZoomIn,ChevronLeft,ChevronRight} from 'lucide-react';
import {modelRenderGalleries,type CatalogImage} from '@/lib/media-catalog';
import '@/app/model-explorer.css';
import {useMotionPreference} from './useMotionPreference';

export function ImageBento({images,title='A closer look',compact=false,showAll=false,hideHeading=false}:{images:CatalogImage[];title?:string;compact?:boolean;showAll?:boolean;hideHeading?:boolean}){
  const [limit,setLimit]=useState(compact?4:12),[active,setActive]=useState<number|null>(null);
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement|null>(null);
  const shown=showAll?images:images.slice(0,limit);
  const gallery=useRef<HTMLDivElement>(null);
  const reduced=useMotionPreference();
  useEffect(()=>{
    const el=gallery.current;if(!el||reduced)return;
    const tiles=Array.from(el.querySelectorAll<HTMLElement>('.rg-tile'));
    const visible=new Set<HTMLElement>();let raf=0;
    const update=()=>{raf=0;for(const tile of visible){const rect=tile.getBoundingClientRect();const phase=(window.innerHeight/2-rect.top-rect.height/2)/window.innerHeight;tile.style.setProperty('--image-drift',`${Math.max(-12,Math.min(12,phase*22))}px`);}};
    const queue=()=>{if(!raf)raf=requestAnimationFrame(update);};
    const observer=new IntersectionObserver(entries=>{for(const entry of entries){const tile=entry.target as HTMLElement;if(entry.isIntersecting){visible.add(tile);tile.classList.add('rg-entered');}else visible.delete(tile);}queue();},{rootMargin:'60px'});
    tiles.forEach(tile=>observer.observe(tile));window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);
    return()=>{observer.disconnect();cancelAnimationFrame(raf);window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue);tiles.forEach(tile=>{tile.style.removeProperty('--image-drift');tile.classList.remove('rg-entered');});};
  },[reduced,limit,images]);
  useEffect(()=>{const el=dialog.current;if(active===null||!el)return;el.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{el.close();document.body.style.overflow=overflow;trigger.current?.focus({preventScroll:true});};},[active!==null]);
  const close=()=>setActive(null);const step=(by:number)=>setActive(i=>((i??0)+by+images.length)%images.length);
  if(!images.length)return null;
  return <div ref={gallery} className={`rg-gallery${compact?' rg-compact':''}`} data-motion-skip>
    {!hideHeading&&<div className="rg-heading"><div><p className="eyebrow">THE IMAGE COLLECTION</p><h2>{title}</h2></div><p>Select an image to explore</p></div>}
    <div className="rg-grid">{shown.map((im,i)=><button type="button" className="rg-tile" key={im.src} aria-label={`Enlarge ${im.alt}`} onClick={e=>{trigger.current=e.currentTarget;setActive(i);}}><img src={im.src} alt={im.alt} loading="lazy" decoding="async" width={im.width} height={im.height}/><span className="rg-zoom"><ZoomIn size={18}/></span></button>)}</div>
    {!showAll&&limit<images.length&&<button className="rg-more" onClick={()=>setLimit(n=>n+12)}>View more images</button>}
    <dialog className="rg-dialog" ref={dialog} aria-label="Image viewer" onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
      {active!==null&&<><div className="rg-dialog-top"><span>Image viewer</span><button className="mx-icon" onClick={close} aria-label="Close image viewer"><X size={21}/></button></div><img src={images[active].src} alt={images[active].alt}/><div className="rg-dialog-bottom"><button className="mx-icon" aria-label="Previous image" onClick={()=>step(-1)}><ChevronLeft size={22}/></button><p>{images[active].alt.replace(/(?:[·—–-]\s*)?(?:image|view|concept study|photograph)?\s*\d+\s*$/i,'').trim()}</p><button className="mx-icon" aria-label="Next image" onClick={()=>step(1)}><ChevronRight size={22}/></button></div></>}
    </dialog>
  </div>;
}
export default function RenderGallery({modelId,compact=false}:{modelId:string;compact?:boolean}){
  const images=modelRenderGalleries[modelId]??[];
  return <ImageBento key={modelId} images={images} compact={compact} title={modelId==='art-toy'?'The concept, in colour':'Considered from every angle'}/>;
}
