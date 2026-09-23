import type {Metadata} from 'next';
import PageIntro from '@/components/PageIntro';
import ProjectGallery from '@/components/ProjectGallery';
import CTA from '@/components/CTA';
export const metadata:Metadata={title:'Projects & design concepts'};
export default function ProjectsPage(){return <><PageIntro eyebrow="DESIGN EXPLORATIONS" title="A world of ideas." italic="Made spatial." description="Explore directions for your next space, from exhibition architecture to interiors and events."/><section className="section gallery-section"><p className="concept-disclosure">Concept collection · ภาพทั้งหมดในแกลเลอรีนี้สร้างด้วย AI เพื่อแสดงแนวทางการออกแบบ ไม่ใช่ภาพผลงานที่ก่อสร้างจริง</p><ProjectGallery/></section><CTA/></>;}
