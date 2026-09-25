'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Menu, Phone, Search, X } from 'lucide-react';
import { company, navigation, projects, services } from '@/lib/content';
import { articles } from '@/lib/journal';

const searchItems = [
  ...projects.map(project => ({ title: project.title, category: 'Project', href: `/projects/${project.slug}/`, text: `${project.category} ${project.description}` })),
  ...services.map(service => ({ title: service.title, category: 'Service', href: `/services/#${service.id}`, text: `${service.thai} ${service.description}` })),
  ...articles.map(article => ({ title: article.title, category: 'Journal', href: `/news/${article.slug}/`, text: `${article.category} ${article.intro}` })),
  ...navigation.filter(item => item.href !== '/').map(item => ({ title: item.label, category: 'Page', href: item.href, text: '' })),
];

export function Logo() {
  return (
    <span className="brand">
      <Image className="brand-logo" src="/images/company-logo.png" alt="" width={70} height={70} preload />
      <span className="brand-type">TIME SERVICE<span>DESIGNS & CONSTRUCTIONS</span></span>
    </span>
  );
}

export default function Header() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [overlay, setOverlay] = useState<'menu' | 'search' | null>(null);
  const [query, setQuery] = useState('');
  const menuDialog = useRef<HTMLDialogElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const previousPath = useRef(path);
  const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results = tokens.length
    ? searchItems.filter(item => tokens.every(token => `${item.title} ${item.category} ${item.text}`.toLocaleLowerCase().includes(token)))
    : [...searchItems.slice(0, 3), ...searchItems.slice(projects.length, projects.length + 3)];

  useEffect(() => {
    if (previousPath.current === path) return;
    previousPath.current = path;
    const id = requestAnimationFrame(() => {
      setOverlay(null);
      if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(id);
  }, [path]);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 60);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [path]);

  useEffect(() => {
    const menu = menuDialog.current;
    const search = searchDialog.current;
    if (overlay !== 'menu') menu?.close();
    if (overlay !== 'search') search?.close();
    if (overlay === 'menu' && !menu?.open) menu?.showModal();
    if (overlay === 'search' && !search?.open) {
      search?.showModal();
      searchInput.current?.focus();
    }
    const previousOverflow = document.body.style.overflow;
    if (overlay) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [overlay]);

  const openSearch = () => { setQuery(''); setOverlay('search'); };
  const isCurrent = (href: string) => {
    const target = href.replace(/\/$/, '') || '/';
    const current = path.replace(/\/$/, '') || '/';
    return current === target || (target !== '/' && current.startsWith(`${target}/`));
  };

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className={`header ${scrolled || path !== '/' ? 'header-solid' : ''}`}>
        <Link href="/" className="logo-link" aria-label="Time Service home"><Logo /></Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map(item => <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <button className="header-search icon-button" type="button" aria-label="Search website" aria-haspopup="dialog" aria-expanded={overlay === 'search'} aria-controls="site-search" onClick={openSearch}><Search size={18} aria-hidden="true" /></button>
          <a className="header-phone icon-button" href={company.phoneHref} aria-label={`Call Time Service: ${company.phone}`} title={company.phone}><Phone size={17} aria-hidden="true" /></a>
          <Link className="header-quote" href="/contact/">Get a Quote <ArrowRight size={16} aria-hidden="true" /></Link>
          <button className="menu-toggle icon-button" type="button" aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={overlay === 'menu'} aria-controls="mobile-navigation" onClick={() => setOverlay('menu')}><Menu size={22} aria-hidden="true" /></button>
        </div>
      </header>

      <dialog id="mobile-navigation" ref={menuDialog} className="mobile-menu" aria-label="Navigation" onCancel={() => setOverlay(null)} onClose={() => setOverlay(current => current === 'menu' ? null : current)}>
        <div className="mobile-menu-top"><Link href="/" aria-label="Time Service home" onClick={() => setOverlay(null)}><Logo /></Link><button className="icon-button" type="button" aria-label="Close navigation" onClick={() => setOverlay(null)}><X size={22} aria-hidden="true" /></button></div>
        <nav aria-label="Mobile navigation">
          {navigation.map((item, index) => <Link href={item.href} key={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined} onClick={() => setOverlay(null)}><span>0{index + 1}</span>{item.label}<ArrowUpRight aria-hidden="true" /></Link>)}
        </nav>
        <button className="mobile-search" type="button" onClick={openSearch}><Search size={19} aria-hidden="true" />Search projects & services<ArrowRight size={18} aria-hidden="true" /></button>
        <a className="mobile-phone" href={company.phoneHref}><Phone size={18} aria-hidden="true" />{company.phone}</a>
        <p>Bangkok, Thailand · From concept to completion.</p>
      </dialog>

      <dialog id="site-search" ref={searchDialog} className="site-search" aria-labelledby="site-search-title" onCancel={() => setOverlay(null)} onClose={() => setOverlay(current => current === 'search' ? null : current)} onClick={event => { if (event.target === event.currentTarget) setOverlay(null); }}>
        <div className="site-search-inner">
          <div className="search-heading"><div><p className="search-eyebrow">FIND YOUR INSPIRATION</p><h2 id="site-search-title">What are you looking for?</h2></div><button className="icon-button" type="button" aria-label="Close search" onClick={() => setOverlay(null)}><X size={22} aria-hidden="true" /></button></div>
          <div className="search-field" role="search"><Search size={21} aria-hidden="true" /><label className="nav-sr-only" htmlFor="site-search-input">Search projects, services and journal</label><input ref={searchInput} id="site-search-input" type="search" placeholder="Try “exhibition” or “interior”" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" maxLength={200} aria-describedby="search-result-status" /></div>
          <p id="search-result-status" className="search-result-status" role="status">{tokens.length ? `${results.length} ${results.length === 1 ? 'result' : 'results'} for “${query.trim()}”` : 'Explore our projects & expertise'}</p>
          {results.length > 0 ? <ul className="search-results">{results.map(item => <li key={item.href}><Link href={item.href} onClick={() => setOverlay(null)}><span><small>{item.category}</small><strong>{item.title}</strong></span><ArrowUpRight size={19} aria-hidden="true" /></Link></li>)}</ul> : <div className="search-empty"><p>No matches yet. Try a project name, “design” or “construction”.</p><Link href="/contact/" onClick={() => setOverlay(null)}>Talk to our team <ArrowRight size={16} aria-hidden="true" /></Link></div>}
          <p className="search-tip">Press Esc to close <span>SPACE · PEOPLE · BRANDS</span></p>
        </div>
      </dialog>
    </>
  );
}
