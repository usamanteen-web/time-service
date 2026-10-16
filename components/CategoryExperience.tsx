'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowDown, ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import type { CatalogImage } from '@/lib/media-catalog';
import SplitChars from './SplitChars';
import { useMotionPreference } from './useMotionPreference';
import '@/app/category-experience.css';

export type CategoryVariant = 'systems' | 'events' | 'displays' | 'vehicles';
type StoryStep = { title: string; copy: string; label: string };
const stories: Record<CategoryVariant, StoryStep[]> = {
  systems: [
    { label: 'Identity', title: 'Many exhibitors.\nOne presence.', copy: 'A shared architectural language makes a pavilion recognisable, while leaving room for each exhibitor to tell their own story.' },
    { label: 'Connection', title: 'Space to meet.\nRoom to discover.', copy: 'Open sightlines and clear circulation connect the individual stands, product displays and meeting spaces.' },
    { label: 'Details', title: 'A system,\nconsidered together.', copy: 'From the first impression to the smallest display, the collection follows the details that bring an exhibition together.' },
  ],
  events: [
    { label: 'Set the scene', title: 'Before\nthe moment.', copy: 'A setting shapes the anticipation. Space, light and a clear point of focus bring people together.' },
    { label: 'Bring it to life', title: 'People.\nEnergy. Connection.', copy: 'Every event has its own rhythm. The environment becomes part of the experience, from the first arrival to the main occasion.' },
    { label: 'Make it memorable', title: 'A moment\nthat stays.', copy: 'The details work together to create a shared experience. Explore the event collection, frame by frame.' },
  ],
  displays: [
    { label: 'Attract', title: 'A reason\nto stop.', copy: 'A distinctive silhouette, a warm material or an unexpected colour. A retail experience begins with curiosity.' },
    { label: 'Explore', title: 'A little closer.\nA new discovery.', copy: 'Thoughtful displays make products easy to discover and give visitors space to move, look and connect.' },
    { label: 'Remember', title: 'Leave with\nan impression.', copy: 'Pop-up stores and branded displays turn a temporary space into a memorable part of the brand.' },
  ],
  vehicles: [
    { label: 'Your arrival', title: 'The experience\nstarts here.', copy: 'From an individual arrival to a shared journey, the right vehicle sets the tone for the day.' },
    { label: 'Your journey', title: 'Space for\nevery journey.', copy: 'Discover the vehicles in our collection and explore the interiors, seating and details at your own pace.' },
    { label: 'Your destination', title: 'Arrive\nwith ease.', copy: 'Executive transfers, group travel and tours, thoughtfully connected to the rest of your event.' },
  ],
};

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const photoLabel = (photo: CatalogImage, fallback: string) => photo.caption && !/^(selected work|concept study)\s*\d+$/i.test(photo.caption) ? photo.caption : photo.title ?? fallback;

