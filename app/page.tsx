import { companyStructuredData } from '@/lib/seo';
import type { Metadata } from 'next';
import ScrollVideoHero from '@/components/ScrollVideoHero';
import Services from '@/components/Services';
import About from '@/components/About';
import Projects from '@/components/Projects';
import Statistics from '@/components/Statistics';
import Process from '@/components/Process';
import CTA from '@/components/CTA';
import SpatialExperience from '@/components/SpatialExperience';
import KineticBand from '@/components/KineticBand';
import FeaturedProject from '@/components/FeaturedProject';
const searchTitle = 'Time Service Designs and Constructions | ออกแบบและรับสร้างบูธครบวงจร';
const searchDescription = 'รับออกแบบ ผลิต และติดตั้งบูธนิทรรศการ ด้วยโรงงานของเราเอง 4 แห่ง ดูแลตั้งแต่แนวคิดและแบบ 3 มิติ ไปจนถึงการผลิตและติดตั้งหน้างาน';
export const metadata: Metadata = {
  title: { absolute: searchTitle },
  description: searchDescription,
  alternates: { canonical: 'https://www.timeservices.co/' },
  openGraph: { type: 'website', siteName: 'Time Service Designs and Constructions', title: searchTitle, description: searchDescription, url: 'https://www.timeservices.co/' },
  twitter: { card: 'summary', title: searchTitle, description: searchDescription },
};
export default function Home(){return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(companyStructuredData).replace(/</g, '\\u003c') }}/><ScrollVideoHero/><Services/><FeaturedProject/><SpatialExperience/><Projects/><KineticBand/><About/><Statistics/><Process/><CTA className="home-cta"/></>;}
