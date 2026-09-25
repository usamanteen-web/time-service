import type {Metadata} from 'next';
import AboutExperience from '@/components/AboutExperience';
import CTA from '@/components/CTA';
export const metadata:Metadata={title:'About us'};
export default function AboutPage(){return <><AboutExperience/><CTA/></>;}
