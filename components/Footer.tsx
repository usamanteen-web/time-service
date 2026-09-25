import Link from 'next/link';
import { ArrowRight, ArrowUp, ArrowUpRight, MapPin, MessageCircle } from 'lucide-react';
import { Logo } from './Header';
import { company, navigation, people, services } from '@/lib/content';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link href="/" aria-label="Time Service home"><Logo /></Link>
          <p>Time Service Designs and<br />Constructions Co., Ltd.</p>
          <span>Spaces for people.<br />Experiences for brands.</span>
          <Link className="footer-start" href="/contact/">Let’s create something <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <div>
          <h2>Navigation</h2>
          <nav aria-label="Footer navigation">{navigation.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
        </div>
        <div>
          <h2>Our services</h2>
          <nav aria-label="Services">{services.map(service => <Link key={service.id} href={`/services/#${service.id}`}>{service.title}</Link>)}</nav>
        </div>
        <div className="footer-contact">
          <h2>Let’s talk</h2>
          <div className="footer-people">
            {people.map(person => <p key={person.email}>
              <strong>{person.name}</strong>
              <a href={`tel:${person.tel}`}>Tel. : {person.phone}</a>
              <a href={`mailto:${person.email}`}>E-mail : {person.email}</a>
            </p>)}
          </div>
          <p><MapPin size={17} aria-hidden="true" /><span>{company.address}</span></p>
          <a href="https://wa.me/66661124227" target="_blank" rel="noreferrer"><MessageCircle size={17} aria-hidden="true" />Connect With Us <ArrowUpRight size={15} aria-hidden="true" /><span className="nav-sr-only"> (opens in a new tab)</span></a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Time Service Designs and Constructions Co., Ltd.</p>
        <span>SPACE · PEOPLE · BRANDS · A BETTER TOMORROW</span>
        <a href="#main">Back to top <ArrowUp size={14} aria-hidden="true" /></a>
      </div>
    </footer>
  );
}
