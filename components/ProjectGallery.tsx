'use client';
import {useState} from 'react';
import {projects} from '@/lib/content';
import {ProjectCard} from './Projects';
const filters=['All concepts','Exhibition design','Brand experience','Event production','Interior & display','Construction'];
export default function ProjectGallery(){const [filter,setFilter]=useState('All concepts');const selected=projects.filter(p=>filter==='All concepts'||p.category===filter);return <><div className="project-filters" role="group" aria-label="Filter concepts by service">{filters.map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}</div><p className="sr-only" aria-live="polite">{selected.length} concepts shown</p><div className="project-grid">{selected.map(p=><ProjectCard key={p.slug} project={p} index={projects.indexOf(p)}/>)}</div></>;}
