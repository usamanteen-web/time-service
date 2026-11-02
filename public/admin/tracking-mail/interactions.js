/* Archive links for the existing dashboard; default layout stays unchanged. */
'use strict';
window.MailInteractions=(()=>{
 const selected=()=>selectedAccount==='all'?'gmail':selectedAccount;
 const snap=()=>payload?.accounts[selected()]?.data||{};
 const read=(f={},direct=false)=>{if(selected()==='domain'&&!f.account){MailDetails.open($('[data-detail-card=accounts]'));return}MailReader.open({account:selected()==='harry'?'harry':'gmail',...f},direct)};
 const action=(f,label='อ่านเมล',direct=false)=>`<button type="button" class="read-mail-action" data-mail-filter="${esc(JSON.stringify(f))}" data-mail-direct="${direct}">${esc(label)}</button>`;
 function rowFilter(r,harry=selected()==='harry'){
  return harry?(r.thread?{account:'harry',thread:r.thread,order:'asc'}:{account:'harry',q:r.subject||r.customer||''}):(r.ref?{account:'gmail',ref:r.ref}:{account:'gmail',q:r.company||r.subject||''});
 }
 function base(id){
  const h=selected()==='harry',s=snap();
  if(h)return {account:'harry',...({sent:{direction:'harry'},today:{direction:'customer'},pending:{direction:'customer'},delivery:{direction:'customer'}}[id]||{})};
  return {account:'gmail',...({sent:{direction:'sent'},today:{day:s.today?.date,direction:'sent'},pending:{direction:'bounce'},delivery:{direction:'sent'},chart:{direction:'sent'},progress:{direction:'sent'}}[id]||{})};
 }
 function drawer(card){
  const target=$('#mail-detail .detail-body');if(!target||selected()==='domain')return;
  const id=card.dataset.detailCard,s=snap(),h=selected()==='harry',f=base(id);
  const tools=document.createElement('div');tools.className='detail-read-actions';
  tools.innerHTML=action(f,id==='pending'&&!h?'อ่านเมลตีกลับที่มีในคลัง':'อ่านเมลในคลัง')+(id==='delivery'?action({account:h?'harry':'gmail',direction:h?'customer':'bounce'},h?'อ่านคำตอบลูกค้า':'อ่านเมลตีกลับ'):'')+(id==='accounts'?action({account:'gmail'},'อ่าน Gmail')+action({account:'harry'},'อ่าน Harry'):'');
  if(id==='recent'||id==='chart')tools.innerHTML+='<form class="detail-archive-search"><label>ค้นหาในคลังอีเมลทั้งหมด<input name="q" type="search" placeholder="หัวข้อ / บริษัท / ผู้ส่ง"></label><button class="read-mail-action">ค้นหาเมล</button></form>';
  const explanation=document.createElement('p');explanation.className='detail-note';explanation.textContent='อ่านจากสำเนาในคลัง (อาจยังคัดลอกไม่ครบ) · จำนวนบริษัทและเธรดไม่ใช่จำนวนฉบับ · คำว่า ส่งออก ไม่ยืนยันว่าได้รับหรืออ่านแล้ว';
  target.prepend(explanation);target.prepend(tools);
  const search=tools.querySelector('form');if(search)search.onsubmit=e=>{e.preventDefault();read({q:search.elements.q.value.trim()})};
  if(id==='pending'&&!h){const n=document.createElement('p');n.className='detail-note';n.textContent='บริษัทที่ยังไม่เคยส่งจะไม่มีอีเมลให้อ่าน API นี้ไม่มีตัวกรองสถานะรายชื่อ / ประเทศ / งาน / ชั่วโมง จึงไม่อ้างว่ารายการค้นหาคือยอดบริษัทดังกล่าว';tools.after(n)}
  // Recent and waiting items retain the exact snapshot identity, never a made-up match.
  let source=h&&id==='delivery'?(s.waiting||[]):h&&id==='today'?(s.recent||[]).filter(r=>r.last_from==='customer'):(s.recent||[]);
  target.querySelectorAll('.detail-items .detail-item').forEach((el,i)=>{const r=source[i];if(r)el.insertAdjacentHTML('beforeend',action(rowFilter(r),'อ่านเมล',true))});
  if(!h&&['chart','delivery'].includes(id)){
   let daily=(s.daily||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
   if(id==='delivery'){const end=Date.parse(String(s.as_of||daily.at(-1)?.date||'').slice(0,10)+'T00:00:00Z');daily=daily.filter(r=>{const t=Date.parse(r.date+'T00:00:00Z');return t<=end&&t>end-14*86400000})}
   const table=target.querySelector('table');table?.querySelectorAll('tbody tr').forEach((tr,i)=>{const d=daily[i];if(!d)return;tr.lastElementChild.insertAdjacentHTML('beforeend',action({account:'gmail',day:d.date,direction:'sent'})+action({account:'gmail',day:d.date,direction:'bounce'},'ตีกลับ'))});
  }
  if(h&&id==='chart')target.querySelectorAll('tbody tr').forEach((tr,i)=>{const m=(s.monthly||[])[i];if(m)tr.lastElementChild.insertAdjacentHTML('beforeend',action({account:'harry',month:m.month,direction:'harry'}))});
  if(h&&['sent','pending','progress'].includes(id))target.querySelectorAll('tbody tr').forEach((tr,i)=>{const c=(s.categories||[])[i];if(!c)return;tr.lastElementChild.insertAdjacentHTML('beforeend',action({account:'harry',category:c.key})+action({account:'harry',category:c.key,direction:'customer'},'ลูกค้าตอบ'))});
  if(h&&id==='groups')target.querySelectorAll('tbody tr').forEach(tr=>tr.lastElementChild.insertAdjacentHTML('beforeend',action({account:'harry',q:tr.firstElementChild.textContent},'ค้นหาเมลโดเมนนี้')));
  target.querySelectorAll('.detail-bars > div').forEach(el=>{
   const name=el.querySelector('.detail-bar-head span')?.textContent||'';
   const cat=h?(s.categories||[]).find(c=>(c.label||categoryNames[c.key])===name):null;
   el.insertAdjacentHTML('beforeend',action(cat?{account:'harry',category:cat.key,direction:id==='sent'?'harry':id==='pending'?'customer':undefined}:{...f,q:name},cat?'อ่านเมล':'ค้นหาเมลตามชื่อนี้'));
  });
  target.querySelectorAll('.detail-fields dd').forEach(el=>{const label=el.previousElementSibling?.textContent||'';
   if(/ส่งถึง|ส่งแล้ว|ส่งออก|ตอบกลับ|ชนลิมิต|ตีกลับ|ส่งซ้ำ/.test(label))el.insertAdjacentHTML('beforeend',action({...f,direction:/ชนลิมิต|ตีกลับ|ส่งซ้ำ/.test(label)?'bounce':/ตอบกลับ/.test(label)?h?'customer':'reply':h?'harry':'sent'}));
  });
  if(!h&&['groups','progress'].includes(id))target.querySelectorAll('.detail-item').forEach((el,i)=>{const g=(s.groups||[])[i];if(g)el.insertAdjacentHTML('beforeend',action({account:'gmail',category:g.key==='exhibitor_th'?'th':'en'},'อ่านเมลภาษา'+(g.key==='exhibitor_th'?'ไทย':'อังกฤษ')+' (รวมทุกกลุ่ม)'))});
  if(h&&id==='accounts')target.insertAdjacentHTML('beforeend',action({account:'harry',direction:'customer'},'อ่านลูกค้าตอบ'));
 }
 // The drawer's internal click handlers call its lexical open(), hence this event hook.
 document.addEventListener('mail-detail-open',e=>drawer(e.detail.card));
 const route=(target)=>{
  const a=target.closest('[data-mail-filter]');if(a){read(JSON.parse(a.dataset.mailFilter),a.dataset.mailDirect==='true');return true}
  const row=target.closest('.recent-row');if(row){const r=(snap().recent||[])[Number(row.dataset.recentIndex)];if(r)read(rowFilter(r),true);return true}
  const bar=target.closest('[data-mail-bar]');if(bar){read(JSON.parse(bar.dataset.mailBar));return true}
  const category=target.closest('.category-row');if(category){read({account:'harry',category:category.dataset.category});return true}
  const recipient=target.closest('.recipients tbody tr');if(recipient){const i=[...recipient.parentNode.children].indexOf(recipient),g=snap().groups?.[i];if(g)read({account:'gmail',category:g.key==='exhibitor_th'?'th':'en'});return !!g}
  const date=target.closest('.date-pill');if(date){read({});return true}
  const all=target.closest('.all-link:not(.clear-category)');if(all){read({});return true}
  const nav=target.closest('.nav button');if(nav){
   const i=$$('.nav button').indexOf(nav);$('.sidebar').classList.remove('open');$('.hamburger').setAttribute('aria-expanded','false');
   if(i===0){MailReader.close();MailDetails.close();chooseAccount('all');window.scrollTo({top:0,behavior:'smooth'})}
   else if(i===1)read({direction:selected()==='harry'?'harry':'sent'});
   else if(i===3)read({});
   else MailDetails.open($('[data-detail-card="'+({2:'groups',4:'groups',5:'accounts',6:'delivery'}[i])+'"]'));
   return true;
  }
  return false;
 };
 document.addEventListener('click',e=>{if(route(e.target)){e.preventDefault();e.stopImmediatePropagation()}},true);
 document.addEventListener('keydown',e=>{
  if(['Enter',' '].includes(e.key)&&e.target.matches('.recent-row,[data-mail-bar],.recipients tbody tr')){if(route(e.target)){e.preventDefault();e.stopImmediatePropagation()}}
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'&&payload){e.preventDefault();read({})}
 },true);
 function bind(){
  $$('.recipients tbody tr').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.title='อ่านเมลภาษาเดียวกันในคลัง (รวมทุกกลุ่ม)'});
  const pop=$('#avatar-menu');if(pop){pop.querySelectorAll('[data-mail-filter]').forEach(el=>el.remove());pop.insertAdjacentHTML('afterbegin',action(selected()==='domain'?{}:{account:selected()==='harry'?'harry':'gmail'},'ค้นหา / อ่านอีเมล'))}
  const notice=$('#notice-menu');if(notice&&!notice.querySelector('[data-mail-filter]'))notice.insertAdjacentHTML('beforeend',action({account:'gmail',direction:'reply'},'อ่านลูกค้าตอบ')+action({account:'gmail',direction:'bounce'},'อ่านตีกลับ'));
 }
 let tooltip;
 document.addEventListener('pointerover',e=>{const bar=e.target.closest('[data-mail-bar]');if(!bar)return;if(!tooltip){tooltip=document.createElement('div');tooltip.className='reader-chart-tooltip';document.body.append(tooltip)}tooltip.textContent=bar.getAttribute('aria-label');tooltip.style.left=Math.min(e.clientX+10,innerWidth-280)+'px';tooltip.style.top=Math.max(10,e.clientY-55)+'px';tooltip.hidden=false});
 document.addEventListener('pointerout',e=>{if(e.target.closest('[data-mail-bar]')&&tooltip)tooltip.hidden=true});
 document.addEventListener('click',()=>{if(tooltip)tooltip.hidden=true},true);
 bind();return {bind,drawer,rowFilter};
})();
