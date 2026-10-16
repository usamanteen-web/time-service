'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { projectPatterns, type ProjectEntry } from '@/lib/content';
import {projectCovers,projectCoverAlt,projectHref,projectPreviews} from '@/lib/project-media';
import KineticHeading from './KineticHeading';
import SplitChars from './SplitChars';
import { useMotionPreference } from './useMotionPreference';
/** Hovering the card or focusing its link reveals a three-image collection preview. */
export function ProjectCard({project,index,bento=false,eager=false,introCover}:{project:ProjectEntry;index:number;bento?:boolean;eager?:boolean;introCover?:string}){
  const profile=project.kind==='profile';const previews=projectPreviews(project.slug);const modelCover=project.slug==='blue-horizon';
  const reduced=useMotionPreference();
  const [hovered,setHovered]=useState(false);
  const [focused,setFocused]=useState(false);
  const [frame,setFrame]=useState(0);
  const active=hovered||focused;
  useEffect(()=>{
    setFrame(0);
    if(!active||reduced||previews.length<2)return;
    const timer=window.setInterval(()=>{if(!document.hidden)setFrame(current=>(current+1)%previews.length);},1900);
    return()=>window.clearInterval(timer);
  },[active,reduced,previews.length]);
  return <Link href={projectHref(project.slug)} className={`project-card ${bento?'bento-card':''} ${profile?'profile-card':''}`} data-tilt data-previewing={active||undefined}
    onPointerEnter={event=>{if(event.pointerType!=='touch')setHovered(true);}} onPointerLeave={()=>setHovered(false)}
    onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}>
    <div className="project-image">
      <span className={`project-cover${project.slug==='material-dialogue'?' project-cover-crop':''}`}><Image src={projectCovers[project.slug]??`/images/${project.image}.jpg`} alt={projectCoverAlt[project.slug]??`${project.title} — collection cover`} fill loading={eager?'eager':undefined} fetchPriority={eager?'high':undefined} sizes={bento?'(max-width:640px) 92vw, (max-width:1000px) 45vw, 60vw':'(max-width:640px) 92vw, (max-width:1000px) 45vw, 31vw'}/></span>
      {previews.map((preview,previewIndex)=><span key={preview.src} className="project-preview-frame" data-active={active&&frame===previewIndex||undefined} aria-hidden="true"><Image src={preview.src} alt="" fill loading="lazy" sizes="(max-width:640px) 92vw, 60vw"/></span>)}
      {introCover&&<span className="project-intro-cover" aria-hidden="true"><Image src={introCover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw"/></span>}
      <span className="project-tag">{profile?'PROFILE':modelCover?'DESIGN STUDIES':'COLLECTION'}</span>
      <span className="project-open"><ArrowUpRight size={24}/><span>{profile?'Open the archive':modelCover?'Explore in 3D':'Explore the collection'}</span></span>
    </div>
    <div className="project-meta"><div><SplitChars as="h3" variant="reveal" lines={[project.title]} delay={.2+(index%3)*.1} stagger={.022}/><p>{project.category}</p></div><span className="project-arrow"><ArrowUpRight size={22}/></span></div>
  </Link>;
}
export default function Projects(){return <section id="projects" className="section projects-section"><div className="section-heading"><div><p className="eyebrow"><span/> OUR PROJECTS / DESIGN EXPLORATIONS</p><KineticHeading first="Spaces that" second="make an impression"/></div><div className="section-intro"><p className="thai">เมื่อแนวคิด กลายเป็นพื้นที่แห่งความเป็นไปได้</p><p>A collection of spatial concepts.<br/>Designed to spark your next idea.</p><Link href="/projects/" className="text-link">View the collection <ArrowUpRight size={17}/></Link></div></div><div className="project-grid project-bento">{projectPatterns.map((p,i)=><ProjectCard key={p.slug} project={p} index={i} bento/>)}</div></section>;}
