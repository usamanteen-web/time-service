export type Lang = 'th' | 'en';

export type BotData = {
  company: { name: string; phone: string; phoneHref: string; address: string; mapsHref: string };
  services: { id: string; title: string; short: string; thai: string; description: string; detail: string; includes: string[] }[];
  projects: { title: string; href: string }[];
  steps: { title: string; thai: string; copy: string }[];
  sales: { name: string; role: string; phone: string; tel: string; email: string; chat: { whatsapp: string; wechat: string; line: string }; label?: { th: string; en: string } };
};

export type BotAction = { label: string; intent?: string; href?: string; external?: boolean };

export type BotReply = { intent: string; lang: Lang; text: string; actions: BotAction[]; form?: 'quote' };

type Rule = { intent: string; th: string[]; en: string[] };

// Order matters: on equal scores the earlier rule wins, so specific intents come before generic ones.
const RULES: Rule[] = [
  { intent: 'human', th: ['คุยกับคน', 'คุยกับพนักงาน', 'เจ้าหน้าที่', 'พนักงาน', 'ฝ่ายขาย', 'เซลล์', 'ทีมงาน', 'ติดต่อกลับ', 'โทรกลับ'], en: ['human', 'real person', 'agent', 'sales', 'staff', 'call me', 'your team'] },
  { intent: 'quote', th: ['ใบเสนอราคา', 'เสนอราคา', 'ราคา', 'ค่าใช้จ่าย', 'ค่าบริการ', 'เท่าไหร่', 'เท่าไร', 'กี่บาท', 'ประเมิน', 'งบประมาณ'], en: ['quote', 'quotation', 'price', 'pricing', 'cost', 'budget', 'how much', 'estimate'] },
  { intent: 'contact', th: ['ติดต่อ', 'เบอร์', 'โทร', 'ไลน์', 'วอทส์แอป', 'วีแชท', 'อีเมล', 'line', 'whatsapp', 'wechat', 'email'], en: ['contact', 'phone', 'call', 'email', 'e-mail', 'line', 'whatsapp', 'wechat', 'reach you'] },
  { intent: 'location', th: ['ที่อยู่', 'ที่ตั้ง', 'แผนที่', 'อยู่ที่ไหน', 'อยู่ไหน', 'เดินทางมา', 'ไปยังไง', 'บางพลี', 'สมุทรปราการ'], en: ['address', 'location', 'map', 'where are', 'where is', 'directions', 'office'] },
  { intent: 'projects', th: ['ผลงาน', 'ตัวอย่างงาน', 'งานที่ผ่านมา', 'ดูงาน', 'พอร์ต', 'โปรเจกต์', 'โปรเจค'], en: ['project', 'portfolio', 'past work', 'our work', 'your work', 'example', 'gallery', 'showcase'] },
  { intent: 'process', th: ['ขั้นตอน', 'กระบวนการ', 'ระยะเวลา', 'กี่วัน', 'นานไหม', 'ทำงานยังไง', 'เริ่มยังไง'], en: ['process', 'steps', 'timeline', 'how long', 'how does it work', 'how do you work', 'lead time', 'workflow'] },
  { intent: 'factory', th: ['โรงงาน', 'ผลิตเอง'], en: ['factory', 'factories', 'manufactur', 'in-house', 'fabricat'] },
  { intent: 'about', th: ['เกี่ยวกับบริษัท', 'ข้อมูลบริษัท', 'ประวัติบริษัท', 'คือใคร', 'เป็นใคร', 'ประวัติ'], en: ['about you', 'about the company', 'about your company', 'company profile', 'who are you', 'history'] },
  { intent: 'service:exhibition', th: ['ออกแบบบูธ', 'บูธ', 'นิทรรศการ', 'งานแสดงสินค้า', 'เอ็กซิบิชั่น', 'แสดงสินค้า', 'ก่อสร้างบูธ', '3 มิติ', '3มิติ', 'สามมิติ'], en: ['booth', 'stand', 'exhibition', 'pavilion', 'trade show', 'tradeshow', 'expo', '3d'] },
  { intent: 'service:event', th: ['อีเวนท์', 'อีเวนต์', 'จัดงาน', 'งานเปิดตัว', 'สัมมนา', 'เวที'], en: ['event', 'organizer', 'organiser', 'launch', 'stage', 'conference', 'seminar'] },
  { intent: 'service:construction', th: ['ที่ปรึกษา', 'ให้คำปรึกษา', 'คุมงาน', 'หน้างาน', 'ประสานงาน'], en: ['consult', 'advice', 'coordinat', 'on-site', 'site problem'] },
  { intent: 'service:lighting', th: ['แสงสีเสียง', 'ระบบไฟ', 'แสง', 'เสียง', 'ลำโพง', 'ไมค์'], en: ['lighting', 'light', 'sound', 'audio', 'speaker', 'led'] },
  { intent: 'service:interior', th: ['สนามบิน', 'รถรับส่ง', 'รถตู้', 'ทัวร์', 'ท่องเที่ยว', 'เดินทาง', 'รับส่ง', 'ทริป'], en: ['transport', 'tour', 'airport', 'transfer', 'travel', 'trip', 'van'] },
  { intent: 'services', th: ['รับทำอะไร', 'ทำอะไรบ้าง', 'มีอะไรบ้าง', 'บริการ'], en: ['service', 'what do you do', 'what can you', 'offer', 'provide', 'capabilit'] },
];