/** Four deliberately different scroll stages. Native scrolling remains in control. */
function CategoryStory({ variant, title, photos, cover }: { variant: CategoryVariant; title: string; photos: CatalogImage[]; cover: string }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  const [shortViewport, setShortViewport] = useState(false);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end end'] });
  const fleet = useMemo(() => photos.filter((photo, i) => i === 0 || photo.title !== photos[i - 1].title), [photos]);
  const total = variant === 'vehicles' ? Math.max(1, fleet.length) : 3;
  const manual = reduced || shortViewport;
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1000px) and (max-height: 550px)');
    const update = () => setShortViewport(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const write = (value: number) => {
    stage.current?.style.setProperty('--ce-progress', manual ? '0' : clamp(value).toFixed(4));
    if (!manual) setActive(variant === 'vehicles' ? Math.round(clamp(value) * (total - 1)) : Math.min(total - 1, Math.floor(clamp(value) * total)));
  };
  useMotionValueEvent(scrollYProgress, 'change', write);
  useEffect(() => { write(scrollYProgress.get()); }, [manual, total]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (index: number) => {
    if (manual) { setActive(index); return; }
    const element = root.current;
    if (!element) return;
    const distance = Math.max(0, element.offsetHeight - innerHeight);
    const position = variant === 'vehicles' ? index / Math.max(1, total - 1) : (index + .35) / total;
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top + distance * position, behavior: 'smooth' });
  };
  const step = stories[variant][variant === 'vehicles' ? Math.min(2, Math.floor(active / total * 3)) : active];
  const selectedFleet = fleet[Math.min(active, fleet.length - 1)];
  const frames = variant === 'displays' ? [cover, photos[0]?.src ?? cover, photos[1]?.src ?? cover] : photos.slice(0, 3).map(p => p.src);
  const systemFrames = [
    { src: cover, alt: 'Korea Pavilion, repeated exhibition modules and shared national identity' },
    { src: '/images/catalog/models/korea-pavilion/01-pavilion-overview.webp', alt: 'Korea Pavilion overview showing all four connected blocks and visitor aisles' },
    { src: '/images/catalog/models/korea-pavilion/04-promotion-hero.webp', alt: 'Korea Pavilion promotional area with curved reception and product display details' },
  ];

  return <section ref={root} className={`ce-story ce-story-${variant}`} data-still={manual ? '' : undefined} aria-label={`${title} visual story`}>
    <div ref={stage} className="ce-stage" style={{ '--ce-progress': 0, '--ce-count': total } as CSSProperties}>
      {variant === 'systems' && <>
        <div className="ce-blueprint" aria-hidden="true"><i/><i/><i/><i/><span>TIME SERVICE / SPATIAL STUDIES</span></div>
        <div className="ce-system-image">{systemFrames.map((image, index) => <div className="ce-system-scene" key={image.src} data-active={active === index ? '' : undefined} aria-hidden={active !== index}><img src={image.src} alt={image.alt} fetchPriority={index === 0 ? 'high' : undefined}/></div>)}<span className="ce-dimension ce-dimension-x" aria-hidden="true">A SHARED ARCHITECTURAL LANGUAGE</span><span className="ce-dimension ce-dimension-y" aria-hidden="true">SPACE / SYSTEM / IDENTITY</span></div>
        <div className="ce-system-caption"><span>EXHIBITION STUDY / KOREA PAVILION</span><p>From one stand to a connected pavilion.</p></div>
      </>}
      {variant === 'events' && <div className="ce-event-scenes">
        {frames.map((src, i) => <div className="ce-event-scene" data-active={active === i ? '' : undefined} key={src}><img src={src} alt={photos[i]?.alt ?? title} loading={i ? 'lazy' : 'eager'}/><span className="ce-event-wash"/></div>)}
        <span className="ce-stage-light" aria-hidden="true"/>
      </div>}
      {variant === 'displays' && <div className="ce-display-stack">
        {frames.map((src, i) => <div className={`ce-display-card ce-display-card-${i}`} data-active={active === i ? '' : undefined} key={`${src}-${i}`} style={{ '--ce-card': i } as CSSProperties}><img src={src} alt={i === 0 ? 'Orange Ocean retail concept and material details' : photos[i - 1]?.alt ?? title} loading={i ? 'lazy' : 'eager'}/><span>{stories.displays[i].label}</span></div>)}
      </div>}
      {variant === 'vehicles' && <div className="ce-journey-window"><div className="ce-journey-track" style={{ transform: manual ? `translate3d(-${active * 100}%,0,0)` : undefined }}>
        {fleet.map((photo, i) => <div className="ce-journey-scene" key={photo.src}><img src={photo.src} alt={photo.alt} loading={i ? 'lazy' : 'eager'}/><span className="ce-journey-shade"/><span className="ce-journey-name">{photo.title}</span></div>)}
      </div></div>}
      <div className="ce-story-copy">
        <span className="ce-story-kicker">{variant === 'vehicles' ? 'THE FLEET / YOUR JOURNEY' : step.label}</span>
        <h2 key={step.title}>{step.title.split('\n').map((line, i) => <span key={line}>{i ? <em>{line}</em> : line}</span>)}</h2>
        <p>{step.copy}</p>
        {variant === 'vehicles' && <span className="ce-fleet-current">{selectedFleet?.title}</span>}
      </div>
      <div className="ce-story-bottom">
        <span className="ce-scroll-cue"><ArrowDown size={15}/> Scroll through the story</span>
        <nav className="ce-story-steps" aria-label={`${title} story chapters`}>
          {Array.from({ length: total }, (_, i) => <button key={i} type="button" onClick={() => go(i)} aria-current={active === i ? 'step' : undefined}><span>{variant === 'vehicles' ? fleet[i]?.title : stories[variant][i].label}</span></button>)}
        </nav>
      </div>
    </div>
  </section>;
}

