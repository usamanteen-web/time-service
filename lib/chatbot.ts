export type Lang = 'th' | 'en' | 'zh';
export const LANGS: Lang[] = ['th', 'en', 'zh'];

export type BotData = {
  company: { name: string; phone: string; phoneHref: string; address: string; mapsHref: string };
  services: { id: string; title: string; short: string; thai: string; description: string; detail: string; includes: string[] }[];
  projects: { title: string; href: string }[];
  steps: { title: string; thai: string; copy: string }[];
  sales: { name: string; role: string; phone: string; tel: string; email: string; chat: { whatsapp: string; wechat: string; line: string }; label?: { th: string; en: string; zh?: string } };
};

export type BotAction = { label: string; intent?: string; href?: string; external?: boolean };

export type BotReply = { intent: string; lang: Lang; text: string; actions: BotAction[]; form?: 'quote' };

type Rule = { intent: string; th: string[]; en: string[]; zh: string[] };

// Order matters: on equal scores the earlier rule wins, so specific intents come before generic ones.
const RULES: Rule[] = [
  { intent: 'human', th: ['คุยกับคน', 'คุยกับพนักงาน', 'เจ้าหน้าที่', 'พนักงาน', 'ฝ่ายขาย', 'เซลล์', 'ทีมงาน', 'ติดต่อกลับ', 'โทรกลับ'], en: ['human', 'real person', 'agent', 'sales', 'staff', 'call me', 'your team'], zh: ['人工', '真人', '客服', '销售', '业务员', '联系人', '回电', '打电话给我'] },
  { intent: 'quote', th: ['ใบเสนอราคา', 'เสนอราคา', 'ราคา', 'ค่าใช้จ่าย', 'ค่าบริการ', 'เท่าไหร่', 'เท่าไร', 'กี่บาท', 'ประเมิน', 'งบประมาณ'], en: ['quote', 'quotation', 'price', 'pricing', 'cost', 'budget', 'how much', 'estimate'], zh: ['报价', '价格', '多少钱', '费用', '预算', '估价', '收费', '价钱', '怎么收费'] },
  { intent: 'contact', th: ['ติดต่อ', 'เบอร์', 'โทร', 'ไลน์', 'วอทส์แอป', 'วีแชท', 'อีเมล', 'line', 'whatsapp', 'wechat', 'email'], en: ['contact', 'phone', 'call', 'email', 'e-mail', 'line', 'whatsapp', 'wechat', 'reach you'], zh: ['联系', '电话', '手机', '邮箱', '电邮', '微信', 'LINE', 'WhatsApp', '联络'] },
  { intent: 'location', th: ['ที่อยู่', 'ที่ตั้ง', 'แผนที่', 'อยู่ที่ไหน', 'อยู่ไหน', 'เดินทางมา', 'ไปยังไง', 'บางพลี', 'สมุทรปราการ'], en: ['address', 'location', 'map', 'where are', 'where is', 'directions', 'office'], zh: ['地址', '位置', '在哪', '地图', '办公室', '怎么去'] },
  { intent: 'projects', th: ['ผลงาน', 'ตัวอย่างงาน', 'งานที่ผ่านมา', 'ดูงาน', 'พอร์ต', 'โปรเจกต์', 'โปรเจค'], en: ['project', 'portfolio', 'past work', 'our work', 'your work', 'example', 'gallery', 'showcase'], zh: ['案例', '作品', '项目', '过往', '参考', '图片'] },
  { intent: 'process', th: ['ขั้นตอน', 'กระบวนการ', 'ระยะเวลา', 'กี่วัน', 'นานไหม', 'ทำงานยังไง', 'เริ่มยังไง'], en: ['process', 'steps', 'timeline', 'how long', 'how does it work', 'how do you work', 'lead time', 'workflow'], zh: ['流程', '步骤', '多久', '工期', '时间', '周期'] },
  { intent: 'factory', th: ['โรงงาน', 'ผลิตเอง'], en: ['factory', 'factories', 'manufactur', 'in-house', 'fabricat'], zh: ['工厂', '自己生产', '自有工厂', '生产'] },
  { intent: 'about', th: ['เกี่ยวกับบริษัท', 'ข้อมูลบริษัท', 'ประวัติบริษัท', 'คือใคร', 'เป็นใคร', 'ประวัติ'], en: ['about you', 'about the company', 'about your company', 'company profile', 'who are you', 'history'], zh: ['公司介绍', '关于你们', '你们是谁', '公司简介', '历史'] },
  { intent: 'service:exhibition', th: ['ออกแบบบูธ', 'บูธ', 'นิทรรศการ', 'งานแสดงสินค้า', 'เอ็กซิบิชั่น', 'แสดงสินค้า', 'ก่อสร้างบูธ', '3 มิติ', '3มิติ', 'สามมิติ'], en: ['booth', 'stand', 'exhibition', 'pavilion', 'trade show', 'tradeshow', 'expo', '3d'], zh: ['展台', '展位', '展览', '展会', '搭建', '特装', '3D', '展馆', '设计'] },
  { intent: 'service:event', th: ['อีเวนท์', 'อีเวนต์', 'จัดงาน', 'งานเปิดตัว', 'สัมมนา', 'เวที'], en: ['event', 'organizer', 'organiser', 'launch', 'stage', 'conference', 'seminar'], zh: ['活动', '发布会', '舞台', '会议', '研讨会', '晚会', '路演'] },
  { intent: 'service:construction', th: ['ที่ปรึกษา', 'ให้คำปรึกษา', 'คุมงาน', 'หน้างาน', 'ประสานงาน'], en: ['consult', 'advice', 'coordinat', 'on-site', 'site problem'], zh: ['咨询', '顾问', '现场', '协调', '监工'] },
  { intent: 'service:lighting', th: ['แสงสีเสียง', 'ระบบไฟ', 'แสง', 'เสียง', 'ลำโพง', 'ไมค์'], en: ['lighting', 'light', 'sound', 'audio', 'speaker', 'led'], zh: ['灯光', '音响', '音箱', '麦克风', 'LED', '屏幕'] },
  { intent: 'service:interior', th: ['สนามบิน', 'รถรับส่ง', 'รถตู้', 'ทัวร์', 'ท่องเที่ยว', 'เดินทาง', 'รับส่ง', 'ทริป'], en: ['transport', 'tour', 'airport', 'transfer', 'travel', 'trip', 'van'], zh: ['接送', '机场', '包车', '旅游', '交通', '用车', '大巴', '面包车'] },
  { intent: 'services', th: ['รับทำอะไร', 'ทำอะไรบ้าง', 'มีอะไรบ้าง', 'บริการ'], en: ['service', 'what do you do', 'what can you', 'offer', 'provide', 'capabilit'], zh: ['服务', '做什么', '业务', '提供'] },
];

