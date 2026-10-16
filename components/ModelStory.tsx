'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {getModelById} from '@/lib/model-catalog';
import ModelExplorer from './ModelExplorer';
import {useMotionPreference} from './useMotionPreference';
import '@/app/model-explorer.css';
export type StoryChapter={eyebrow:string;title:string;body:string;viewIndex:number};
export default function ModelStory({modelId,chapters}:{modelId:string;chapters:StoryChapter[]}){
  const section=useRef<HTMLElement>(null), [progress,setProgress]=useState(0),[guided,setGuided]=useState(true),[compact,setCompact]=useState(false);
  const reduced=useMotionPreference();const source=getModelById(modelId);
  const model=useMemo(()=>source?{...source,views:chapters.map(c=>source.views[c.viewIndex]??source.views[0])}:undefined,[source,chapters]);
  useEffect(()=>{
    const media=window.matchMedia('(max-width: 899px)');
    const update=()=>setCompact(media.matches);
    update();media.addEventListener('change',update);
    return()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    const el=section.current;if(!el||reduced||compact)return;let frame=0;
    const update=()=>{frame=0;const panels=Array.from(el.querySelectorAll<HTMLElement>('.ms-chapter'));if(panels.length<2)return;const first=panels[0].getBoundingClientRect(),last=panels[panels.length-1].getBoundingClientRect();const focus=window.innerHeight*.55;const start=first.top+first.height*.5,end=last.top+last.height*.5;setProgress(Math.min(1,Math.max(0,(focus-start)/Math.max(1,end-start))));};
    const scroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
    update();window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);
    return()=>{window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);cancelAnimationFrame(frame);};
  },[reduced,compact]);
  if(!model)return null;
  const active=Math.round(progress*(chapters.length-1));
  return <section className={`ms-story${reduced?' ms-reduced':''}`} ref={section} aria-label={`${model.name} design story`} data-motion-skip>
    <div className="ms-stage"><ModelExplorer model={model} progress={progress} guided={guided&&!reduced&&!compact} onTakeControl={()=>setGuided(false)} onResume={reduced||compact?undefined:()=>setGuided(true)}/><div className="ms-progress" aria-hidden="true"><span style={{transform:`scaleX(${progress})`}}/></div><p className="ms-help">{compact?'Explore the model, then continue reading below.':reduced?'Choose any view to discover the design.':'Scroll through the story, or take the model into your own hands.'}</p></div>
    <div className="ms-chapters">{chapters.map((c,i)=><section className={`ms-chapter${i===active?' is-active':''}`} key={c.title}><p className="eyebrow">{c.eyebrow.replace(/^\d+\s*\/\s*/, '')}</p><h2>{c.title}</h2><p>{c.body}</p></section>)}</div>
  </section>;
}