const THAI = /[฀-๿]/;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function detectLang(text: string, fallback: Lang = 'th'): Lang {
  if (THAI.test(text)) return 'th';
  return /[a-z]/i.test(text) ? 'en' : fallback;
}

function hits(text: string, keyword: string): boolean {
  if (THAI.test(keyword)) return text.includes(keyword);
  // Short Latin words must match whole words ("van" must not match "vancouver"); longer ones may carry a suffix.
  const end = keyword.length <= 3 ? '([^a-z]|$)' : '';
  return new RegExp(`(^|[^a-z])${escapeRegExp(keyword)}${end}`).test(text);
}

export function matchIntent(input: string): string | null {
  const text = input.toLowerCase().trim();
  if (!text) return null;
  let best: { intent: string; score: number } | null = null;
  const scores: Record<string, number> = {};
  for (const rule of RULES) {
    let score = 0;
    for (const keyword of [...rule.th, ...rule.en]) if (hits(text, keyword)) score += keyword.length >= 5 ? 2 : 1;
    scores[rule.intent] = score;
    if (score > 0 && (!best || score > best.score)) best = { intent: rule.intent, score };
  }
  // A question about price is always a quote request, even when it also names a service ("how much for a booth").
  if (scores.quote > 0 && scores.quote > (scores.human ?? 0)) return 'quote';
  if (best) return best.intent;
  if (/ขอบคุณ|ขอบใจ|thank|thx/.test(text)) return 'thanks';
  if (/^(บาย|ลาก่อน|bye|goodbye)/.test(text)) return 'bye';
  if (text.length <= 30 && /^(สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|ดีจ้า|hello|hi\b|hey\b|good (morning|afternoon|evening))/.test(text)) return 'greeting';
  return null;
}

// Thai replies are written with ครับ/ผม. The widget calls setVoice(chatbotConfig.voice) so the mascot
// speaks with her own particles; without it the bot keeps the original wording.
export type Voice = { particle: string; question: string; pronoun: string };
let currentVoice: Voice = { particle: 'ครับ', question: 'ครับ', pronoun: 'ผม' };
export function setVoice(next: Voice) { currentVoice = next; }
export function voice(text: string, v: Voice = currentVoice): string {
  if (v.particle === 'ครับ') return text;
  return text.replace(/(ไหม|มั้ย|หรือเปล่า|ยังไง|อะไร)ครับ/g, `$1${v.question}`).replace(/ครับ/g, v.particle).replace(/ผม(?=[ก-๙])/g, v.pronoun);
}
const pick = (lang: Lang, th: string, en: string) => (lang === 'th' ? voice(th) : en);

export function menuActions(lang: Lang): BotAction[] {
  return [
    { label: pick(lang, 'บริการของเรา', 'Our services'), intent: 'services' },
    { label: pick(lang, 'ผลงาน', 'Projects'), intent: 'projects' },
    { label: pick(lang, 'ขอใบเสนอราคา', 'Request a quote'), intent: 'quote' },
    { label: pick(lang, 'ติดต่อ / ที่อยู่', 'Contact / location'), intent: 'contact' },
    { label: pick(lang, 'คุยกับทีมงาน', 'Talk to our team'), intent: 'human' },
  ];
}