const THAI = /[฀-๿]/;
const HAN = /[\u3400-\u9fff\uf900-\ufaff]/;
const KANA_HANGUL = /[\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af\u1100-\u11ff]/;
// Scripts the rule bot cannot answer in: they go to the AI translation route.
const OTHER_SCRIPT = /[\u0400-\u04ff\u0590-\u06ff\u0750-\u077f\u0900-\u0dff\u1000-\u109f\u1780-\u17ff\u0e80-\u0eff\u10a0-\u10ff\u0370-\u03ff]/;
// Latin letters with accents (é, ñ, ư, ş …) mean a Latin-script language other than English.
const ACCENTED_LATIN = /[\u00c0-\u024f\u1e00-\u1eff]/;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function detectLang(text: string, fallback: Lang = 'th'): Lang {
  if (THAI.test(text)) return 'th';
  if (HAN.test(text) && !KANA_HANGUL.test(text)) return 'zh';
  return /[a-z]/i.test(text) ? 'en' : fallback;
}

/**
 * What the widget should do with a typed message:
 * - 'th' | 'en' | 'zh': answer with the built-in bot in that language;
 * - 'other': a language the bot does not speak (Japanese, Korean, Russian, Vietnamese, French …) →
 *   ask the AI route to detect the language and translate the answer;
 * - 'en?': plain ASCII Latin that matched no English rule; may be Malay, Indonesian, Tagalog … →
 *   ask the AI route, which keeps English when it really is English.
 */
export function routeFor(text: string, fallback: Lang = 'th'): Lang | 'other' | 'en?' {
  const value = text.trim();
  if (!value) return fallback;
  if (THAI.test(value)) return 'th';
  if (KANA_HANGUL.test(value) || OTHER_SCRIPT.test(value)) return 'other';
  if (HAN.test(value)) return 'zh';
  if (ACCENTED_LATIN.test(value)) return 'other';
  if (!/[a-z]/i.test(value)) return fallback;
  return matchIntent(value) ? 'en' : 'en?';
}

