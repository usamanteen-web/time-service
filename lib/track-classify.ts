export type ClickInfo = { category: string; item: string };

export type LinkParts = { protocol: string; hostname: string; pathname: string; hash: string };

export type ClassifyContext = {
  host: string;
  pages: Record<string, string>;
  projects: Record<string, string>;
  services: Record<string, string>;
  news: Record<string, string>;
  bySlug: Record<string, string>;
};

const strip = (host: string) => host.toLowerCase().replace(/^www\./, '');

const CHAT_HOSTS: [RegExp, string][] = [
  [/^(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|whatsapp\.com)$/, 'WhatsApp'],
  [/^(u\.wechat\.com|weixin\.qq\.com|wechat\.com)$/, 'WeChat'],
  [/^(line\.me|lin\.ee)$/, 'LINE'],
];

const withSlash = (pathname: string) => (pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(pathname) ? pathname : `${pathname}/`);

export function classifyLink(link: LinkParts, ctx: ClassifyContext, quoteButton = false): ClickInfo | null {
  if (link.protocol === 'mailto:') return { category: 'contact', item: 'Email' };
  if (link.protocol === 'tel:') return { category: 'contact', item: 'Phone' };
  if (link.protocol !== 'http:' && link.protocol !== 'https:') return null;

  const host = strip(link.hostname);
  if (host !== strip(ctx.host)) {
    for (const [pattern, item] of CHAT_HOSTS) if (pattern.test(host)) return { category: 'contact', item };
    if (/^(maps\.app\.goo\.gl|maps\.google\.com)$/.test(host) || (/^google\.[a-z.]+$/.test(host) && link.pathname.startsWith('/maps'))) {
      return { category: 'contact', item: 'Google Maps' };
    }
    return { category: 'external', item: host };
  }

  const path = withSlash(link.pathname || '/');
  const hash = link.hash.replace(/^#/, '');
  if (quoteButton) return { category: 'contact', item: 'Get a Quote' };
  if (path === '/contact/') return { category: 'contact', item: 'Contact page' };
  if (path === '/services/' && hash && ctx.services[hash]) return { category: 'service', item: ctx.services[hash] };
  if (path === '/news/' && hash) return { category: 'news', item: ctx.news[hash] ?? ctx.bySlug[hash] ?? hash };
  if (path.startsWith('/news/') && path !== '/news/') {
    const slug = path.slice('/news/'.length).replace(/\/$/, '');
    return { category: 'news', item: ctx.news[slug] ?? slug };
  }
  if (ctx.projects[path]) return { category: 'project', item: ctx.projects[path] };
  return { category: 'page', item: ctx.pages[path] ?? path };
}
