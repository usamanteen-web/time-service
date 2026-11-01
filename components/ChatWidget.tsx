'use client';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Send, X } from 'lucide-react';
import { company, people, projectPatterns, services, steps } from '@/lib/content';
import { projectHref } from '@/lib/project-media';
import { greeting, matchIntent, replyFor, routeFor, setVoice, voice, type BotAction, type BotData, type BotReply, type Lang } from '@/lib/chatbot';
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
    typing: chatbotConfig.status.typing.th, translating: chatbotConfig.status.translating.th, launcher: chatbotConfig.launcher.th, pickLang: 'เลือกภาษา',
  },
  en: {
    open: 'Open chat', close: 'Close chat', title: chatbotConfig.name.en, status: chatbotConfig.status.online.en,
    placeholder: 'Type your question', send: 'Send', note: 'Questions the bot cannot answer are saved to improve our service',
    name: 'Name', contact: 'Phone / LINE ID / email', message: 'Project details (show name, size, dates)',
    submit: 'Send details', sending: 'Sending…', consent: 'Used only to contact you about your enquiry.',
    ok: 'Thank you, we received your details and our team will contact you on the channel you gave. For a faster answer, chat with the team directly.',
    error: 'We could not send your details. Please try again, or contact the team directly below.',
    limited: 'You have reached today’s limit. Please contact the team directly below.', sent: 'Details sent',
    typing: chatbotConfig.status.typing.en, translating: chatbotConfig.status.translating.en, launcher: chatbotConfig.launcher.en, pickLang: 'Choose language',
  },
  zh: {
    open: '打开聊天', close: '关闭聊天', title: chatbotConfig.name.zh, status: chatbotConfig.status.online.zh,
    placeholder: '请输入您的问题', send: '发送', note: '机器人无法回答的问题会被记录，用于改进服务',
    name: '姓名', contact: '电话 / LINE ID / 微信 / 邮箱', message: '项目详情（展会名称、面积、日期）',
    submit: '提交信息', sending: '正在提交…', consent: '您的信息仅用于就本次咨询与您联系。',
    ok: '谢谢！我们已收到您的信息，团队会通过您留下的方式与您联系。如需更快回复，可直接联系我们的团队。',
    error: '提交失败，请重试，或通过下方方式直接联系我们的团队。',
    limited: '今天的提交次数已达上限，请通过下方方式直接联系我们的团队。', sent: '已提交',
    typing: chatbotConfig.status.typing.zh, translating: chatbotConfig.status.translating.zh, launcher: chatbotConfig.launcher.zh, pickLang: '选择语言',
  },
};
for (const key of Object.keys(copy.th) as (keyof typeof copy.th)[]) copy.th[key] = voice(copy.th[key]);
type Copy = typeof copy.en;
const COPY_KEYS = Object.keys(copy.en) as (keyof Copy)[];
const BUILT_IN = new Set<string>(['th', 'en', 'zh']);

/** A language the bot does not speak itself: its UI text and answers come translated from /api/chat-ai. */
type AiLang = { code: string; name: string; copy: Copy };

