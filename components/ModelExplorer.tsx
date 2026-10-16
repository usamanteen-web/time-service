'use client';

import {createElement, useCallback, useEffect, useMemo, useRef, useState, type RefObject} from 'react';
import {createPortal} from 'react-dom';
import type {ModelViewerElement} from '@google/model-viewer';
import {Box, Maximize2, Minus, Plus, RotateCcw, X, Hand} from 'lucide-react';
import type {CatalogModel} from '@/lib/model-catalog';
import {parseOrbit, resolvePose, samplePath, formatPose, type CameraPose} from '@/lib/camera-pose';
import {useMotionPreference} from './useMotionPreference';

type Props = {model:CatalogModel; progress?:number; guided?:boolean; onTakeControl?:()=>void; onResume?:()=>void;openAsDialog?:boolean;onClose?:()=>void};
type ExplorerSnapshot = {pose:CameraPose; viewIndex:number; overview:boolean};
type SnapshotReader = (()=>ExplorerSnapshot|undefined)|null;

function readPose(viewer:ModelViewerElement):CameraPose {
  const {width,height}=viewer.getBoundingClientRect();
  const aspect=width/Math.max(1,height);
  // getFieldOfView() includes model-viewer's portrait framing adjustment.
  // Convert it back before assigning the field-of-view attribute again.
  const framing=Math.max(1,viewer.getIdealAspect()/Math.max(.001,aspect));
  const fov=2*Math.atan(Math.tan(viewer.getFieldOfView()*Math.PI/360)/framing)*180/Math.PI;
  return {target:viewer.getCameraTarget().toString(),orbit:viewer.getCameraOrbit().toString(),fov:`${fov}deg`};
}

/** One canvas at a time. Inline scrolling stays on the page; expanded mode enables pinch and wheel zoom. */
export default function ModelExplorer({model, progress=0, guided=false, onTakeControl, onResume, openAsDialog=false, onClose}:Props) {
  const [expanded,setExpanded]=useState(openAsDialog);
  const expandButton=useRef<HTMLButtonElement>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const capture=useRef<SnapshotReader>(null);
  const saved=useRef<{modelId:string;snapshot:ExplorerSnapshot}|null>(null);
  useEffect(()=>{saved.current=null;},[model.id]);
  useEffect(()=>{
    if(!expanded)return;
    const el=dialog.current; const previous=document.body.style.overflow;
    el?.showModal(); document.body.style.overflow='hidden';
    return()=>{el?.close();document.body.style.overflow=previous;expandButton.current?.focus({preventScroll:true});};
  },[expanded]);
  const remember=()=>{const snapshot=capture.current?.();if(snapshot)saved.current={modelId:model.id,snapshot};};
  const close=()=>{remember();setExpanded(false);onClose?.();};
  const open=()=>{remember();onTakeControl?.();setExpanded(true);};
  const initialSnapshot=saved.current?.modelId===model.id?saved.current.snapshot:undefined;
  // Full-screen can be portrait. Keep complete-structure presets within that
  // narrower frame; custom close-ups still restore their exact camera pose.
  const canvasModel=useMemo(()=>expanded?{...model,views:model.views.map(v=>{
    const radius=parseOrbit(v.orbit).radius;
    return radius.unit==='%'&&radius.value<110?{...v,orbit:v.orbit.replace(/\S+$/, '110%')}:v;
  })}:model,[model,expanded]);
  const canvas=<ExplorerCanvas key={`${model.id}-${expanded}`} model={canvasModel} {...{progress,initialSnapshot}} capture={capture} guided={guided&&!expanded} onTakeControl={onTakeControl} onResume={onResume} expanded={expanded} action={<button ref={expanded?undefined:expandButton} className="mx-icon" aria-label={expanded?'Close expanded model':'Expand 3D model'} onClick={expanded?close:open}>{expanded?<X size={19}/>:<Maximize2 size={18}/>}</button>}/>;
  return <>{expanded?(openAsDialog?null:<div className="mx-placeholder"><img src={model.poster} alt=""/><span>Exploring {model.name} in full screen</span></div>):canvas}{expanded&&createPortal(<dialog ref={dialog} className="mx-dialog" aria-label={`${model.name} interactive model`} onCancel={e=>{e.preventDefault();close();}}>{canvas}</dialog>,document.body)}</>;
}

