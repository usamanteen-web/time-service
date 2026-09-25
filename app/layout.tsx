import type {Metadata} from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MotionEnhancements from '@/components/MotionEnhancements';
import SiteMotion from '@/components/SiteMotion';
import './globals.css';
import './motion.css';
import './redesign.css';
import './navigation-redesign.css';
import './featured-project.css';
import './spatial-redesign.css';
import './about-contact.css';
import './site-motion.css';
import './canvas-port.css';
export const metadata:Metadata={title:{default:'Time Service Designs & Constructions | Exhibition Booth Design Thailand',template:'%s | Time Service'},description:'Professional exhibition booth design, construction, event production, interior and general construction services in Bangkok, Thailand.',keywords:['Exhibition Booth Thailand','Exhibition Design Bangkok','Booth Construction Thailand','Exhibition Contractor Thailand','Event Organizer Bangkok','Interior Design Thailand'],icons:{icon:'/images/company-logo.png',apple:'/apple-touch-icon.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><MotionEnhancements/><SiteMotion/><Header/><main id="main">{children}</main><Footer/></body></html>;}
