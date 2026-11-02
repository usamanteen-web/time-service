/* Read-only archive client. No sending, no third-party code, no body logging. */
'use strict';
window.MailReader=(()=>{
 const labels={sent:'ส่งออก',reply:'ลูกค้าตอบ',bounce:'ตีกลับ',harry:'Harry',customer:'ลูกค้า',internal:'ภายใน',auto:'อัตโนมัติ'};
 const empty='ยังไม่มีสำเนาเมลนี้ — ระบบกำลังคัดลอกเมลย้อนหลัง';
 let dialog,body,opener,overflow='',state,history=[],request,serial=0,fixture;
 const date=ts=>Number.isFinite(Number(ts))?new Intl.DateTimeFormat('th-TH',{timeZone:'Asia/Bangkok',dateStyle:'medium',timeStyle:'short'}).format(new Date(Number(ts)*1000)):'—';
 const account=()=>selectedAccount==='harry'?'harry':'gmail';
 const clean=f=>Object.fromEntries(Object.entries(f).filter(([,v])=>v!==''&&v!==null&&v!==undefined));
 const button=(text,attrs='')=>`<button type="button" ${attrs}>${esc(text)}</button>`;
 function ensure(){
  if(dialog)return;
  dialog=document.createElement('dialog');dialog.id='mail-reader';dialog.setAttribute('aria-labelledby','reader-title');dialog.setAttribute('aria-modal','true');
  dialog.innerHTML='<header class="reader-header"><button type="button" data-reader-back aria-label="ย้อนกลับ">←</button><div><small>TIME MAIL · อ่านอย่างเดียว</small><h2 id="reader-title">คลังอีเมล</h2></div><button type="button" data-reader-close aria-label="ปิดอีเมล">×</button></header><div class="reader-body" tabindex="0"></div>';
  document.body.append(dialog);body=dialog.querySelector('.reader-body');
  dialog.querySelector('[data-reader-close]').onclick=close;
  dialog.querySelector('[data-reader-back]').onclick=()=>history.length?render(history.pop()):close();
  dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
 }
 function close(){serial++;request?.abort();if(!dialog?.open)return;dialog.close();body.replaceChildren();history=[];document.body.style.overflow=overflow;if(opener?.isConnected)opener.focus({preventScroll:true})}
 async function api(path,params,signal){
  if(sampleMode){
   if(!fixture){const res=await fetch('/admin/tracking-mail/sample-messages.json',{signal});if(!res.ok)throw Error('โหลดตัวอย่างไม่สำเร็จ');fixture=await res.json()}
   if(signal.aborted)throw new DOMException('Aborted','AbortError');
   if(path==='mail-message')return {message:fixture.messages.find(m=>m.id===params.id)||null};
   let rows=fixture.messages.filter(m=>m.account===params.account);
   for(const k of ['day','direction','category'])if(params[k])rows=rows.filter(m=>m[k]===params[k]);
   if(params.month)rows=rows.filter(m=>m.day.startsWith(params.month));
   if(params.thread)rows=rows.filter(m=>m.thread_id===params.thread);
   if(params.ref)rows=rows.filter(m=>m.to_ref===params.ref);
   if(params.q){const q=params.q.toLocaleLowerCase();rows=rows.filter(m=>[m.from_name,m.from_addr,m.to_addr,m.subject,m.snippet,m.body_text].join(' ').toLocaleLowerCase().includes(q))}
   rows.sort((a,b)=>(params.order==='asc'?1:-1)*(a.ts-b.ts)||a.id.localeCompare(b.id));
   const offset=Number(params.offset)||0,limit=Number(params.limit)||50;
   return {total:rows.length,offset,limit,messages:rows.slice(offset,offset+limit).map(({body_html,body_text,cc,...m})=>m)};
  }
  const res=await fetch('/api/'+path+'?'+new URLSearchParams(clean(params)),{headers:{Authorization:'Bearer '+key},cache:'no-store',signal});
  if(res.status===401){close();key='';store.clear();showLogin('รหัสหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');throw new DOMException('Unauthorized','AbortError')}
  if(res.status===404&&path==='mail-message')return {message:null};
  if(!res.ok)throw Error('โหลดอีเมลไม่สำเร็จ (HTTP '+res.status+')');
  return res.json();
 }
 function go(next){history.push(state);render(next)}
 function summary(m){return `<span class="reader-badge ${m.direction==='bounce'?'problem':''}">${esc(labels[m.direction]||m.direction||'—')}</span><strong>${esc(m.subject||'(ไม่มีหัวข้อ)')}</strong><small>${esc(m.from_name||m.from_addr)} → ${esc(m.to_addr)} · ${esc(date(m.ts))}</small><span class="reader-snippet">${esc(m.snippet||'')}</span>`}
 function filters(f){
  const dirs=f.account==='harry'?['harry','customer','internal','auto']:['sent','reply','bounce'];
  const cats=f.account==='harry'?Object.entries(categoryNames):[['th','ไทย'],['en','อังกฤษ']];
  return `<form class="reader-search"><label>ค้นหาอีเมล<input type="search" name="q" value="${esc(f.q||'')}" placeholder="หัวข้อ / ผู้ส่ง / บริษัท" autocomplete="off"></label>${button('ค้นหา','data-search-submit')}</form><div class="reader-filters"><label>บัญชี<select name="account">${['gmail','harry'].map(a=>`<option ${a===f.account?'selected':''} value="${a}">${esc(titleFor(a))}</option>`).join('')}</select></label><label>หมวด<select name="category"><option value="">ทุกหมวด</option>${cats.map(([v,t])=>`<option value="${esc(v)}" ${f.category===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>วันที่<input type="date" name="day" value="${esc(f.day||'')}"></label><label>เดือน<input type="month" name="month" value="${esc(f.month||'')}"></label></div><div class="reader-chips">${button('ทั้งหมด',`data-direction="" aria-pressed="${!f.direction}"`)+dirs.map(d=>button(labels[d],`data-direction="${d}" aria-pressed="${f.direction===d}"`)).join('')}${button('ล้างตัวกรอง','data-reset')}</div>${Object.keys(clean(f)).some(k=>['thread','ref','q','day','month','category'].includes(k))?`<p class="reader-scope">ตัวกรอง: ${esc(Object.entries(clean(f)).filter(([k])=>!['account','order'].includes(k)).map(([k,v])=>k+' = '+v).join(' · '))}</p>`:''}`;
 }
 function bindFilters(f){
  const search=body.querySelector('form');search.onsubmit=e=>{e.preventDefault();render({view:'list',filters:{...f,q:search.elements.q.value.trim()},offset:0})};
  search.querySelector('button').onclick=()=>search.requestSubmit();
  body.querySelectorAll('select,input[type=date],input[type=month]').forEach(el=>el.onchange=()=>{const next=el.name==='account'?{account:el.value}:{...f,[el.name]:el.value};if(el.name==='day')delete next.month;if(el.name==='month')delete next.day;render({view:'list',filters:next,offset:0})});
  body.querySelectorAll('[data-direction]').forEach(el=>el.onclick=()=>render({view:'list',filters:{...f,direction:el.dataset.direction},offset:0}));
  body.querySelector('[data-reset]').onclick=()=>render({view:'list',filters:{account:f.account},offset:0});
 }
 function htmlBody(html){
  const doc=new DOMParser().parseFromString(String(html),'text/html');
  doc.querySelectorAll('script,base,meta,link,iframe,object,embed,form,input,button,video,audio,source').forEach(el=>el.remove());
  doc.querySelectorAll('*').forEach(el=>{[...el.attributes].forEach(a=>{if(/^on/i.test(a.name)||['srcset','background','srcdoc','formaction'].includes(a.name))el.removeAttribute(a.name)});if(el.hasAttribute('src')&&!/^data:image\/(png|jpeg|gif|webp);/i.test(el.getAttribute('src')))el.removeAttribute('src');if(el.tagName==='A'){if(!/^(https?:|mailto:)/i.test(el.getAttribute('href')||''))el.removeAttribute('href');el.target='_blank';el.rel='noopener noreferrer'}});
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><base target="_blank"><style>html{color-scheme:light}body{font:15px/1.75 system-ui,sans-serif;color:#021024;background:white;margin:20px;overflow-wrap:anywhere}img,table{max-width:100%!important}pre{white-space:pre-wrap}a{color:#052659}</style></head><body>'+doc.body.innerHTML+'</body></html>';
 }
 function message(m){return `<article class="reader-message"><h3>${esc(m.subject||'(ไม่มีหัวข้อ)')}</h3><span class="reader-badge ${m.direction==='bounce'?'problem':''}">${esc(labels[m.direction]||m.direction)}</span><dl><dt>จาก</dt><dd>${esc(m.from_name)} &lt;${esc(m.from_addr)}&gt;</dd><dt>ถึง</dt><dd>${esc(m.to_addr)}</dd>${m.cc?`<dt>สำเนา</dt><dd>${esc(Array.isArray(m.cc)?m.cc.join(', '):m.cc)}</dd>`:''}<dt>วันที่</dt><dd>${esc(date(m.ts))} (เวลาไทย)</dd></dl><div class="reader-mail-body"></div></article>`}
 function mountBody(container,m){
  if(m.body_html){const iframe=document.createElement('iframe');iframe.title='เนื้อหาอีเมล';iframe.setAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox');iframe.setAttribute('referrerpolicy','no-referrer');iframe.srcdoc=htmlBody(m.body_html);container.append(iframe)}
  else{const pre=document.createElement('pre');pre.textContent=m.body_text||empty;container.append(pre)}
 }
 async function render(next){
  state=next;request?.abort();request=new AbortController();const signal=request.signal,token=++serial;
  body.innerHTML='<div class="reader-loading" role="status">กำลังโหลดอีเมล…<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';body.scrollTop=0;
  dialog.querySelector('[data-reader-back]').title=history.length?'ย้อนกลับ':'ปิด';
  const active=()=>token===serial&&!signal.aborted&&dialog.open;
  try{
   if(next.view==='message'){
    const data=await api('mail-message',{id:next.id},signal);if(!active())return;
    const m=data.message;if(!m){body.innerHTML=`<p class="reader-empty">${empty}</p>`;return}
    body.innerHTML=(m.thread_id?button('อ่านทั้งเธรด','data-reader-thread'):'')+message(m)+'<p class="reader-privacy">ปิดรูปภาพภายนอกเพื่อไม่ส่งสัญญาณเปิดอ่าน · ลิงก์เปิดในแท็บใหม่</p>';
    mountBody(body.querySelector('.reader-mail-body'),m);
    const thread=body.querySelector('[data-reader-thread]');if(thread)thread.onclick=()=>go({view:'thread',filters:{account:next.account,thread:m.thread_id,order:'asc'},offset:0});
   }else{
    const f=clean(next.filters),isThread=next.view==='thread';
    const data=await api('mail-messages',{...f,limit:50,offset:next.offset||0,order:isThread?'asc':f.order||'desc'},signal);if(!active())return;
    const rows=Array.isArray(data.messages)?data.messages:[],total=number(data.total),offset=next.offset||0;
    body.innerHTML=(isThread?'<h3>บทสนทนา · เก่าสุดก่อน</h3>':filters(f))+`<p class="reader-count" aria-live="polite">${sampleMode?'ตัวอย่างสังเคราะห์ · ':''}สำเนาในคลัง ${fmt(total)} ฉบับ${total?' · '+fmt(offset+1)+'–'+fmt(offset+rows.length):''}</p><p class="reader-scope">ยอดสำเนาในคลังอาจยังไม่เท่ายอดแดชบอร์ดระหว่างคัดลอกย้อนหลัง · ยอดบริษัท / เธรด / ครั้งที่ส่งเป็นคนละหน่วย</p>`;
    if(!rows.length)body.insertAdjacentHTML('beforeend',`<p class="reader-empty">${empty}</p>`);
    if(isThread){
     body.insertAdjacentHTML('beforeend',`<div class="reader-thread">${rows.map((m,i)=>`<details data-thread-index="${i}"><summary>${summary(m)}</summary><div class="reader-thread-body"></div></details>`).join('')}</div>`);
     body.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',async()=>{if(!el.open||el.dataset.loaded)return;el.dataset.loaded='loading';const target=el.querySelector('.reader-thread-body');target.textContent='กำลังโหลด…';try{const d=await api('mail-message',{id:rows[Number(el.dataset.threadIndex)].id},signal);if(!active())return;if(!d.message){target.textContent=empty;return}target.innerHTML=message(d.message);mountBody(target.querySelector('.reader-mail-body'),d.message)}catch(e){if(e.name!=='AbortError'){target.textContent='โหลดไม่สำเร็จ ปิดแล้วเปิดข้อความเพื่อลองใหม่';delete el.dataset.loaded}}}));
    }else{
     body.insertAdjacentHTML('beforeend',`<div class="reader-list">${rows.map((m,i)=>`<button type="button" class="reader-row" data-message-index="${i}">${summary(m)}</button>`).join('')}</div>`);
     bindFilters(f);body.querySelectorAll('[data-message-index]').forEach(el=>el.onclick=()=>go({view:'message',id:rows[Number(el.dataset.messageIndex)].id,account:f.account}));
    }
    body.insertAdjacentHTML('beforeend',`<nav class="reader-pages" aria-label="หน้าอีเมล">${button('← ก่อนหน้า',`data-prev ${offset===0?'disabled':''}`)}${button('ถัดไป →',`data-next ${offset+rows.length>=total?'disabled':''}`)}</nav>`);
    body.querySelector('[data-prev]').onclick=()=>render({...next,offset:Math.max(0,offset-50)});body.querySelector('[data-next]').onclick=()=>render({...next,offset:offset+50});
    if(next.direct&&rows.length){state={...next,direct:false};go(f.thread?{view:'thread',filters:{account:f.account,thread:f.thread,order:'asc'},offset:0}:{view:'message',id:rows[0].id,account:f.account});return}
   }
  }catch(e){if(!active()||e.name==='AbortError')return;body.innerHTML=`<p class="reader-empty problem" role="alert">${esc(e.message)}</p>${button('ลองใหม่','data-reader-retry')}`;body.querySelector('button').onclick=()=>render(next)}
 }
 function open(filters={},direct=false){
  ensure();opener=document.activeElement;closeMenus();
  if(!dialog.open){overflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden'}
  history=[];dialog.querySelector('[data-reader-close]').focus();render({view:'list',filters:{account:account(),...filters},offset:0,direct:direct&&!!(filters.ref||filters.thread)});
 }
 return {open,close,account};
})();
