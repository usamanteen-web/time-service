export type StoryChapter = {
  eyebrow: string;
  title: string;
  body: string;
  viewIndex: number;
};

export type JournalArticle = {
  slug: string;
  category: string;
  title: string;
  image: string;
  cover?: { src: string; alt: string };
  intro: string;
  sections: { heading: string; body: string }[];
  modelId?: string;
  projectName?: string;
  subtitle?: string;
  focus?: string[];
  chapters?: StoryChapter[];
};

export const articles: JournalArticle[] = [
  {
    slug: 'the-open-pavilions',
    category: 'EXHIBITION DESIGN',
    title: 'The Open Pavilions',
    image: 'pavilion',
    cover: { src: '/images/catalog/models/korea-pavilion/03-standard-block-detail.webp', alt: 'Korea pavilion exhibition bays with shared overhead branding, product displays and meeting tables' },
    modelId: 'korea-pavilion',
    projectName: 'Korea Pavilions',
    subtitle: 'Many identities. One shared space.',
    intro: 'A pavilion brings individual exhibitors into a larger conversation. Explore how a shared architectural language, open circulation and a clear sense of arrival can connect an entire exhibition community.',
    focus: ['Shared identity', 'Open circulation', 'Individual presence'],
    chapters: [
      { eyebrow: '01 / THE COMPLETE PICTURE', title: 'A pavilion is more than a collection of stands.', body: 'Begin with the whole Korea Pavilions model. Read the outline, the shared frontage and the relationship between neighbouring spaces. The first design question is how these individual exhibitors can feel part of one place while retaining their own identity.', viewIndex: 0 },
      { eyebrow: '02 / A CLEAR ARRIVAL', title: 'Make the invitation easy to read.', body: 'At eye level, the pavilion needs to introduce itself before visitors reach a particular stand. Look at the entrances and the rhythm of the frontage: a shared visual language can guide people towards the group, while each exhibitor still has a recognisable place within it.', viewIndex: 1 },
      { eyebrow: '03 / THE PLAN FROM ABOVE', title: 'Leave room for discovery.', body: 'From above, the relationship between display areas and circulation becomes clearer. Follow the open routes through the model and notice where people might pause, approach a product or begin a conversation. A good pavilion gives the visitor choices without making the space feel uncertain.', viewIndex: 2 },
      { eyebrow: '04 / EVERY SIDE MATTERS', title: 'A complete experience, from every approach.', body: 'Continue around the back and opposite side. Exhibition architecture is encountered from several directions, so the quieter elevations deserve the same attention as the main arrival. This view helps reveal how the pavilion meets the surrounding hall and how the individual spaces connect.', viewIndex: 3 },
      { eyebrow: '05 / THE HUMAN SCALE', title: 'Find the details that bring it together.', body: 'Move closer to a display, a counter or a meeting area. These small elements shape the moment when a visitor becomes a guest. Use free exploration to rotate and zoom into the model, then return to the overview to see how each detail belongs to the larger composition.', viewIndex: 4 },
    ],
    sections: [
      { heading: 'One identity, many conversations', body: 'The strength of a pavilion lies in balance. Repeated architectural elements create recognition, while graphic areas, product displays and meeting settings give each participant its own voice. Designing these elements together makes the shared environment feel intentional.' },
      { heading: 'Design the journey as carefully as the stand', body: 'The view from an aisle, the first step inside and the space for a conversation are all part of the same design. Reviewing the model from above and at eye level helps connect the overall layout with the experience of the people using it.' },
    ],
  },
  {
    slug: 'double-decker-exhibition-stands',
    category: 'SPATIAL DESIGN',
    title: 'Double Decker Exhibition Stands',
    image: 'pavilion-blue',
    cover: { src: '/images/news/marun-double-decker.webp', alt: 'MARUN double-decker exhibition stand with blue graphic walls, upper meeting areas and reception counters' },
    modelId: 'marun',
    projectName: 'Marun',
    subtitle: 'A second level. A recognised design.',
    intro: 'The MARUN stand received a Best Design and Construction certificate. Explore its two-level architecture, from the welcoming exhibition floor to the upper meeting spaces, and discover how the design comes together.',
    focus: ['Two-level composition', 'Visitor journey', 'Meeting spaces'],
    chapters: [
      { eyebrow: '01 / THE COMPLETE PICTURE', title: 'Think beyond the footprint.', body: 'Start with the complete Marun stand and read the two levels together. The upper floor is part of the stand’s identity as well as its spatial programme. Its proportion, edges and relationship to the ground floor determine how the whole design is understood from the exhibition aisle.', viewIndex: 0 },
      { eyebrow: '02 / THE FIRST ENCOUNTER', title: 'Keep the ground floor welcoming.', body: 'The approach to a double-decker stand should make the public areas easy to recognise. Look at how the frontage introduces the space beneath the upper level, and how the entrance, displays and places to pause relate to one another. The first impression still happens at the visitor’s eye level.', viewIndex: 1 },
      { eyebrow: '03 / TWO LEVELS IN PLAN', title: 'Understand the space between destinations.', body: 'An elevated view reveals how the upper floor sits within the overall composition. Follow the circulation and consider how someone moves from an initial conversation to a more focused meeting. The connection between levels should feel like a natural continuation of the visitor journey.', viewIndex: 2 },
      { eyebrow: '04 / BEHIND THE FRONTAGE', title: 'Look at the complete architecture.', body: 'Turn around the model to study the opposite elevation and the depth of the stand. A second floor changes more than the silhouette: it creates layers, shaded areas and different views through the space. Reading all sides helps connect the dramatic front with the quieter working areas.', viewIndex: 3 },
      { eyebrow: '05 / A CLOSER PERSPECTIVE', title: 'Bring the experience back to people.', body: 'Zoom in to explore the relationship between furniture, edges and openings. A memorable stand must also feel comfortable at close range. Switch to free exploration to inspect the areas that interest you, and reset the view whenever you want to see the full composition again.', viewIndex: 4 },
    ],
    sections: [
      { heading: 'Best Design and Construction', body: 'MARUN received a Best Design and Construction certificate for its exhibition stand. The two-level composition brings brand presentation, reception and meeting spaces together. This recognition is part of the project story: carrying the architectural idea through to its built details.' },
      { heading: 'A change of pace within one stand', body: 'Different levels can support different kinds of conversation. A visible ground floor can welcome discovery, while a more enclosed setting can support longer discussions. The design challenge is to connect those experiences without losing the clarity of the whole stand.' },
      { heading: 'From spatial idea to a coordinated build', body: 'A double-decker concept also needs careful technical development. Access, structure, services and venue requirements must be reviewed together as the design progresses. The interactive model is a way to discuss the spatial idea; detailed coordination brings that idea into a buildable proposal.' },
    ],
  },
  {
    slug: 'hanging-structure',
    category: 'BRAND & STRUCTURE',
    title: 'Hanging Structure',
    image: 'hanging-structure',
    cover: { src: '/images/news/jiuli-hanging-structure.webp', alt: 'JIULI exhibition stand with twin curved suspended signs, overhead trusses and illuminated product displays' },
    modelId: 'jiuli-detailed',
    projectName: 'JIULI',
    subtitle: 'Presence above. Possibility below.',
    intro: 'An exhibition stand begins before a visitor reaches its edge. Explore the JIULI model to see how the overhead composition and the space below can create a recognisable presence across the hall.',
    focus: ['Overhead identity', 'Open sightlines', 'Connected composition'],
    chapters: [
      { eyebrow: '01 / THE COMPLETE PICTURE', title: 'Give the space a recognisable silhouette.', body: 'Begin with the JIULI stand as a whole. Notice the relationship between its upper elements and the floor-level architecture. An overhead composition can help define the stand from a distance, but it works best when the forms below continue the same visual story.', viewIndex: 0 },
      { eyebrow: '02 / THE VIEW FROM THE AISLE', title: 'Be visible without closing the space.', body: 'From the front, compare what draws the eye above with what welcomes the visitor below. A clear focal point and open sightlines help the stand communicate at different distances: first across the hall, then from the aisle, and finally during a conversation.', viewIndex: 1 },
      { eyebrow: '03 / THE OVERHEAD COMPOSITION', title: 'Read the layers from above.', body: 'The elevated view brings the upper composition and the stand layout into one frame. Look for the relationship between the perimeter, the focal areas and the open floor. This is where a strong graphic gesture becomes part of a complete spatial design.', viewIndex: 2 },
      { eyebrow: '04 / A PRESENCE ON EVERY SIDE', title: 'Follow the form around the stand.', body: 'Rotate to the opposite side and see how the upper elements appear from another approach. A crowded exhibition floor rarely offers one perfect viewpoint. Considering the full circuit helps the stand remain coherent as people move around it.', viewIndex: 3 },
      { eyebrow: '05 / THE CONNECTIONS', title: 'Let the details complete the idea.', body: 'Move closer to the relationship between the upper forms, the displays and the meeting areas. Explore freely to inspect the model’s layers, then zoom out to bring the full stand back into view. The strongest composition connects its distant silhouette with an engaging experience at ground level.', viewIndex: 4 },
    ],
    sections: [
      { heading: 'Designing the space above the stand', body: 'The upper part of an exhibition environment can contribute to recognition, orientation and atmosphere. Its shape, visual weight and placement should complement the stand below, so the overhead identity feels like part of the architecture.' },
      { heading: 'A visual idea with practical coordination', body: 'The final suspension and support strategy depends on the venue and the approved technical design. Rigging points, loads, clearances and installation access need specialist coordination. Reviewing the visual model early helps the design and production teams ask the right questions together.' },
    ],
  },
  {
    slug: 'a-better-exhibition-brief', category: 'PLANNING', title: 'A great space starts with a better brief', image: 'pavilion',
    intro: 'Before the first sketch, a few clear decisions can make the design process more focused.',
    sections: [
      { heading: 'Begin with the purpose', body: 'What should visitors understand, feel or do after entering the space? A product demonstration, a quiet meeting and a public launch each need a different layout.' },
      { heading: 'Share the practical details', body: 'Bring the floor plan, venue guidance, target dates, approximate budget and the products or activities the space needs to support. These details help the team develop a realistic direction.' },
      { heading: 'Think about the visitor journey', body: 'Consider how someone notices the space, enters it, finds what they need and speaks with your team. A clear journey helps the architecture and the experience work together.' },
    ],
  },
  {
    slug: 'materials-and-atmosphere', category: 'DESIGN NOTES', title: 'Material, light and a sense of place', image: 'interior',
    intro: 'A space is experienced through more than its shape. Surface, light and proportion all contribute to its character.',
    sections: [
      { heading: 'Give materials a purpose', body: 'Materials can frame a focal point, soften a meeting area or express the character of a brand. Begin with a small, coherent palette and use contrast deliberately.' },
      { heading: 'Design light with the space', body: 'Think about the difference between general illumination, accent lighting and the light needed for a specific task. Discuss these layers together with the layout and displays.' },
      { heading: 'Test the details early', body: 'Material samples, lighting references and visualisations make conversations more concrete. Reviewing them together helps clarify expectations before production.' },
    ],
  },
  {
    slug: 'from-design-to-installation', category: 'BEHIND THE PROCESS', title: 'From a drawing to opening day', image: 'team',
    intro: 'Turning an idea into a physical environment depends on shared information and careful coordination.',
    sections: [
      { heading: 'Agree on the design direction', body: 'A clear design review should connect the concept, layout, finishes and operational needs. Keep the decisions visible to everyone involved.' },
      { heading: 'Prepare for the venue', body: 'Coordinate access times, available services and the venue’s technical requirements before installation. Build these conditions into the production plan.' },
      { heading: 'Leave time for the final details', body: 'Allow time to review finishes, lighting, displays and the visitor route once the space is installed. The final walkthrough brings the design and its day-to-day use together.' },
    ],
  },
];

export const featuredArticles = articles.filter(article => article.modelId);

/** Use the same selected project image across featured, journal and related-story surfaces. */
export function journalCover(article: JournalArticle) {
  return article.cover ?? { src: `/images/${article.image}.jpg`, alt: `Design illustration for ${article.title}` };
}
