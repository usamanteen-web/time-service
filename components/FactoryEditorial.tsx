'use client';

import Image from 'next/image';
import {useEffect, useRef, useState} from 'react';
import {motion} from 'framer-motion';
import {ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Maximize2, X} from 'lucide-react';
import {useMotionPreference} from './useMotionPreference';
import SplitChars from './SplitChars';
import '@/app/factory-editorial.css';

type FactoryPhotograph = {src:string; title:string; alt:string; illustrative?:boolean};

const photographs:FactoryPhotograph[] = [
  {src:'/images/about/factory.webp', title:'Built in-house.', alt:'Full-size curved exhibition stand being built in the Time Service production workshop'},
  {src:'/images/factory/team-craftsmanship.webp', title:'Craftsmanship, in every detail.', alt:'Illustrative image of a craftsperson working on custom exhibition components', illustrative:true},
  {src:'/images/factory/carpentry.webp', title:'Made to fit.', alt:'Unfinished timber reception counter with integrated shelving in the workshop'},
  {src:'/images/factory/team-finishing.webp', title:'Care in every finish.', alt:'Illustrative image of a workshop team preparing exhibition components and finishes', illustrative:true},
  {src:'/images/factory/preparation.webp', title:'Checked before delivery.', alt:'Masked counter components with curved lighting illuminated for checks in the workshop'},
  {src:'/images/factory/team-assembly.webp', title:'One team. One standard.', alt:'Illustrative image of a workshop team assembling exhibition components', illustrative:true},
  {src:'/images/factory/fabrication.webp', title:'From parts to a complete space.', alt:'Timber frames and booth wall panels being assembled in the workshop'},
  {src:'/images/factory/finishing.webp', title:'Colour. Surface. Detail.', alt:'Turquoise booth arches and wall panels during finishing in the workshop'},
];
const ease = [.22, .61, .36, 1] as const;

/** Compact photo story for the About page's right column. */
export default function FactoryEditorial() {
  const reduced = useMotionPreference();
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const visiblePhotos = expanded ? photographs : photographs.slice(0, 6);
  const initial = reduced ? false : {opacity:0, y:14};
  const reveal = {opacity:1, y:0};
  const opened = active !== null;

  useEffect(() => {
    const element = dialog.current;
    if (!opened || !element) return;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      trigger.current?.focus({preventScroll:true});
    };
  }, [opened]);

  const close = () => setActive(null);
  const step = (direction:number) => setActive(current => current === null ? null : (current + direction + visiblePhotos.length) % visiblePhotos.length);

  return <section id="our-factory" className="factory-editorial" aria-labelledby="factory-title" data-motion-skip>
    <header className="factory-vision">
      <SplitChars id="factory-title" variant="skew" offset={['start 96%', 'start 64%']} lines={['Our Own', {text:'Factory', italic:true}]}/>
      <SplitChars as="p" className="factory-promise" variant="reveal" delay={.04} stagger={.012} lines={['Built In-House. Delivered With Control.']}/>
      <motion.p className="factory-vision-copy" initial={initial} whileInView={reveal} viewport={{once:true, amount:.3}} transition={{duration:.35, ease}}>We believe exceptional spaces begin with thoughtful making. Our vision is to bring design and craftsmanship closer together, with care for every material, detail and finish.</motion.p>
      <motion.p className="factory-vision-copy" initial={initial} whileInView={reveal} viewport={{once:true, amount:.3}} transition={{duration:.35, ease}}>Across our <strong>4 in-house production facilities</strong>, our own teams connect the first prototype to the final installation.</motion.p>
      <motion.p className="factory-vision-copy" lang="th" initial={initial} whileInView={reveal} viewport={{once:true, amount:.3}} transition={{duration:.35, ease}}>โรงงานทั้ง 4 แห่งของเรา รองรับการผลิตและเตรียมงานแบบครบวงจร ทำให้เราสามารถควบคุมคุณภาพ ระยะเวลา และรายละเอียดของงานได้ตั้งแต่การผลิตจนถึงการเตรียมติดตั้ง</motion.p>
    </header>

    <div className="factory-collection">
      <motion.div className="factory-collection-heading" initial={initial} whileInView={reveal} viewport={{once:true}} transition={{duration:.35, ease}}>
        <h3>Inside our factory</h3>
        <p>4 Factories. One Standard.</p>
      </motion.div>
      <div className="factory-photo-grid" id="factory-photographs">
        {Array.from({length:Math.ceil(visiblePhotos.length / 2)}, (_, row) => <div className="factory-photo-row" key={row}>
          {visiblePhotos.slice(row * 2, row * 2 + 2).map((photo, column) => {
            const index = row * 2 + column;
            return <motion.button type="button" className="factory-photo-tile" key={photo.src} aria-label={`View photograph: ${photo.title}`} aria-haspopup="dialog" initial={reduced ? false : {opacity:0, y:12}} whileInView={reveal} viewport={{once:true, amount:.18}} transition={{duration:.35, delay:reduced ? 0 : column * .35, ease}}
              onClick={event => {trigger.current = event.currentTarget; setActive(index);}}>
              <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 1023px) 48vw, 28vw"/>
              <span className="factory-photo-shade" aria-hidden="true"/>
              <span className="factory-photo-caption">{photo.title}</span>
              <span className="factory-photo-open" aria-hidden="true"><Maximize2 size={17}/></span>
            </motion.button>;
          })}
        </div>)}
      </div>
      <button ref={expandButton} type="button" className="factory-explore-more" aria-expanded={expanded} aria-controls="factory-photographs" onClick={() => setExpanded(value => !value)}>
        {expanded ? 'Show less from our factory' : 'Explore more from our factory'}
        {expanded ? <ArrowUp size={17} aria-hidden="true"/> : <ArrowDown size={17} aria-hidden="true"/>}
      </button>
    </div>

    <dialog className="factory-lightbox" ref={dialog} aria-label="Factory photographs" onCancel={event => {event.preventDefault(); close();}} onClose={close}
      onKeyDown={event => {if (event.key === 'ArrowRight') {event.preventDefault(); step(1);} if (event.key === 'ArrowLeft') {event.preventDefault(); step(-1);}}}
      onClick={event => {if (event.target === event.currentTarget) close();}}>
      {active !== null && <div className="factory-lightbox-content">
        <button className="factory-lightbox-close" type="button" onClick={close} aria-label="Close factory photograph"><X size={24}/></button>
        <div className="factory-lightbox-image"><Image src={photographs[active].src} alt={photographs[active].alt} fill sizes="94vw"/></div>
        <div className="factory-lightbox-footer">
          <button type="button" onClick={() => step(-1)} aria-label="Previous factory photograph"><ChevronLeft size={23}/></button>
          <div className="factory-lightbox-caption" aria-live="polite"><p>{photographs[active].title}</p>{photographs[active].illustrative && <small>Illustrative image</small>}</div>
          <button type="button" onClick={() => step(1)} aria-label="Next factory photograph"><ChevronRight size={23}/></button>
        </div>
      </div>}
    </dialog>
  </section>;
}
