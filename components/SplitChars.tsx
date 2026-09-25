'use client';

import { useEffect, useRef, type CSSProperties, type ElementType } from 'react';
import { useMotionValueEvent, useScroll } from 'framer-motion';
import { useMotionPreference } from './useMotionPreference';

export type SplitLine = string | { text: string; italic?: boolean };
type ScrollOffset = NonNullable<Parameters<typeof useScroll>[0]>['offset'];

type Props = {
  lines: SplitLine[];
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'strong';
  /**
   * rise — characters rise in once, on mount (pure CSS, so it plays from first paint).
   * skew — characters tilt and skew into place as the heading scrolls into view.
   * reveal — characters rise in once, when the heading first scrolls into view
   *          (and again whenever it is re-mounted while on screen, e.g. a new slide).
   */
  variant?: 'rise' | 'skew' | 'reveal';
  className?: string;
  id?: string;
  /** rise / reveal: seconds before the first character moves. */
  delay?: number;
  /** rise / reveal: seconds between characters. */
  stagger?: number;
  /** skew: framer-motion scroll offsets for the 0 → 1 progress. */
  offset?: ScrollOffset;
};

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const graphemes = (word: string) => segmenter ? Array.from(segmenter.segment(word), part => part.segment) : Array.from(word);
export { graphemes };

/**
 * Inline character spans for headings that keep their own markup (the hero).
 * The caller puts the readable text on the heading (aria-label); these are hidden.
 * `start` continues the stagger index across lines.
 */
export function Chars({text, start = 0}: {text: string; start?: number}) {
  let index = start;
  const words = text.split(/\s+/).filter(Boolean);
  return <span className="ac-chars" aria-hidden="true">{words.map((word, wordIndex) => <span key={wordIndex} className="ac-split-word-wrap">
    <span className="ac-split-word">{graphemes(word).map((char, charIndex) => <span key={charIndex} className="ac-char" style={{'--i': index++} as CSSProperties}>{char}</span>)}</span>
    {wordIndex < words.length - 1 ? ' ' : null}
  </span>)}</span>;
}

const normalise = (line: SplitLine) => typeof line === 'string' ? { text: line, italic: false } : { text: line.text, italic: !!line.italic };

/**
 * A heading split into characters. Screen readers get the whole sentence through
 * aria-label; the per-character spans are aria-hidden. Words never break apart.
 */
export default function SplitChars({lines, as: Tag = 'h2', variant = 'rise', className = '', id, delay = .12, stagger = .026, offset = ['start 94%', 'start 48%']}: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = useMotionPreference();
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const parts = lines.map(normalise);
  const label = parts.map(part => part.text).join(' ');
  let index = 0;
  const rendered = parts.map((part, lineIndex) => {
    const Line = part.italic ? 'em' : 'span';
    const words = part.text.split(/\s+/).filter(Boolean);
    return <Line key={lineIndex} className="ac-split-line" aria-hidden="true">
      {words.map((word, wordIndex) => <span key={wordIndex} className="ac-split-word-wrap">
        <span className="ac-split-word">{graphemes(word).map((char, charIndex) => <span key={charIndex} className="ac-char" style={{'--i': index++} as CSSProperties}>{char}</span>)}</span>
        {wordIndex < words.length - 1 ? ' ' : null}
      </span>)}
    </Line>;
  });
  const total = Math.max(1, index - 1);

  const write = (value: number) => ref.current?.style.setProperty('--ac-p', value.toFixed(4));
  useMotionValueEvent(scrollYProgress, 'change', value => { if (variant === 'skew') write(value); });

  // Arm the scroll-driven state only on the client and only when motion is welcome,
  // so the server HTML (and reduced motion) always shows the finished heading.
  useEffect(() => {
    const el = ref.current;
    if (!el || variant !== 'skew') return;
    if (reduced) { el.removeAttribute('data-armed'); return; }
    write(scrollYProgress.get());
    el.setAttribute('data-armed', '');
    return () => el.removeAttribute('data-armed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, variant, scrollYProgress]);

  // reveal: hide on the client, then play the rise once the heading is on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el || variant !== 'reveal') return;
    if (reduced) { el.removeAttribute('data-armed'); el.removeAttribute('data-in'); return; }
    el.setAttribute('data-armed', '');
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      el.setAttribute('data-in', '');
      observer.disconnect();
    }, { rootMargin: '0px 0px -6% 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, variant]);

  const style = {'--ac-split-n': total, '--ac-split-delay': `${delay}s`, '--ac-split-stagger': `${stagger}s`} as CSSProperties;
  const Heading = Tag as ElementType;
  return <Heading ref={ref} id={id} className={`ac-split ac-split-${variant} ${className}`.trim()} aria-label={label} style={style}>{rendered}</Heading>;
}
