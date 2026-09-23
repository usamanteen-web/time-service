'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, Phone, X } from 'lucide-react';
import { company, navigation } from '@/lib/content';

export function Logo() {
  return <span className="brand"><Image className="brand-logo" src="/images/company-logo.png" alt="Time Service company logo" width={70} height={70} preload/><span className="brand-type">TIME SERVICE<span>DESIGNS & CONSTRUCTIONS</span></span></span>;
}
export default function Header() {
  const path = usePathname();
  const [scrolled,setScrolled] = useState(false);
  const [open,setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousPath = useRef(path);
  useEffect(()=>{
    if(previousPath.current===path) return;
    previousPath.current=path;
    const id=requestAnimationFrame(()=>{
      if(!window.location.hash) window.scrollTo({top:0,left:0,behavior:'instant'});
    });
    return ()=>cancelAnimationFrame(id);
  },[path]);
  useEffect(()=>{
    const update=()=>{ const hero=document.getElementById('hero'); setScrolled(!hero || hero.getBoundingClientRect().bottom<=window.innerHeight+80); };
    update(); window.addEventListener('scroll',update,{passive:true});
    return ()=>window.removeEventListener('scroll',update);
  },[path]);
  useEffect(()=>{
    const el=dialog.current;
    if(open){el?.showModal(); document.body.style.overflow='hidden';}
    else {el?.close(); document.body.style.overflow='';}
    return ()=>{document.body.style.overflow='';};
  },[open]);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className={`header ${scrolled || path!=='/' ? 'header-solid' : ''}`}>
      <Link href="/" className="logo-link" aria-label="Time Service home"><Logo/></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{navigation.map(n=><Link key={n.href} href={n.href} aria-current={path===n.href || (n.href!=='/' && path.startsWith(n.href))?'page':undefined}>{n.label}</Link>)}</nav>
      <a className="header-contact" href={company.phoneHref}><Phone size={15}/><span>{company.phone}</span><ArrowUpRight size={15}/></a>
      <button className="menu-toggle" aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><Menu/></button>
    </header>
    <dialog ref={dialog} className="mobile-menu" onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)}>
      <div className="mobile-menu-top"><Logo/><button aria-label="Close navigation" onClick={()=>setOpen(false)}><X/></button></div>
      <nav aria-label="Mobile navigation">{navigation.map((n,i)=><Link href={n.href} key={n.href} onClick={()=>setOpen(false)}><span>0{i+1}</span>{n.label}<ArrowUpRight/></Link>)}</nav>
      <a className="mobile-phone" href={company.phoneHref}><Phone size={18}/>{company.phone}</a><p>Bangkok, Thailand · From concept to completion.</p>
    </dialog>
  </>;
}
