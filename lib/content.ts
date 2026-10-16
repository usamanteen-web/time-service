export const company = {
  name: 'Time Service Designs and Constructions Co., Ltd.',
  phone: '086 793 3023', phoneHref: 'tel:+66867933023',
  address: '124/24 Moo 12, Bang Phli Yai Subdistrict, Bang Phli District, Samut Prakan 10540, Thailand',
  postalAddress: {
    '@type': 'PostalAddress',
    streetAddress: '124/24 Moo 12, Bang Phli Yai Subdistrict',
    addressLocality: 'Bang Phli',
    addressRegion: 'Samut Prakan',
    postalCode: '10540',
    addressCountry: 'TH',
  },
  mapsHref: 'https://maps.app.goo.gl/yYFWpAZnEpDsw8Ey9',
};
export const people = [
  { name:'Pimchanok Chaitaveekulawat', role:'Managing Director', phone:'(+66) 86 793 3023', tel:'+66867933023', email:'Pimchanok.event@gmail.com',
    chat:{ whatsapp:'https://wa.me/qr/CPKP4ZEWNXHZE1', wechat:'https://u.wechat.com/kNSDMcuASBN7g08Ej_m9hTk?s=3', line:'https://line.me/ti/p/aBua5SneBP' } },
  { name:'Usaman Ohro', role:'Project Director', phone:'(+66) 66 112 4227', tel:'+66661124227', email:'usaman.teen@gmail.com',
    chat:{ whatsapp:'https://wa.me/qr/W3QHUITNJ5V7A1', wechat:'https://u.wechat.com/kOaExtCIi_etX-Nm3uvlqwQ?s=2', line:'https://line.me/ti/p/CXLEsV4CWz' } },
  { name:'Harry Chau', role:'Sales & Marketing', phone:'(+66) 61 019 8954', tel:'+66610198954', email:'harry.timeservice@gmail.com',
    chat:{ whatsapp:'https://api.whatsapp.com/qr/MKAOVFBDVNSHC1?autoload=1&app_absent=0', wechat:'https://u.wechat.com/kMHtRpHNjRDsbLNKSz9vM7I?s=2', line:'https://line.me/ti/p/PzYUe2pB-i' } },
];
/** Chat apps each person can be reached on (links decoded from their QR codes). */
export const chatChannels = [{ key:'whatsapp', label:'WhatsApp' }, { key:'wechat', label:'WeChat' }, { key:'line', label:'LINE' }] as const;
export const navigation = [
  {label:'Home', href:'/'}, {label:'About us',href:'/about/'},
  {label:'Our services',href:'/services/'}, {label:'Projects',href:'/projects/'},
  {label:'News',href:'/news/'}, {label:'Contact us',href:'/contact/'}
];
export const services = [
  { id:'exhibition', number:'01', title:'Exhibition Design & Construction', short:'Exhibition', thai:'ออกแบบและก่อสร้างบูธ', image:'pavilion', alt:'White and oak exhibition pavilion with sculptural timber fins and soft blue lighting', description:'Distinctive spaces that bring your brand to life designed, fabricated and delivered by our own team across 4 in-house production facilities.', detail:'พื้นที่จัดแสดงที่ถ่ายทอดแบรนด์ของคุณ ตั้งแต่แนวคิดและงานออกแบบ 3 มิติ ไปจนถึงการผลิตและติดตั้งจริง โดยทีมของเราเองผ่าน 4 โรงงานผลิต', includes:['Spatial strategy & 3D design','In-house production across 4 factories','Installation & final handover'] },
  { id:'event', number:'02', title:'Event Organizer', short:'Event production', thai:'งานอีเวนท์ครบวงจร', image:'event', alt:'Contemporary corporate event stage illuminated with dramatic blue lighting', description:'Thoughtfully coordinated events, designed around the experience. We connect the creative concept, environment and production details.', detail:'ดูแลภาพรวมของงานอีเวนท์ เชื่อมต่อแนวคิดสร้างสรรค์ พื้นที่ และรายละเอียดการผลิตให้เป็นประสบการณ์เดียวกัน', includes:['Creative concept & planning','Stage & event environments','Production coordination'] },
  { id:'construction', number:'03', title:'Project Consulting', short:'Project consulting', thai:'ให้คำปรึกษา ประสานงาน และแก้ไขปัญหาหน้างาน เพื่อให้งานดำเนินไปตามแผน', image:'construction', alt:'Modern structural steel and concrete building during construction', description:'A considered approach to construction, with a focus on practical details, material quality and clear coordination from start to finish.', detail:'ใส่ใจคุณภาพวัสดุ รายละเอียดหน้างาน และการประสานงานทุกขั้นตอน เพื่อเปลี่ยนแบบให้กลายเป็นพื้นที่ใช้งานจริง', includes:['Project planning','Construction coordination','Quality review & handover'] },
  { id:'lighting', number:'04', title:'Lighting & Sound Systems', short:'Lighting & sound', thai:'บริการระบบแสง สี เสียง ครบวงจร', image:'lighting', alt:'Professional lighting truss projecting precise cobalt beams across an event space', description:'Light, sound and atmosphere, working together. Technical production that supports the story and makes every moment feel intentional.', detail:'ผสานแสง เสียง และบรรยากาศให้เข้ากับเรื่องราวของงาน พร้อมดูแลการติดตั้งและควบคุมระบบ', includes:['Lighting concept','Sound system planning','Technical setup & operation'] },
  { id:'interior', number:'05', title:'Transportation & Tours', short:'Transportation & tours', thai:'บริการด้านการเดินทางและทัวร์ที่สะดวก ราบรื่น และครบวงจร', image:'interior', alt:'Refined interior showroom with natural stone display plinths and warm oak surfaces', description:'Seamless travel, thoughtfully arranged.\nFrom airport transfers and private transportation to customized tours, we take care of every detail for a smooth and comfortable journey.', detail:'ดูแลทุกการเดินทางอย่างครบถ้วน\nตั้งแต่บริการรับ–ส่งสนามบิน รถรับส่งส่วนตัว ไปจนถึงการจัดทริปและโปรแกรมท่องเที่ยว พร้อมดูแลและประสานงานตลอดการเดินทาง', includes:['Airport Transfer & Transportation','Private & Group Transportation','Customized Tours & Travel Coordination'] },
];
/** Per-service extras for the services page: Thai lines under the list items and the button label. */
export const serviceExtras: Record<string, {includesThai?: string[]; cta?: string}> = {
  interior: { includesThai:['บริการรับ–ส่งสนามบินและการเดินทาง','บริการรถรับส่งแบบส่วนตัวและแบบกลุ่ม','จัดโปรแกรมท่องเที่ยวและประสานงานการเดินทาง'], cta:'Plan your journey' },
};
export const projects = [
  { slug:'the-open-pavilion', title:'The Open Pavilion', category:'Exhibition design', image:'pavilion', size:'Spatial concept', description:'A welcoming exhibition environment shaped by rhythmic timber fins, a floating canopy and open sightlines. Warm materials meet precise blue accents.' },
  { slug:'blue-horizon', title:'Blue Horizon', category:'Brand experience', image:'pavilion-blue', size:'Spatial concept', description:'An architectural study in clarity and scale. A bold suspended frame connects meeting spaces, display zones and a strong presence across the exhibition floor.' },
  { slug:'living-canopy', title:'Living Canopy', category:'Exhibition design', image:'pavilion-green', size:'Spatial concept', description:'A circular pavilion explores a softer way to gather. Layered planting, timber and a curved white canopy create a calm pause within a busy hall.' },
  { slug:'a-moment-in-blue', title:'A Moment in Blue', category:'Event production', image:'event', size:'Event concept', description:'A study of atmosphere and focus for a contemporary corporate launch. A restrained lighting language gives the stage a strong, memorable identity.' },
  { slug:'material-dialogue', title:'Material Dialogue', category:'Interior & display', image:'interior', size:'Interior concept', description:'A quiet showroom concept built around honest materials, sculptural display elements and a clear path through the space.' },
  { slug:'structure-and-light', title:'Structure & Light', category:'Construction', image:'construction', size:'Architectural concept', description:'A visual exploration of the transition from structure to space, with steel, concrete and daylight expressing the logic of the build.' },
];
/**
 * Real booth photography from the TIME SERVICE PROFILES album (public/images/profiles, photos in
 * lib/profiles.ts). Listed first on the home and projects pages; it is a photo archive, not a concept.
 */
