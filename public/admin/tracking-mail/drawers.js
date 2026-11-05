/* Snapshot-backed detail drawers. No network calls or external dependencies. */
'use strict';
window.MailDetails = (() => {
 const selectors='.kpis > .kpi, .middle > section, .bottom > section';
 const ids=['sent','today','pending','delivery','chart','recent','progress','groups','accounts'];
 const titles=['บริษัทที่ส่งแล้ว','วันนี้','รอส่ง','ส่งถึงผู้รับ','ยอดส่งรายวัน','ส่งล่าสุด','ความคืบหน้า','กลุ่มผู้รับ','บัญชีส่งหลัก'];
 const missing='ยังไม่มีข้อมูล';
 const arr=v=>Array.isArray(v)?v:[];
 const val=v=>v===null||v===undefined||!Number.isFinite(Number(v))?missing:fmt(v);
 const text=v=>v===null||v===undefined||v===''?missing:String(v);
 const section=(title,body)=>`<section><h3>${esc(title)}</h3>${body}</section>`;
 const note=t=>`<p class="detail-note">${esc(t)}</p>`;
 const empty=()=>`<p class="detail-empty">${missing}</p>`;
 const hero=(v,label)=>`<div class="detail-hero"><div class="detail-value">${esc(v)}</div><div class="detail-caption">${esc(label)}</div></div>`;
 const fields=rows=>`<dl class="detail-fields">${rows.map(([a,b])=>`<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>`;
 function bars(rows){
  if(!rows.length)return empty();
  const max=Math.max(1,...rows.map(r=>number(r.n)));
  return `<div class="detail-bars">${rows.map(r=>`<div><div class="detail-bar-head"><span>${esc(text(r.name))}</span><strong>${esc(val(r.n))}</strong></div><div class="detail-track"><i style="width:${Math.max(0,Math.min(100,number(r.n)/max*100))}%"></i></div></div>`).join('')}</div>`;
 }
 function table(headers,rows){return rows.length?`<div class="detail-table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${esc(text(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty()}
 const groupName=g=>g.label||({exhibitor_th:'บริษัทไทย',exhibitor_en:'บริษัทต่างชาติ',transport:'ทัวร์ / โรงแรม',transport_en:'ทัวร์ / โรงแรม',partner:'ผู้จัดงาน',partner_en:'ผู้จัดงาน'}[g.key])||g.key;
 const language=key=>key==='exhibitor_th'?'ไทย':['exhibitor_en','partner_en','transport_en'].includes(key)?'อังกฤษ':missing;
 const templateFor=key=>({partner:'partner_en',transport:'transport_en'}[key]||key);
 const percent=(a,b)=>b>0?Math.max(0,Math.min(100,a/b*100)).toLocaleString('en-US',{maximumFractionDigits:1})+'%':missing;
 function groupDetails(s){
  return arr(s.groups).length?arr(s.groups).map(g=>{
   const total=number(g.sent)+number(g.pending),pct=percent(number(g.sent),total),key=templateFor(g.key);
   return `<div class="detail-item"><strong>${esc(text(groupName(g)))}</strong>${fields([['ส่งแล้ว',val(g.sent)],['รอส่ง',val(g.pending)],['ความคืบหน้า',pct]])}<div class="detail-track"><i style="width:${total>0?Math.max(0,Math.min(100,number(g.sent)/total*100)):0}%"></i></div><small>แบบเมล ${esc(text(key))} · ${esc(language(key))}</small></div>`;
  }).join(''):empty();
 }
 const statusName=k=>({'Not Contacted':'รอส่ง','Failed - Needs Retry':'รอส่งซ้ำ','Unknown - Verify Before Resend':'รอตรวจ','Already Contacted':'ส่งแล้ว'}[k]||(k.startsWith('Hold')?'พักไว้':k));
 const dailyRows=s=>arr(s.daily).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const dailyTable=rows=>table(['วันที่','พยายามส่ง','ส่งถึง','ชนลิมิต','ผิดพลาด','ไม่ทราบ'],rows.map(d=>[thaiDate(d.date,true),val(d.attempts),val(d.delivered),val(d.limit_bounced),val(d.errors),val(d.unknown)]));
 const dailyLegend=()=>note('พยายามส่ง = จำนวนครั้งที่ลองส่ง · ส่งถึง = ระบบบันทึกว่าส่งถึงผู้รับ · ชนลิมิต = Gmail จำกัดการส่ง · ผิดพลาด = ส่งไม่สำเร็จด้วยเหตุอื่น · ไม่ทราบ = ต้องตรวจสอบก่อนส่งซ้ำ ตัวเลขแต่ละคอลัมน์เป็นค่าจากระบบ ไม่ใช่จำนวนบริษัทที่ไม่ซ้ำ และบางสถานะอาจทับซ้อนกัน');
 function eta(s){
  const pending=Number(s.pending),cap=Number(s.safe_cap),start=String(s.as_of||'').slice(0,10);
  if(s.pending==null||!Number.isFinite(pending)||pending<0||!Number.isFinite(cap)||cap<=0||!/^\d{4}-\d{2}-\d{2}$/.test(start))return note('ยังไม่มีข้อมูลพอคำนวณวันส่งครบ');
  const days=Math.ceil(pending/cap),date=new Date(start+'T00:00:00Z');
  if(!Number.isFinite(date.getTime())||days>100000)return note('ยังไม่มีข้อมูลพอคำนวณวันส่งครบ');
  let left=days;while(left>0){date.setUTCDate(date.getUTCDate()+1);if(date.getUTCDay()!==0&&date.getUTCDay()!==6)left--}
  return hero(val(days)+' วันทำการ','คาดว่าจะส่งครบ '+thaiDate(date.toISOString(),true))+note(`รอส่ง ${val(pending)} ÷ เพดานปลอดภัย ${val(cap)} ต่อวัน = ${val(days)} วันทำการ (ปัดขึ้น) นับวันจันทร์–ศุกร์ถัดจาก ${thaiDate(start,true)} ไม่นับวันของข้อมูลซ้ำ ไม่หักวันหยุดนักขัตฤกษ์ ไม่รวมการลดเพดานหรือความผิดพลาดในอนาคต เป็นเพียงประมาณการ`)+fields([['ค่าประมาณจากระบบ',s.eta_workdays==null?missing:val(s.eta_workdays)+' วันทำการ']]);
 }
 function weekComparison(s){
  const rows=dailyRows(s).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d.date));if(!rows.length)return empty();
  const end=Date.parse(rows.at(-1).date+'T00:00:00Z'),week=7*86400000;
  const sum=(lo,hi)=>rows.filter(d=>{const t=Date.parse(d.date+'T00:00:00Z');return t>lo&&t<=hi}).reduce((a,d)=>a+number(d.delivered),0);
  const now=sum(end-week,end),before=sum(end-2*week,end-week),change=before?((now-before)/before*100):null;
  return fields([['7 วันล่าสุด',val(now)+' ฉบับ'],['7 วันก่อนหน้า',val(before)+' ฉบับ'],['เปลี่ยนแปลง',change===null?'ยังเทียบเป็น % ไม่ได้':(change>=0?'+':'')+change.toFixed(1)+'%']])+note(`นับวันตามปฏิทินย้อนหลังจาก ${thaiDate(rows.at(-1).date,true)} รวมเฉพาะยอดส่งถึงในข้อมูลที่มี เทียบกับ 7 วันก่อนหน้านั้น สูตร (ยอดใหม่ − ยอดเดิม) ÷ ยอดเดิม × 100; ถ้ายอดเดิมเป็นศูนย์จะไม่คำนวณเปอร์เซ็นต์`);
 }
 function recentContent(rows,harry=false,search=true){
  const categories=[...new Set(rows.map(r=>r.category).filter(Boolean))];
  const tools=search?`<div class="detail-tools"><label class="detail-search-label" for="detail-search">ค้นหารายการ<input id="detail-search" type="search" placeholder="${harry?'หัวข้อ / โดเมนลูกค้า':'บริษัท / เวลา / แบบเมล'}" autocomplete="off"></label>${harry?`<label class="detail-search-label" for="detail-category">หมวดหมู่<select id="detail-category"><option value="">ทุกหมวด</option>${categories.map(c=>`<option value="${esc(c)}">${esc(categoryNames[categoryKey(c)]||c)}</option>`).join('')}</select></label>`:''}</div>`:'';
  return tools+`<p class="detail-count" aria-live="polite">แสดง ${val(rows.length)} รายการที่มีในข้อมูล (สูงสุด 50 รายการ)</p><div class="detail-items">${rows.map((r,i)=>`<article id="detail-row-${i}" class="detail-item" data-category-key="${esc(r.category||'')}"><strong>${esc(text(harry?r.subject:r.company))}</strong><small>${esc(thaiTime(r.time))}${harry?' · '+esc(text(r.customer)):''}</small>${harry&&r.campaign?`<small>${esc((arr(payload?.accounts?.harry?.data?.campaigns).find(c=>c.key===r.campaign)?.subject||'')+' · '+((arr(payload?.accounts?.harry?.data?.campaigns).find(c=>c.key===r.campaign)?.start)?thaiDate(arr(payload?.accounts?.harry?.data?.campaigns).find(c=>c.key===r.campaign).start,true):''))}</small>`:''}<span class="detail-tag">${esc(harry?(categoryNames[categoryKey(r.category)]||r.category):language(r.template))}</span>${harry?`<span class="detail-tag">${r.last_from==='customer'?'ลูกค้าตอบล่าสุด':r.last_from==='harry'?'Harry ตอบล่าสุด':missing}</span>`:`<small>แบบเมล ${esc(text(r.template))}</small>`}</article>`).join('')}</div><p class="detail-empty detail-no-results"${rows.length?' hidden':''}>${missing}</p>`;
 }
 function accountsContent(){
  const purposes={gmail:'ส่งเมลแนะนำบริษัทและติดตามแคมเปญของ Teen',domain:'บัญชีบริษัทที่จะใช้แทน Gmail เมื่อโดเมนและ Workspace พร้อม',harry:'ติดตามงาน Harry จากเมลที่ cc ถึงพิมพ์ชนก ไม่ได้อ่านกล่องเมล Harry โดยตรง'};
  return Object.entries(payload.accounts).map(([id,a])=>{
   const updated=a.updated_at!=null&&Number.isFinite(Number(a.updated_at))?new Intl.DateTimeFormat('th-TH',{timeZone:'Asia/Bangkok',dateStyle:'medium',timeStyle:'short'}).format(new Date(Number(a.updated_at)*1000)):a.data?.as_of?thaiTime(a.data.as_of):missing;
   return `<div class="detail-item"><strong>${esc(titleFor(id))}</strong><small>${esc(text(a.address))}</small>${status(a)}<p>${esc(purposes[id]||missing)}</p><small>อัปเดต ${esc(updated)} (เวลาไทย)</small></div>`;
  }).join('')+section('การติดตามลิงก์ · รวมทุกบัญชี',fields([['เมลที่ติดตามลิงก์',val(payload.clicks?.sent)],['กดลิงก์',val(payload.clicks?.clicked)],['เข้าดูเว็บ',val(payload.clicks?.opened)],['สแกนเนอร์อย่างเดียว',val(payload.clicks?.scanner_only)]]))+note('สแกนเนอร์ = ระบบสแกนไวรัสของผู้รับ ไม่ใช่หลักฐานว่าลูกค้าเปิดอ่านหรือสนใจ ตัวเลขเข้าดูเว็บไม่ใช่อัตราเปิดอีเมล');
 }
 function gmailContent(id,s){
  const d=s.detail||{};
  if(id==='sent')return hero(val(s.sent_companies),`ส่งแล้ว จาก ${val(s.total)} บริษัท`)+section('ส่งแล้วแยกตามกลุ่ม',bars(arr(s.groups).map(g=>({name:groupName(g),n:g.sent}))))+section('ประเทศของบริษัทที่ส่งแล้ว',bars(arr(d.countries)))+section('งานแสดงสินค้าของบริษัทที่ส่งแล้ว',bars(arr(d.events)));
  if(id==='today')return hero(val(s.today?.attempts)+' / '+val(s.today?.cap),'จำนวนครั้งที่ส่ง / เพดานวันนี้')+fields([['วันที่',s.today?.date?thaiDate(s.today.date,true):missing],['ส่งถึงผู้รับ',val(s.today?.delivered)],['ช่วงเวลาส่ง',text(s.window)],['เพดานปลอดภัยปัจจุบัน',val(s.safe_cap)]])+section('จำนวนส่งรายชั่วโมง',bars(arr(d.today_hourly).map(r=>({name:text(r.hour)+':00 น.',n:r.n}))))+section('ประวัติปรับเพดาน',arr(d.cap_history).length?arr(d.cap_history).map(h=>note(`ลดเพดานเหลือ ${val(h.cap)} เมื่อ ${thaiTime(h.at)} หลังชนลิมิต Gmail ที่ ${val(h.attempts_at_hit)} ฉบับ`)).join(''):empty())+note('เป็นยอดของวันที่ในข้อมูลล่าสุด ไม่ใช่ยอดสดขณะเปิดหน้านี้');
  if(id==='pending')return hero(val(s.pending),'บริษัทที่รอส่ง รวมรอส่งซ้ำ')+section('สถานะรายชื่อทั้งหมด',table(['สถานะ','จำนวน'],Object.entries(d.status_counts||{}).map(([k,n])=>[statusName(k)+' · '+k,val(n)])))+section('รอส่งแยกตามกลุ่ม',bars(arr(s.groups).map(g=>({name:groupName(g),n:g.pending}))))+fields([['รอส่งซ้ำ',val(s.retry)],['รอตรวจ',val(s.verify)],['พักไว้ในรายชื่อ',val(s.held)]])+section('คาดว่าจะส่งครบ',eta(s));
  if(id==='delivery'){
   const rows=dailyRows(s),end=Date.parse(String(s.as_of||rows.at(-1)?.date||'').slice(0,10)+'T00:00:00Z');
   const reasons={BOUNCE_HARD:'อีเมลไม่มีอยู่จริง',NO_DOMAIN:'โดเมนไม่มีจริง',NO_MAIL_SERVER:'โดเมนไม่รับเมล',INVALID_SYNTAX:'รูปแบบผิด',PLACEHOLDER:'อีเมลหลอก'};
   return hero(s.last7?.rate==null?missing:val(s.last7.rate)+'%',`ส่งถึง ${val(s.last7?.delivered)} จาก ${val(s.last7?.attempts)} ครั้ง · 7 วันล่าสุด`)+section('ผลส่งรายวัน · 14 วันล่าสุด',dailyTable(rows.filter(r=>{const t=Date.parse(r.date+'T00:00:00Z');return t<=end&&t>end-14*86400000})))+dailyLegend()+section('รายชื่อที่งดส่ง',fields([['บัญชีดำ',val(s.suppression?.blacklist)],['พักไว้ในระบบป้องกัน',val(s.suppression?.holds)],['พักไว้ในรายชื่อแคมเปญ',val(s.held)]]))+table(['เหตุผลที่งดส่ง','จำนวน'],Object.entries(d.suppression_reasons||{}).map(([k,n])=>[reasons[k]||k,val(n)]))+note('รายการพักในระบบป้องกันกับรายการพักในแคมเปญเป็นคนละขอบเขต จึงไม่จำเป็นต้องเท่ากัน');
  }
  if(id==='chart')return section('เทียบสัปดาห์ก่อน',weekComparison(s))+section('ผลส่งรายวันทั้งหมด',dailyTable(dailyRows(s)))+dailyLegend();
  if(id==='recent')return recentContent(arr(s.recent).slice(0,50));
  if(id==='progress')return eta(s)+section('ความคืบหน้าแต่ละกลุ่ม',groupDetails(s))+note('เปอร์เซ็นต์แต่ละกลุ่ม = ส่งแล้ว ÷ (ส่งแล้ว + รอส่ง) ไม่รวมรายชื่อที่พักหรือรอตรวจ');
  if(id==='groups')return hero(val(s.total),'บริษัททั้งหมดในแคมเปญ')+section('กลุ่มผู้รับและแบบเมล',groupDetails(s))+note('เปอร์เซ็นต์ = ส่งแล้ว ÷ (ส่งแล้ว + รอส่ง) แบบเมลภาษาไทยใช้ exhibitor_th; แบบเมลภาษาอังกฤษใช้ exhibitor_en, partner_en และ transport_en');
  if(id==='accounts')return accountsContent();
  return empty();
 }
 const harryTitles=['เมลที่ Harry ส่งออก','ลูกค้าตอบกลับ','ตอบลูกค้าเฉลี่ย (ชม.)','ลูกค้าตอบแล้ว ยังไม่เห็น Harry ตอบ','เมลที่ Harry ส่งรายเดือน','เธรดล่าสุด','แยกตามหมวดหมู่','ลูกค้าที่ติดต่อ','บัญชีส่งหลัก'];
 const coverage=()=>note('เห็นเฉพาะเมลที่ Harry cc ถึงพิมพ์ชนก (2 ปี)');
 const categoryTable=s=>table(['หมวดหมู่','เธรด','ส่ง','ตอบกลับ','ค้างตอบ'],arr(s.categories).map(c=>[c.label||categoryNames[categoryKey(c.key)],val(c.threads),val(c.sent),val(c.customer_replies),val(c.waiting_reply)]));
 function harryContent(id,s){
  const rows=arr(s.recent).slice(0,50),cats=arr(s.categories);
  if(id==='sent')return hero(val(s.sent),'เมลที่ส่งออก')+section('ส่งแยกตามหมวดหมู่',bars(cats.map(c=>({name:c.label,n:c.sent}))))+categoryTable(s);
  if(id==='today')return hero(val(s.customer_replies),'ลูกค้าตอบกลับในช่วงข้อมูล')+note('รายการด้านล่างคือเธรดล่าสุดที่ผู้ตอบคนสุดท้ายเป็นลูกค้า จากรายการล่าสุดที่ส่งมา ไม่ใช่ประวัติการตอบกลับทั้งหมด')+section('เธรดล่าสุดที่ลูกค้าตอบ',recentContent(rows.filter(r=>r.last_from==='customer'),true));
  if(id==='pending')return hero(val(s.avg_reply_hours),'ชั่วโมงเฉลี่ยในการตอบลูกค้า')+note('ใช้ค่าเฉลี่ยเวลาตอบที่ระบบคำนวณมา จากการตอบกลับที่มองเห็นในเมล cc ไม่ได้หมายความว่า Harry ตอบทุกเธรดภายในเวลานี้ ข้อมูลชุดนี้ไม่มีเวลาของแต่ละคู่คำตอบ จึงยังตรวจย้อนกลับหรือแสดงค่าเฉลี่ยแยกรายหมวดไม่ได้')+section('จำนวนลูกค้าตอบกลับแยกตามหมวด',bars(cats.map(c=>({name:c.label,n:c.customer_replies}))))+categoryTable(s);
  if(id==='delivery')return hero(val(s.waiting_reply),'เธรดที่ลูกค้าตอบล่าสุด')+note('อาจตอบแล้วแต่ไม่ได้ cc พิมพ์ชนก')+recentContent(arr(s.waiting).slice(0,50),true);
  if(id==='chart')return hero(val(s.sent),'ยอดส่งออกทั้งช่วงข้อมูล')+section('ยอดส่งรายเดือนทั้งหมด',table(['เดือน','ส่งออก'],arr(s.monthly).map(m=>[text(m.month),val(m.sent)])))+note('ตารางแสดงทุกเดือนที่มีในข้อมูล ไม่ได้จำกัดตามปุ่มช่วงเวลาบนกราฟ');
  if(id==='recent')return recentContent(rows,true);
  if(id==='progress'){const rounds=arr(s.campaigns);const roundTable=rounds.length?`<div class="detail-table-wrap"><table><thead><tr>${['หัวข้อแคมเปญ','เริ่ม','ส่ง','ตอบกลับ','รอคำตอบ'].map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rounds.map(c=>`<tr data-harry-campaign="${esc(c.key)}">${[c.subject+' · '+c.start,c.start,val(c.sent),val(c.customer_replies),val(c.waiting_reply)].map(x=>`<td>${esc(text(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty();return section('หมวดหมู่ทั้งหมด',categoryTable(s))+section('จำนวนเธรดแยกตามหมวด',bars(cats.map(c=>({name:c.label,n:c.threads}))))+section('แคมเปญแยกตามรอบ',roundTable)+note('หนึ่งเธรดอาจมีเมลหลายฉบับ จำนวนเธรดจึงไม่เท่าจำนวนครั้งที่ส่ง ค้างตอบหมายถึงลูกค้าตอบล่าสุดในเมล cc ที่มองเห็น');}
  if(id==='groups')return hero(val(s.customers),'ลูกค้าที่ติดต่อในช่วงข้อมูล')+section('โดเมนลูกค้าในเธรดล่าสุด',table(['โดเมน','เธรดในรายการล่าสุด'],Object.entries(rows.reduce((all,r)=>{if(r.customer)all[r.customer]=(all[r.customer]||0)+1;return all},Object.create(null))).sort((a,b)=>b[1]-a[1]).map(([name,n])=>[name,val(n)])))+note('รายชื่อโดเมนมาจากเธรดล่าสุดสูงสุด 50 รายการ ไม่ใช่รายชื่อลูกค้าครบทั้งหมด โดเมนเดียวอาจมีลูกค้าหลายราย');
  if(id==='accounts')return accountsContent();
  return empty();
 }
 let dialog=null,opener=null,oldOverflow='';
 function ensure(){
  if(dialog)return;
  dialog=document.createElement('dialog');dialog.id='mail-detail';dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','mail-detail-title');
  dialog.innerHTML='<div class="detail-header"><div class="detail-heading"><p class="detail-eyebrow">TIME MAIL · รายละเอียด</p><h2 id="mail-detail-title"></h2><p class="detail-updated"></p></div><button type="button" class="detail-close" aria-label="ปิดรายละเอียด">×</button></div><div class="detail-body" tabindex="0"></div>';
  document.body.append(dialog);
  dialog.querySelector('.detail-close').onclick=close;
  dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
  let startedOutside=false;
  const outside=e=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom};
  dialog.addEventListener('pointerdown',e=>{startedOutside=e.target===dialog&&outside(e)});
  dialog.addEventListener('click',e=>{if(startedOutside&&e.target===dialog&&outside(e))close();startedOutside=false});
  dialog.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return}
   if(e.key!=='Tab')return;
   const items=[...dialog.querySelectorAll('button,input,select,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
   const first=items[0],last=items.at(-1);
   if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  });
 }
 function close(){
  if(!dialog?.open)return;
  dialog.close();document.body.style.overflow=oldOverflow;
  if(opener?.isConnected)opener.focus({preventScroll:true});
 }
 function open(card,rowIndex=null){
  if(!payload||!card)return;
  ensure();closeMenus();
  const accountId=selectedAccount==='all'?'gmail':selectedAccount,account=payload.accounts[accountId],s=account?.data;
  const id=card.dataset.detailCard,index=ids.indexOf(id);
  opener=rowIndex===null?(card.contains(document.activeElement)?document.activeElement:card):card.querySelector(`.recent-row[data-recent-index="${Number(rowIndex)}"]`)||card;
  dialog.querySelector('h2').textContent=(accountId==='harry'?harryTitles:titles)[index]||'รายละเอียด';
  dialog.querySelector('.detail-updated').textContent=s?.as_of?'ข้อมูล ณ '+thaiTime(s.as_of):missing;
  dialog.querySelector('.detail-body').innerHTML=accountId==='domain'?note('บัญชีนี้ยังไม่เริ่มใช้ — รอโดเมน'):accountId==='harry'?coverage()+(sampleMode&&payload._sample?note('ตัวอย่างข้อมูลสำหรับทดลอง ไม่ใช่ผลงานจริงของ Harry'):'')+(s?harryContent(id,s):empty()):s?gmailContent(id,s):empty();
  if(!dialog.open){oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal()}
  dialog.querySelector('.detail-body').scrollTop=0;dialog.querySelector('.detail-close').focus({preventScroll:true});
  const input=dialog.querySelector('#detail-search'),select=dialog.querySelector('#detail-category');
  const filter=()=>{
   const query=(input?.value||'').trim().toLocaleLowerCase(),category=select?.value||'';
   const items=[...dialog.querySelectorAll('.detail-items .detail-item')];
   items.forEach(el=>{el.hidden=!!((category&&category!==el.dataset.categoryKey)||!el.textContent.toLocaleLowerCase().includes(query))});
   const count=items.filter(el=>!el.hidden).length;
   const counter=dialog.querySelector('.detail-count');if(counter)counter.textContent=`แสดง ${val(count)} จาก ${val(items.length)} รายการที่มีในข้อมูล (สูงสุด 50 รายการ)`;
   const noResults=dialog.querySelector('.detail-no-results');if(noResults){noResults.hidden=count>0;noResults.textContent=items.length?'ไม่พบรายการที่ค้นหา':missing}
  };
  if(input)input.addEventListener('input',filter);
  if(select){select.addEventListener('change',filter);if(id==='recent'&&selectedHarryCategory&&[...select.options].some(o=>o.value===selectedHarryCategory))select.value=selectedHarryCategory}
  if(input||select)filter();
  if(id==='recent'&&rowIndex!==null){const target=dialog.querySelector(`#detail-row-${Number(rowIndex)}`);if(target){target.classList.add('is-target');requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}))}}
  document.dispatchEvent(new CustomEvent('mail-detail-open',{detail:{card}}));
 }
 function bind(){
  $$(selectors).forEach((card,i)=>{card.dataset.detailCard=ids[i];card.tabIndex=0;card.setAttribute('aria-haspopup','dialog');card.setAttribute('aria-controls','mail-detail');card.setAttribute('aria-label',`ดูรายละเอียด ${card.querySelector('.kpi-label,.section-title')?.textContent.trim()||titles[i]}`);if(i<4)card.setAttribute('role','button')});
  $$('.account-tile').forEach(tile=>{tile.tabIndex=0;tile.setAttribute('role','button');tile.setAttribute('aria-haspopup','dialog');tile.setAttribute('aria-label','ดูรายละเอียดบัญชี · '+tile.textContent.trim())});
  const snap=payload?.accounts[selectedAccount==='all'?'gmail':selectedAccount]?.data;
  const visible=arr(snap?.recent).map((r,i)=>({r,i})).filter(({r})=>selectedAccount!=='harry'||!selectedHarryCategory||r.category===selectedHarryCategory);
  $$('.recent-row').forEach((row,i)=>{row.dataset.recentIndex=String(visible[i]?.i??i);row.setAttribute('role','button');row.setAttribute('aria-haspopup','dialog');row.setAttribute('aria-label','ดูรายละเอียด '+row.textContent.trim())});
  window.MailInteractions?.bind();
 }
 document.addEventListener('click',event=>{
  const card=event.target.closest('[data-detail-card]');
  if(!card||event.target.closest('button,input,select,a,.popover'))return;
  const row=event.target.closest('.recent-row');
  open(card,row?Number(row.dataset.recentIndex):null);
 });
 document.addEventListener('keydown',event=>{
  if(!['Enter',' '].includes(event.key)||!event.target.matches('[data-detail-card],.recent-row,.account-tile'))return;
  event.preventDefault();event.stopPropagation();const card=event.target.closest('[data-detail-card]');
  open(card,event.target.matches('.recent-row')?Number(event.target.dataset.recentIndex):null);
 });
 bind();
 return {bind,open,close};
})();
