'use client';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Send, X } from 'lucide-react';
import { company, people, projectPatterns, services, steps } from '@/lib/content';
import { projectHref } from '@/lib/project-media';
import { detectLang, greeting, matchIntent, replyFor, setVoice, voice, type BotAction, type BotData, type Lang } from '@/lib/chatbot';
import { chatbotConfig, stickerFor } from '@/lib/chatbot-config';
import { track } from '@/lib/track';

setVoice(chatbotConfig.voice);

const contact = people.find((person) => person.name === chatbotConfig.contactPerson) ?? people[0];
const sales = { ...contact, label: chatbotConfig.contactLabel };
const botData: BotData = {
  company,
  services,
  projects: projectPatterns.map((project) => ({ title: project.title, href: projectHref(project.slug) })),
  steps,
  sales,
};

type Message = { id: number; from: 'bot' | 'user'; text: string; actions?: BotAction[]; form?: 'quote'; sticker?: { src: string; alt: string } | null };

const copy = {
  th: {
    open: 'เปิดแชท', close: 'ปิดแชท', title: chatbotConfig.name.th, status: chatbotConfig.status.online.th,
    placeholder: 'พิมพ์คำถามที่นี่', send: 'ส่ง', note: 'ข้อความที่บอทตอบไม่ได้จะถูกบันทึกเพื่อปรับปรุงบริการ',
    name: 'ชื่อ', contact: 'เบอร์โทร / LINE ID / อีเมล', message: 'รายละเอียดงาน (ชื่องาน ขนาดพื้นที่ วันที่)',
    submit: 'ส่งข้อมูล', sending: 'กำลังส่ง…', consent: 'ข้อมูลนี้ใช้เพื่อติดต่อกลับเรื่องที่สอบถามเท่านั้น',
    ok: 'ขอบคุณครับ ได้รับข้อมูลแล้ว ทีมงานจะติดต่อกลับตามช่องทางที่ให้ไว้ หากต้องการความรวดเร็วแชทกับทีมงานโดยตรงได้ครับ',
    error: 'ส่งข้อมูลไม่สำเร็จ ลองอีกครั้ง หรือติดต่อทีมงานโดยตรงผ่านช่องทางด้านล่างได้เลยครับ',
    limited: 'วันนี้ส่งข้อมูลครบจำนวนแล้ว กรุณาติดต่อทีมงานโดยตรงผ่านช่องทางด้านล่างครับ', sent: 'ส่งข้อมูลแล้ว',
  },
  en: {
    open: 'Open chat', close: 'Close chat', title: chatbotConfig.name.en, status: chatbotConfig.status.online.en,
    placeholder: 'Type your question', send: 'Send', note: 'Questions the bot cannot answer are saved to improve our service',
    name: 'Name', contact: 'Phone / LINE ID / email', message: 'Project details (show name, size, dates)',
    submit: 'Send details', sending: 'Sending…', consent: 'Used only to contact you about your enquiry.',
    ok: 'Thank you, we received your details and our team will contact you on the channel you gave. For a faster answer, chat with the team directly.',
    error: 'We could not send your details. Please try again, or contact the team directly below.',
    limited: 'You have reached today’s limit. Please contact the team directly below.', sent: 'Details sent',
  },
} satisfies Record<Lang, Record<string, string>>;
for (const key of Object.keys(copy.th) as (keyof typeof copy.th)[]) copy.th[key] = voice(copy.th[key]);

function Chip({ action, onChoose, onNavigate }: { action: BotAction; onChoose: (action: BotAction) => void; onNavigate: () => void }) {
  if (!action.href) {
    return <button type="button" className="tsc-chip" onClick={() => onChoose(action)}>{action.label}</button>;
  }
  if (/^(https?:|tel:|mailto:)/.test(action.href)) {
    return (
      <a className="tsc-chip" href={action.href} target={action.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {action.label}<ArrowUpRight size={13} aria-hidden="true" />
      </a>
    );
  }
  return <Link className="tsc-chip" href={action.href} onClick={onNavigate}>{action.label}<ArrowUpRight size={13} aria-hidden="true" /></Link>;
}

function QuoteForm({ lang, pathname, onResult }: { lang: Lang; pathname: string; onResult: (result: 'ok' | 'error' | 'limited') => void }) {
  const t = copy[lang];
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state !== 'idle') return;
    const form = new FormData(event.currentTarget);
    setState('sending');
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.get('name'), contact: form.get('contact'), message: form.get('message'), hp: form.get('website'), p: pathname }),
      });
      if (response.ok) {
        track({ t: 'chat', p: pathname, c: 'chat', i: 'lead_sent', z: 'chat' });
        setState('done');
        onResult('ok');
        return;
      }
      setState('idle');
      onResult(response.status === 429 ? 'limited' : 'error');
    } catch {
      setState('idle');
      onResult('error');
    }
  }

  return (
    <form className="tsc-form" onSubmit={submit}>
      <label>{t.name}<input name="name" required maxLength={80} autoComplete="name" disabled={state === 'done'} /></label>
      <label>{t.contact}<input name="contact" required maxLength={120} autoComplete="tel" disabled={state === 'done'} /></label>
      <label>{t.message}<textarea name="message" rows={3} maxLength={1000} disabled={state === 'done'} /></label>
      <input className="tsc-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" className="tsc-submit" disabled={state !== 'idle'}>{state === 'sending' ? t.sending : state === 'done' ? t.sent : t.submit}</button>
      <small>{t.consent}</small>
    </form>
  );
}

