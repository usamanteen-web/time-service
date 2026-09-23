'use client';
import { useMotionPreference } from './useMotionPreference';
import {motion} from 'framer-motion';
export default function Reveal({children,className='',delay=0}:{children:React.ReactNode;className?:string;delay?:number}){
  const reduced=useMotionPreference();
  return <motion.div className={className} initial={false} whileInView={reduced?{}:{opacity:1,y:0}} viewport={{once:true,amount:.1}} transition={{duration:.6,delay,ease:[.22,1,.36,1]}}>{children}</motion.div>;
}