export const profileProject = { slug:'time-service-profiles', title:'TIME SERVICE PROFILES', category:'Professional Experience', image:'profiles/p-001', size:'Photo archive', description:'Exhibition stands from the TIME SERVICE profile, gathered in one archive and shown in album order.', kind:'profile' as const };
export type ProjectEntry = (typeof projects)[number] & { kind?: 'profile' };
/**
 * The six project patterns on the home and projects pages, named as edited on the canvas.
 * The concept pages behind them show the same names; `projects` keeps the original concept titles.
 */
const patternNames: Record<string, { title: string; category: string }> = {
  'time-service-profiles': { title:'TIME SERVICE PROFILES', category:'Professional Experience' },
  'blue-horizon': { title:'3D Model Designs', category:'Interactive design collection' },
  'living-canopy': { title:'Systems & Pavilions', category:'Exhibition design' },
  'a-moment-in-blue': { title:'Event Organizer', category:'Event production' },
  'material-dialogue': { title:'Displays & Pop-Ups', category:'Creative Branding' },
  'structure-and-light': { title:'Vehicles & Tour', category:'Service Journey' },
};
export const projectPatterns: ProjectEntry[] = [profileProject, ...projects].filter(p => p.slug in patternNames).map(p => ({ ...p, ...patternNames[p.slug] }));
/** A project as it is shown on the site: its pattern name when it has one. */
export const displayProject = (p: ProjectEntry): ProjectEntry => patternNames[p.slug] ? { ...p, ...patternNames[p.slug] } : p;
export const steps = [
  { title:'Consult', thai:'ปรึกษาความต้องการ', copy:'Every great space begins with a conversation.' },
  { title:'Design', thai:'ออกแบบแนวคิด 3D', copy:'Shape the idea. See the possibilities.' },
  { title:'Production', thai:'ผลิตและเตรียมงาน', copy:'Fabrication, finishing and preparation, managed in-house across our four factories.' },
  { title:'Installation', thai:'ติดตั้งหน้างาน', copy:'From the workshop to the real world.' },
  { title:'Completion', thai:'ส่งมอบงาน', copy:'Your vision, ready for its moment.' },
];
