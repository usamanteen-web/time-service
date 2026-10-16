import type { MetadataRoute } from 'next';
import { profileProject, projects } from '@/lib/content';
import { articles } from '@/lib/journal';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/about/', '/services/', '/projects/', '/news/', '/contact/', '/projects/3d-model-designs/',
    ...[profileProject, ...projects].map(p => `/projects/${p.slug}/`),
    ...articles.map(a => `/news/${a.slug}/`)];
  return [...new Set(routes)].map(path => ({ url: `https://www.timeservices.co${path}` }));
}