function hits(text: string, keyword: string): boolean {
  if (THAI.test(keyword) || HAN.test(keyword)) return text.includes(keyword.toLowerCase());
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
    for (const keyword of [...rule.th, ...rule.en, ...rule.zh]) if (hits(text, keyword)) score += keyword.length >= 5 ? 2 : 1;
    scores[rule.intent] = score;
    if (score > 0 && (!best || score > best.score)) best = { intent: rule.intent, score };
  }
  // A question about price is always a quote request, even when it also names a service ("how much for a booth").
  if (scores.quote > 0 && scores.quote > (scores.human ?? 0)) return 'quote';
  if (best) return best.intent;
  if (/ขอบคุณ|ขอบใจ|thank|thx|谢谢|感谢|多谢|謝謝/.test(text)) return 'thanks';
  if (/^(บาย|ลาก่อน|bye|goodbye|再见|拜拜|再見)/.test(text)) return 'bye';
  if (text.length <= 30 && /^(สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|ดีจ้า|hello|hi\b|hey\b|good (morning|afternoon|evening)|你好|您好|嗨|早上好|下午好|晚上好|在吗)/.test(text)) return 'greeting';
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
const pick = (lang: Lang, th: string, en: string, zh: string) => (lang === 'th' ? voice(th) : lang === 'zh' ? zh : en);

const SERVICE_ZH: Record<string, { title: string; short: string; detail: string; includes: string[] }> = {
  exhibition: { title: '展台设计与搭建', short: '展台', detail: '从创意构思、3D设计到制作与现场搭建，全部由我们自己的团队通过4家自有工厂完成，打造展现品牌的展示空间。', includes: ['空间规划与3D设计', '4家自有工厂生产制作', '现场搭建与最终交付'] },
  event: { title: '活动策划执行', short: '活动执行', detail: '统筹活动全局，把创意概念、场地环境与制作细节整合为完整的体验。', includes: ['创意构思与策划', '舞台与活动场景', '制作统筹协调'] },
  construction: { title: '项目咨询', short: '项目咨询', detail: '提供咨询与协调，解决现场问题，注重材料品质与各环节沟通，确保项目按计划推进。', includes: ['项目规划', '施工协调', '质量检查与交付'] },
  lighting: { title: '灯光音响系统', short: '灯光音响', detail: '让灯光、音响与氛围配合活动主题，并负责设备安装与现场操控。', includes: ['灯光方案', '音响系统规划', '技术安装与现场操作'] },
  interior: { title: '交通与旅游服务', short: '交通旅游', detail: '全程安排出行：机场接送、私人及团体用车，到定制行程与旅游安排，并全程协调。', includes: ['机场接送与交通', '私人及团体用车', '定制旅游与行程协调'] },
};
const STEP_ZH: Record<string, string> = { Consult: '咨询需求', Design: '3D概念设计', Production: '生产与准备', Installation: '现场搭建', Completion: '交付验收' };

export function menuActions(lang: Lang): BotAction[] {
  return [
    { label: pick(lang, 'บริการของเรา', 'Our services', '我们的服务'), intent: 'services' },
    { label: pick(lang, 'ผลงาน', 'Projects', '案例'), intent: 'projects' },
    { label: pick(lang, 'ขอใบเสนอราคา', 'Request a quote', '索取报价'), intent: 'quote' },
    { label: pick(lang, 'ติดต่อ / ที่อยู่', 'Contact / location', '联系方式 / 地址'), intent: 'contact' },
    { label: pick(lang, 'คุยกับทีมงาน', 'Talk to our team', '联系我们的团队'), intent: 'human' },
  ];
}

function channelActions(data: BotData, lang: Lang): BotAction[] {
  const { chat } = data.sales;
  return [
    { label: 'LINE', href: chat.line, external: true },
    { label: 'WhatsApp', href: chat.whatsapp, external: true },
    { label: 'WeChat', href: chat.wechat, external: true },
    { label: pick(lang, `โทร ${data.sales.phone}`, `Call ${data.sales.phone}`, `致电 ${data.sales.phone}`), href: `tel:${data.sales.tel}`, external: true },
    { label: pick(lang, 'ส่งอีเมล', 'E-mail', '发邮件'), href: `mailto:${data.sales.email}`, external: true },
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
      `您好，欢迎来到 ${data.company.name}\n请选择下方的主题，或直接输入您的问题。`,
    ),
    actions: menuActions(lang),
  };
}

