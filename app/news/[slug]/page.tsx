import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articles, featuredArticles, journalCover } from '@/lib/journal';
import CTA from '@/components/CTA';
import SplitChars from '@/components/SplitChars';
import ModelStory from '@/components/ModelStory';
import RenderGallery from '@/components/RenderGallery';
import '../../news-editorial.css';

export function generateStaticParams() {
  return articles.map(article => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find(item => item.slug === slug);
  return { title: article?.title ?? 'Design stories', description: article?.intro };
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find(item => item.slug === slug);
  if (!article) notFound();
  const cover = journalCover(article);

  if (!article.modelId || !article.chapters) {
    return (
      <>
        <article className="article news-classic-article">
          <Link href="/news/" className="text-link">All news & stories</Link>
          <p className="eyebrow">{article.category}</p>
          <SplitChars as="h1" variant="rise" lines={[article.title]} delay={.15} stagger={.018}/>
          <p className="article-intro">{article.intro}</p>
          <div className="article-image site-clip-enter" data-motion-skip>
            <Image src={cover.src} alt={cover.alt} fill priority sizes="(max-width:900px) 92vw, 900px"/>
          </div>
          {article.sections.map(section => (
            <section key={section.heading}>
              <SplitChars variant="reveal" lines={[section.heading]} stagger={.018}/>
              <p>{section.body}</p>
            </section>
          ))}
        </article>
        <CTA/>
      </>
    );
  }

  const related = featuredArticles.filter(item => item.slug !== article.slug);

  return (
    <>
      <article className="news-spatial-article">
        <header className="news-story-header">
          <div className="news-story-topline">
            <Link href="/news/" className="news-back-link">All news & stories</Link>
            <span>{article.category}</span>
          </div>
          <p className="eyebrow">IN FOCUS / {article.projectName}</p>
          <h1>{article.title}</h1>
          <div className="news-story-introduction">
            <p className="news-story-deck">{article.subtitle}</p>
            <p>{article.intro}</p>
          </div>
          <div className="news-story-meta">
            <span className="news-story-scroll">Scroll to explore the design</span>
            <div>{article.focus?.map(focus => <span key={focus}>{focus}</span>)}</div>
          </div>
          <div className="news-story-cover site-clip-enter" data-motion-skip>
            <Image src={cover.src} alt={cover.alt} fill priority sizes="(max-width: 680px) 92vw, 89vw"/>
          </div>
        </header>

        <ModelStory modelId={article.modelId} chapters={article.chapters}/>

        <section className="news-render-section" aria-labelledby="news-render-title">
          <div className="news-section-heading">
            <div>
              <p className="eyebrow">THE RENDER COLLECTION</p>
              <h2 id="news-render-title">Another way to see it.</h2>
            </div>
            <p>A closer look at the design through its presentation renders. Open an image to explore the composition in more detail.</p>
          </div>
          <RenderGallery modelId={article.modelId} compact/>
        </section>

        <section className="news-design-notes" aria-labelledby="news-notes-title">
          <div className="news-design-notes-title">
            <p className="eyebrow">BEHIND THE DESIGN</p>
            <h2 id="news-notes-title">An idea.<br/><em>A complete experience.</em></h2>
          </div>
          <div className="news-design-notes-copy">
            {article.sections.map(section => <div key={section.heading}><h3>{section.heading}</h3><p>{section.body}</p></div>)}
            <Link href="/projects/3d-model-designs/" className="news-library-link">Explore all 3D model designs</Link>
          </div>
        </section>
      </article>

      <section className="news-related" aria-labelledby="news-related-title">
        <div className="news-section-heading"><div><p className="eyebrow">CONTINUE EXPLORING</p><h2 id="news-related-title">The next perspective.</h2></div><Link href="/news/" className="text-link">All news & stories</Link></div>
        <div className="news-related-grid">
          {related.map(item => <Link key={item.slug} href={`/news/${item.slug}/`} className="news-related-card"><div><Image src={journalCover(item).src} alt={journalCover(item).alt} fill sizes="(max-width:680px) 90vw, 43vw"/></div><p className="eyebrow">{item.projectName} / INTERACTIVE STORY</p><h3>{item.title}</h3></Link>)}
        </div>
      </section>
      <CTA/>
    </>
  );
}
