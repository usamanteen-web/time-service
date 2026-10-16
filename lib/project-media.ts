import {categoryGalleries,modelRenderGalleries} from './media-catalog';
export const projectCategory:Record<string,string>={
  'time-service-profiles':'profiles','living-canopy':'systems-pavilions','a-moment-in-blue':'event-organizer','material-dialogue':'displays-stores','structure-and-light':'vehicles-tour',
};
export const projectCovers:Record<string,string>={
  'time-service-profiles':'/images/covers/time-service-designs-marun.webp',
  'blue-horizon':'/images/catalog/models/inol/02-rear-slab-gallery.webp',
  'living-canopy':'/images/catalog/models/korea-pavilion/05-promotion-reverse.webp',
  'a-moment-in-blue':'/images/event.jpg',
  'material-dialogue':'/images/covers/art-toy.webp',
  'structure-and-light':'/images/covers/vehicles-tour.webp',
};
export const projectCoverAlt:Record<string,string>={
  'time-service-profiles':'MARUN two-storey exhibition booth with illuminated blue-and-white architecture',
  'blue-horizon':'INOL Group rear slab gallery architectural render',
  'living-canopy':'Korea Pavilion promotional stand and connected exhibition booths',
  'a-moment-in-blue':'Event stage with blue lighting and an audience',
  'material-dialogue':'Orange Ocean art toy pop-up store concept',
  'structure-and-light':'Executive transport and group travel concept',
};
export const projectIndexCover='/images/catalog/models/art-toy/concept-04.webp';
export const projectHref=(slug:string)=>slug==='blue-horizon'?'/projects/3d-model-designs/':`/projects/${slug}/`;
/** Three images from the collection, in collection/file order. */
export const projectPreviews=(slug:string)=>{
  const images=slug==='blue-horizon'
    ? ['korea-pavilion','marun','inol'].flatMap(id=>modelRenderGalleries[id]?.slice(0,1)??[])
    : categoryGalleries[projectCategory[slug]]??[];
  return images.slice(0,3);
};
export const projectPreview=(slug:string)=>projectPreviews(slug)[0]?.src;
export const categoryDescriptions:Record<string,string>={
  'living-canopy':'Individual exhibitors. One shared identity. Explore exhibition systems and national pavilions, brought together through a coherent spatial language.',
  'a-moment-in-blue':'Spaces for a shared moment. A look at the stages, environments and production details behind our event work.',
  'material-dialogue':'A place for the product, and a reason to explore. Discover retail displays, pop-up stores and environments created around the way people browse.',
  'structure-and-light':'Every journey is part of the experience. Explore our transport collection, from executive transfers and group travel to thoughtfully arranged tours.',
};
