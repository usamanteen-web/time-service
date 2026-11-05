/* Theme shell + feature pages (Teen 2026-11-05: "ปรับทุกหน้าให้เป็นธีมเดียวกับหน้าแคมเปญ").
   Every sidebar item has its own hash page in the แคมเปญ look: #sent ส่งเมล, #leads รายชื่อ, #history ประวัติส่ง,
   #contacts ผู้ติดต่อ, #protection ระบบป้องกัน (#campaigns stays in campaigns.js, ภาพรวม is the default).
   Numbers come only from payload.accounts.*.data and the read-only archive API; missing data shows "—" / "ยังไม่มีข้อมูล".
   Desktop (>=1100px) = 1586px canvas zoomed to the window width, exactly like #cpx. */
'use strict';
window.MailPages=(()=>{
 const ORDER=['overview','sent','leads','history','contacts','campaigns','protection'];
 const HEAD={
  sent:['ส่งเมล','ติดตามการส่งวันนี้เทียบเพดาน รายชั่วโมง และเมลที่ส่งล่าสุด','ส่งเมล'],
  leads:['รายชื่อ','รายชื่อบริษัททั้งหมด แยกตามกลุ่ม สถานะ ประเทศ และงานแสดงสินค้า','รายชื่อทั้งหมด'],
  history:['ประวัติส่ง','ผลส่งย้อนหลังรายวันและรายเดือน พร้อมคลังอีเมลที่ค้นหาและเปิดอ่านได้','ประวัติการส่ง'],
  contacts:['ผู้ติดต่อ','ลูกค้าที่ตอบกลับ เธรดที่รอตอบ และการกดลิงก์ในเมล','ผู้ติดต่อทั้งหมด'],
  protection:['ระบบป้องกัน','อัตราส่งถึง การตีกลับ เหตุผลที่งดส่ง และเพดานส่งที่ปลอดภัย','ระบบป้องกันการส่ง']};
 const NA='ยังไม่มีข้อมูล';
 const REASONS={BOUNCE_HARD:'อีเมลไม่มีอยู่จริง',NO_DOMAIN:'โดเมนไม่มีจริง',NO_MAIL_SERVER:'โดเมนไม่รับเมล',INVALID_SYNTAX:'รูปแบบผิด',PLACEHOLDER:'อีเมลหลอก'};
 const STATUS={'Already Contacted':'ส่งแล้ว','Not Contacted':'รอส่ง','Failed - Needs Retry':'รอส่งซ้ำ','Unknown - Verify Before Resend':'รอตรวจ'};
 const GROUPS={exhibitor_th:'บริษัทไทย',exhibitor_en:'บริษัทต่างชาติ',transport:'ทัวร์ / โรงแรม',partner:'ผู้จัดงาน'};
 const I=id=>`<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
 const n=v=>Number.isFinite(Number(v))?Number(v):0, has=v=>v!=null&&v!==''&&Number.isFinite(Number(v)), arr=v=>Array.isArray(v)?v:[];
 const page=()=>{const h=decodeURIComponent(location.hash.slice(1));return ORDER.includes(h)?h:'overview'};
 const acct=()=>selectedAccount==='all'?'gmail':selectedAccount;
 const data=id=>payload?.accounts?.[id]?.data||null;
 const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pct=(a,b)=>has(a)&&n(b)>0?Math.max(0,Math.min(100,n(a)/n(b)*100)):null;
 const pctText=v=>v==null?'—':v.toLocaleString('en-US',{maximumFractionDigits:1})+'%';
 const monthLabel=m=>{const [y,mo]=String(m).split('-').map(Number);return y&&mo?`${months[mo-1]} ${String(y+543).slice(-2)}`:'—'};
 let shownKey='',drawnKey={},introTimer,histMode='day',charts={},arch=null,listCtl={};

 /* ---------- building blocks (classes in theme.css) ---------- */
 const head=p=>{const [t,sub,crumb]=HEAD[p];return `<header class="page-head"><h1>${t}</h1><div class="subtitle">${esc(sub)}</div><nav class="crumb" aria-label="ตำแหน่งหน้า"><a href="#" data-home>${I('n-home-solid')}หน้าหลัก</a><span aria-hidden="true">&gt;</span><b>${crumb}</b></nav></header>`};
 const card=(icon,title,body,{cls='',right='',sub='',d=0}={})=>`<section class="th-card ${cls}" style="--d:${d}"><div class="th-card-h"><h2 class="th-title">${I(icon)}${esc(title)}</h2>${sub?`<span class="th-sub">${esc(sub)}</span>`:''}${right}</div>${body}</section>`;
 const mail=(f,direct=false)=>`data-mail-filter="${esc(JSON.stringify(f))}" data-mail-direct="${direct}"`;
 const btn=(attrs,label,cls='')=>`<button type="button" class="th-btn ${cls}" ${attrs}>${esc(label)} ${I('n-arrow')}</button>`;
 const tile=(icon,label,value,{cls='',attrs='',count=null}={})=>{const tag=attrs?'button':'div';return `<${tag} ${attrs?'type="button" ':''}class="th-tile ${cls}" ${attrs}>${I(icon)}<small>${esc(label)}</small><b${count!=null&&has(count)?` data-count="${n(count)}"`:''}>${value}</b></${tag}>`};
 const empty=(msg=NA)=>`<div class="th-empty">${esc(msg)}</div>`;
 const kv=rows=>`<dl class="th-kv">${rows.map(([a,b,c])=>`<dt>${esc(a)}</dt><dd class="${c||''}">${esc(b)}</dd>`).join('')}</dl>`;
 const note=t=>`<p class="th-note">${esc(t)}</p>`;
 const chip=(t,cls='')=>`<span class="th-chip ${cls}">${esc(t)}</span>`;
 function bars(rows,{lw=170,max=null}={}){
  if(!rows.length)return empty();
  const m=max??Math.max(1,...rows.map(r=>n(r.n)));
  return `<div class="th-bars" style="--lw:${lw}px">${rows.map((r,k)=>{const tag=r.f?'button':'div',w=has(r.n)&&n(r.n)>0?Math.max(.6,Math.min(100,n(r.n)/m*100)):0;
   return `<${tag} ${r.f?`type="button" ${mail(r.f)} title="${esc(r.tip||'อ่านเมลที่เกี่ยวข้องในคลัง')}"`:''} class="th-bar"><span title="${esc(r.name)}">${esc(r.name)}</span><i><b class="${r.tone||''}" style="--w:${w}%;--k:${Math.min(k,12)}${w?'':';min-width:0'}"></b></i><strong>${has(r.n)?fmt(r.n):'—'}</strong></${tag}>`}).join('')}</div>`;
 }
 function item({lead='',title,sub='',chipHtml='',time='',attrs='',k=0}){
  return `<button type="button" class="th-item" style="--k:${Math.min(k,12)}" ${attrs}>${lead}<span class="th-item-c"><strong title="${esc(title)}">${esc(title)}</strong>${sub?`<small title="${esc(sub)}">${esc(sub)}</small>`:''}</span><span class="th-item-r">${chipHtml}${time?`<time>${esc(time)}</time>`:''}<span class="th-go">อ่าน ${I('n-arrow')}</span></span></button>`;
 }
 // letters/digits only (no "I–" / "S(" from dashes and brackets in sender names)
 const STOP=['CO','LTD','LIMITED','INC','CORP','COMPANY','RE','FW','AW'];
 const ini=name=>String(name||'').split(/[\s/·,|_()\[\]–-]+/).filter(w=>/[\p{L}\p{N}]/u.test(w)&&!STOP.includes(w.toUpperCase().replace(/[^A-Z]/g,''))).slice(0,2).map(w=>(w.match(/[^\u0E40-\u0E44\P{L}]|\p{N}/u)||[''])[0]).join('').toUpperCase()||'?';
 const avatar=name=>`<span class="initials" aria-hidden="true">${esc(ini(name))}</span>`;
 const lang=t=>t==='exhibitor_th'?'ไทย':t?'อังกฤษ':'—';
 const niceStep=t=>{const raw=Math.max(t/4,1),p=10**Math.floor(Math.log10(raw)),m=raw/p;return Math.max(1,(m<=1?1:m<=2?2:m<=5?5:10)*p)};
 const short=v=>v>=10000?(v/1000).toLocaleString('en-US',{maximumFractionDigits:1})+'k':fmt(v);
 /* vertical glossy bars: rows [{label,b,r,f,tip,gap}] (b = blue, r = red stacked on top); drawn after insertion so the
    viewBox follows the real box and text never stretches */
 const vchart=(id,rows,{h=230,fill=true}={})=>{charts[id]={rows};return `<svg class="th-vchart${fill?' th-fill':''}" data-vchart="${id}" role="img" aria-label="${esc(rows.map(r=>r.tip).join(' · ').slice(0,600))}" style="--h:${h}px"></svg>`};
 function drawV(svg){
  const spec=charts[svg.dataset.vchart];if(!spec)return;const rows=spec.rows,id=svg.dataset.vchart;
  // viewBox = the svg's own layout size, so text keeps its CSS size at any card height (zoom scales it like the rest)
  const cw=svg.clientWidth,ch=svg.clientHeight,H=ch>60?Math.round(ch):210,W=cw>60&&ch>60?Math.max(280,Math.round(cw)):760;
  const top=Math.max(1,...rows.map(r=>n(r.b)+n(r.r))),st=niceStep(top),max=Math.ceil(top/st)*st;
  const L=44,R=W-4,B=H-26,T=24,ph=B-T,step=(R-L)/Math.max(1,rows.length),bw=Math.max(3,Math.min(44,step*.6)),every=Math.max(1,Math.ceil(58/step));
  let s=`<defs><linearGradient id="vb-${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b5dbff"/><stop offset=".38" stop-color="#5aa4ff"/><stop offset="1" stop-color="#2167e2"/></linearGradient><linearGradient id="vr-${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffc6ca"/><stop offset=".38" stop-color="#ff6d77"/><stop offset="1" stop-color="#d9283a"/></linearGradient><linearGradient id="vs-${id}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient><radialGradient id="vg-${id}" cx=".35" cy=".3"><stop stop-color="#ffe3e5"/><stop offset=".4" stop-color="#ff7079"/><stop offset="1" stop-color="#d9283a"/></radialGradient></defs>`;
  for(let v=0;v<=max;v+=st){const y=B-v/max*ph;s+=`<line class="${v?'grid':'base'}" x1="${L}" x2="${R}" y1="${y}" y2="${y}"/><text x="${L-8}" y="${y+4}" text-anchor="end">${short(v)}</text>`}
  const top3=(x,y,w,b)=>{const r=Math.min(7,w/2,b-y);return `M${x} ${b}V${y+r}Q${x} ${y} ${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${b}Z`};
  rows.forEach((r,i)=>{
   const x=L+i*step+(step-bw)/2,hb=n(r.b)/max*ph,hr=n(r.r)/max*ph,yb=B-hb,yr=yb-hr,tot=n(r.b)+n(r.r),cx=x+bw/2;
   s+=`<g ${r.f?`data-mail-bar="${esc(JSON.stringify(r.f))}" role="button" tabindex="0"`:''} aria-label="${esc(r.tip||r.label)}"><rect x="${L+i*step}" y="${T-14}" width="${step}" height="${B-T+14}" fill="transparent"/>`;
   if(hb>0)s+=`<g class="gb" style="--i:${Math.min(i,40)}"><path d="${hr>0?`M${x} ${B}V${yb}H${x+bw}V${B}Z`:top3(x,yb,bw,B)}" fill="url(#vb-${id})"/><path d="${hr>0?`M${x+2} ${B-1}V${yb}H${x+bw-2}V${B-1}Z`:top3(x+2,yb+2,bw-4,B-1)}" fill="url(#vs-${id})"/></g>`;
   if(hr>0)s+=`<g class="gb" style="--i:${Math.min(i,40)}"><path d="${top3(x,yr,bw,yb)}" fill="url(#vr-${id})"/></g>`;
   if(r.gap)s+=`<circle class="gapdot" style="--k:${Math.min(i,12)}" cx="${cx}" cy="${B}" r="4.2" fill="url(#vg-${id})"/>`;
   if(!r.none&&(step>=24||tot===Math.max(...rows.map(q=>n(q.b)+n(q.r)))))s+=`<text class="v" style="--i:${Math.min(i,40)}" x="${cx}" y="${Math.min(yr,B)-7}" text-anchor="middle">${r.gap?'0':fmt(tot)}</text>`;
   if(i%every===0||i===rows.length-1&&(rows.length-1)%every>every/2)s+=`<text x="${cx}" y="${B+18}" text-anchor="middle">${esc(r.label)}</text>`;
   s+='</g>';
  });
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML=s;
 }
 const legend=items=>`<div class="th-legend">${items.map(([c,t])=>`<span><i style="background:${c}"></i>${esc(t)}</span>`).join('')}</div>`;
 const BLUE='linear-gradient(180deg,#9cc8ff,#2167e2)',RED='linear-gradient(180deg,#ffb3b8,#d9283a)',LBLUE='linear-gradient(180deg,#d2e5ff,#6a9ff0)',GREY='linear-gradient(180deg,#e6edf9,#c5d3ee)';
 function withGaps(daily){
  const rows=arr(daily).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d.date)).slice().sort((a,b)=>a.date.localeCompare(b.date));
  if(!rows.length)return rows;const have=new Set(rows.map(d=>d.date)),t=new Date(rows[0].date+'T00:00:00Z'),last=new Date(rows.at(-1).date+'T00:00:00Z'),out=[...rows];
  for(;t<=last;t.setUTCDate(t.getUTCDate()+1)){const iso=t.toISOString().slice(0,10),wd=t.getUTCDay();if(wd>0&&wd<6&&!have.has(iso))out.push({date:iso,gap:true})}
  return out.sort((a,b)=>a.date.localeCompare(b.date));
 }
 const problems=d=>n(d.limit_bounced)+n(d.errors)+n(d.unknown);
 function emptyPage(id,msg){
  return `<div class="th-row">${card('n-inbox',id==='all'?'ทุกบัญชี':titleFor(id),`<div class="th-empty"><b>—</b>${esc(msg||NA)}<div class="th-acts">${btn('data-account="gmail"','ดู Teen · Gmail')}${btn('data-account="harry"','ดู Harry')}</div></div>`)}</div>`;
 }

 /* ---------- ส่งเมล ---------- */
 function sentPage(){
  const id=acct();if(id==='harry')return harrySent();
  const s=data('gmail');if(id==='domain'||!s)return emptyPage(id,id==='domain'?'บัญชี Teen · timeservices.co ยังไม่เริ่มส่ง — รอโดเมนและ Workspace พร้อม':'ยังไม่มีข้อมูลการส่งของ Gmail');
  const t=s.today||{},live=sampleMode||t.date===bangkokToday(),d=s.detail||{};
  const att=has(t.attempts)?n(t.attempts):null,del=has(t.delivered)?n(t.delivered):null,cap=has(t.cap)?n(t.cap):null,fail=att!=null&&del!=null?Math.max(0,att-del):null;
  const dayTxt=t.date?thaiDate(t.date,true):NA;
  const today=card('n-send','ส่งวันนี้',`<div class="th-hero"><b data-count="${del??''}">${fmt(del)}</b><span>/ ${fmt(cap)} ฉบับ</span><small>ส่งถึงผู้รับ · ${live?'วันนี้ ':''}${esc(dayTxt)}${t.date&&!live?' (ยังไม่มีข้อมูลของวันนี้)':''} · ${pctText(pct(del,cap))} ของเพดาน</small></div>
   <span class="th-pb big"><i style="--w:${pct(del,cap)??0}%"></i></span>
   <div class="th-tiles" style="--n:4">${tile('n-send','พยายามส่ง',fmt(att),{count:att})}${tile('n-check','ส่งถึง',fmt(del),{count:del})}${tile('n-warn','ไม่ผ่าน',fmt(fail),{cls:fail?'red':'',count:fail})}${tile('n-gauge','เพดานปลอดภัย',fmt(s.safe_cap),{count:s.safe_cap})}</div>
   <div class="th-foot"><span>${I('n-clock')}ช่วงเวลาส่ง ${esc(s.window||'—')}</span>${t.date?btn(mail({account:'gmail',day:t.date,direction:'sent'}),'อ่านเมลที่ส่งวันนั้น','pri'):''}</div>`,{right:btn('data-drawer="today"','รายละเอียด'),d:0});
  const hours=arr(d.today_hourly),win=String(s.window||'').match(/(\d{1,2}):\d{2}\s*[–-]\s*(\d{1,2}):\d{2}/);
  let h0=win?+win[1]:8,h1=win?+win[2]:18;hours.forEach(r=>{const h=+r.hour;if(Number.isFinite(h)){h0=Math.min(h0,h);h1=Math.max(h1,h+1)}});
  const slots=[];for(let h=h0;h<h1;h++){const r=hours.find(x=>+x.hour===h),hh=String(h).padStart(2,'0');slots.push({label:hh+':00',b:r?n(r.n):0,none:!r,f:r&&t.date?{account:'gmail',day:t.date,direction:'sent'}:null,tip:r?`${hh}:00 น. · ส่ง ${fmt(r.n)} ครั้ง · กดเพื่ออ่านเมลที่ส่งวันนั้น`:`${hh}:00 น. · ไม่มีบันทึกการส่ง`})}
  const sumH=hours.reduce((a,r)=>a+n(r.n),0);
  const hourly=card('n-clock','ส่งรายชั่วโมง',hours.length?vchart('hourly',slots,{h:220})+note('ชั่วโมงที่ไม่มีแท่ง = ไม่มีบันทึกการส่ง · กดแท่งเพื่ออ่านเมลที่ส่งวันนั้น (คลังกรองได้ทีละวัน)'):empty('ยังไม่มีข้อมูลรายชั่วโมงของวันนี้'),{sub:t.date?`${dayTxt} · รวม ${fmt(sumH)} ครั้ง`:'',d:1});
  const recent=arr(s.recent).slice(0,50);
  const list=recent.length?`<div class="th-search">${I('n-search')}<input type="search" data-filter-list="sent-recent" placeholder="ค้นหาบริษัท / เวลา" aria-label="ค้นหาในรายการส่งล่าสุด" autocomplete="off"></div><div class="th-list th-fill" data-list="sent-recent" style="margin-top:10px">${recent.map((r,k)=>item({lead:avatar(r.company),title:String(r.company||'—').split(' / ')[0],sub:thaiTime(r.time),chipHtml:chip(lang(r.template)),attrs:mail(MailInteractions.rowFilter(r,false),true),k})).join('')}</div><p class="th-count" data-count-for="sent-recent">แสดง ${fmt(recent.length)} รายการล่าสุดที่มีในข้อมูล</p>`:empty('ยังไม่มีรายการส่ง');
  const rec=card('n-mail','ส่งล่าสุด',list,{right:btn(mail({account:'gmail',direction:'sent'}),'ดูทั้งหมดในคลัง'),sub:`${fmt(recent.length)} รายการ`,d:2});
  const purposes={gmail:'ส่งเมลแนะนำบริษัทและติดตามแคมเปญ',domain:'จะใช้แทน Gmail เมื่อโดเมนและ Workspace พร้อม',harry:'ติดตามงาน Harry จากเมลที่ cc ถึงพิมพ์ชนก'};
  const accts=Object.entries(payload.accounts||{}).map(([key,a],k)=>`<button type="button" class="th-item${acct()===key?' on':''}" style="--k:${k}" data-account="${esc(key)}"><span class="initials" aria-hidden="true">${key==='harry'?'H':'T'}</span><span class="th-item-c"><strong>${esc(titleFor(key))}</strong><small>${esc(a.address||'—')} · ${esc(purposes[key]||'')}</small></span><span class="th-item-r">${status(a)}</span></button>`).join('');
  const l7=s.last7||{},c=payload.clicks||{};
  const senders=card('n-users','บัญชีผู้ส่ง',`<div class="th-list">${accts||empty()}</div>
   <div class="th-tiles" style="--n:3;margin-top:12px">${tile('n-check','ส่งถึง 7 วัน',`${fmt(l7.delivered)}<small class="u"> / ${fmt(l7.attempts)}</small>`)}${tile('n-send','ส่งทั้งหมด (ครั้ง)',fmt(s.attempts_total),{count:s.attempts_total})}${tile('n-link','กดลิงก์ในเมล',`${fmt(c.clicked)}<small class="u"> / ${fmt(c.sent)}</small>`)}</div>`,{right:btn('data-drawer="accounts"','รายละเอียด'),d:3});
  return `<div class="th-row r1 h330">${today}${hourly}</div><div class="th-row r2 h446">${rec}${senders}</div>`;
 }
 function harrySent(){
  const h=data('harry');if(!h)return emptyPage('harry','ยังไม่มีข้อมูลของ Harry');
  const cats=arr(h.categories),months_=arr(h.monthly),rec=arr(h.recent).slice(0,50),threads=cats.reduce((a,c)=>a+n(c.threads),0);
  const hero=card('n-send','เมลที่ Harry ส่ง',`<div class="th-hero"><b data-count="${n(h.sent)}">${fmt(h.sent)}</b><span>ฉบับ</span><small>ช่วงข้อมูล ${n(h.days)===730?'2 ปี':fmt(h.days)+' วัน'} · เห็นเฉพาะเมลที่ Harry cc ถึงพิมพ์ชนก</small></div>
   <div class="th-tiles" style="--n:4">${tile('n-layers','เธรด',fmt(threads),{count:threads})}${tile('n-users','ลูกค้า',fmt(h.customers),{count:h.customers})}${tile('n-reply','ตอบกลับ',fmt(h.customer_replies),{count:h.customer_replies})}${tile('n-clock','ค้างตอบ',fmt(h.waiting_reply),{cls:n(h.waiting_reply)?'red':'',count:h.waiting_reply})}</div>`,{right:btn(mail({account:'harry',direction:'harry'}),'อ่านเมลที่ส่ง'),d:0});
  const chart=card('n-bars','ส่งรายเดือน',months_.length?vchart('hmonth',months_.map(m=>({label:monthLabel(m.month),b:n(m.sent),f:{account:'harry',month:m.month,direction:'harry'},tip:`${monthLabel(m.month)} · ส่ง ${fmt(m.sent)} ฉบับ · กดเพื่ออ่าน`})),{h:240}):empty(),{sub:`รวม ${fmt(months_.reduce((a,m)=>a+n(m.sent),0))} ฉบับ`,d:1});
  const list=card('n-mail','เธรดล่าสุด',rec.length?`<div class="th-list th-fill">${rec.map((r,k)=>item({lead:avatar(r.customer),title:r.subject||'(ไม่มีหัวข้อ)',sub:`${r.customer||'—'} · ${categoryNames[categoryKey(r.category)]||r.category||'อื่น ๆ'}`,time:thaiTime(r.time),chipHtml:chip(r.last_from==='customer'?'ลูกค้าตอบล่าสุด':'Harry ตอบล่าสุด',r.last_from==='customer'?'red':''),attrs:mail(MailInteractions.rowFilter(r,true),true),k})).join('')}</div>`:empty(),{sub:`${fmt(rec.length)} เธรด`,d:2});
  const byCat=card('n-grid','ส่งแยกตามหมวด',`<div class="th-fill">`+bars(cats.map(c=>({name:c.label||categoryNames[categoryKey(c.key)]||c.key,n:c.sent,f:{account:'harry',category:c.key,direction:'harry'},tip:'อ่านเมลที่ Harry ส่งในหมวดนี้'})),{lw:200})+'</div>',{d:3});
  return `<div class="th-row r1 h330">${hero}${chart}</div><div class="th-row r2 h446">${list}${byCat}</div>`;
 }

 /* ---------- รายชื่อ ---------- */
 function leadsPage(){
  const id=acct();if(id==='harry')return harryLeads();
  const s=data('gmail');if(id==='domain'||!s)return emptyPage(id,id==='domain'?'บัญชี Teen · timeservices.co ยังไม่มีรายชื่อ — รอโดเมน':'ยังไม่มีข้อมูลรายชื่อ');
  const d=s.detail||{},G=arr(s.groups),tot=n(s.total);
  const parts=[['ส่งแล้ว',s.sent_companies,'b1',BLUE],['รอส่ง (รวมรอส่งซ้ำ)',s.pending,'b2',LBLUE],['รอตรวจ',s.verify,'r1',RED],['พักไว้',s.held,'n1',GREY]];
  const total=card('n-users','รายชื่อทั้งหมด',`<div class="th-hero"><b data-count="${tot}">${fmt(s.total)}</b><span>บริษัท</span><small>${esc(s.campaign_name||'')}</small></div>
   <div class="th-stack" role="img" aria-label="${esc(parts.map(p=>p[0]+' '+fmt(p[1])).join(' · '))}">${parts.map(p=>`<i class="${p[2]}" style="--w:${tot?n(p[1])/tot*100:0}%"></i>`).join('')}</div>
   ${legend(parts.map(p=>[p[3],`${p[0]} ${fmt(p[1])}`]))}
   <div style="margin-top:14px">${kv([['ความคืบหน้า',pctText(has(s.progress_pct)?n(s.progress_pct):null)],['รอส่งซ้ำ (อยู่ในรอส่ง)',fmt(s.retry),n(s.retry)?'r':''],['คาดว่าจะส่งครบ',has(s.eta_workdays)?`~${fmt(s.eta_workdays)} วันทำการ`:'—'],['ส่งวันละ (เพดานปลอดภัย)',fmt(s.safe_cap)+' ฉบับ']])}</div>`,{right:btn('data-drawer="groups"','รายละเอียด'),d:0});
  const tones=['t-blue','t-red','t-green','t-purple'];
  const lanes=card('n-layers','กลุ่มผู้รับ',G.length?`<div class="th-lanes">${G.map((g,k)=>{const all=n(g.sent)+n(g.pending),p=pct(g.sent,all),key={partner:'partner_en',transport:'transport_en'}[g.key]||g.key;
    return `<div class="th-lane ${tones[k%4]}" style="--k:${k}"><h3><span>${esc(GROUPS[g.key]||g.label||g.key)}</span><em>${fmt(g.sent)}</em></h3><p>แบบเมล ${esc(key)} · ${lang(key)}</p>
     <div class="th-mini"><small>ส่งแล้ว</small><b data-count="${n(g.sent)}">${fmt(g.sent)}</b><span class="th-pb"><i style="--w:${p??0}%;--k:${k}"></i></span><small>รอส่ง ${fmt(g.pending)} · ${pctText(p)}</small></div>
     ${btn(mail({account:'gmail',category:g.key==='exhibitor_th'?'th':'en'}),'อ่านเมลภาษา'+(g.key==='exhibitor_th'?'ไทย':'อังกฤษ'))}</div>`}).join('')}</div>${note('% = ส่งแล้ว ÷ (ส่งแล้ว + รอส่ง) · ปุ่มอ่านเมลกรองตามภาษาของแบบเมล (รวมทุกกลุ่มที่ใช้ภาษาเดียวกัน)')}`:empty(),{sub:`${fmt(G.length)} กลุ่ม`,d:1});
  const sc=Object.entries(d.status_counts||{}).sort((a,b)=>n(b[1])-n(a[1]));
  const status_=card('n-check','สถานะรายชื่อ',bars(sc.map(([k,v])=>({name:STATUS[k]||(String(k).startsWith('Hold')?'พักไว้':k),n:v,tone:/Failed|Unknown/.test(k)?'red':String(k).startsWith('Hold')?'navy':'',
    f:k==='Already Contacted'?{account:'gmail',direction:'sent'}:k==='Failed - Needs Retry'?{account:'gmail',direction:'bounce'}:null,tip:k==='Already Contacted'?'อ่านเมลที่ส่งแล้ว':'อ่านเมลตีกลับในคลัง'})),{lw:120})+note('บริษัทที่ยังไม่เคยส่ง (รอส่ง / รอตรวจ / พักไว้) ยังไม่มีอีเมลให้อ่าน'),{d:2});
  const countries=card('n-globe','ประเทศ',bars(arr(d.countries).map(c=>({name:c.name,n:c.n})),{lw:150}),{sub:'บริษัทที่ส่งแล้ว',d:3});
  const events=card('n-flag','งานแสดงสินค้า',`<div class="th-fill">${bars(arr(d.events).map(e=>({name:e.name,n:e.n,f:{account:'gmail',q:e.name},tip:'ค้นหาเมลที่มีชื่องานนี้ในคลัง'})),{lw:190})}</div>`,{sub:'บริษัทที่ส่งแล้ว',d:4});
  return `<div class="th-row r1 h380">${total}${lanes}</div><div class="th-row r2 h396">${status_}${countries}${events}</div>`;
 }
 function harryLeads(){
  const h=data('harry');if(!h)return emptyPage('harry','ยังไม่มีข้อมูลของ Harry');
  const cats=arr(h.categories),rec=arr(h.recent).slice(0,50);
  const doms=Object.entries(rec.reduce((a,r)=>{if(r.customer)a[r.customer]=(a[r.customer]||0)+1;return a},Object.create(null))).sort((a,b)=>b[1]-a[1]);
  const hero=card('n-users','ลูกค้าที่ติดต่อ',`<div class="th-hero"><b data-count="${n(h.customers)}">${fmt(h.customers)}</b><span>ราย</span><small>ช่วงข้อมูล ${n(h.days)===730?'2 ปี':fmt(h.days)+' วัน'} · ไม่นำข้อมูลจากบัญชีอื่นมารวม</small></div>
   <div class="th-tiles" style="--n:2">${tile('n-send','เมลที่ส่ง',fmt(h.sent),{count:h.sent})}${tile('n-reply','ลูกค้าตอบกลับ',fmt(h.customer_replies),{count:h.customer_replies})}</div>`,{right:btn('data-drawer="groups"','รายละเอียด'),d:0});
  const table=card('n-grid','หมวดหมู่งาน',cats.length?`<div class="th-table-wrap th-fill"><table class="th-table"><thead><tr><th>หมวดหมู่</th><th>เธรด</th><th>ส่ง</th><th>ตอบกลับ</th><th>ค้างตอบ</th></tr></thead><tbody>${cats.map(c=>`<tr data-go ${mail({account:'harry',category:c.key})} tabindex="0" role="button" aria-label="อ่านเมลหมวด ${esc(c.label||c.key)}"><td>${esc(c.label||categoryNames[categoryKey(c.key)]||c.key)}</td><td>${fmt(c.threads)}</td><td>${fmt(c.sent)}</td><td class="b">${fmt(c.customer_replies)}</td><td class="${n(c.waiting_reply)?'r':''}">${fmt(c.waiting_reply)}</td></tr>`).join('')}</tbody></table></div>`:empty(),{sub:'กดแถวเพื่ออ่านเมลในหมวด',d:1});
  const dom=card('n-globe','โดเมนลูกค้าในเธรดล่าสุด',doms.length?`<div class="th-fill">${bars(doms.map(([k,v])=>({name:k,n:v,f:{account:'harry',q:k},tip:'ค้นหาเมลของโดเมนนี้'})),{lw:200})}</div>${note('มาจากเธรดล่าสุดสูงสุด 50 รายการ ไม่ใช่รายชื่อลูกค้าครบทั้งหมด')}`:empty(),{d:2});
  const camps=arr(h.campaigns);
  const cp=card('n-grid','แคมเปญของ Harry',camps.length?`<div class="th-list th-fill">${camps.map((c,k)=>`<button type="button" class="th-item" style="--k:${Math.min(k,12)}" data-open-campaign="${esc(c.key)}"><span class="initials" aria-hidden="true">H</span><span class="th-item-c"><strong title="${esc(c.subject)}">${esc(c.subject||'—')}</strong><small>${esc(c.start?thaiDate(c.start,true):'—')} · ส่ง ${fmt(c.sent)} · ลูกค้า ${fmt(c.customers)}</small></span><span class="th-item-r">${n(c.waiting_reply)?chip('ค้างตอบ '+fmt(c.waiting_reply),'red'):chip('ตอบ '+fmt(c.customer_replies))}<span class="th-go">ดู ${I('n-arrow')}</span></span></button>`).join('')}</div>`:empty(),{sub:`${fmt(camps.length)} แคมเปญ`,d:3});
  return `<div class="th-row r1 h380">${hero}${table}</div><div class="th-row r2 two h396">${dom}${cp}</div>`;
 }

 /* ---------- ประวัติส่ง ---------- */
 function historyPage(){
  const id=acct();if(id==='domain')return emptyPage(id,'บัญชี Teen · timeservices.co ยังไม่มีประวัติส่ง — รอโดเมน');
  const harry=id==='harry',s=data(id);if(!s)return emptyPage(id);
  let chart,table;
  if(harry){
   const M=arr(s.monthly);
   chart=card('n-bars','เมลที่ Harry ส่งรายเดือน',M.length?vchart('hist',M.map(m=>({label:monthLabel(m.month),b:n(m.sent),f:{account:'harry',month:m.month,direction:'harry'},tip:`${monthLabel(m.month)} · ส่ง ${fmt(m.sent)} ฉบับ · กดเพื่ออ่าน`})),{h:240}):empty(),{sub:`รวม ${fmt(s.sent)} ฉบับ · ${n(s.days)===730?'2 ปี':fmt(s.days)+' วัน'}`,cls:'wide',d:0});
   table=card('n-cal','ตารางรายเดือน',M.length?`<div class="th-table-wrap th-fill"><table class="th-table"><thead><tr><th>เดือน</th><th>ส่งออก</th><th></th></tr></thead><tbody>${M.slice().reverse().map(m=>`<tr><td>${esc(monthLabel(m.month))}</td><td>${fmt(m.sent)}</td><td><button type="button" class="mini" ${mail({account:'harry',month:m.month,direction:'harry'})}>อ่าน</button></td></tr>`).join('')}</tbody></table></div>`:empty(),{d:2});
  }else{
   const rows=histRows(s);
   const seg=`<div class="seg" role="group" aria-label="มุมมอง"><button type="button" data-hist="day" aria-pressed="${histMode==='day'}">รายวัน</button><button type="button" data-hist="month" aria-pressed="${histMode==='month'}">รายเดือน</button></div>`;
   chart=card('n-bars',histMode==='month'?'ผลส่งรายเดือน':'ผลส่งรายวัน',(rows.length?vchart('hist',rows,{h:240}):empty())+legend([[BLUE,'ส่งถึงผู้รับ'],[RED,'ไม่ผ่าน (ชนลิมิต + ผิดพลาด + ไม่ทราบ)'],['radial-gradient(circle,#ff7079,#d9283a)','วันทำการที่ไม่ได้ส่ง']]),{sub:`ส่งทั้งหมด ${fmt(s.attempts_total)} ครั้ง · ส่งถึง ${fmt(s.delivered_total)}`,right:seg,cls:'wide',d:0});
   const desc=arr(s.daily).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
   table=card('n-cal','ตารางรายวัน',desc.length?`<div class="th-table-wrap th-fill"><table class="th-table"><thead><tr><th>วันที่</th><th>พยายาม</th><th>ส่งถึง</th><th>ชนลิมิต</th><th>ผิดพลาด</th><th>ไม่ทราบ</th></tr></thead><tbody>${desc.map(d=>`<tr><td>${esc(thaiDate(d.date,true))}<br><button type="button" class="mini" ${mail({account:'gmail',day:d.date,direction:'sent'})}>อ่าน</button><button type="button" class="mini red" ${mail({account:'gmail',day:d.date,direction:'bounce'})}>ตีกลับ</button></td><td>${fmt(d.attempts)}</td><td class="b">${fmt(d.delivered)}</td><td class="${n(d.limit_bounced)?'r':''}">${fmt(d.limit_bounced)}</td><td class="${n(d.errors)?'r':''}">${fmt(d.errors)}</td><td>${fmt(d.unknown)}</td></tr>`).join('')}</tbody></table></div>${note('ตัวเลขเป็นจำนวนครั้ง ไม่ใช่จำนวนบริษัท · ชนลิมิต = Gmail จำกัดการส่ง')}`:empty(),{d:2});
  }
  return `<div class="th-row r1 h330">${chart}${table}</div><div class="th-row h560">${archiveCard(id)}</div>`;
 }
 function histRows(s){
  const D=withGaps(s.daily);let rows;
  if(histMode==='month'){const g={};D.forEach(d=>{if(d.gap)return;const m=d.date.slice(0,7);g[m]=g[m]||{b:0,r:0};g[m].b+=n(d.delivered);g[m].r+=problems(d)});
    rows=Object.entries(g).sort().map(([m,v])=>({label:monthLabel(m),b:v.b,r:v.r,f:{account:'gmail',month:m,direction:'sent'},tip:`${monthLabel(m)} · ส่งถึง ${fmt(v.b)} · ไม่ผ่าน ${fmt(v.r)} · กดเพื่ออ่าน`}))}
  else rows=D.map(d=>({label:thaiDate(d.date),b:d.gap?0:n(d.delivered),r:d.gap?0:problems(d),gap:!!d.gap,f:{account:'gmail',day:d.date,direction:'sent'},tip:d.gap?`${thaiDate(d.date,true)} · ไม่ได้ส่ง (วันทำการ)`:`${thaiDate(d.date,true)} · พยายามส่ง ${fmt(d.attempts)} · ส่งถึง ${fmt(d.delivered)} · ไม่ผ่าน ${fmt(problems(d))} · กดเพื่ออ่าน`}));
  return rows;
 }
 function archiveCard(id){
  if(!arch||arch.base!==id)arch={base:id,filters:{account:id},offset:0,ctl:null,serial:0};
  return card('n-inbox','คลังอีเมล',`<div class="th-archive" data-archive></div>`,{sub:'ค้นหาและเปิดอ่านสำเนาเมล (อ่านอย่างเดียว)',right:btn(mail({account:id}),'เปิดเต็มจอ'),d:1});
 }
 async function archiveLoad(box){
  if(!box||!arch)return;
  const f=Object.fromEntries(Object.entries(arch.filters).filter(([,v])=>v!==''&&v!=null));
  box.innerHTML=MailReader.filters(f)+`<p class="reader-count" aria-live="polite">กำลังโหลด…</p><div class="reader-list th-fill">${'<div class="skeleton" style="height:66px"></div>'.repeat(4)}</div><nav class="reader-pages" aria-label="หน้าอีเมล"></nav>`;
  // one compact header row (search + filters) and one row (chips · count · pager) so the list gets the height
  const top=document.createElement('div');top.className='th-arch-top';top.append(box.querySelector('.reader-search'),box.querySelector('.reader-filters'));
  const mid=document.createElement('div');mid.className='th-arch-mid';mid.append(box.querySelector('.reader-chips'),box.querySelector('.reader-count'),box.querySelector('.reader-pages'));
  box.prepend(top,mid);box.querySelector('.reader-scope')&&mid.after(box.querySelector('.reader-scope'));
  const set=next=>{arch.filters=next;arch.offset=0;archiveLoad(box)};
  const form=box.querySelector('form');form.onsubmit=e=>{e.preventDefault();set({...f,q:form.elements.q.value.trim()})};
  form.querySelector('button').onclick=()=>form.requestSubmit();
  box.querySelectorAll('select,input[type=date],input[type=month]').forEach(el=>el.onchange=()=>{const next=el.name==='account'?{account:el.value}:{...f,[el.name]:el.value};if(el.name==='day')delete next.month;if(el.name==='month')delete next.day;set(next)});
  box.querySelectorAll('[data-direction]').forEach(el=>el.onclick=()=>set({...f,direction:el.dataset.direction}));
  box.querySelector('[data-reset]').onclick=()=>set({account:f.account});
  const token=++arch.serial;arch.ctl?.abort();const ctl=arch.ctl=new AbortController();
  try{
   const res=await MailReader.api('mail-messages',{...f,limit:20,offset:arch.offset,order:'desc'},ctl.signal);
   if(token!==arch.serial||!box.isConnected)return;
   const rows=arr(res.messages),total=n(res.total),off=arch.offset;
   box.querySelector('.reader-count').textContent=`${sampleMode?'ตัวอย่างสังเคราะห์ · ':''}สำเนาในคลัง ${fmt(total)} ฉบับ${total?' · '+fmt(off+1)+'–'+fmt(off+rows.length):''}`;
   box.querySelector('.reader-list').innerHTML=rows.map((m,i)=>`<button type="button" class="reader-row" style="--k:${Math.min(i,12)}" data-msg="${i}">${MailReader.summary(m,f.account)}</button>`).join('')||`<p class="reader-empty">ยังไม่มีสำเนาเมลตามตัวกรองนี้</p>`;
   box.querySelectorAll('[data-msg]').forEach(el=>el.onclick=()=>{box.querySelectorAll('.reader-row.on').forEach(x=>x.classList.remove('on'));el.classList.add('on');MailReader.openMessage(rows[+el.dataset.msg].id,f.account)});
   const pages=box.querySelector('.reader-pages');
   pages.innerHTML=`<button type="button" class="th-btn" data-prev ${off===0?'disabled':''} aria-label="หน้าก่อนหน้า">←</button><button type="button" class="th-btn" data-next ${off+rows.length>=total?'disabled':''} aria-label="หน้าถัดไป">→</button>`;
   pages.querySelector('[data-prev]').onclick=()=>{arch.offset=Math.max(0,off-20);archiveLoad(box)};
   pages.querySelector('[data-next]').onclick=()=>{arch.offset=off+20;archiveLoad(box)};
  }catch(e){if(e.name==='AbortError'||token!==arch.serial)return;box.querySelector('.reader-count').textContent='';box.querySelector('.reader-list').innerHTML=`<p class="reader-empty problem" role="alert">${esc(e.message)}</p>`}
 }

 /* ---------- ผู้ติดต่อ ---------- */
 function contactsPage(){
  const sa=selectedAccount;if(sa==='domain')return emptyPage('domain','บัญชี Teen · timeservices.co ยังไม่มีผู้ติดต่อ — รอโดเมน');
  const showG=sa!=='harry',showH=sa!=='gmail',h=data('harry'),c=payload.clicks||{},hv=v=>h?fmt(v):'—';
  const tiles=[];
  if(showH)tiles.push(tile('n-reply','ลูกค้าตอบ (Harry)',hv(h?.customer_replies),{count:h?.customer_replies}),tile('n-clock','รอ Harry ตอบ',hv(h?.waiting_reply),{cls:n(h?.waiting_reply)?'red':'',count:h?.waiting_reply}),tile('n-timer','ตอบเฉลี่ย (ชม.)',h&&has(h.avg_reply_hours)?fmt(h.avg_reply_hours):'—'),tile('n-users','ลูกค้า (Harry)',hv(h?.customers),{count:h?.customers}));
  if(showG)tiles.push(tile('n-reply','ลูกค้าตอบ (Gmail)','<span data-total-for="gmail-reply">…</span>'),tile('n-link','กดลิงก์ในเมล',`${fmt(c.clicked)}<small class="u"> / ${fmt(c.sent)}</small>`),tile('n-eye','เข้าดูเว็บ',fmt(c.opened),{count:c.opened}));
  const sum=card('n-users','สรุปผู้ติดต่อ',`<div class="th-tiles" style="--n:${tiles.length}">${tiles.join('')}</div>`,{sub:showG?`การกดลิงก์รวมทุกบัญชี · สแกนเนอร์ ${fmt(c.scanner_only)} ครั้ง (ระบบสแกนของผู้รับ ไม่ใช่การเปิดอ่าน)`:`เห็นเฉพาะเมลที่ Harry cc ถึงพิมพ์ชนก`,d:0});
  const cards=[];
  if(showH){
   const W=arr(h?.waiting);
   cards.push(card('n-clock','รอ Harry ตอบ',!h?empty():W.length?`<div class="th-list th-fill">${W.map((r,k)=>item({lead:avatar(r.customer),title:r.subject||'(ไม่มีหัวข้อ)',sub:`${r.customer||'—'} · ${categoryNames[categoryKey(r.category)]||r.category||'อื่น ๆ'}`,time:thaiTime(r.time),chipHtml:chip('ลูกค้าตอบล่าสุด','red'),attrs:mail(MailInteractions.rowFilter(r,true),true),k})).join('')}</div>${note('ลูกค้าตอบล่าสุดในเมล cc ที่มองเห็น · Harry อาจตอบแล้วแต่ไม่ได้ cc พิมพ์ชนก')}`:empty('ไม่มีเธรดที่รอตอบ'),{sub:h?`${fmt(W.length)} เธรด`:'',d:1}));
   cards.push(card('n-reply','ลูกค้าตอบ Harry',`<div class="th-list th-fill" data-archive-list="harry|customer">${'<div class="skeleton" style="height:58px"></div>'.repeat(4)}</div>`,{right:btn(mail({account:'harry',direction:'customer'}),'ดูทั้งหมด'),d:2}));
  }
  if(showG)cards.push(card('n-reply','ลูกค้าตอบ Gmail',`<div class="th-list th-fill${showH?'':' two-col'}" data-archive-list="gmail|reply">${'<div class="skeleton" style="height:58px"></div>'.repeat(4)}</div>`,{right:btn(mail({account:'gmail',direction:'reply'}),'ดูทั้งหมด'),sub:showH?'':'สำเนาในคลังอีเมล',d:3}));
  return `<div class="th-row h180">${sum}</div><div class="th-row r2 h596 c${cards.length}">${cards.join('')}</div>`;
 }
 async function archiveList(box){
  if(!box)return;const [account,direction]=box.dataset.archiveList.split('|'),key=box.dataset.archiveList;
  const ctl=new AbortController();(listCtl[key]?.abort());listCtl[key]=ctl;
  try{
   const res=await MailReader.api('mail-messages',{account,direction,limit:30,offset:0,order:'desc'},ctl.signal);if(ctl.signal.aborted||!box.isConnected)return;
   const rows=arr(res.messages);$$(`[data-total-for="${account}-${direction}"]`).forEach(el=>el.textContent=fmt(res.total));
   const dt=ts=>ts?new Intl.DateTimeFormat('th-TH',{timeZone:'Asia/Bangkok',dateStyle:'medium',timeStyle:'short'}).format(new Date(ts*1000)):'';
   box.innerHTML=rows.map((m,k)=>item({lead:avatar(m.from_name||m.from_addr),title:m.subject||'(ไม่มีหัวข้อ)',sub:`${m.from_name||m.from_addr||'—'} · ${m.snippet||''}`,time:dt(m.ts),attrs:`data-open-msg="${esc(m.id)}" data-open-acc="${esc(account)}"`,k})).join('')||empty('ยังไม่มีสำเนาเมลตอบกลับในคลัง');
  }catch(e){if(e.name==='AbortError')return;$$(`[data-total-for="${account}-${direction}"]`).forEach(el=>el.textContent='—');box.innerHTML=empty('โหลดไม่สำเร็จ: '+e.message)}
 }

 /* ---------- ระบบป้องกัน ---------- */
 function protectionPage(){
  const id=acct();if(id!=='gmail')return emptyPage(id,id==='harry'?'ระบบป้องกันใช้กับบัญชีที่ส่งเมลเอง (Teen · Gmail) · Harry อ่านจากเมล cc เท่านั้น':'บัญชี Teen · timeservices.co ยังไม่เริ่มส่ง — รอโดเมน');
  const s=data('gmail');if(!s)return emptyPage(id);
  const d=s.detail||{},l7=s.last7||{},rate=has(l7.rate)?n(l7.rate):pct(l7.delivered,l7.attempts),C=2*Math.PI*64;
  const failed7=has(l7.attempts)&&has(l7.delivered)?Math.max(0,n(l7.attempts)-n(l7.delivered)):null;
  const ring=`<div class="th-ring" role="img" aria-label="ส่งถึงผู้รับ ${pctText(rate)}"><svg viewBox="0 0 160 160"><defs><linearGradient id="ringBlue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5aa4ff"/><stop offset="1" stop-color="#1d55d0"/></linearGradient></defs><circle cx="80" cy="80" r="64" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="15"/><circle class="arc" cx="80" cy="80" r="64" fill="none" stroke="url(#ringBlue)" stroke-width="15" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-(rate??0)/100)}"/></svg><div class="val"><b>${pctText(rate)}</b><small>ส่งถึงผู้รับ</small></div></div>`;
  const r1a=card('n-shield','อัตราส่งถึง · 7 วัน',`<div class="th-split">${ring}<div style="flex:1;min-width:0">${kv([['ส่งถึงผู้รับ',fmt(l7.delivered)+' ครั้ง'],['พยายามส่ง',fmt(l7.attempts)+' ครั้ง'],['ไม่ผ่าน',fmt(failed7)+' ครั้ง',failed7?'r':''],['สถานะ',rate==null?NA:rate>=95?'ดีมาก':rate>=80?'ปกติ':'ต้องดู',rate!=null&&rate<80?'r':'']])}<div class="th-acts">${btn(mail({account:'gmail',direction:'bounce'}),'อ่านเมลตีกลับ')}</div></div></div>`,{d:0});
  const rows=dailyRows14(s);
  const r1b=card('n-bars','ผลส่ง 14 วันล่าสุด',(rows.length?vchart('prot',rows.map(r=>({label:thaiDate(r.date),b:n(r.delivered),r:problems(r),f:{account:'gmail',day:r.date,direction:problems(r)?'bounce':'sent'},tip:`${thaiDate(r.date,true)} · ส่งถึง ${fmt(r.delivered)} · ชนลิมิต ${fmt(r.limit_bounced)} · ผิดพลาด ${fmt(r.errors)} · ไม่ทราบ ${fmt(r.unknown)}`})),{h:230}):empty())+legend([[BLUE,'ส่งถึงผู้รับ'],[RED,'ไม่ผ่าน (ชนลิมิต + ผิดพลาด + ไม่ทราบ)']]),{right:btn('data-drawer="delivery"','ตารางละเอียด'),sub:'แท่งแดง = ส่งไม่ผ่าน · กดเพื่ออ่านเมลของวันนั้น',d:1});
  const reasons=Object.entries(d.suppression_reasons||{}).sort((a,b)=>n(b[1])-n(a[1]));
  const r2a=card('n-ban','เหตุผลที่งดส่ง',bars(reasons.map(([k,v])=>({name:REASONS[k]||k,n:v,tone:'red'})),{lw:150})+`<div style="margin-top:14px">${kv([['บัญชีดำ',fmt(s.suppression?.blacklist)],['พักไว้ในระบบป้องกัน',fmt(s.suppression?.holds)],['พักไว้ในรายชื่อแคมเปญ',fmt(s.held)]])}</div>`+note('รายการพักในระบบป้องกันกับรายการพักในแคมเปญเป็นคนละขอบเขต จึงไม่จำเป็นต้องเท่ากัน'),{d:2});
  const t=s.today||{},hist=arr(d.cap_history);
  const r2b=card('n-gauge','เพดานส่งปลอดภัย',`<div class="th-hero"><b data-count="${n(s.safe_cap)}">${fmt(s.safe_cap)}</b><span>ฉบับ / วัน</span></div>${kv([['เพดานวันล่าสุด',`${fmt(t.cap)} (${t.date?thaiDate(t.date,true):'—'})`],['ส่งวันล่าสุด',fmt(t.attempts)+' ครั้ง'],['ช่วงเวลาส่ง',s.window||'—']])}
   <h3 class="th-h3">ประวัติปรับเพดาน</h3>${hist.length?`<ul class="th-timeline th-fill">${hist.map((x,k)=>`<li style="--k:${k}">ลดเพดานเหลือ <b>${fmt(x.cap)}</b> เมื่อ ${esc(thaiTime(x.at))} หลังชนลิมิต Gmail ที่ ${fmt(x.attempts_at_hit)} ฉบับ</li>`).join('')}</ul>`:empty('ยังไม่เคยปรับเพดาน')}`,{d:3});
  const r2c=card('n-warn','รอตรวจ / ส่งซ้ำ',`<div class="th-tiles" style="--n:3">${tile('n-history','รอส่งซ้ำ',fmt(s.retry),{cls:n(s.retry)?'red':'',count:s.retry})}${tile('n-warn','รอตรวจ',fmt(s.verify),{cls:n(s.verify)?'red':'',count:s.verify})}${tile('n-ban','พักไว้',fmt(s.held),{count:s.held})}</div>
   ${note('รอส่งซ้ำ = ส่งไม่สำเร็จ ต้องลองใหม่ · รอตรวจ = ไม่ทราบผล ต้องตรวจก่อนส่งซ้ำ · พักไว้ = ข้อมูลอีเมลไม่สมบูรณ์')}<div class="th-acts">${btn(mail({account:'gmail',direction:'bounce'}),'อ่านเมลตีกลับ','pri')}${btn('data-drawer="pending"','รายละเอียดรอส่ง')}</div>`,{d:4});
  return `<div class="th-row r1 h330">${r1a}${r1b}</div><div class="th-row r2 h446">${r2a}${r2b}${r2c}</div>`;
 }
 function dailyRows14(s){
  const rows=arr(s.daily).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d.date)).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const end=Date.parse(String(s.as_of||rows.at(-1)?.date||'').slice(0,10)+'T00:00:00Z');
  return Number.isFinite(end)?rows.filter(r=>{const t=Date.parse(r.date+'T00:00:00Z');return t<=end&&t>end-14*86400000}):rows.slice(-14);
 }

 /* ---------- shell: zoom, nav state, intro motion, count-up ---------- */
 function fit(){const a=$('#app.th-app');if(!a)return;const w=document.documentElement.clientWidth;a.style.zoom=w>=1100?(w/1586).toFixed(5):''}
 function nav(p){
  const n_=$('.nav');if(!n_)return;n_.dataset.on=p;
  $$('.nav button').forEach(b=>{const on=b.dataset.page===p;b.classList.toggle('selected',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  $$('main > .page').forEach(sec=>sec.hidden=sec.dataset.page!==p);
  document.title=(p==='overview'?'ภาพรวม':HEAD[p]?.[0]||'แคมเปญ')+' — TIME Mail';
 }
 function countUp(root){
  if(reduce())return;
  root.querySelectorAll('.metric,.chart-total .num,.gauge-label .num,.recipient-total .num,.account-tile .num,.eta .num,[data-count]').forEach(el=>{
   const node=[...el.childNodes].find(x=>x.nodeType===3&&/\d/.test(x.nodeValue));if(!node)return;
   const orig=node.nodeValue,m=orig.match(/[\d,]+(\.\d+)?/);if(!m)return;
   const to=Number(m[0].replace(/,/g,'')),dec=(m[1]||'').length-(m[1]?1:0),t0=performance.now(),dur=950;if(!Number.isFinite(to)||to===0)return;
   const step=t=>{if(!node.isConnected)return;const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);
    node.nodeValue=p<1?orig.replace(m[0],(to*e).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec})):orig;if(p<1)requestAnimationFrame(step)};
   requestAnimationFrame(step)});
 }
 function intro(){
  const m=$('main');if(!m||reduce())return;
  m.classList.remove('intro');void m.offsetWidth;m.classList.add('intro');
  clearTimeout(introTimer);introTimer=setTimeout(()=>m.classList.remove('intro'),2600);
  const sec=$(`main > .page[data-page="${page()}"]`);if(sec)countUp(sec);
 }
 const stamp=()=>[payload?.generated_at,...Object.values(payload?.accounts||{}).map(a=>a?.updated_at)].join('|');
 function draw(p,force=false){
  const sec=$(`main > .page[data-page="${p}"]`);if(!sec||!HEAD[p])return;
  if(!payload){sec.innerHTML=head(p)+`<div class="th-row">${card('n-inbox','กำลังโหลดข้อมูล',`<div class="skeleton" style="height:180px"></div>`)}</div>`;drawnKey[p]='';return}
  const key=[selectedAccount,stamp(),p==='history'?histMode:''].join('|');if(!force&&drawnKey[p]===key)return;
  drawnKey[p]=key;
  const body={sent:sentPage,leads:leadsPage,history:historyPage,contacts:contactsPage,protection:protectionPage}[p]();
  sec.innerHTML=head(p)+body;
  sec.querySelectorAll('[data-vchart]').forEach(drawV);
  if(p==='history')archiveLoad(sec.querySelector('[data-archive]'));
  sec.querySelectorAll('[data-archive-list]').forEach(archiveList);
 }
 function render(){
  if(!$('main'))return;fit();
  const p=page();nav(p);if(p==='campaigns')return;
  if(p==='overview'){if(shownKey.split('|')[0]!=='overview')redrawChart?.()}
  else draw(p);
  const k=p+'|'+selectedAccount;if(payload&&k!==shownKey){shownKey=k;intro()}
 }
 function mounted(){fit();render()}
 addEventListener('hashchange',()=>{const p=page();if(p!=='campaigns'){closeMenus?.();window.MailReader?.close();window.MailDetails?.close();scrollTo(0,0)}render()});
 let rz;addEventListener('resize',()=>{fit();clearTimeout(rz);rz=setTimeout(()=>{const sec=$(`main > .page[data-page="${page()}"]:not([hidden])`);sec?.querySelectorAll('[data-vchart]').forEach(drawV)},160)});
 document.addEventListener('click',e=>{
  const home=e.target.closest('[data-home]');if(home&&home.closest('#app')){e.preventDefault();$('.sidebar')?.classList.remove('open');if(location.hash&&location.hash!=='#')location.hash='';else scrollTo({top:0,behavior:'smooth'});return}
  const dr=e.target.closest('[data-drawer]');if(dr){const c=$(`[data-detail-card="${dr.dataset.drawer}"]`);if(c)MailDetails.open(c);return}
  const h=e.target.closest('[data-hist]');if(h){histMode=h.dataset.hist;const sec=$('main > .page[data-page="history"]'),svg=sec?.querySelector('[data-vchart="hist"]'),s=data('gmail');
   if(!svg||!s){draw('history',true);return}
   charts.hist={rows:histRows(s)};svg.classList.add('regrow');drawV(svg);drawnKey.history=[selectedAccount,stamp(),histMode].join('|');
   sec.querySelectorAll('[data-hist]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hist===histMode)));
   const t=svg.closest('.th-card')?.querySelector('.th-title');if(t)t.lastChild.nodeValue=histMode==='month'?'ผลส่งรายเดือน':'ผลส่งรายวัน';return}
  const om=e.target.closest('[data-open-msg]');if(om){MailReader.openMessage(om.dataset.openMsg,om.dataset.openAcc||'gmail');}
  const oc=e.target.closest('[data-open-campaign]');if(oc&&window.Campaigns){Campaigns.show('harry');Campaigns.select('harry',oc.dataset.openCampaign);return}
  const it=e.target.closest('.th-item');if(it&&it.closest('.th-list')){it.parentElement.querySelectorAll('.th-item.on').forEach(x=>x!==it&&x.classList.remove('on'));it.classList.add('on')}
 });
 document.addEventListener('input',e=>{const inp=e.target.closest('[data-filter-list]');if(!inp)return;const list=$(`[data-list="${inp.dataset.filterList}"]`);if(!list)return;
  const q=inp.value.trim().toLocaleLowerCase();let shown_=0;list.querySelectorAll('.th-item').forEach(el=>{const hit=!q||el.textContent.toLocaleLowerCase().includes(q);el.hidden=!hit;if(hit)shown_++});
  const cnt=$(`[data-count-for="${inp.dataset.filterList}"]`);if(cnt)cnt.textContent=q?`พบ ${fmt(shown_)} จาก ${fmt(list.children.length)} รายการ`:`แสดง ${fmt(list.children.length)} รายการล่าสุดที่มีในข้อมูล`});
 document.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('.th-table tr[data-mail-filter]')){e.preventDefault();e.target.click()}});
 if($('main'))mounted();
 return {render,mounted,fit,page};
})();
