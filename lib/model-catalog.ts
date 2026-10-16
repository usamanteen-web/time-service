import { exhibitionModels, type ModelView } from './exhibition-models';

export type CatalogModel = {
  id: string;
  name: string;
  code: string;
  area: string;
  src: string;
  poster: string;
  size: string;
  description: string;
  views: ModelView[];
  bounds?: { min: [number, number, number]; max: [number, number, number] };
};
export type ModelCatalogItem = CatalogModel;

const view = (id: string, label: string, title: string, description: string, target: string, orbit: string, fov = '35deg'): ModelView => ({ id, label, title, description, target, orbit, fov });

export const modelCatalog: CatalogModel[] = [
  {
    id: 'korea-pavilion', name: 'Korea Pavilions', code: 'PAVILION', area: '4 pavilion blocks · 360 m²',
    src: '/models/catalog/korea-pavilion.glb', poster: '/images/catalog/models/korea-pavilion/01-pavilion-overview.webp', size: '8.3 MB',
    description: 'Four connected pavilion blocks bring individual exhibitors together beneath a shared identity.',
    bounds: { min: [-16.55, 0, -12.0175], max: [16.55, 5.5219, 12.0175] },
    views: [
      view('overview', 'Overview', 'One identity. Many possibilities.', 'See all four pavilion blocks and the open circulation between them.', '0m 2.5m 0m', '-32deg 65deg 82%'),
      view('front', 'Front', 'A clear invitation to explore', 'Continuous overhead identity connects the individual exhibition spaces.', '0m 2.5m 0m', '0deg 72deg 82%'),
      view('overhead', 'Layout', 'The complete pavilion plan', 'Read the four-block arrangement, visitor aisles and promotional pavilion together.', '0m 1m 0m', '0deg 3deg 75%'),
      view('reverse', 'Reverse', 'Open from every direction', 'Explore the opposite side and the connections between exhibition blocks.', '0m 2.5m 0m', '145deg 58deg 82%'),
      view('detail', 'Pavilion detail', 'A place to meet', 'Move closer to the promotional pavilion, furniture and welcoming curved frontage.', '9m 1.8m 0m', '25deg 66deg 23m', '42deg'),
    ],
  },
  {
    id: 'marun', name: 'MARUN', code: 'DOUBLE DECKER', area: '20 × 6 m · two levels',
    src: '/models/catalog/marun.glb', poster: '/images/catalog/models/marun/04-booth-overview.webp', size: '5.1 MB',
    description: 'A double-decker exhibition stand with a mezzanine, detailed staircase and glazed meeting suite.',
    bounds: { min: [-10, 0, -3.0562], max: [10, 5.1694, 3.0562] },
    views: [
      view('overview', 'Overview', 'A new level of brand experience', 'The complete two-storey stand, from reception to the upper meeting level.', '0m 2.5m 0m', '-28deg 63deg 84%'),
      view('front', 'Front', 'A strong architectural presence', 'Explore the length of the blue-and-white facade and its reception points.', '0m 2.5m 0m', '0deg 79deg 110%'),
      view('overhead', 'Upper level', 'Two levels, one connected experience', 'Read the mezzanine layout, staircase and open meeting spaces.', '0m 2m 0m', '-15deg 25deg 110%'),
      view('reverse', 'Reverse', 'Designed on every side', 'See the rear circulation and the full depth of the stand.', '0m 2.5m 0m', '150deg 62deg 110%'),
      view('detail', 'Meeting room', 'Space for a conversation', 'A close look at the glazed meeting suite, furniture and layered material finishes.', '4.3m 1.5m -1.1m', '10deg 76deg 8m', '45deg'),
    ],
  },
  {
    id: 'inol', name: 'INOL Group', code: 'MATERIAL GALLERY', area: '18 × 6 m',
    src: '/models/catalog/inol.glb', poster: '/images/catalog/models/inol/01-hero-front.webp', size: '6.4 MB',
    description: 'Rhythmic arches frame a gallery of stone, material samples and intimate meeting spaces.',
    bounds: { min: [-9.0967, 0, -3.0196], max: [9.0967, 5.055, 3.0196] },
    views: [
      view('overview', 'Overview', 'Material, rhythm and light', 'The complete arched exhibition gallery and its layered material displays.', '0m 2.4m 0m', '-30deg 65deg 88%'),
      view('front', 'Front', 'A rhythm of open arches', 'Nine architectural bays balance circulation with carefully framed product moments.', '0m 2.3m 0m', '0deg 80deg 110%'),
      view('overhead', 'Layout', 'A gallery made for discovery', 'Follow the route through material displays, sample islands and meeting areas.', '0m 1.5m 0m', '0deg 15deg 110%'),
      view('reverse', 'Reverse', 'A different perspective on material', 'Explore the rear slab gallery and the complete exhibition perimeter.', '0m 2.4m 0m', '145deg 62deg 110%'),
      view('detail', 'Materials', 'Texture at a human scale', 'Move closer to the central sample island and its stone details.', '-1m 1.2m 0m', '-25deg 68deg 10m', '45deg'),
    ],
  },
  {
    id: 'italy-pavilion', name: 'Italy Pavilion', code: 'PAVILION', area: 'Exhibitor island + reception',
    src: '/models/catalog/italy-pavilion.glb', poster: '/images/catalog/models/italy-pavilion/01-overall-italy-pavilion.webp', size: '1.6 MB',
    description: 'An exhibitor island and a separate reception lounge share a distinctive suspended national identity.',
    bounds: { min: [-6.3566, 0, -6.3226], max: [6.357, 7.9, 6.3226] },
    views: [
      view('overview', 'Overview', 'An identity that brings people together', 'Both the exhibitor island and reception pavilion, in one complete view.', '0m 3m 0m', '-35deg 59deg 98%'),
      view('front', 'Front', 'A welcome with a shared identity', 'Read the relationship between exhibition stations and the reception lounge.', '0m 2.8m 0m', '0deg 75deg 110%'),
      view('overhead', 'Layout', 'A pavilion with room to connect', 'The exhibitor stations, shared aisle and hospitality space seen from above.', '0m 2m 0m', '0deg 5deg 110%'),
      view('reverse', 'Reverse', 'The full architectural composition', 'Suspended fascia, exhibition modules and the separate hospitality area.', '0m 3m 0m', '145deg 59deg 110%'),
      view('detail', 'Reception', 'Designed around the welcome', 'Move closer to the reception, meeting and lounge spaces.', '4.8m 1.8m 0m', '-65deg 68deg 13m', '42deg'),
    ],
  },
  {
    id: 'art-toy', name: 'Orange Ocean · Art Toy', code: 'RETAIL EXPERIENCE', area: '12 × 10 m',
    src: '/models/catalog/art-toy.glb', poster: '/images/catalog/models/art-toy/concept-01.webp', size: '11.7 MB',
    description: 'A playful retail world with collectible figures, a central canopy, island displays and tropical details.',
    bounds: { min: [-6.2232, 0, -5.4155], max: [6.2232, 3.619, 5.4155] },
    views: [
      view('overview', 'Overview', 'A world of colour and character', 'Explore the complete Art Toy retail environment and its connected islands.', '0m 1.6m 0m', '-32deg 58deg 92%'),
      view('front', 'Front', 'An invitation to play', 'The sculpted islands, character displays and central canopy seen together.', '0m 1.5m 0m', '0deg 76deg 110%'),
      view('overhead', 'Layout', 'Follow your curiosity', 'Discover the open routes between the retail kiosk, lounge and display islands.', '0m 1m 0m', '0deg 5deg 110%'),
      view('reverse', 'Reverse', 'Discovery in every direction', 'Explore the opposite side of the retail experience.', '0m 1.6m 0m', '145deg 59deg 110%'),
      view('detail', 'Canopy detail', 'Little details, a lasting impression', 'Look closely at the canopy, counter, decorative lighting and character displays.', '0m 1.5m 0m', '-30deg 72deg 10m', '45deg'),
    ],
  },
  ...exhibitionModels.filter(model => model.id === 'jiuli-detailed').map(model => ({
  ...model,
  src: `/models/${model.id}.glb`,
  description: model.views[0].description,
  views: model.id === 'jiuli-detailed' ? [
    view('overview', 'Overview', 'Identity above the exhibition floor', 'See the complete stand, suspended identity, rigging and visitor space together.', '0m 2.55m 0m', '31deg 67deg 110%', '37deg'),
    view('front', 'Front', 'A clear presence from the aisle', 'Explore the curved signs, graphic walls and welcoming exhibition frontage.', '0m 2.55m 0m', '0deg 78deg 110%', '37deg'),
    view('overhead', 'Structure', 'The architecture overhead', 'Read the full truss arrangement, hanging identity and the stand beneath it.', '0m 2.55m 0m', '20deg 18deg 115%', '37deg'),
    view('reverse', 'Reverse', 'Connected on every side', 'Rotate around the entire installation to understand its depth and suspension.', '0m 2.55m 0m', '155deg 62deg 110%', '37deg'),
    view('detail', 'Hanging detail', 'Where identity meets structure', 'Move closer to the curved suspended signs, cables, trusses and lighting.', '0m 5.1m 0m', '31deg 60deg 13m', '37deg'),
  ] : [
    view('overview', 'Overview', 'Every detail, in perspective', model.views[0].description, '0m 3.4m 0m', '-36deg 68deg 110%', '37deg'),
    view('front', 'Front', 'A sculpted first impression', 'The curved reception, graphic architecture and overhead identity read as one composition.', '0m 3.4m 0m', '0deg 77deg 110%', '37deg'),
    view('overhead', 'Structure', 'A complete architectural composition', 'Explore the overhead rigging and the full exhibition layout.', '0m 3.4m 0m', '-15deg 20deg 115%', '37deg'),
    view('reverse', 'Reverse', 'A different perspective', 'View the full stand from the opposite side, including the meeting spaces and structure.', '0m 3.4m 0m', '145deg 63deg 110%', '37deg'),
    view('detail', 'Reception', 'Crafted at a human scale', model.views[1].description, model.views[1].target, model.views[1].orbit, model.views[1].fov),
  ],
  })),
];

export function getModelById(id: string): CatalogModel | undefined {
  return modelCatalog.find(model => model.id === id);
}
