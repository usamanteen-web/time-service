import {projectCovers,projectCoverAlt} from './project-media';

/** Shared by the home service cards and the service detail page. */
const selected:Record<string,{src:string;alt:string}>={
  exhibition:{src:'/images/services/haisenpet-exhibition.webp',alt:'Haisenpet exhibition booth with pink and white branding, suspended signage and product displays'},
  construction:{src:'/images/about/factory.webp',alt:'Exhibition stand under construction in the Time Service workshop'},
  interior:{src:projectCovers['structure-and-light'],alt:projectCoverAlt['structure-and-light']},
};
export const serviceImage=(service:{id:string;image:string;alt:string})=>selected[service.id]??{src:`/images/${service.image}.jpg`,alt:service.alt};