function channelActions(data: BotData, lang: Lang): BotAction[] {
  const { chat } = data.sales;
  return [
    { label: 'LINE', href: chat.line, external: true },
    { label: 'WhatsApp', href: chat.whatsapp, external: true },
    { label: 'WeChat', href: chat.wechat, external: true },
    { label: pick(lang, `โทร ${data.sales.phone}`, `Call ${data.sales.phone}`), href: `tel:${data.sales.tel}`, external: true },
    { label: pick(lang, 'ส่งอีเมล', 'E-mail'), href: `mailto:${data.sales.email}`, external: true },
  ];
}

export function greeting(data: BotData, lang: Lang): BotReply {
  return {
    intent: 'greeting',
    lang,
    text: pick(
      lang,
      `สวัสดีครับ ยินดีต้อนรับสู่ ${data.company.name}\nเลือกหัวข้อด้านล่าง หรือพิมพ์คำถามได้เลยครับ`,
      `Hello, welcome to ${data.company.name}\nPick a topic below or type your question.`,
    ),
    actions: menuActions(lang),
  };
}

export function replyFor(intent: string, data: BotData, lang: Lang): BotReply {
  const done = (text: string, actions: BotAction[], form?: 'quote'): BotReply => ({ intent, lang, text, actions, form });

  if (intent === 'greeting') return greeting(data, lang);

  if (intent === 'services') {
    const list = data.services.map((service) => `• ${service.title}`).join('\n');
    return done(
      pick(lang, `เรามี ${data.services.length} บริการหลักครับ เลือกดูรายละเอียดได้เลย:\n${list}`, `We offer ${data.services.length} core services. Tap one for details:\n${list}`),
      [...data.services.map((service) => ({ label: service.short, intent: `service:${service.id}` })), { label: pick(lang, 'ดูหน้าบริการ', 'Open services page'), href: '/services/' }],
    );
  }

  if (intent.startsWith('service:')) {
    const service = data.services.find((item) => item.id === intent.slice('service:'.length));
    if (!service) return replyFor('unmatched', data, lang);
    const includes = service.includes.map((line) => `• ${line}`).join('\n');
    return done(
      pick(lang, `${service.title}\n${service.detail}\n\nรวมถึง:\n${includes}`, `${service.title}\n${service.description}\n\nIncludes:\n${includes}`),
      [
        { label: pick(lang, 'ขอใบเสนอราคา', 'Request a quote'), intent: 'quote' },
        { label: pick(lang, 'ดูรายละเอียดบนเว็บ', 'See details on the website'), href: `/services/#${service.id}` },
        { label: pick(lang, 'บริการอื่นๆ', 'Other services'), intent: 'services' },
      ],
    );
  }

  if (intent === 'projects') {
    return done(
      pick(lang, `ผลงานของเราแบ่งเป็น ${data.projects.length} หมวด เลือกดูได้เลยครับ:`, `Our work is grouped into ${data.projects.length} collections. Pick one to explore:`),
      [...data.projects.map((project) => ({ label: project.title, href: project.href })), { label: pick(lang, 'ดูผลงานทั้งหมด', 'All projects'), href: '/projects/' }],
    );
  }

  if (intent === 'quote') {
    return done(
      pick(
        lang,
        'ราคาขึ้นอยู่กับขนาดพื้นที่ รูปแบบบูธ วัสดุ และกำหนดงาน จึงยังบอกราคาตายตัวในแชทไม่ได้ครับ\nฝากรายละเอียดสั้นๆ (ชื่องาน ขนาดพื้นที่ วันที่) ทีมงานจะประเมินและติดต่อกลับครับ',
        "Pricing depends on the floor area, booth style, materials and schedule, so we can't give a fixed price in chat.\nLeave a few details (show name, size, dates) and our team will review them and get back to you.",
      ),
      [{ label: pick(lang, 'หรือแชทกับทีมโดยตรง', 'Or chat with the team directly'), intent: 'contact' }],
      'quote',
    );
  }

  if (intent === 'contact' || intent === 'human') {
    const { sales } = data;
    const intro = intent === 'human'
      ? pick(lang, 'ได้เลยครับ ติดต่อทีมงานโดยตรงได้ตามช่องทางด้านล่าง', 'Of course. You can reach our team directly below.')
      : pick(lang, 'ช่องทางติดต่อของเราครับ', 'Here is how to reach us.');
    return done(
      `${intro}\n${sales.label ? pick(lang, sales.label.th, sales.label.en) : sales.name} · ${sales.role}\n${pick(lang, 'โทร', 'Phone')} ${sales.phone}\n${pick(lang, 'อีเมล', 'E-mail')} ${sales.email}`,
      [
        ...channelActions(data, lang),
        { label: pick(lang, 'ฝากข้อมูลให้ติดต่อกลับ', 'Leave details for a call back'), intent: 'quote' },
        { label: pick(lang, 'หน้าติดต่อ', 'Contact page'), href: '/contact/' },
      ],
    );
  }

  if (intent === 'location') {
    return done(
      pick(lang, `ที่อยู่ของเรา\n${data.company.address}`, `Our address\n${data.company.address}`),
      [
        { label: pick(lang, 'เปิดแผนที่', 'Open map'), href: data.company.mapsHref, external: true },
        { label: pick(lang, 'หน้าติดต่อ', 'Contact page'), href: '/contact/' },
      ],
    );
  }

  if (intent === 'process') {
    const list = data.steps.map((step, index) => pick(lang, `${index + 1}. ${step.title} — ${step.thai}`, `${index + 1}. ${step.title} — ${step.copy}`)).join('\n');
    return done(
      pick(lang, `ขั้นตอนการทำงานของเรามี ${data.steps.length} ขั้นตอน:\n${list}\nระยะเวลาขึ้นอยู่กับขนาดและรูปแบบงานครับ`, `Our process has ${data.steps.length} steps:\n${list}\nTimelines depend on the size and style of the project.`),
      [{ label: pick(lang, 'ขอใบเสนอราคา', 'Request a quote'), intent: 'quote' }, { label: pick(lang, 'ผลงาน', 'Projects'), intent: 'projects' }],
    );
  }

  if (intent === 'factory') {
    const exhibition = data.services[0];
    return done(
      pick(lang, exhibition.detail, exhibition.description),
      [{ label: pick(lang, 'ขั้นตอนการทำงาน', 'Our process'), intent: 'process' }, { label: pick(lang, 'ผลงาน', 'Projects'), intent: 'projects' }],
    );
  }

  if (intent === 'about') {
    return done(
      pick(
        lang,
        `${data.company.name} ออกแบบและก่อสร้างบูธนิทรรศการ จัดงานอีเวนท์ และให้บริการที่เกี่ยวข้อง ตั้งอยู่ที่ จ.สมุทรปราการ ประเทศไทย`,
        `${data.company.name} designs and builds exhibition booths, produces events and offers related services, based in Samut Prakan, Thailand.`,
      ),
      [{ label: pick(lang, 'อ่านเรื่องราวของเรา', 'Read our story'), href: '/about/' }, ...menuActions(lang).slice(0, 2)],
    );
  }

  if (intent === 'thanks') return done(pick(lang, 'ยินดีครับ มีอะไรให้ช่วยอีกไหมครับ', 'You are welcome. Anything else I can help with?'), menuActions(lang));
  if (intent === 'bye') return done(pick(lang, 'ขอบคุณที่แวะมาครับ ยินดีให้บริการเสมอ', 'Thanks for stopping by. We are happy to help any time.'), []);

  return {
    intent: 'unmatched',
    lang,
    text: pick(
      lang,
      'ขออภัยครับ ผมยังไม่เข้าใจคำถามนี้ ลองเลือกหัวข้อด้านล่าง หรือฝากข้อมูลให้ทีมงานตอบกลับโดยตรงครับ',
      "Sorry, I didn't catch that. Pick a topic below or leave your details and our team will answer you directly.",
    ),
    actions: [...menuActions(lang).filter((action) => action.intent !== 'human'), { label: pick(lang, 'ฝากข้อมูลให้ติดต่อกลับ', 'Leave details for a call back'), intent: 'quote' }],
  };
}

export function reply(input: string, data: BotData, fallback: Lang = 'th'): BotReply {
  const lang = detectLang(input, fallback);
  return replyFor(matchIntent(input) ?? 'unmatched', data, lang);
}
