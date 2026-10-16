import type {Metadata} from 'next';
import ModelDesigns from '@/components/ModelDesigns';
import CTA from '@/components/CTA';
export const metadata:Metadata={title:'3D Model Designs',description:'Explore the Time Service exhibition model collection in 3D. Rotate, zoom and discover each design alongside its concept images and render gallery.'};
export default function ModelDesignsPage(){return <><ModelDesigns/><CTA/></>;}