/** Album-order bento; no filtering, pagination or CSS dense reordering. */
function CategoryBento({ variant, photos, title }: { variant: CategoryVariant; photos: CatalogImage[]; title: string }) {
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const reduced = useMotionPreference();
  const [active, setActive] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const isOpen = active !== null;
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const items = [...element.querySelectorAll<HTMLElement>('[data-ce-photo]')];
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.setAttribute('data-revealed', '');
      reveals.unobserve(entry.target);
    }), { rootMargin: '0px 0px -4% 0px', threshold: .05 });
    const visible = new Set<number>();
    const progress = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const index = Number((entry.target as HTMLElement).dataset.cePhoto);
        if (entry.isIntersecting) visible.add(index); else visible.delete(index);
      });
      if (visible.size) setCurrent(Math.min(...visible));
    }, { rootMargin: '-20% 0px -35% 0px' });
    items.forEach(item => { reveals.observe(item); progress.observe(item); });
    if (!reduced) element.dataset.enhanced = '';
    else delete element.dataset.enhanced;
    return () => { reveals.disconnect(); progress.disconnect(); delete element.dataset.enhanced; };
  }, [photos, reduced]);
  useEffect(() => {
    const element = dialog.current;
    if (!isOpen || !element) return;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; trigger.current?.focus({ preventScroll: true }); };
  }, [isOpen]);
  const step = (direction: number) => setActive(index => ((index ?? 0) + direction + photos.length) % photos.length);
  const groups = useMemo(() => {
    if (variant !== 'vehicles') return [{ title: '', start: 0, images: photos }];
    const result: { title: string; start: number; images: CatalogImage[] }[] = [];
    photos.forEach((photo, index) => {
      const label = photo.title ?? 'The fleet';
      if (result[result.length - 1]?.title !== label) result.push({ title: label, start: index, images: [] });
      result[result.length - 1].images.push(photo);
    });
    return result;
  }, [photos, variant]);
  const galleryTitle = { systems: 'Built around connection.', events: 'Every frame, a shared moment.', displays: 'Spaces made to be discovered.', vehicles: 'A closer look at the fleet.' }[variant];
  return <section className="ce-collection" id="collection" aria-label={`${title} complete collection`}>
    <div className="ce-collection-intro"><div><p className="eyebrow">INSIDE THE COLLECTION</p><h2>{galleryTitle}</h2></div><p>Every image, in album order.<br/>Select a photograph to explore the details.</p></div>
    <div className="ce-collection-rail"><span>{title}</span><i aria-hidden="true"><i style={{ transform: `scaleX(${(current + 1) / photos.length})` }}/></i></div>
    <div ref={root} className="ce-gallery">
      {groups.map((group, gi) => <section key={`${group.title}-${gi}`} className="ce-album-group" aria-label={group.title || title}>
        {group.title && <div className="ce-fleet-heading"><span>THE FLEET</span><h3>{group.title}</h3></div>}
        <div className="ce-bento">{group.images.map((photo, localIndex) => {
          const index = group.start + localIndex;
          return <button key={photo.src} className="ce-photo" type="button" data-ce-photo={index} style={{ '--ce-order': localIndex % 3 } as CSSProperties} aria-haspopup="dialog" aria-label={`Open ${title} image ${index + 1}: ${photo.caption ?? photo.alt}`} onClick={event => { trigger.current = event.currentTarget; setActive(index); }}>
            <span className="ce-photo-lens"><img src={photo.src} srcSet={`${photo.thumb} 640w, ${photo.src} ${photo.width}w`} sizes="(max-width: 640px) 92vw, (max-width: 900px) 48vw, 65vw" width={photo.width} height={photo.height} alt={photo.alt} loading="lazy" decoding="async"/></span>
            <span className="ce-photo-caption"><span><small>{photoLabel(photo, title)}</small></span><Expand size={17}/></span>
          </button>;
        })}</div>
      </section>)}
    </div>
    <dialog ref={dialog} className="ce-lightbox" aria-label={`${title} image viewer`} onCancel={event => { event.preventDefault(); setActive(null); }} onClick={event => { if (event.target === event.currentTarget) setActive(null); }} onKeyDown={event => { if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); step(1); } }}>
      {active !== null && <><div className="ce-lightbox-top"><span>{title}</span><button type="button" onClick={() => setActive(null)} aria-label="Close image viewer"><X size={23}/></button></div><img src={photos[active].src} alt={photos[active].alt}/><div className="ce-lightbox-bottom"><button type="button" onClick={() => step(-1)} aria-label="Previous image"><ChevronLeft size={24}/></button><p>{photoLabel(photos[active], title)}</p><button type="button" onClick={() => step(1)} aria-label="Next image"><ChevronRight size={24}/></button></div></>}
    </dialog>
  </section>;
}

export default function CategoryExperience({ variant, title, category, description, photos, cover }: { variant: CategoryVariant; title: string; category: string; description: string; photos: CatalogImage[]; cover: string }) {
  const page = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.header');
    if (!header) return;
    const update = () => page.current?.style.setProperty('--ce-header', `${header.getBoundingClientRect().height}px`);
    update(); const observer = new ResizeObserver(update); observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return <div ref={page} className={`ce-page ce-${variant}`} data-motion-skip>
    <header className="ce-intro"><Link href="/projects/" className="text-link">All projects</Link><div className="ce-intro-main"><div><p className="eyebrow">{category} / THE COLLECTION</p><SplitChars as="h1" variant="rise" lines={[title]} stagger={.025}/></div></div><div className="ce-intro-bottom"><p>{description}</p><Link href="#collection">Explore the collection <ArrowDown size={17}/></Link></div></header>
    <CategoryStory variant={variant} title={title} photos={photos} cover={cover}/>
    <CategoryBento variant={variant} title={title} photos={photos}/>
  </div>;
}
