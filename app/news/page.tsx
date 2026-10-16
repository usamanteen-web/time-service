import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Box } from 'lucide-react';
import { featuredArticles, journalCover } from '@/lib/journal';
import PageIntro from '@/components/PageIntro';
import CTA from '@/components/CTA';
import '../news-editorial.css';

export const metadata: Metadata = {
  title: 'News & design stories',
  description: 'Explore exhibition design through interactive 3D stories: Korea Pavilions, Marun double-decker stands and JIULI hanging structures.',
};

export default function NewsPage() {
  return (
    <>
      <PageIntro
        eyebrow="NEWS & DESIGN STORIES"
        title="Behind the spaces"
        italic="Inside the ideas"
        description="Discover the thinking behind the stand. Move through our designs in 3D, explore the details and see how a spatial idea comes together."
      />
      <section className="news-collection section" aria-labelledby="news-collection-title">
        <div className="news-collection-heading">
          <div>
            <p className="eyebrow">THE DESIGN JOURNAL</p>
            <h2 id="news-collection-title">A new perspective.</h2>
          </div>
          <p>Three spatial stories. Every angle, yours to explore.</p>
        </div>
        <div className="news-grid">
          {featuredArticles.map((article) => {
            const cover = journalCover(article);
            return (
              <Link
                href={`/news/${article.slug}/`}
                className={`news-card${article.modelId ? ' news-card-spatial' : ''}`}
                id={article.slug}
                key={article.slug}
              >
                <div className="news-card-image">
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    sizes="(max-width: 680px) 92vw, (max-width: 1050px) 44vw, 29vw"
                    className="news-card-cover"
                  />
                  {article.modelId && <span className="news-card-format"><Box size={14} aria-hidden="true"/> Interactive 3D story</span>}
                </div>
                <p className="eyebrow">{article.category}</p>
                <h3>{article.title}</h3>
                <p className="news-card-intro">{article.intro}</p>
                <span className="news-card-link">{article.modelId ? 'Explore the story' : 'Read the story'}</span>
              </Link>
            );
          })}
        </div>
      </section>
      <CTA />
    </>
  );
}
