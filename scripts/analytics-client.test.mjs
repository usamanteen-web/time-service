import {test} from 'node:test';
import assert from 'node:assert/strict';
import {company, people, services, projects, profileProject, steps, displayProject, projectPatterns, navigation} from '../lib/content.ts';
import {detectLang, greeting, matchIntent, menuActions, reply, replyFor} from '../lib/chatbot.ts';
import {classifyLink} from '../lib/track-classify.ts';

const projectHref = (slug) => (slug === 'blue-horizon' ? '/projects/3d-model-designs/' : `/projects/${slug}/`);
const sales = people.find((person) => /sales/i.test(person.role));
const data = {
  company,
  services: services.map(({id, title, short, thai, description, detail, includes}) => ({id, title, short, thai, description, detail, includes})),
  projects: projectPatterns.map((project) => ({title: project.title, href: projectHref(project.slug)})),
  steps,
  sales,
};

test('language detection follows the script the visitor types in', () => {
  assert.equal(detectLang('ราคาเท่าไหร่'), 'th');
  assert.equal(detectLang('how much'), 'en');
  assert.equal(detectLang('12345', 'th'), 'th');
  assert.equal(detectLang('12345', 'en'), 'en');
});

const cases = [
  ['ราคาบูธเท่าไหร่', 'quote'],
  ['how much for a 6x3 booth', 'quote'],
  ['อยากดูผลงาน', 'projects'],
  ['show me your portfolio', 'projects'],
  ['ที่อยู่บริษัท', 'location'],
  ['where is your office', 'location'],
  ['เบอร์โทรติดต่อ', 'contact'],
  ['what is your line id', 'contact'],
  ['ติดต่อฝ่ายขาย', 'human'],
  ['I want to talk to a real person', 'human'],
  ['รับจัดอีเวนท์ไหม', 'service:event'],
  ['มีบริการแสงสีเสียงไหม', 'service:lighting'],
  ['do you do airport transfer', 'service:interior'],
  ['รับออกแบบบูธงานแสดงสินค้าไหม', 'service:exhibition'],
  ['we need an exhibition stand design', 'service:exhibition'],
  ['คุมงานหน้างานได้ไหม', 'service:construction'],
  ['what services do you offer', 'services'],
  ['ขั้นตอนการทำงานเป็นยังไง', 'process'],
  ['timeline please', 'process'],
  ['ผลิตเองที่โรงงานไหม', 'factory'],
  ['ขอบคุณครับ', 'thanks'],
  ['thanks a lot', 'thanks'],
  ['สวัสดีครับ', 'greeting'],
  ['hello', 'greeting'],
  ['hi there', 'greeting'],
  ['สวัสดีครับ ราคาบูธเท่าไหร่', 'quote'],
  ['ทำบูธงานแสดงสินค้าราคาเท่าไหร่', 'quote'],
  ['รับจัดอีเวนท์ งบประมาณประมาณเท่าไหร่', 'quote'],
  ['how much does an exhibition stand cost', 'quote'],
  ['price for lighting and sound', 'quote'],
  ['ขอคุยกับฝ่ายขายเรื่องบูธ', 'human'],
  ['อยากดูผลงานของบริษัทหน่อย', 'projects'],
  ['งบประมาณประมาณ 100000', 'quote'],
  ['vancouver office address', 'location'],
  ['we led the exhibition stand design', 'service:exhibition'],
  ['lighting', 'service:lighting'],
  ['led screen', 'service:lighting'],
  ['van rental', 'service:interior'],
  ['บริษัทรับทำบูธงาน Gem Fair ไหม', 'service:exhibition'],
  ['รับออกแบบ 3 มิติไหม', 'service:exhibition'],
  ['do you do 3D design', 'service:exhibition'],
  ['ขอข้อมูลบริษัทหน่อย', 'about'],
  ['my company needs a booth', 'service:exhibition'],
  ['high quality?', null],
  ['asdf qwer', null],
  ['', null],
];
for (const [input, expected] of cases) {
  test(`intent: "${input}" -> ${expected}`, () => assert.equal(matchIntent(input), expected));
}

test('every intent produces a usable reply built from site content only', () => {
  const intents = ['greeting', 'services', 'projects', 'quote', 'contact', 'human', 'location', 'process', 'factory', 'about', 'thanks', 'bye', 'unmatched', ...services.map((service) => `service:${service.id}`)];
  for (const lang of ['th', 'en']) {
    for (const intent of intents) {
      const answer = replyFor(intent, data, lang);
      assert.ok(answer.text.length > 5, `${intent}/${lang} has text`);
      assert.equal(answer.lang, lang);
      assert.doesNotMatch(answer.text, /บาท|฿|\$|THB|USD|\d+\s?%/, `${intent}/${lang} must not state prices or percentages`);
      for (const action of answer.actions) {
        assert.ok(action.label, 'action has a label');
        assert.ok(action.intent || action.href, 'action does something');
        if (action.href) assert.match(action.href, /^(\/|https?:\/\/|tel:|mailto:)/);
        if (action.intent && action.intent !== 'greeting') assert.notEqual(replyFor(action.intent, data, lang).intent, 'unmatched', `${action.intent} is a real intent`);
      }
    }
  }
});

