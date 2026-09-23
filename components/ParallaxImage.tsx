'use client';
import { useMotionPreference } from './useMotionPreference';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function ParallaxImage({src, alt, sizes, strength=45}: {src:string;alt:string;sizes:string;strength?:number}) {
  const target = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  const {scrollYProgress} = useScroll({target,offset:['start end','end start']});
  const y = useTransform(() => reduced ? 0 : (scrollYProgress.get()-.5)*strength*2);
  return <div ref={target} className="parallax-window"><motion.div className="parallax-image-layer" style={{y}}><Image src={src} alt={alt} fill sizes={sizes}/></motion.div></div>;
}
