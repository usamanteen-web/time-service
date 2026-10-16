import type {Metadata} from 'next';
import PageIntro from '@/components/PageIntro';
import ProjectGallery from '@/components/ProjectGallery';
import CTA from '@/components/CTA';
export const metadata:Metadata={title:'Projects & design concepts'};
export default function ProjectsPage(){return <><PageIntro eyebrow="DESIGN EXPLORATIONS" title="A world of ideas" italic="Made spatial" description="Explore directions for your next space, from exhibition architecture to interiors and events."/><ProjectGallery/><div className="pp-note"><p className="concept-disclosure">Concept collection</p></div><CTA/></>;}