export default function ChatWidget() {
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('th');
  // Once the visitor picks TH/EN in the header, typed messages no longer flip the language.
  const [langLocked, setLangLocked] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const t = copy[lang];

  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const push = (message: Omit<Message, 'id'>) => setMessages((current) => [...current, { ...message, id: nextId.current++ }]);

  const answer = (intent: string, language: Lang, typed?: string) => {
    const reply = replyFor(intent, botData, language);
    const show = () => { setTyping(false); push({ from: 'bot', text: reply.text, actions: reply.actions, form: reply.form, sticker: stickerFor(reply.intent) }); };
    if (timer.current) clearTimeout(timer.current);
    if (chatbotConfig.typingDelayMs > 0) { setTyping(true); timer.current = setTimeout(show, chatbotConfig.typingDelayMs); } else show();
    track({ t: 'chat', p: pathname, c: 'chat', i: reply.intent === 'unmatched' ? 'unmatched' : `topic:${reply.intent}`, z: 'chat', l: reply.intent === 'unmatched' ? typed?.slice(0, 200) : undefined });
  };

  const openChat = () => {
    if (messages.length === 0) {
      let saved: string | null = null;
      try { saved = localStorage.getItem('tsc_lang'); } catch { /* storage blocked */ }
      const initial: Lang = saved === 'th' || saved === 'en' ? saved : typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('th') ? 'th' : 'en';
      if (saved === 'th' || saved === 'en') setLangLocked(true);
      setLang(initial);
      const hello = greeting(botData, initial);
      push({ from: 'bot', text: hello.text, actions: hello.actions, sticker: stickerFor('greeting') });
    }
    setOpen(true);
    track({ t: 'chat', p: pathname, c: 'chat', i: 'open', z: 'chat' });
  };

  const closeChat = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  const choose = (action: BotAction) => {
    if (!action.intent) return;
    push({ from: 'user', text: action.label });
    answer(action.intent, lang);
  };

  const submitText = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    const language = langLocked ? lang : detectLang(text, lang);
    setLang(language);
    setInput('');
    push({ from: 'user', text });
    answer(matchIntent(text) ?? 'unmatched', language, text);
  };

  const switchLang = (next: Lang) => {
    setLangLocked(true);
    if (next === lang) return;
    setLang(next);
    try { localStorage.setItem('tsc_lang', next); } catch { /* storage blocked */ }
    const hello = greeting(botData, next);
    push({ from: 'bot', text: hello.text, actions: hello.actions, sticker: stickerFor('greeting') });
    track({ t: 'chat', p: pathname, c: 'chat', i: `lang:${next}`, z: 'chat' });
  };

  const leadResult = (result: 'ok' | 'error' | 'limited') => {
    push({ from: 'bot', text: t[result], actions: replyFor('contact', botData, lang).actions.slice(0, 4), sticker: result === 'ok' ? stickerFor('lead_ok') : null });
  };

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open, typing]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const lastBot = messages.reduce((found, message, index) => (message.from === 'bot' ? index : found), -1);
  const closeOnSmallScreens = () => {
    if (window.matchMedia('(max-width: 540px)').matches) setOpen(false);
  };

  return (
    <div className="tsc-root" onKeyDown={(event) => { if (event.key === 'Escape' && open) closeChat(); }}>
      <button ref={launcherRef} type="button" className="tsc-launcher" aria-expanded={open} aria-controls={panelId} aria-label={open ? t.close : t.open} onClick={open ? closeChat : openChat}>
        {open ? <X size={22} aria-hidden="true" /> : <img className="tsc-launcher-avatar" src={chatbotConfig.avatar} alt="" width={46} height={46} />}
        {!open && <span className="tsc-online" aria-hidden="true" />}
        <span className="tsc-launcher-label" aria-hidden="true">{open ? 'Close' : chatbotConfig.launcher[lang]}</span>
      </button>
      <section id={panelId} className="tsc-panel" role="dialog" aria-label="Chat with Time Service" hidden={!open}>
        <header className="tsc-head">
          <span className="tsc-head-avatar"><img src={chatbotConfig.avatar} alt="" width={42} height={42} /><i aria-hidden="true" /></span>
          <div><strong>{t.title}</strong><span>{typing ? chatbotConfig.status.typing[lang] : t.status}</span></div>
          <div className="tsc-lang" role="group" aria-label={lang === 'th' ? 'เลือกภาษา' : 'Choose language'}>
            {(['th', 'en'] as const).map((code) => (
              <button key={code} type="button" aria-pressed={lang === code} onClick={() => switchLang(code)}>{code === 'th' ? 'TH' : 'EN'}</button>
            ))}
          </div>
          <button type="button" className="tsc-close" onClick={closeChat} aria-label={t.close}><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="tsc-log" ref={listRef} role="log" aria-live="polite">
          {messages.map((message, index) => (
            <div key={message.id} className={`tsc-msg tsc-${message.from}`}>
              {message.sticker && <img className="tsc-sticker" src={message.sticker.src} alt={message.sticker.alt} loading="lazy" width={150} height={130} />}
              <div className="tsc-bubble">{message.text}</div>
              {message.form === 'quote' && <QuoteForm lang={lang} pathname={pathname} onResult={leadResult} />}
              {message.actions && index === lastBot && (
                <div className="tsc-actions">
                  {message.actions.map((action) => <Chip key={action.label} action={action} onChoose={choose} onNavigate={closeOnSmallScreens} />)}
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="tsc-msg tsc-bot tsc-typing" aria-label={chatbotConfig.status.typing[lang]}>
              <div className="tsc-bubble"><span /><span /><span /></div>
            </div>
          )}
        </div>
        <form className="tsc-input" onSubmit={submitText}>
          <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder={t.placeholder} aria-label={t.placeholder} maxLength={300} autoComplete="off" />
          <button type="submit" aria-label={t.send} disabled={!input.trim()}><Send size={17} aria-hidden="true" /></button>
        </form>
        <p className="tsc-note">{t.note}</p>
      </section>
    </div>
  );
}
