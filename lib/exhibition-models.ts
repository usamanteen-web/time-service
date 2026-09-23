export type ModelView = { id:string; label:string; title:string; description:string; target:string; orbit:string; fov:string };
export const exhibitionModels = [
  {id:'hilong-detailed',name:'HILONG',code:'B103',area:'10.5 × 10 m',poster:'/images/hilong-detailed-poster.jpg',size:'22.6 MB',views:[
    {id:'overview',label:'Overview',title:'Every detail, in perspective.',description:'Curved fascia, illuminated graphics and a complete exhibition space.',target:'0m 3.4m 0m',orbit:'-36deg 68deg 90%',fov:'37deg'},
    {id:'reception',label:'Reception',title:'A sculpted first impression.',description:'Layered reception counter, curved media screen and touch displays.',target:'-1.1m 2.1m 3.15m',orbit:'-24deg 78deg 10.5m',fov:'42deg'},
    {id:'inside',label:'Inside',title:'Step into the space.',description:'Explore the furniture, presentation screens and glass meeting area.',target:'1.9m 1.72m -0.95m',orbit:'-26.8deg 85.48deg 5.45m',fov:'48deg'},
    {id:'meeting',label:'Meeting room',title:'Designed for conversation.',description:'Timber finishes, meeting furniture and the exhibition graphics.',target:'4.2m 1.05m 0.25m',orbit:'-42.74deg 56.02deg 2.594m',fov:'55deg'},
    {id:'structure',label:'Structure',title:'The architecture overhead.',description:'Suspended identity, detailed trusses, fixtures and rigging.',target:'0m 7.15m 0m',orbit:'-36deg 64deg 18m',fov:'37deg'},
  ] satisfies ModelView[]},
  {id:'jiuli-detailed',name:'JIULI',code:'R110',area:'8.5 × 6 m',poster:'/images/jiuli-detailed-poster.jpg',size:'14.4 MB',views:[
    {id:'overview',label:'Overview',title:'Every detail, in perspective.',description:'Curved identity, graphic walls and a fully furnished exhibition space.',target:'0m 2.55m 0m',orbit:'31deg 67deg 90%',fov:'37deg'},
    {id:'reception',label:'Reception',title:'Crafted down to the counter.',description:'Circular openings, illuminated lines and dimensional branding.',target:'2.95m 0.8m 2.3m',orbit:'36.21deg 69.46deg 3.71m',fov:'45deg'},
    {id:'inside',label:'Inside',title:'Step into the space.',description:'Meeting tables, chairs, brochure stands and graphic panels.',target:'-1.1m 1.72m -1.25m',orbit:'26.33deg 86.51deg 5.42m',fov:'48deg'},
    {id:'products',label:'Product display',title:'Materials, up close.',description:'Metal samples, display surfaces and the layered counter construction.',target:'-1.75m 0.9m 1.8m',orbit:'-15deg 67deg 4.5m',fov:'45deg'},
    {id:'structure',label:'Structure',title:'The architecture overhead.',description:'Twin curved signs, suspension cables, trusses and spotlights.',target:'0m 5.1m 0m',orbit:'31deg 64deg 13m',fov:'37deg'},
  ] satisfies ModelView[]},
];
