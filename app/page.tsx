import type { Metadata } from 'next';
import { companyName, companyStructuredData, homeDescription, homeTitle, siteUrl } from '@/lib/seo';
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
export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: `${siteUrl}/` },
  openGraph: {
    type: 'website', url: `${siteUrl}/`, siteName: companyName,
    title: homeTitle, description: homeDescription,
  },
  twitter: { card: 'summary', title: homeTitle, description: homeDescription },
};

export default function Home(){return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(companyStructuredData).replace(/</g, '\\u003c') }}/><ScrollVideoHero/><Services/><FeaturedProject/><SpatialExperience/><Projects/><KineticBand/><About/><Statistics/><Process/><CTA/></>;}
