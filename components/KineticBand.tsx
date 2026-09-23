'use client';
import { useMotionPreference } from './useMotionPreference';

import * as Scrollytelling from '@bsmnt/scrollytelling';


const defaults={ease:'none'};
export default function KineticBand() {
  const reduced=useMotionPreference();
  return <Scrollytelling.Root start="top bottom" end="bottom top" scrub={true} disabled={!!reduced} defaults={defaults}>
    <div className="kinetic-band" aria-hidden="true"><Scrollytelling.Animation tween={{start:0,end:100,fromTo:[{xPercent:-14},{xPercent:4,ease:'none'}]}} disabled={!!reduced}><div className="kinetic-band-track"><span>IMAGINE.</span><em>DESIGN.</em><span>BUILD.</span><i>↗</i><span>IMAGINE.</span><em>DESIGN.</em></div></Scrollytelling.Animation></div>
  </Scrollytelling.Root>;
}
