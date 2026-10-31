// Tests for the chatbot persona/config (lib/chatbot-config.ts) and how replies use it.
// Run: node --test scripts/chatbot-config.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, statSync} from 'node:fs';
import {company, people, services, projectPatterns, steps} from '../lib/content.ts';
import {chatbotConfig, stickerFor} from '../lib/chatbot-config.ts';
import {greeting, matchIntent, reply, replyFor, setVoice, voice} from '../lib/chatbot.ts';

setVoice(chatbotConfig.voice);

const pub = (src) => new URL(`../public${src}`, import.meta.url);
const data = {
  company,
  services,
  projects: projectPatterns.map((p) => ({title: p.title, href: `/projects/${p.slug}/`})),
  steps,
  sales: people.find((p) => /sales/i.test(p.role)) ?? people[0],
};

test('avatar and every configured sticker file exists and is small enough for a chat bubble', () => {
  for (const src of [chatbotConfig.avatar, chatbotConfig.avatarLarge]) {
    assert.ok(existsSync(pub(src)), src);
    assert.ok(statSync(pub(src)).size < 40_000, `${src} too large`);
  }
  for (const key of new Set(Object.values(chatbotConfig.stickers))) {
    const src = `${chatbotConfig.stickerDir}${key}.webp`;
    assert.ok(existsSync(pub(src)), src);
    assert.ok(statSync(pub(src)).size < 60_000, `${src} too large`);
    assert.ok(chatbotConfig.stickerAlt[key], `alt text for ${key}`);
  }
});

test('sticker map only names intents the bot really produces', () => {
  const known = new Set(['greeting', 'quote', 'projects', 'services', 'process', 'factory', 'about', 'human', 'contact',
    'thanks', 'bye', 'unmatched', 'location', 'lead_ok']);
  for (const intent of Object.keys(chatbotConfig.stickers)) assert.ok(known.has(intent), `unknown intent ${intent}`);
});

test('each customer message gets the right answer and sticker', () => {
  const cases = [
    ['สวัสดีค่ะ', 'greeting', 'hello'],
    ['hello', 'greeting', 'hello'],
    ['ราคาบูธ 36 ตร.ม. เท่าไหร่', 'quote', 'check'],
    ['how much is a 6x3 booth', 'quote', 'check'],
    ['อยากดูผลงาน', 'projects', 'search'],
    ['รับออกแบบบูธไหม', 'service:exhibition', 'build'],
    ['ขั้นตอนการทำงาน', 'process', 'build'],
    ['ขอคุยกับเจ้าหน้าที่', 'human', 'ask'],
    ['ขอบคุณค่ะ', 'thanks', 'thanks'],
    ['asdf qwer', 'unmatched', 'think'],
  ];
  for (const [text, intent, sticker] of cases) {
    const r = reply(text, data);
    assert.equal(r.intent, intent, text);
    assert.equal(stickerFor(r.intent)?.src, `/images/chatbot/${sticker}.webp`, text);
  }
});

test('location answer has no sticker so the address stays the focus', () => {
  assert.equal(stickerFor(replyFor('location', data, 'th').intent), null);
});

test('Thai voice uses the female mascot particles and never leaves ครับ', () => {
  assert.equal(chatbotConfig.voice.particle, 'ค่ะ');
  for (const intent of ['greeting', 'services', 'projects', 'quote', 'contact', 'human', 'location', 'process', 'about', 'thanks', 'bye', 'unmatched']) {
    const text = replyFor(intent, data, 'th').text;
    assert.ok(!/ครับ/.test(text), `${intent}: ${text}`);
  }
  assert.equal(voice('มีอะไรให้ช่วยอีกไหมครับ'), 'มีอะไรให้ช่วยอีกไหมคะ');
  assert.equal(voice('ขออภัยครับ ผมยังไม่เข้าใจ'), 'ขออภัยค่ะ เรายังไม่เข้าใจ');
  assert.match(greeting(data, 'th').text, /ค่ะ/);
});

test('English replies are unchanged by the Thai voice', () => {
  assert.equal(replyFor('thanks', data, 'en').text, 'You are welcome. Anything else I can help with?');
});

test('a customer chat transcript: every turn answers from real site data', () => {
  const transcript = ['สวัสดีค่ะ', 'รับทำบูธงาน Gem Fair ไหมคะ', 'ราคาประมาณเท่าไหร่', 'ขอเบอร์ติดต่อหน่อย', 'ขอบคุณค่ะ'];
  const answers = transcript.map((text) => reply(text, data));
  assert.deepEqual(answers.map((a) => a.intent), ['greeting', 'service:exhibition', 'quote', 'contact', 'thanks']);
  assert.equal(answers[2].form, 'quote');
  assert.ok(answers[3].text.includes(data.sales.phone));
  assert.ok(answers[3].actions.some((a) => a.label === 'LINE'));
  assert.equal(matchIntent('ราคาประมาณเท่าไหร่'), 'quote');
});

test('stickerFor maps any service:* intent to the services sticker', () => {
  assert.equal(stickerFor('service:lighting')?.src, '/images/chatbot/build.webp');
  assert.equal(stickerFor('nope'), null);
});
