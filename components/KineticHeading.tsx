'use client';
import { useMotionPreference } from './useMotionPreference';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

function Word({text, index, progress, reduced}: {text: string; index: number; progress: MotionValue<number>; reduced: boolean | null}) {
  const resolve = () => Math.max(0, Math.min(1, (progress.get() - index * .065) / .55));
  // Function transforms use the same measured timeline in every browser.
  const y = useTransform(() => reduced ? 0 : (1 - resolve()) * 36);
  const rotate = useTransform(() => reduced ? 0 : (1 - resolve()) * 3);
  const opacity = useTransform(() => reduced ? 1 : .28 + resolve() * .72);
  return <span className="kinetic-word-mask"><motion.span style={{y, rotate, opacity}}>{text}</motion.span></span>;
}

export default function KineticHeading({first, second, className=''}: {first: string; second: string; className?: string}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = useMotionPreference();
  const {scrollYProgress} = useScroll({target: ref, offset: ['start 95%', 'end 60%']});
  const firstWords = first.split(' ');
  return <h2 ref={ref} className={`kinetic-heading ${className}`} aria-label={`${first} ${second}`}>
    <span className="kinetic-line" aria-hidden="true">{firstWords.map((word,i) => <Word key={i} text={word} index={i} progress={scrollYProgress} reduced={reduced}/>)}</span>
    <em className="kinetic-line" aria-hidden="true">{second.split(' ').map((word,i) => <Word key={i} text={word} index={i+firstWords.length} progress={scrollYProgress} reduced={reduced}/>)}</em>
  </h2>;
}
