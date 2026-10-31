'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { displayProject, navigation, profileProject, projects, services } from '@/lib/content';
import { articles } from '@/lib/journal';
import { projectHref } from '@/lib/project-media';
import { classifyLink, type ClassifyContext } from '@/lib/track-classify';
import { track } from '@/lib/track';

const pages: Record<string, string> = {};
for (const item of navigation) pages[item.href] = item.label;

const projectTitles: Record<string, string> = {};
const bySlug: Record<string, string> = {};
for (const project of [profileProject, ...projects]) {
  const title = displayProject(project).title;
  projectTitles[projectHref(project.slug)] = title;
  bySlug[project.slug] = title;
}

const baseContext: Omit<ClassifyContext, 'host'> = {
  pages,
  projects: projectTitles,
  services: Object.fromEntries(services.map((service) => [service.id, service.title])),
  news: Object.fromEntries(articles.map((article) => [article.slug, article.title])),
  bySlug,
};

const zoneOf = (element: Element) => (element.closest('.tsc-root') ? 'chat' : element.closest('header, .header, .mobile-menu') ? 'header' : element.closest('footer') ? 'footer' : 'page');

function firstVisit(): boolean {
  try {
    const seen = window.sessionStorage.getItem('ts_session');
    window.sessionStorage.setItem('ts_session', '1');
    return !seen;
  } catch {
    return false;
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const lastPath = useRef('');

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const entry = firstVisit();
    const event: Parameters<typeof track>[0] = { t: 'pageview', p: pathname };
    if (entry) {
      const query = new URLSearchParams(window.location.search);
      let referrer = '';
      try {
        const host = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (host && host !== window.location.hostname.replace(/^www\./, '')) referrer = host;
      } catch {
        // No usable referrer: counts as direct.
      }
      event.e = 1;
      event.r = query.get('utm_source') || referrer;
      const campaign = query.get('utm_campaign');
      if (campaign) event.cp = campaign;
    }
    track(event);
  }, [pathname]);

  useEffect(() => {
    const context: ClassifyContext = { ...baseContext, host: window.location.hostname };
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const tagged = target.closest('[data-track]');
      if (tagged) {
        const [category, item] = (tagged.getAttribute('data-track') || '').split('|');
        if (category && item) track({ t: 'click', p: window.location.pathname, c: category, i: item, z: zoneOf(tagged) });
        return;
      }
      const anchor = target.closest('a[href]');
      const href = anchor?.getAttribute('href');
      if (!anchor || !href || href.startsWith('#')) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      const info = classifyLink(url, context, anchor.classList.contains('header-quote'));
      if (info) track({ t: 'click', p: window.location.pathname, c: info.category, i: info.item, z: zoneOf(anchor) });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
