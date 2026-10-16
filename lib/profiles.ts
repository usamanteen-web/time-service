import { packBento, type Placement, type Span } from './bento';
import { profilePhotos } from './profiles-data';

/** 132 photos = 12 chapters of 11, so every chapter is the same size and they run 01–12. */
export const PHOTOS_PER_CHAPTER = 11;
export const profileCount = profilePhotos.length;
export const pad = (n: number) => String(n).padStart(3, '0');
export const photoSrc = (n: number, size?: 900) => `/images/profiles/p-${pad(n)}${size ? `-${size}` : ''}.jpg`;

type Photo = (typeof profilePhotos)[number];
type Shape = 'panorama' | 'wide' | 'standard' | 'square' | 'portrait' | 'tall';
type Item = { kind: 'photo'; photo: Photo; index: number } | { kind: 'chapter'; chapter: number; from: number; to: number };

/** One tile per photo, plus a numbered card at the start of every chapter. */
const items: Item[] = profilePhotos.flatMap((photo, index) => {
  const tile: Item = { kind: 'photo', photo, index };
  if (index % PHOTOS_PER_CHAPTER) return [tile];
  const chapter = index / PHOTOS_PER_CHAPTER + 1;
  return [{ kind: 'chapter', chapter, from: index + 1, to: Math.min(index + PHOTOS_PER_CHAPTER, profileCount) }, tile];
});

const shapeOf = ({ w, h }: Photo): Shape => {
  const ratio = w / h;
  if (ratio >= 1.9) return 'panorama';
  if (ratio >= 1.55) return 'wide';
  if (ratio >= 1.15) return 'standard';
  if (ratio >= .9) return 'square';
  if (ratio >= .6) return 'portrait';
  return 'tall';
};
const s = (w: number, h: number): Span => ({ w, h });

/**
 * Candidate spans per shape, in preference order. `k` counts photos of that
 * shape so far, which rotates the feature tiles through the grid. Desktop
 * works in thirds (4 / 8 / 12 of 12 columns, 300px rows) so every free run
 * is a clean third; tablet halves that (6 columns, 190px rows); phones use
 * 2 columns of 170px rows.
 */
const desktop = (shape: Shape, k: number): Span[] => {
  switch (shape) {
    case 'panorama': return k % 3 === 1 ? [s(12, 2), s(8, 1), s(4, 1)] : [s(8, 1), s(12, 2), s(4, 1)];
    case 'wide': return k % 4 === 2 ? [s(8, 2), s(4, 1)] : [s(4, 1), s(8, 2)];
    case 'standard': return k % 6 === 3 ? [s(8, 2), s(4, 1)] : [s(4, 1), s(8, 2)];
    case 'square': return [s(4, 2), s(4, 1)];
    case 'portrait': return [s(4, 2)];
    case 'tall': return [s(4, 3), s(4, 2)];
  }
};
const tablet = (shape: Shape, k: number): Span[] => {
  switch (shape) {
    case 'panorama': return [s(6, 2), s(2, 1)];
    case 'wide': return k % 4 === 2 ? [s(4, 2), s(2, 1)] : [s(2, 1), s(4, 2)];
    case 'standard': return k % 6 === 3 ? [s(4, 2), s(2, 1)] : [s(2, 1), s(4, 2)];
    case 'square': return [s(2, 2), s(2, 1)];
    case 'portrait': return [s(2, 2)];
    case 'tall': return [s(2, 2)];
  }
};
const mobile = (shape: Shape, k: number): Span[] => {
  switch (shape) {
    case 'panorama': return [s(2, 1)];
    case 'wide': return [s(2, 1), s(1, 1)];
    case 'standard': return k % 3 === 1 ? [s(2, 2), s(1, 1)] : [s(1, 1), s(2, 2)];
    case 'square': return [s(1, 1)];
    case 'portrait': return [s(1, 1)];
    case 'tall': return [s(1, 2)];
  }
};

const layout = (columns: number, pick: (shape: Shape, k: number) => Span[], chapter: Span, first: Span, minWidth: number) => {
  const seen: Partial<Record<Shape, number>> = {};
  return packBento(items, columns, item => {
    if (item.kind === 'chapter') return [chapter];
    // Photo 001 opens the archive as a feature tile.
    if (item.index === 0) return [first];
    const shape = shapeOf(item.photo);
    const k = seen[shape] ?? 0;
    seen[shape] = k + 1;
    return pick(shape, k);
  }, minWidth);
};
const d = layout(12, desktop, s(4, 1), s(8, 2), 4);
const t = layout(6, tablet, s(2, 1), s(4, 2), 2);
const m = layout(2, mobile, s(2, 1), s(2, 1), 1);

export type GalleryTile = Item & { spans: { d: Placement; t: Placement; m: Placement } };
export const galleryTiles: GalleryTile[] = items.map((item, i) => ({ ...item, spans: { d: d[i], t: t[i], m: m[i] } }));
export const chapterCount = Math.ceil(profileCount / PHOTOS_PER_CHAPTER);
