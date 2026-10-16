/**
 * Import the supplied project photographs and presentation images without
 * changing any originals. Run from the repository with:
 *   node scripts/import-media-catalog.mjs [path-to-Projects]
 * Requires the sharp dependency already supplied by Next.js.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.resolve(process.argv[2] || path.join(repo, '..', 'Projects'));
const modelRoot = path.join(sourceRoot, '3D Model Designs', 'Concept-3D models ');
const outputRoot = path.join(repo, 'public', 'images', 'catalog');
const imagePattern = /\.(?:jpe?g|png|webp)$/i;
const sortFiles = (a, b) => a.localeCompare(b, 'en', { numeric: true });
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const provenance = [];
const previousSources = JSON.parse(await fs.readFile(path.join(repo, 'scripts', 'media-catalog-sources.json'), 'utf8').catch(() => '[]'));
const previousSourceMap = new Map(previousSources.map((entry) => [entry.src, entry.source]));
// These two files are Blender interface screenshots of Art Toy, accidentally
// stored in the Rolls-Royce folder. They are not vehicle portfolio images.
const misplacedVehicleScreenshots = new Set(['Screenshot 2569-09-26 at 08.14.40.png', 'Screenshot 2569-09-26 at 14.16.01.png']);
// The approved Sprinter interior replaces the older seating photograph. Keep
// source-index filenames stable so existing links to the other vehicles work.
const excludedSprinterImage = 'LINE_ALBUM_Benz Sprinter419_260927_1.jpg';
const featuredSprinterImage = 'LINE_ALBUM_Benz Sprinter419_260927_4.jpg';
// These six approved concepts may live with the Art Toy scene or in the user's
// reorganized 3D Model Designs folder. Resolve them before touching the catalog.
const artToyNames = [
  '463.jpg',
  'ChatGPT Image Sep 25, 2026 at 06_13_37 PM.png',
  'ChatGPT Image Sep 25, 2026 at 11_36_45 PM.png',
  'ChatGPT Image Sep 26, 2026 at 08_16_27 AM.png',
  'ChatGPT Image Sep 26, 2026 at 08_16_31 AM.png',
  'ChatGPT Image Sep 26, 2026 at 08_24_21 AM.png',
];
const artToyFiles = [];
for (const name of artToyNames) {
  const candidates = [path.join(modelRoot, 'Art Toy model', name), path.join(sourceRoot, '3D Model Designs', name)];
  let source;
  for (const candidate of candidates) {
    if (await fs.stat(candidate).then((stat) => stat.isFile()).catch(() => false)) { source = candidate; break; }
  }
  if (!source) throw new Error(`Approved Art Toy concept is missing: ${name}. Existing catalog is preserved.`);
  artToyFiles.push(source);
}

async function imagesIn(directory, recursive = true) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory() && recursive) files.push(...await imagesIn(filename));
    else if (entry.isFile() && imagePattern.test(entry.name)) files.push(filename);
  }
  return files.sort(sortFiles);
}

async function importImage(source, folder, filename, title, caption) {
  const directory = path.join(outputRoot, folder);
  await fs.mkdir(directory, { recursive: true });
  const target = path.join(directory, `${filename}.webp`);
  const thumbTarget = path.join(directory, `${filename}-thumb.webp`);
  const src = `/images/catalog/${folder}/${filename}.webp`;
  const sourceRelative = path.relative(path.dirname(sourceRoot), source);
  const sourceStat = await fs.stat(source);
  const targetStat = await fs.stat(target).catch(() => null);
  const thumbStat = await fs.stat(thumbTarget).catch(() => null);
  if (!targetStat || !thumbStat || previousSourceMap.get(src) !== sourceRelative || targetStat.mtimeMs < sourceStat.mtimeMs || thumbStat.mtimeMs < sourceStat.mtimeMs) {
    await sharp(source).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toFile(target);
    await sharp(source).rotate().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toFile(thumbTarget);
  }
  const { width, height } = await sharp(target).metadata();
  provenance.push({ source: sourceRelative, src });
  return { src, thumb: `/images/catalog/${folder}/${filename}-thumb.webp`, alt: `${title} — ${caption}`, width, height, title, caption };
}

const categorySources = [
  ['profiles', 'TIME SERVICE PROFILES', 'TIME SERVICE Profiles'],
  ['systems-pavilions', 'Systems & Pavilions', 'Systems & Pavilions'],
  ['event-organizer', 'Event Organize', 'Event Organizer'],
  ['displays-stores', 'Displays & stores', 'Displays & Pop-Ups'],
  ['vehicles-tour', 'Vehicles & Tour', 'Vehicles & Tour'],
];
const categoryGalleries = {};
for (const [id, directoryName, title] of categorySources) {
  const directory = path.join(sourceRoot, directoryName);
  const files = (await imagesIn(directory)).filter((file) => id !== 'vehicles-tour' || !misplacedVehicleScreenshots.has(path.basename(file)));
  categoryGalleries[id] = [];
  let sprinterLead;
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const group = id === 'vehicles-tour' ? path.basename(path.dirname(file)) : '';
    if (group === 'Benz Sprinter419' && path.basename(file) === excludedSprinterImage) continue;
    const caption = group || `Selected work ${String(index + 1).padStart(2, '0')}`;
    const image = await importImage(file, `categories/${id}`, `${String(index + 1).padStart(3, '0')}${group ? `-${slugify(group)}` : ''}`, group || title, caption);
    categoryGalleries[id].push(image);
    if (group === 'Benz Sprinter419' && path.basename(file) === featuredSprinterImage) sprinterLead = image;
  }
  if (sprinterLead) {
    const images = categoryGalleries[id].filter((image) => image !== sprinterLead);
    const firstSprinter = images.findIndex((image) => image.title === 'Benz Sprinter419');
    images.splice(firstSprinter < 0 ? images.length : firstSprinter, 0, sprinterLead);
    categoryGalleries[id] = images;
  }
  console.log(`${id}: ${categoryGalleries[id].length} photos`);
}

const modelRenderGalleries = {};
const renderSources = [
  ['korea-pavilion', 'Korean Pavilions/Korea_40Booths_v1/renders', 'Korea Pavilion'],
  ['marun', 'Marun/MARUN_Studio_v3/renders', 'MARUN'],
  ['inol', 'INOL Group/INOL_Studio_v1/renders', 'INOL'],
  ['italy-pavilion', 'Italy Pavilions/Italy_Pavilion_v1/renders', 'Italy Pavilion'],
];
for (const [id, directoryName, title] of renderSources) {
  let files = (await imagesIn(path.join(modelRoot, directoryName), false)).filter((file) => /_4K\./i.test(file));
  // The MARUN overview introduces the full architecture before interior details.
  if (id === 'marun') files = files.sort((a, b) => Number(!a.includes('Overview')) - Number(!b.includes('Overview')) || sortFiles(a, b));
  modelRenderGalleries[id] = [];
  for (const file of files) {
    const name = path.basename(file, path.extname(file)).replace(/_4K$/i, '');
    const caption = name.replace(/^\d+_/, '').replaceAll('_', ' ');
    modelRenderGalleries[id].push(await importImage(file, `models/${id}`, slugify(name), title, caption));
  }
  console.log(`${id}: ${modelRenderGalleries[id].length} renders`);
}

// Art Toy uses the six concept images specifically selected by the user,
// not the scene renders or the alternate Orange Ocean lighting version.
modelRenderGalleries['art-toy'] = [];
for (let index = 0; index < artToyFiles.length; index++) {
  modelRenderGalleries['art-toy'].push(await importImage(artToyFiles[index], 'models/art-toy', `concept-${String(index + 1).padStart(2, '0')}`, 'Art Toy — Orange Ocean', `Concept study ${String(index + 1).padStart(2, '0')}`));
}
console.log(`art-toy: ${modelRenderGalleries['art-toy'].length} selected concept images`);

// The existing Jiuli render is the same view as its export preview; include it
// once. These are the final, approved model posters already used on the site.
for (const [id, title] of [['hilong-detailed', 'HILONG'], ['jiuli-detailed', 'JIULI']]) {
  modelRenderGalleries[id] = [await importImage(path.join(repo, 'public', 'images', `${id}-poster.jpg`), `models/${id}`, 'overview', title, 'Complete exhibition overview')];
}

const type = `export type CatalogImage = {\n  src: string;\n  thumb: string;\n  alt: string;\n  width: number;\n  height: number;\n  title?: string;\n  caption?: string;\n};\n`;
const serialize = (name, value) => `export const ${name}: Record<string, CatalogImage[]> = ${JSON.stringify(value, null, 2)};\n`;
const counts = {
  photos: Object.values(categoryGalleries).reduce((sum, images) => sum + images.length, 0),
  modelImages: Object.values(modelRenderGalleries).reduce((sum, images) => sum + images.length, 0),
};
await fs.writeFile(path.join(repo, 'lib', 'media-catalog.ts'), `// Generated by scripts/import-media-catalog.mjs. Originals are preserved.\n${type}\n${serialize('categoryGalleries', categoryGalleries)}\n${serialize('modelRenderGalleries', modelRenderGalleries)}\nexport const mediaCatalogCounts = ${JSON.stringify(counts)};\n`);
await fs.writeFile(path.join(repo, 'scripts', 'media-catalog-sources.json'), `${JSON.stringify(provenance, null, 2)}\n`);
const activeSources = new Set(provenance.map((entry) => entry.src));
for (const previous of previousSources) {
  if (activeSources.has(previous.src) || !previous.src.startsWith('/images/catalog/')) continue;
  const obsolete = path.join(repo, 'public', previous.src);
  if (!obsolete.startsWith(`${outputRoot}${path.sep}`)) continue;
  await fs.unlink(obsolete).catch(() => {});
  await fs.unlink(obsolete.replace(/\.webp$/, '-thumb.webp')).catch(() => {});
}
console.log(`Imported ${counts.photos} photographs and ${counts.modelImages} model presentation images.`);