export function replyFor(intent: string, data: BotData, lang: Lang): BotReply {
  const done = (text: string, actions: BotAction[], form?: 'quote'): BotReply => ({ intent, lang, text, actions, form });

  if (intent === 'greeting') return greeting(data, lang);

  if (intent === 'services') {
    const list = data.services.map((service) => `• ${lang === 'zh' && SERVICE_ZH[service.id] ? `${SERVICE_ZH[service.id].title} (${service.title})` : service.title}`).join('\n');
    return done(
      pick(lang, `เรามี ${data.services.length} บริการหลักครับ เลือกดูรายละเอียดได้เลย:\n${list}`, `We offer ${data.services.length} core services. Tap one for details:\n${list}`, `我们提供 ${data.services.length} 项核心服务，点击查看详情：\n${list}`),
      [...data.services.map((service) => ({ label: lang === 'zh' && SERVICE_ZH[service.id] ? SERVICE_ZH[service.id].short : service.short, intent: `service:${service.id}` })), { label: pick(lang, 'ดูหน้าบริการ', 'Open services page', '查看服务页面'), href: '/services/' }],
    );
  }

  if (intent.startsWith('service:')) {
    const service = data.services.find((item) => item.id === intent.slice('service:'.length));
    if (!service) return replyFor('unmatched', data, lang);
    const includes = service.includes.map((line) => `• ${line}`).join('\n');
    const zhService = SERVICE_ZH[service.id];
    const zhText = zhService ? `${zhService.title} (${service.title})\n${zhService.detail}\n\n包括：\n${zhService.includes.map((line) => `• ${line}`).join('\n')}` : `${service.title}\n${service.description}`;
    return done(
      pick(lang, `${service.title}\n${service.detail}\n\nรวมถึง:\n${includes}`, `${service.title}\n${service.description}\n\nIncludes:\n${includes}`, zhText),
      [
        { label: pick(lang, 'ขอใบเสนอราคา', 'Request a quote', '索取报价'), intent: 'quote' },
        { label: pick(lang, 'ดูรายละเอียดบนเว็บ', 'See details on the website', '在网站上查看详情'), href: `/services/#${service.id}` },
        { label: pick(lang, 'บริการอื่นๆ', 'Other services', '其他服务'), intent: 'services' },
      ],
    );
  }

  if (intent === 'projects') {
    return done(
      pick(lang, `ผลงานของเราแบ่งเป็น ${data.projects.length} หมวด เลือกดูได้เลยครับ:`, `Our work is grouped into ${data.projects.length} collections. Pick one to explore:`, `我们的作品分为 ${data.projects.length} 个系列，请选择查看：`),
      [...data.projects.map((project) => ({ label: project.title, href: project.href })), { label: pick(lang, 'ดูผลงานทั้งหมด', 'All projects', '全部案例'), href: '/projects/' }],
    );
  }

  if (intent === 'quote') {
    return done(
      pick(
        lang,
        'ราคาขึ้นอยู่กับขนาดพื้นที่ รูปแบบบูธ วัสดุ และกำหนดงาน จึงยังบอกราคาตายตัวในแชทไม่ได้ครับ\nฝากรายละเอียดสั้นๆ (ชื่องาน ขนาดพื้นที่ วันที่) ทีมงานจะประเมินและติดต่อกลับครับ',
        "Pricing depends on the floor area, booth style, materials and schedule, so we can't give a fixed price in chat.\nLeave a few details (show name, size, dates) and our team will review them and get back to you.",
        '价格取决于面积、展台风格、材料和工期，所以无法在聊天中给出固定报价。\n请留下简单信息（展会名称、面积、日期），我们的团队会评估后尽快联系您。',
      ),
      [{ label: pick(lang, 'หรือแชทกับทีมโดยตรง', 'Or chat with the team directly', '或直接联系团队'), intent: 'contact' }],
      'quote',
    );
  }

  if (intent === 'contact' || intent === 'human') {
    const { sales } = data;
    const intro = intent === 'human'
      ? pick(lang, 'ได้เลยครับ ติดต่อทีมงานโดยตรงได้ตามช่องทางด้านล่าง', 'Of course. You can reach our team directly below.', '好的，您可以通过以下方式直接联系我们的团队。')
      : pick(lang, 'ช่องทางติดต่อของเราครับ', 'Here is how to reach us.', '我们的联系方式：');
    return done(
      `${intro}\n${sales.label ? pick(lang, sales.label.th, sales.label.en, sales.label.zh ?? sales.label.en) : sales.name} · ${sales.role}\n${pick(lang, 'โทร', 'Phone', '电话')} ${sales.phone}\n${pick(lang, 'อีเมล', 'E-mail', '邮箱')} ${sales.email}`,
      [
        ...channelActions(data, lang),
        { label: pick(lang, 'ฝากข้อมูลให้ติดต่อกลับ', 'Leave details for a call back', '留下信息，我们回电'), intent: 'quote' },
        { label: pick(lang, 'หน้าติดต่อ', 'Contact page', '联系页面'), href: '/contact/' },
      ],
    );
  }

  if (intent === 'location') {
    return done(
      pick(lang, `ที่อยู่ของเรา\n${data.company.address}`, `Our address\n${data.company.address}`, `我们的地址\n${data.company.address}`),
      [
        { label: pick(lang, 'เปิดแผนที่', 'Open map', '打开地图'), href: data.company.mapsHref, external: true },
        { label: pick(lang, 'หน้าติดต่อ', 'Contact page', '联系页面'), href: '/contact/' },
      ],
    );
  }

  if (intent === 'process') {
    const list = data.steps.map((step, index) => pick(lang, `${index + 1}. ${step.title} — ${step.thai}`, `${index + 1}. ${step.title} — ${step.copy}`, `${index + 1}. ${STEP_ZH[step.title] ?? step.title} (${step.title})`)).join('\n');
    return done(
      pick(lang, `ขั้นตอนการทำงานของเรามี ${data.steps.length} ขั้นตอน:\n${list}\nระยะเวลาขึ้นอยู่กับขนาดและรูปแบบงานครับ`, `Our process has ${data.steps.length} steps:\n${list}\nTimelines depend on the size and style of the project.`, `我们的工作流程共 ${data.steps.length} 步：\n${list}\n工期取决于项目的规模和形式。`),
      [{ label: pick(lang, 'ขอใบเสนอราคา', 'Request a quote', '索取报价'), intent: 'quote' }, { label: pick(lang, 'ผลงาน', 'Projects', '案例'), intent: 'projects' }],
    );
  }

  if (intent === 'factory') {
    const exhibition = data.services[0];
    return done(
      pick(lang, exhibition.detail, exhibition.description, SERVICE_ZH[exhibition.id]?.detail ?? exhibition.description),
      [{ label: pick(lang, 'ขั้นตอนการทำงาน', 'Our process', '工作流程'), intent: 'process' }, { label: pick(lang, 'ผลงาน', 'Projects', '案例'), intent: 'projects' }],
    );
  }

  if (intent === 'about') {
    return done(
      pick(
        lang,
        `${data.company.name} ออกแบบและก่อสร้างบูธนิทรรศการ จัดงานอีเวนท์ และให้บริการที่เกี่ยวข้อง ตั้งอยู่ที่ จ.สมุทรปราการ ประเทศไทย`,
        `${data.company.name} designs and builds exhibition booths, produces events and offers related services, based in Samut Prakan, Thailand.`,
        `${data.company.name} 专业从事展台设计与搭建、活动策划执行及相关服务，公司位于泰国北榄府（Samut Prakan）。`,
      ),
      [{ label: pick(lang, 'อ่านเรื่องราวของเรา', 'Read our story', '了解我们'), href: '/about/' }, ...menuActions(lang).slice(0, 2)],
    );
  }

  if (intent === 'thanks') return done(pick(lang, 'ยินดีครับ มีอะไรให้ช่วยอีกไหมครับ', 'You are welcome. Anything else I can help with?', '不客气！还有什么可以帮您的吗？'), menuActions(lang));
  if (intent === 'bye') return done(pick(lang, 'ขอบคุณที่แวะมาครับ ยินดีให้บริการเสมอ', 'Thanks for stopping by. We are happy to help any time.', '感谢您的光临，我们随时为您服务。'), []);

  return {
    intent: 'unmatched',
    lang,
    text: pick(
      lang,
      'ขออภัยครับ ผมยังไม่เข้าใจคำถามนี้ ลองเลือกหัวข้อด้านล่าง หรือฝากข้อมูลให้ทีมงานตอบกลับโดยตรงครับ',
      "Sorry, I didn't catch that. Pick a topic below or leave your details and our team will answer you directly.",
      '抱歉，我还不太明白这个问题。请选择下方的主题，或留下您的信息，我们的团队会直接回复您。',
    ),
    actions: [...menuActions(lang).filter((action) => action.intent !== 'human'), { label: pick(lang, 'ฝากข้อมูลให้ติดต่อกลับ', 'Leave details for a call back', '留下信息，我们回电'), intent: 'quote' }],
  };
}

export function reply(input: string, data: BotData, fallback: Lang = 'th'): BotReply {
  const lang = detectLang(input, fallback);
  return replyFor(matchIntent(input) ?? 'unmatched', data, lang);
}