function ExplorerCanvas({model,progress,guided,onTakeControl,onResume,expanded,action,initialSnapshot,capture}:Props&{expanded:boolean;action:React.ReactNode;initialSnapshot?:ExplorerSnapshot;capture:RefObject<SnapshotReader>}){
  const root=useRef<HTMLDivElement>(null),viewer=useRef<ModelViewerElement>(null);
  const [moduleReady,setModuleReady]=useState(false),[near,setNear]=useState(false);
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [loaded,setLoaded]=useState(0),[retry,setRetry]=useState(0),[viewIndex,setViewIndex]=useState(initialSnapshot?.viewIndex??0);
  const percentBase=useRef(1),guidedRef=useRef(guided),progressRef=useRef(progress??0);
  const reduced=useMotionPreference();
  guidedRef.current=guided;progressRef.current=progress??0;
  const takeControl=useRef(onTakeControl);takeControl.current=onTakeControl;
  const restoredViewer=useRef<ModelViewerElement|null>(null);
  useEffect(()=>{
    capture.current=()=>{
      const el=viewer.current;if(!el?.loaded)return undefined;
      const isGuided=guidedRef.current;
      const index=isGuided?Math.round(progressRef.current*(model.views.length-1)):viewIndex;
      return {pose:readPose(el),viewIndex:index,overview:isGuided?progressRef.current<=.04:viewIndex===0};
    };
    return()=>{capture.current=null;};
  },[capture,model.views.length,viewIndex]);
  useEffect(()=>{const el=root.current;if(!el)return;const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setNear(true);io.disconnect();}},{rootMargin:'250px'});io.observe(el);return()=>io.disconnect();},[]);
  useEffect(()=>{if(!near)return;let alive=true;import('@google/model-viewer').then(module=>{module.ModelViewerElement.dracoDecoderLocation='/models/catalog/draco/';if(alive)setModuleReady(true);}).catch(()=>{if(alive)setStatus('error');});return()=>{alive=false;};},[near,retry]);
  const apply=useCallback((pose:CameraPose)=>{const el=viewer.current;if(!el)return;el.cameraTarget=pose.target;el.cameraOrbit=pose.orbit;el.fieldOfView=pose.fov;if(reduced)void el.updateComplete.then(()=>el.jumpCameraToGoal());},[reduced]);
  const follow=useCallback((p:number)=>{if(!model.views.length)return;const path=model.views.map(v=>resolvePose(v,percentBase.current));apply(formatPose(samplePath(path,p,.16).pose));},[model,apply]);
  useEffect(()=>{
    const el=viewer.current;if(!el||!moduleReady)return;let alive=true;
    const loadedModel=async()=>{
      await el.updateComplete;if(!alive)return;
      if(restoredViewer.current!==el){
        el.jumpCameraToGoal();
        const radius=el.getCameraOrbit().radius;
        const first=parseOrbit(model.views[0].orbit).radius;
        percentBase.current=first.unit==='%'?radius/(first.value/100):radius;
        restoredViewer.current=el;
        // Percentage overview framing adapts to the new viewport. Close-up poses
        // retain their exact target, orbit and zoom when opening or closing.
        if(initialSnapshot&&!initialSnapshot.overview){
          apply(initialSnapshot.pose);await el.updateComplete;
          if(!alive)return;
          el.jumpCameraToGoal();
        }
      }
      if(guidedRef.current&&!reduced)follow(progressRef.current);
      setStatus('ready');
    };
    const loadProgress=(e:Event)=>setLoaded(Math.round(((e as CustomEvent).detail?.totalProgress??0)*100));
    const failed=()=>setStatus('error');
    const changed=(e:Event)=>{if((e as CustomEvent).detail?.source==='user-interaction'){takeControl.current?.();setViewIndex(-1);}};
    el.addEventListener('load',loadedModel);el.addEventListener('progress',loadProgress);el.addEventListener('error',failed);el.addEventListener('camera-change',changed);if(el.loaded)void loadedModel();
    return()=>{alive=false;el.removeEventListener('load',loadedModel);el.removeEventListener('progress',loadProgress);el.removeEventListener('error',failed);el.removeEventListener('camera-change',changed);};
  },[moduleReady,model,retry,follow,reduced,initialSnapshot,apply]);
  useEffect(()=>{if(status==='ready'&&guided&&!reduced)follow(progress??0);},[progress,guided,reduced,status,follow]);
  const choose=(i:number)=>{takeControl.current?.();setViewIndex(i);apply(model.views[i]);};
  const zoom=(factor:number)=>{const el=viewer.current;if(!el)return;takeControl.current?.();setViewIndex(-1);const p=el.getCameraOrbit();const min=percentBase.current*.04;apply({...readPose(el),orbit:`${p.theta}rad ${p.phi}rad ${Math.max(min,Math.min(percentBase.current*3,p.radius*factor))}m`});};
  const label=guided?model.views[Math.min(model.views.length-1,Math.round((progress??0)*(model.views.length-1)))].label:(model.views[viewIndex]?.label??'Custom view');
  return <div ref={root} className={`mx-viewer ${expanded?'mx-expanded':''}`} data-motion-skip data-model={model.id} data-status={status}>
    <div className="mx-top"><span><Box size={17}/> <strong>{model.name}</strong></span><div><span className="mx-mode">{guided?'Guided story':'Explore freely'}</span>{action}</div></div>
    <div className="mx-viewport">
      {status!=='ready'&&<img className="mx-poster" src={model.poster} alt={`${model.name} design preview`}/>}
      {moduleReady&&status!=='error'&&createElement('model-viewer',{
        key:`${model.id}-${retry}`,ref:viewer,src:model.src,alt:`${model.name} interactive 3D model. Drag or use arrow keys to rotate. Zoom buttons and preset views are below.`,
        'camera-controls':true,'disable-zoom':!expanded,'disable-pan':!expanded,'touch-action':expanded?'none':'pan-y',
        'camera-orbit':model.views[0].orbit,'camera-target':model.views[0].target,'field-of-view':model.views[0].fov,
        'min-camera-orbit':'auto 2deg 3%','max-camera-orbit':'auto 178deg 300%','min-field-of-view':'20deg','max-field-of-view':'60deg',
        'interaction-prompt':'none','environment-image':'neutral','shadow-intensity':'.7','shadow-softness':'.9',exposure:'1',
        'tone-mapping':'aces',loading:'eager',reveal:'auto','interpolation-decay':reduced?'0':'110',
        style:{opacity:status==='ready'?1:0},
      })}
      {status==='loading'&&<div className="mx-feedback" role="status"><span>Preparing your 3D view <strong>{loaded}%</strong></span><progress max="100" value={loaded}/></div>}
      {status==='error'&&<div className="mx-feedback" role="status"><p>The 3D view could not load. You can still explore the images below.</p><button onClick={()=>{setStatus('loading');setLoaded(0);setRetry(n=>n+1);}}>Retry 3D view</button></div>}
      <span className="mx-view-label">{label}</span>
    </div>
    <div className="mx-presets" role="group" aria-label="Model viewpoints">{model.views.map((v,i)=><button key={v.id} disabled={status!=='ready'} aria-pressed={!guided&&i===viewIndex} onClick={()=>choose(i)}>{v.label}</button>)}</div>
    <div className="mx-toolbar"><p><Hand size={15}/><span>{expanded?'Drag to rotate · pinch or scroll to zoom':'Drag to rotate · use + / − to zoom'}</span></p><div className="mx-tools">{onResume&&!guided&&!expanded&&<button className="mx-resume" onClick={onResume}>Follow story</button>}<button className="mx-icon" disabled={status!=='ready'} aria-label="Zoom in" onClick={()=>zoom(.8)}><Plus size={18}/></button><button className="mx-icon" disabled={status!=='ready'} aria-label="Zoom out" onClick={()=>zoom(1.25)}><Minus size={18}/></button><button className="mx-icon" disabled={status!=='ready'} aria-label="Reset model view" onClick={()=>choose(0)}><RotateCcw size={17}/></button></div></div>
  </div>;
}
