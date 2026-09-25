'use client';

import { useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { projects } from '@/lib/content';
import SplitChars from './SplitChars';

// Home-only slide copy, as edited on the Claude Design canvas.
const featuredCopy = [
  { lines: ['The Open', 'Pavilion'], category: 'Professional Experience', name: 'TIME SERVICE PROFILES' },
  { lines: ['Double Decker', 'Exhibition Stand'], category: 'Brand experience', name: 'Wooden Stands' },
  { lines: ['Hangging', 'Structure'], category: 'Exhibition design', name: 'Systems & Pavilions' },
];
const featuredProjects = projects.slice(0, 3).map((project, index) => ({ ...project, ...featuredCopy[index], title: featuredCopy[index].lines.join(' ') }));

export default function FeaturedProject() {
  const [activeIndex, setActiveIndex] = useState(0);
  const project = featuredProjects[activeIndex];

  function moveSlide(direction: number) {
    setActiveIndex((current) => (current + direction + featuredProjects.length) % featuredProjects.length);
  }

  function handleControlKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveSlide(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }

  return (
    <section
      className="featured-project"
      aria-label="Featured design concepts"
      aria-roledescription="carousel"
    >
      <div className="featured-project-images">
        {featuredProjects.map((item, index) => (
          <div
            key={item.slug}
            className={`featured-project-image${index === activeIndex ? ' is-active' : ''}`}
            aria-hidden={index !== activeIndex}
          >
            <Image
              src={`/images/${item.image}.jpg`}
              alt={index === activeIndex ? `${item.name} — AI-generated concept image` : ''}
              fill
              sizes="100vw"
            />
          </div>
        ))}
      </div>
      <div className="featured-project-shade" aria-hidden="true" />

      <div className="featured-project-copy">
        <p className="featured-project-eyebrow"><span aria-hidden="true" /> Featured concept</p>
        <div className="featured-project-story" key={project.slug}>
          <SplitChars as="h2" variant="reveal" className="featured-project-title" lines={project.lines} delay={.05} stagger={.024}/>
          <p className="featured-project-description">{project.description}</p>
        </div>
        <Link className="featured-project-link" href={`/projects/${project.slug}/`} aria-label={`View project: ${project.title}`}>
          View project <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>

      <div className="featured-project-footer">
        <div className="featured-project-controls" onKeyDown={handleControlKey} role="group" aria-label="Choose a featured concept">
          <div className="featured-project-indices">
            {featuredProjects.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                className="featured-project-index"
                aria-label={`Show ${item.name}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
          <div className="featured-project-arrows">
            <button type="button" aria-label="Previous featured concept" onClick={() => moveSlide(-1)}>
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next featured concept" onClick={() => moveSlide(1)}>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="featured-project-caption">
          <span>{project.category}</span>
          <span>Time service designs and constructions</span>
        </div>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {project.title}. Concept {activeIndex + 1} of {featuredProjects.length}.
      </p>
    </section>
  );
}
