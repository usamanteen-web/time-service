// Chatbot look and persona. Edit this file to change the mascot, its name, the status line or which
// sticker shows for each topic. Images live in public/images/chatbot/ (cropped from Teen's mascot sheet,
// 2026-10-31). Tests in scripts/chatbot-config.test.mjs check that every file and intent here exists.

export type Sticker = 'hello' | 'think' | 'thanks' | 'ask' | 'check' | 'gotit' | 'build' | 'solution' | 'search';

export const chatbotConfig = {
  name: { th: 'ผู้ช่วย TIME', en: 'TIME Assistant' },
  // Thai voice of the mascot (female): particle for statements, for questions, and the first-person word.
  // Set particle to 'ครับ' to go back to the original male wording.
  voice: { particle: 'ค่ะ', question: 'คะ', pronoun: 'เรา' },
  status: {
    online: { th: 'ออนไลน์ · พร้อมช่วยเหลือ', en: 'Online · Ready to help' },
    typing: { th: 'กำลังพิมพ์…', en: 'Typing…' },
    checking: { th: 'กำลังตรวจสอบ…', en: 'Checking…' },
  },
  launcher: { th: 'สอบถาม / Chat', en: 'Chat with us' },
  // Whose details the bot hands out when a customer asks to contact / talk to the team / call back.
  // Must match a `name` in lib/content.ts `people` (Teen 2026-10-31: send Teen's details).
  contactPerson: 'Usaman Ohro',
  contactLabel: { th: 'อุสมาน โอะโร (ทีน)', en: 'Usaman Ohro (Teen)' },
  avatar: '/images/chatbot/avatar-96.webp',
  avatarLarge: '/images/chatbot/avatar-192.webp',
  stickerDir: '/images/chatbot/',
  // Delay before the bot answers, so the "typing" state is visible (ms). 0 turns it off.
  typingDelayMs: 650,
  // Which sticker appears above the bot's answer for each intent. Intents not listed show text only,
  // so the chat does not fill up with pictures.
  stickers: {
    greeting: 'hello',
    quote: 'check',
    projects: 'search',
    services: 'build',
    process: 'build',
    factory: 'solution',
    about: 'solution',
    human: 'ask',
    contact: 'ask',
    thanks: 'thanks',
    bye: 'thanks',
    unmatched: 'think',
    lead_ok: 'gotit',
  } as Record<string, Sticker>,
  // Alt text for screen readers (the stickers carry English speech bubbles).
  stickerAlt: {
    hello: 'Hello! How can I help you?',
    think: 'Thinking',
    thanks: 'Thank you!',
    ask: 'Ask anything',
    check: "I'll check for you",
    gotit: 'Got it!',
    build: "Let's build together",
    solution: "Here's the solution!",
    search: 'Searching information',
  } as Record<Sticker, string>,
};

export function stickerFor(intent: string): { src: string; alt: string } | null {
  const key = chatbotConfig.stickers[intent] ?? (intent.startsWith('service:') ? chatbotConfig.stickers.services : undefined);
  return key ? { src: `${chatbotConfig.stickerDir}${key}.webp`, alt: chatbotConfig.stickerAlt[key] } : null;
}