async function chatAi(body: object): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch('/api/chat-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

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

function QuoteForm({ t, pathname, onResult }: { t: Copy; pathname: string; onResult: (result: 'ok' | 'error' | 'limited') => void }) {
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
  const [ai, setAi] = useState<AiLang | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState<'' | 'typing' | 'translating'>('');
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiCopies = useRef(new Map<string, Copy>());
  const t: Copy = ai ? ai.copy : copy[lang];
  const shownLang = ai ? ai.code : lang;

  const push = (message: Omit<Message, 'id'>) => setMessages((current) => [...current, { ...message, id: nextId.current++ }]);

  const logTopic = (reply: BotReply, typed?: string) =>
    track({ t: 'chat', p: pathname, c: 'chat', i: reply.intent === 'unmatched' ? 'unmatched' : `topic:${reply.intent}`, z: 'chat', l: reply.intent === 'unmatched' ? typed?.slice(0, 200) : undefined });

  /** Answer with the built-in bot (th / en / zh), after a short "typing" pause. */
  const answer = (intent: string, language: Lang, typed?: string) => {
    const reply = replyFor(intent, botData, language);
    const show = () => { setBusy(''); push({ from: 'bot', text: reply.text, actions: reply.actions, form: reply.form, sticker: stickerFor(reply.intent) }); };
    if (timer.current) clearTimeout(timer.current);
    if (chatbotConfig.typingDelayMs > 0) { setBusy('typing'); timer.current = setTimeout(show, chatbotConfig.typingDelayMs); } else show();
    logTopic(reply, typed);
  };

  /** Answer in a language the bot does not speak: build the English answer, translate it with the AI route. */
  const answerTranslated = async (intent: string, target: { code: string; name: string }, typed?: string) => {
    const reply = replyFor(intent, botData, 'en');
    const known = aiCopies.current.get(target.code);
    const strings = [reply.text, ...reply.actions.map((action) => action.label), ...(known ? [] : COPY_KEYS.map((key) => copy.en[key]))];
    const out = await chatAi({ mode: 'translate', to: target.code, name: target.name, strings });
    const list = Array.isArray(out?.strings) && out.strings.length === strings.length ? (out.strings as string[]) : null;
    if (!list) return false;
    let uiCopy = known;
    if (!uiCopy) {
      const translated = list.slice(1 + reply.actions.length);
      uiCopy = Object.fromEntries(COPY_KEYS.map((key, index) => [key, translated[index] || copy.en[key]])) as Copy;
      aiCopies.current.set(target.code, uiCopy);
    }
    setAi({ code: target.code, name: target.name, copy: uiCopy });
    push({
      from: 'bot',
      text: list[0],
      actions: reply.actions.map((action, index) => ({ ...action, label: list[1 + index] || action.label })),
      form: reply.form,
      sticker: stickerFor(reply.intent),
    });
    logTopic(reply, typed);
    return true;
  };

  /** Customer typed something the built-in rules cannot place: let the AI route find language + intent. */
  const askAi = async (text: string, fallback: Lang) => {
    if (!chatbotConfig.aiTranslate) { setAi(null); setLang(fallback); answer(matchIntent(text) ?? 'unmatched', fallback, text); return; }
    setBusy('translating');
    const found = await chatAi({ mode: 'detect', text });
    const code = typeof found?.lang === 'string' ? found.lang.toLowerCase().split(/[-_]/)[0] : '';
    const intent = typeof found?.intent === 'string' ? found.intent : 'unmatched';
    const name = typeof found?.name === 'string' && found.name ? found.name : code;
    if (!code) { setBusy(''); setAi(null); setLang(fallback); answer(matchIntent(text) ?? 'unmatched', fallback, text); return; }
    if (BUILT_IN.has(code)) { setBusy(''); setAi(null); setLang(code as Lang); answer(intent, code as Lang, text); return; }
    track({ t: 'chat', p: pathname, c: 'chat', i: `lang:${code}`, z: 'chat' });
    const ok = await answerTranslated(intent, { code, name }, text);
    setBusy('');
    if (!ok) { setAi(null); setLang('en'); answer(intent, 'en', text); }
  };

  const openChat = () => {
    if (messages.length === 0) {
      const browser = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'th';
      const initial: Lang = browser.startsWith('th') ? 'th' : browser.startsWith('zh') ? 'zh' : 'en';
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
    if (!action.intent || busy) return;
    push({ from: 'user', text: action.label });
    if (ai) {
      setBusy('translating');
      void answerTranslated(action.intent, ai).then((ok) => { setBusy(''); if (!ok) answer(action.intent!, 'en'); });
    } else {
      answer(action.intent, lang);
    }
  };

  // The answer always follows the language of the customer's latest message (Teen 2026-11-01).
  const submitText = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    push({ from: 'user', text });
    const route = routeFor(text, ai ? 'en' : lang);
    const intent = matchIntent(text);
    if ((route === 'th' || route === 'zh' || route === 'en') && intent) {
      setAi(null);
      setLang(route);
      answer(intent, route, text);
      return;
    }
    if (route === 'th' || route === 'zh') {
      setAi(null);
      setLang(route);
      answer('unmatched', route, text);
      return;
    }
    void askAi(text, route === 'en?' || route === 'other' ? 'en' : route);
  };

  const switchLang = (next: Lang) => {
    if (next === lang && !ai) return;
    setAi(null);
    setLang(next);
    const hello = greeting(botData, next);
    push({ from: 'bot', text: hello.text, actions: hello.actions, sticker: stickerFor('greeting') });
    track({ t: 'chat', p: pathname, c: 'chat', i: `lang:${next}`, z: 'chat' });
  };

  const leadResult = (result: 'ok' | 'error' | 'limited') => {
    const actions = replyFor('contact', botData, ai ? 'en' : lang).actions.slice(0, 4);
    push({ from: 'bot', text: t[result], actions, sticker: result === 'ok' ? stickerFor('lead_ok') : null });
  };

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const lastBot = messages.reduce((found, message, index) => (message.from === 'bot' ? index : found), -1);
  const closeOnSmallScreens = () => {
    if (window.matchMedia('(max-width: 540px)').matches) setOpen(false);
  };
  const status = busy === 'translating' ? t.translating : busy === 'typing' ? t.typing : t.status;

  return (
    <div className="tsc-root" lang={shownLang} onKeyDown={(event) => { if (event.key === 'Escape' && open) closeChat(); }}>
      <button ref={launcherRef} type="button" className="tsc-launcher" aria-expanded={open} aria-controls={panelId} aria-label={open ? t.close : t.open} onClick={open ? closeChat : openChat}>
        {open ? <X size={22} aria-hidden="true" /> : <img className="tsc-launcher-avatar" src={chatbotConfig.avatar} alt="" width={46} height={46} />}
        {!open && <span className="tsc-online" aria-hidden="true" />}
        <span className="tsc-launcher-label" aria-hidden="true">{open ? 'Close' : t.launcher}</span>
      </button>
      <section id={panelId} className="tsc-panel" role="dialog" aria-label="Chat with Time Service" hidden={!open}>
        <header className="tsc-head">
          <span className="tsc-head-avatar"><img src={chatbotConfig.avatar} alt="" width={42} height={42} /><i aria-hidden="true" /></span>
          <div><strong>{t.title}</strong><span>{status}</span></div>
          <div className="tsc-lang" role="group" aria-label={t.pickLang}>
            {chatbotConfig.languages.map(({ code, label }) => (
              <button key={code} type="button" lang={code} aria-pressed={!ai && lang === code} onClick={() => switchLang(code)}>{label}</button>
            ))}
            {ai && <span className="tsc-lang-ai" title={ai.name}>{ai.code.toUpperCase()}</span>}
          </div>
          <button type="button" className="tsc-close" onClick={closeChat} aria-label={t.close}><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="tsc-log" ref={listRef} role="log" aria-live="polite">
          {messages.map((message, index) => (
            <div key={message.id} className={`tsc-msg tsc-${message.from}`}>
              {message.sticker && <img className="tsc-sticker" src={message.sticker.src} alt={message.sticker.alt} loading="lazy" width={150} height={130} />}
              <div className="tsc-bubble">{message.text}</div>
              {message.form === 'quote' && <QuoteForm t={t} pathname={pathname} onResult={leadResult} />}
              {message.actions && index === lastBot && (
                <div className="tsc-actions">
                  {message.actions.map((action) => <Chip key={`${action.label}|${action.href ?? action.intent}`} action={action} onChoose={choose} onNavigate={closeOnSmallScreens} />)}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="tsc-msg tsc-bot tsc-typing" aria-label={status}>
              <div className="tsc-bubble"><span /><span /><span /></div>
            </div>
          )}
        </div>
        <form className="tsc-input" onSubmit={submitText}>
          <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder={t.placeholder} aria-label={t.placeholder} maxLength={300} autoComplete="off" />
          <button type="submit" aria-label={t.send} disabled={!input.trim() || Boolean(busy)}><Send size={17} aria-hidden="true" /></button>
        </form>
        <p className="tsc-note">{t.note}</p>
      </section>
    </div>
  );
}