test('answers quote the real site data', () => {
  assert.match(replyFor('location', data, 'en').text, new RegExp(company.address.slice(0, 20)));
  const contact = replyFor('contact', data, 'th');
  assert.match(contact.text, new RegExp(sales.email.replace('.', '\\.')));
  assert.ok(contact.actions.some((action) => action.href === sales.chat.line));
  const process = replyFor('process', data, 'en').text;
  for (const step of steps) assert.ok(process.includes(step.title) && process.includes(step.copy));
  for (const service of services) assert.ok(replyFor('services', data, 'en').text.includes(service.title));
  assert.equal(replyFor('projects', data, 'en').actions.filter((action) => action.href.startsWith('/projects/')).length, data.projects.length + 1);
  assert.equal(data.projects.length, 6);
});

test('quote opens the lead form and unmatched falls back to menu plus lead form', () => {
  assert.equal(replyFor('quote', data, 'th').form, 'quote');
  const fallback = reply('xyzzy', data, 'en');
  assert.equal(fallback.intent, 'unmatched');
  assert.ok(fallback.actions.some((action) => action.intent === 'quote'));
  assert.equal(greeting(data, 'en').actions.length, menuActions('en').length);
});

const ctx = {
  host: 'www.timeservices.co',
  pages: Object.fromEntries(navigation.map((item) => [item.href, item.label])),
  projects: Object.fromEntries([profileProject, ...projects].map((project) => [projectHref(project.slug), displayProject(project).title])),
  services: Object.fromEntries(services.map((service) => [service.id, service.title])),
  news: {'the-open-pavilions': 'The Open Pavilions'},
  bySlug: Object.fromEntries([profileProject, ...projects].map((project) => [project.slug, displayProject(project).title])),
};
const link = (href) => { const url = new URL(href, 'https://www.timeservices.co/'); return {protocol: url.protocol, hostname: url.hostname, pathname: url.pathname, hash: url.hash}; };
const classify = (href, quote = false) => classifyLink(link(href), ctx, quote);

test('click classification: projects use the visible pattern names', () => {
  assert.deepEqual(classify('/projects/3d-model-designs/'), {category: 'project', item: '3D Model Designs'});
  assert.deepEqual(classify('/projects/a-moment-in-blue/'), {category: 'project', item: 'Event Organizer'});
  assert.deepEqual(classify('/projects/time-service-profiles/'), {category: 'project', item: 'TIME SERVICE PROFILES'});
  assert.deepEqual(classify('/projects'), {category: 'page', item: 'Projects'});
});

test('click classification: services, news, pages and contact', () => {
  assert.deepEqual(classify('/services/#event'), {category: 'service', item: 'Event Organizer'});
  assert.deepEqual(classify('/services/'), {category: 'page', item: 'Our services'});
  assert.deepEqual(classify('/news/the-open-pavilions/'), {category: 'news', item: 'The Open Pavilions'});
  assert.deepEqual(classify('/news/#blue-horizon'), {category: 'news', item: '3D Model Designs'});
  assert.deepEqual(classify('/about'), {category: 'page', item: 'About us'});
  assert.deepEqual(classify('/contact/'), {category: 'contact', item: 'Contact page'});
  assert.deepEqual(classify('/contact/', true), {category: 'contact', item: 'Get a Quote'});
  assert.deepEqual(classify('https://timeservices.co/about/'), {category: 'page', item: 'About us'});
});

test('click classification: contact channels and external links', () => {
  assert.deepEqual(classify('mailto:a@b.co'), {category: 'contact', item: 'Email'});
  assert.deepEqual(classify('tel:+66867933023'), {category: 'contact', item: 'Phone'});
  assert.deepEqual(classify(sales.chat.line), {category: 'contact', item: 'LINE'});
  assert.deepEqual(classify(sales.chat.whatsapp), {category: 'contact', item: 'WhatsApp'});
  assert.deepEqual(classify(sales.chat.wechat), {category: 'contact', item: 'WeChat'});
  assert.deepEqual(classify('https://wa.me/66661124227'), {category: 'contact', item: 'WhatsApp'});
  assert.deepEqual(classify(company.mapsHref), {category: 'contact', item: 'Google Maps'});
  assert.deepEqual(classify('https://www.example.com/x'), {category: 'external', item: 'example.com'});
  assert.equal(classify('javascript:void(0)'), null);
});
