'use client';

import { createElement, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useInView } from 'framer-motion';
import * as Scrollytelling from '@bsmnt/scrollytelling';
import type { ModelViewerElement } from '@google/model-viewer';
import { ArrowUpRight, Box, Hand, Maximize2, Minus, Plus, RotateCcw, Scan, X } from 'lucide-react';
import { exhibitionModels as models, type ModelView } from '@/lib/exhibition-models';
import '@/app/model-detail.css';

const SIMPLE_QUERY='(prefers-reduced-motion: reduce), (max-width: 767px)';
const subscribe=(notify:()=>void)=>{const media=window.matchMedia(SIMPLE_QUERY);media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
const getSimple=()=>window.matchMedia(SIMPLE_QUERY).matches;
const serverSimple=()=>true;
const defaults={ease:'none'};
const chapters=[
  {title:'The complete composition.',copy:'Explore the architecture, graphic walls and suspended identity.'},
  {title:'Details make the difference.',copy:'Move closer to the materials, furniture, displays and finishing touches.'},
  {title:'Take a look inside.',copy:'Choose a viewpoint or expand the model to explore at your own pace.'},
];
type CameraPose=Pick<ModelView,'target'|'orbit'|'fov'>;

export default function SpatialExperience(){
  const section=useRef<HTMLElement>(null);
  const viewer=useRef<ModelViewerElement>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const expandButton=useRef<HTMLButtonElement>(null);
  const progressText=useRef<HTMLSpanElement>(null);
  const loadText=useRef<HTMLSpanElement>(null);
  const loadBar=useRef<HTMLSpanElement>(null);
  const progress=useRef(0);
  const scrollCamera=useRef(true);
  const savedPose=useRef<CameraPose|null>(null);
  const simple=useSyncExternalStore(subscribe,getSimple,serverSimple);
  const simpleRef=useRef(simple);
  simpleRef.current=simple;
  const near=useInView(section,{margin:'400px 0px',once:true});
  const [moduleReady,setModuleReady]=useState(false);
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [modelIndex,setModelIndex]=useState(0);
  const [retry,setRetry]=useState(0);
  const [free,setFree]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const [viewId,setViewId]=useState('overview');
  const model=models[modelIndex];
  const currentModel=useRef(model);
  currentModel.current=model;
  const activeView=model.views.find(v=>v.id===viewId)??model.views[0];

  useEffect(()=>{
    if(!near)return;
    let alive=true;
    import('@google/model-viewer').then(()=>{if(alive)setModuleReady(true);}).catch(()=>{if(alive)setStatus('error');});
    return()=>{alive=false;};
  },[near,retry]);

  const setCamera=useCallback((pose:CameraPose)=>{
    const el=viewer.current;if(!el)return;
    el.cameraTarget=pose.target;el.fieldOfView=pose.fov;el.cameraOrbit=pose.orbit;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)void el.updateComplete.then(()=>el.jumpCameraToGoal());
  },[]);
  const storyPose=useCallback(():CameraPose=>{
    const m=currentModel.current;const start=m.name==='HILONG'?-36:31;
    return {...m.views[0],orbit:`${start+progress.current*(m.name==='HILONG'?55:-55)}deg ${68-progress.current*6}deg 90%`};
  },[]);
  const takeControl=useCallback(()=>{scrollCamera.current=false;setFree(true);},[]);
  const callbacks=useMemo(()=>({onUpdate:(self:{progress:number})=>{
    progress.current=self.progress;
    if(progressText.current)progressText.current.textContent=String(Math.round(self.progress*100)).padStart(2,'0');
    section.current?.style.setProperty('--spatial-progress',`${self.progress*100}%`);
    if(scrollCamera.current)setCamera(storyPose());
  }}),[setCamera,storyPose]);

  useEffect(()=>{
    const el=viewer.current;if(!el||!moduleReady)return;
    const loaded=()=>{setStatus('ready');setCamera(savedPose.current??(scrollCamera.current&&!simpleRef.current?storyPose():currentModel.current.views[0]));savedPose.current=null;};
    const error=()=>setStatus('error');
    const loading=(event:Event)=>{const fraction=(event as CustomEvent<{totalProgress:number}>).detail.totalProgress;if(loadText.current)loadText.current.textContent=`${Math.round(fraction*100)}%`;if(loadBar.current)loadBar.current.style.transform=`scaleX(${fraction})`;};
    const changed=(event:Event)=>{if((event as CustomEvent<{source:string}>).detail?.source==='user-interaction')takeControl();};
    el.addEventListener('load',loaded);el.addEventListener('error',error);el.addEventListener('progress',loading);el.addEventListener('camera-change',changed);
    if(el.loaded)loaded();
    return()=>{el.removeEventListener('load',loaded);el.removeEventListener('error',error);el.removeEventListener('progress',loading);el.removeEventListener('camera-change',changed);};
  },[moduleReady,modelIndex,retry,expanded,setCamera,storyPose,takeControl]);

  useEffect(()=>{
    if(!expanded)return;
    const el=dialog.current;const previousOverflow=document.body.style.overflow;
    el?.showModal();document.body.style.overflow='hidden';
    return()=>{el?.close();document.body.style.overflow=previousOverflow;};
  },[expanded]);

  const changeModel=(index:number)=>{
    if(index===modelIndex)return;
    savedPose.current=null;setViewId('overview');setStatus('loading');setModelIndex(index);scrollCamera.current=!expanded;setFree(expanded);
    if(!moduleReady)setRetry(v=>v+1);
  };
  const chooseView=(view:ModelView)=>{takeControl();setViewId(view.id);savedPose.current=null;setCamera(view);};
  const reset=()=>{setViewId('overview');savedPose.current=null;scrollCamera.current=!expanded;setFree(expanded);setCamera(simple||expanded?model.views[0]:storyPose());};
  const zoom=(factor:number)=>{
    const el=viewer.current;if(!el)return;takeControl();
    const {theta,phi,radius}=el.getCameraOrbit();const target=el.getCameraTarget();
    setCamera({target:`${target.x}m ${target.y}m ${target.z}m`,orbit:`${theta}rad ${phi}rad ${Math.max(1.2,Math.min(radius*factor,65))}m`,fov:`${el.getFieldOfView()}deg`});
  };
  const toggleExpanded=(open:boolean)=>{
    const el=viewer.current;
    if(el&&status==='ready'){const target=el.getCameraTarget();savedPose.current={target:`${target.x}m ${target.y}m ${target.z}m`,orbit:el.getCameraOrbit().toString(),fov:`${el.getFieldOfView()}deg`};}
    takeControl();setStatus('loading');setExpanded(open);
    if(!open)requestAnimationFrame(()=>expandButton.current?.focus({preventScroll:true}));
  };

  const stage=<div className={`spatial-stage detailed-stage ${expanded?'model-expanded':''} ${viewId!=='overview'?'model-closeup':''}`}>
    <div className="spatial-stage-grid" aria-hidden="true"/>
    <div className="spatial-stage-top"><span className="glass-chip"><Box size={14}/> FULL DETAIL · 3D</span><div className="model-stage-actions">
      <div className="model-switch" role="group" aria-label="Choose exhibition model">{models.map((m,i)=><button key={m.id} onClick={()=>changeModel(i)} aria-pressed={modelIndex===i}>{m.name}</button>)}</div>
      {expanded?<button className="model-expand-button" aria-label="Close expanded 3D view" onClick={()=>toggleExpanded(false)}><X size={19}/></button>:<button ref={expandButton} className="model-expand-button" aria-label="Expand 3D view" title="Expand 3D view" onClick={()=>toggleExpanded(true)}><Maximize2 size={17}/></button>}
    </div></div>
    <div className="model-view-tabs" role="group" aria-label="Explore model details">{model.views.map(view=><button key={view.id} aria-pressed={viewId===view.id} disabled={status!=='ready'} onClick={()=>chooseView(view)}>{view.label}</button>)}</div>
    <div className="model-viewport" data-model-status={status} data-model={model.id} data-view={viewId}>
      {status!=='ready'&&<Image className="model-poster" src={model.poster} alt={`${model.name} detailed exhibition booth with graphics, furnishings and suspended structure`} fill sizes={expanded?'100vw':'(max-width:767px) 95vw, 65vw'}/>}
      {moduleReady&&status!=='error'&&createElement('model-viewer',{
        key:`${model.id}-${retry}`,ref:viewer,src:`/models/${model.id}.glb`,alt:`Detailed ${model.name} ${model.code} exhibition model. Drag or use arrow keys to rotate. Choose a detail view or use the zoom buttons to look closer.`,
        'camera-controls':true,'disable-zoom':!expanded,'disable-pan':!expanded,'touch-action':expanded?'none':'pan-y',
        'camera-orbit':model.views[0].orbit,'camera-target':model.views[0].target,'field-of-view':model.views[0].fov,
        'min-camera-orbit':'auto 10deg 1.2m','max-camera-orbit':'auto 100deg 200%','min-field-of-view':'25deg','max-field-of-view':'55deg',
        'interaction-prompt':'none','shadow-intensity':'1','shadow-softness':'0.8','exposure':'0.9','tone-mapping':'aces','environment-image':'neutral','loading':'eager','reveal':'auto','interpolation-decay':'120',
        onPointerDown:takeControl,onKeyDown:takeControl,style:{opacity:status==='ready'?1:0},
      })}
      <div className="model-loading" role="status" aria-live="polite">{status==='loading'&&<div className="model-progress-card"><span>Loading the details <span ref={loadText}>0%</span></span><div className="model-load-track"><span ref={loadBar}/></div><small>{model.name} · {model.size}</small></div>}{status==='error'&&<div><p>The 3D view couldn’t load. The detailed model image is still available.</p><button onClick={()=>{setStatus('loading');setRetry(r=>r+1);}}>Try 3D again <ArrowUpRight size={15}/></button></div>}</div>
    </div>
    <div className="model-caption glass-panel"><div><span>{model.name} / {model.code} · {activeView.label.toUpperCase()}</span><h3>{activeView.title}</h3><p>{activeView.description}</p></div>{viewId==='overview'&&<span className="model-dimension">{model.area}<small>FLOOR DIMENSIONS</small></span>}</div>
    <div className="model-toolbar"><span><Hand size={15}/>{expanded?'Drag · pinch or scroll to zoom':free||simple?'Drag to rotate · + to zoom':'Scroll to orbit · drag to explore'}</span><div role="group" aria-label="3D camera controls"><button aria-label="Zoom in" title="Zoom in" disabled={status!=='ready'} onClick={()=>zoom(.8)}><Plus size={19}/></button><button aria-label="Zoom out" title="Zoom out" disabled={status!=='ready'} onClick={()=>zoom(1.25)}><Minus size={19}/></button><button aria-label="Reset 3D view" title="Reset view" disabled={status!=='ready'} onClick={reset}><RotateCcw size={17}/></button></div></div>
  </div>;
  return <><Scrollytelling.Root start="top top" end="bottom bottom" scrub={true} disabled={simple} defaults={defaults} callbacks={callbacks}>
    <section ref={section} className={`spatial-experience ${simple?'spatial-simple':''}`} id="experience" aria-labelledby="spatial-title"><div className="spatial-sticky">
      <div className="spatial-topline"><p className="eyebrow"><span/> THE SPATIAL EXPERIENCE</p><span className="spatial-counter">EXPLORE / <span ref={progressText}>00</span><small>%</small></span></div>
      <div className="spatial-layout"><div className="spatial-narrative"><h2 id="spatial-title">A closer <br/>look.<br/><em>Every detail.</em></h2><p className="spatial-intro" lang="th">สัมผัสงานออกแบบ ตั้งแต่ภาพรวมถึงรายละเอียด</p>
        <div className="spatial-chapters">{chapters.map((chapter,index)=><Scrollytelling.Animation key={chapter.title} tween={{start:index*30,end:index*30+20,fromTo:[{opacity:index===0?1:.65,y:index===0?0:16},{opacity:1,y:0,ease:'none'}]}} disabled={simple}><div className="spatial-chapter"><span>0{index+1}</span><div><h3>{chapter.title}</h3><p>{chapter.copy}</p></div></div></Scrollytelling.Animation>)}</div>
      </div>{expanded?<div className="spatial-stage model-inline-placeholder"><Image src={model.poster} alt="" fill sizes="60vw"/><span>Exploring {model.name} in the expanded view</span></div>:stage}</div>
      <div className="spatial-bottom"><span><Scan size={13}/> Reconstructed from supplied drawings and photographs.</span><span>DESIGN IS IN THE DETAILS.</span></div>
    </div></section>
  </Scrollytelling.Root>
    {expanded&&createPortal(<dialog ref={dialog} className="model-dialog" aria-label={`${model.name} detailed 3D explorer`} onCancel={event=>{event.preventDefault();toggleExpanded(false);}}>{stage}</dialog>,document.body)}
  </>;
}
