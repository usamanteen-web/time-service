/* "แคมเปญ" page — pixel build of Teen's final image (reference-teen-final/teen_campaigns_v2.png, 1586x992):
   "ต่างกันชัดเจน เขียนโค้ดให้เหมือนรูปนี้ 100% ใส่ motion effects ด้วย" (2026-11-05). Lives only under the sidebar item "แคมเปญ".
   Desktop = fixed 1586x992 stage zoomed to the window width (layout identical to the image); <1000px = stacked flow.
   Every number comes from payload.accounts.{gmail,harry}.data.campaigns. Decorations are cut from his image. */
'use strict';
window.Campaigns=(()=>{
 const STATES={sending:'กำลังส่ง',paused:'หยุดไว้',done:'เสร็จแล้ว',not_started:'ยังไม่เริ่ม'};
 const STATUS={'Not Contacted':'รอส่ง','Failed - Needs Retry':'รอส่งซ้ำ','Unknown - Verify Before Resend':'รอตรวจ','Already Contacted':'ส่งแล้ว','Followed Up':'ติดตามแล้ว'};
 const CAT={intro:'แนะนำบริษัท / ขอนัดพบ',follow_up:'ตามลูกค้าหลังงาน',quotation:'ใบเสนอราคา',design:'ออกแบบบูธ',production:'ผลิต / ติดตั้ง',transport:'รถ / ขนส่ง',payment:'เอกสาร / การเงิน',other:'อื่นๆ'};
 const IMG='/admin/tracking-mail/img/cpx/';
 const n=v=>Number.isFinite(Number(v))?Number(v):0, f=v=>v==null?'—':n(v).toLocaleString('en-US');
 const TH=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
 const P=s=>String(s).slice(0,10).split('-').map(Number);
 const day=s=>{const [y,m,d]=P(s);return Date.UTC(y,m-1,d)};
 const short=s=>{const [y,m,d]=P(s);return `${d} ${TH[m-1]}`};
 const span=(a,b)=>!a?'ยังไม่เริ่มส่ง':a===b?short(a):P(a)[1]===P(b)[1]?`${P(a)[2]}–${short(b)}`:`${short(a)}–${short(b)}`;
 const d=v=>v?thaiDate(v,true):'—';
 const SVG={
  home:'<path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.8 9.6V20h4.6v-5.6h3.2V20h4.6V9.6"/>',
  send:'<path d="M21 3 9.6 14.4"/><path d="M21 3 14.2 21l-3.6-7.6L3 9.8z"/>',
  image:'<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><circle cx="9" cy="9" r="1.8"/><path d="m4 18 5.2-5.2 3.6 3.6 2.6-2.6L20 18"/>',
  history:'<path d="M3.6 12a8.4 8.4 0 1 0 2.5-6"/><path d="M3.3 4.2v4.4h4.4"/><path d="M12 7.6V12l3 2"/>',
  user:'<circle cx="12" cy="8" r="3.9"/><path d="M4.6 20.4c.9-3.9 3.9-6 7.4-6s6.5 2.1 7.4 6z"/>',
  grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  shield:'<path d="M12 3 4.8 5.8v5.6c0 4.6 3 8 7.2 9.6 4.2-1.6 7.2-5 7.2-9.6V5.8z"/><path d="m8.6 12 2.4 2.4 4.6-4.8"/>',
  cal:'<rect x="3.6" y="5" width="16.8" height="15.4" rx="2.4"/><path d="M3.6 9.6h16.8M8 3v4M16 3v4"/><path d="M7.6 13h1.2M11.4 13h1.2M15.2 13h1.2M7.6 16.6h1.2M11.4 16.6h1.2M15.2 16.6h1.2"/>',
  layers:'<path d="m12 3 9 4.8-9 4.8-9-4.8z"/><path d="m3 12 9 4.8 9-4.8"/><path d="m3 16.2 9 4.8 9-4.8"/>',
  bars:'<path d="M4 20.5h16"/><rect x="5.5" y="11" width="2.8" height="7.5" rx=".6"/><rect x="10.6" y="6" width="2.8" height="12.5" rx=".6"/><rect x="15.7" y="8.6" width="2.8" height="9.9" rx=".6"/>',
  mail:'<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="m3.6 6.6 8.4 6.6 8.4-6.6"/>',
  warn:'<path d="M12 3.6 2.6 19.8h18.8z"/><path d="M12 9.6v4.8M12 17.2h.01"/>',
  clock:'<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.2 2"/>',
  arrow:'<path d="M5 12h13.6M13.4 6.8 18.6 12l-5.2 5.2"/>',
  chev:'<path d="m6.5 9.5 5.5 5.5 5.5-5.5"/>',
  calsm:'<rect x="4" y="5.5" width="16" height="14.5" rx="2.2"/><path d="M4 10h16M8.4 3.5v4M15.6 3.5v4"/>',
  timer:'<circle cx="12" cy="13.2" r="7.4"/><path d="M12 9.4v4l2.4 1.4M9.6 2.8h4.8"/>',
  timer0:'<rect x="7.5" y="3.5" width="9" height="17" rx="4.5"/><path d="M12 8v4"/>'};
 const I=(k,c='')=>`<svg class="ci ${c}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${SVG[k]}</svg>`;
 const LANE_IC={
  send:'<svg class="li" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M21.4 2.8 2.6 10.6l7.4 2.8 2.8 7.4z"/><path d="m21.4 2.8-11.4 10.6"/></svg>',
  pause:'<svg class="li" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9.2"/><path d="M9.6 8.4v7.2M14.4 8.4v7.2" stroke-linecap="round"/></svg>',
  check:'<svg class="li solid" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="m6.8 12.4 3.4 3.4 7-7.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play:'<svg class="li solid" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M9.6 7.4v9.2l7.4-4.6z" fill="#fff"/></svg>',
  wait:'<svg class="li" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9.2"/><path d="M12 7.2v5.4M12 16.4h.01" stroke-linecap="round"/></svg>'};
 let source='gmail', sel=null, range='6m', listOpen=false, laneOpen={}, built=false, lastKey='';

 const gmail=()=>(payload?.accounts?.gmail?.data?.campaigns||[]).map(c=>({...c,_src:'gmail',_name:c.name+(/ติดตาม/.test(c.kind_label||'')?' (ติดตาม)':'')}));
 const harry=()=>(payload?.accounts?.harry?.data?.campaigns||[]).map(c=>({...c,_src:'harry',_name:c.subject,first_day:c.start,last_day:c.end,state:'done'}));
 const all=()=>source==='harry'?harry():source==='all'?[...gmail(),...harry()]:gmail();
 const find=s=>s&&(s.src==='harry'?harry():gmail()).find(c=>c.key===s.key);
 const isSel=c=>sel&&sel.src===c._src&&sel.key===c.key;

 const L={"tl":{"x":224,"y":147,"w":1360,"h":313},"st":{"x":232,"y":442,"w":808,"h":531},"dt":{"x":1019,"y":440,"w":565,"h":533},"head":{"x":262,"y":4,"w":528,"h":164},"acct":{"x":1286,"y":4,"w":295,"h":87}};
 /* What is baked into the base image (exactly Teen's picture). Code only redraws what differs from it. */
 const BAKED={detail:'viv_asia_2027_coldmail'};
 const layer=(k,inner='')=>`<div class="cx-layer cx-${k}" style="left:${L[k].x}px;top:${L[k].y}px;width:${L[k].w}px;height:${L[k].h}px"><img class="cx-lay-img" src="${IMG}layer-${k}.webp" alt="" aria-hidden="true"><div class="cx-in" style="left:${-L[k].x}px;top:${-L[k].y}px">${inner}</div></div>`;
 function build(){
  if(built)return;built=true;
  const nav=[['home','ภาพรวม',202],['send','ส่งเมล',262],['image','รายชื่อ',315],['history','ประวัติส่ง',367],['user','ผู้ติดต่อ',419],['grid','แคมเปญ',470],['shield','ระบบป้องกัน',522]];
  document.body.insertAdjacentHTML('beforeend',`<div id="cpx" hidden><div class="cx-stage">
   <img class="cx-bg" src="${IMG}bg.webp" alt="" aria-hidden="true">
   <aside class="cx-side"><nav class="cx-nav" aria-label="เมนูหลัก">${nav.map(([ic,t,y],i)=>`<button type="button" class="cx-nav-i cx-hit" style="top:${y}px" data-i="${i}" ${i===5?'aria-current="page"':''} aria-label="${t}"></button>`).join('')}</nav></aside>
   ${layer('head',`<a href="#" class="cx-hit" style="left:284px;top:118px;width:90px;height:28px" data-home aria-label="หน้าหลัก"></a>`)}
   ${layer('acct',`<button type="button" class="cx-hit cx-user" style="left:1312px;top:28px;width:116px;height:40px" aria-label="ผู้ใช้งาน"></button>
    <label class="cx-src"><span class="cx-src-l"></span><select aria-label="เลือกบัญชี"><option value="gmail">Teen · Gmail</option><option value="harry">Harry</option><option value="all">ทั้งหมด</option></select></label>
    <div class="cx-umenu" hidden><button type="button" data-overview>${I('home')}หน้าภาพรวม</button><button type="button" data-logout>${I('arrow')}ออกจากระบบ</button></div>`)}
   ${layer('tl',`<label class="cx-range"><span></span>${I('chev','sm')}<select aria-label="ช่วงเวลา"><option value="6m">6 เดือน</option><option value="all">ทั้งหมด</option></select></label>
    <button type="button" class="cx-hit cx-more" style="left:1452px;top:208px;width:102px;height:38px" aria-label="ดูทั้งหมด"></button><div class="cx-names"></div><div class="cx-plot"></div>`)}
   ${layer('st',`<img class="cx-st-empty" src="${IMG}status-empty.webp" alt="" aria-hidden="true" hidden><div class="cx-lanes"></div>`)}
   ${layer('dt',`<img class="cx-dt-empty" src="${IMG}detail-empty.webp" alt="" aria-hidden="true" hidden><div class="cx-dt-html"></div>
    <button type="button" class="cx-hit cx-sum" style="left:1428px;top:472px;width:124px;height:34px" aria-label="ดูสรุปเพิ่มเติม"></button><div class="cx-dt-hits"></div>`)}
   <img class="cx-dec cx-plane" src="${IMG}plane.webp" alt="" aria-hidden="true"><img class="cx-dec cx-cube" src="${IMG}cube.webp" alt="" aria-hidden="true"><img class="cx-dec cx-env" src="${IMG}envelope.webp" alt="" aria-hidden="true">
  </div></div>
  <dialog id="campaign-detail" aria-labelledby="cp-detail-title"><div class="detail-header"><div class="detail-heading"><p class="detail-eyebrow">รายละเอียดแคมเปญ</p><h2 id="cp-detail-title"></h2></div><button class="detail-close" type="button" aria-label="ปิด">×</button></div><div class="detail-body"></div></dialog>`);
  const root=$('#cpx');
  root.querySelectorAll('.cx-nav-i').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(i===5)return;location.hash=['','sent','leads','history','contacts','campaigns','protection'][i]});
  root.querySelector('[data-home]').onclick=e=>{e.preventDefault();location.hash=''};
  const um=root.querySelector('.cx-umenu');root.querySelector('.cx-user').onclick=e=>{e.stopPropagation();um.hidden=!um.hidden};
  document.addEventListener('click',e=>{if(!e.target.closest('.cx-acct'))um.hidden=true});
  um.querySelector('[data-overview]').onclick=()=>{location.hash=''};
  um.querySelector('[data-logout]').onclick=()=>{location.hash='';setTimeout(()=>$('#logout')?.click(),60)};
  root.querySelector('.cx-src select').onchange=e=>{source=e.target.value;sel=null;laneOpen={};listOpen=false;draw(true)};
  root.querySelector('.cx-range select').onchange=e=>{range=e.target.value;draw()};
  root.querySelector('.cx-more').onclick=()=>openList();
  root.querySelector('.cx-sum').onclick=()=>{const c=find(sel);c&&open(c._src,c.key)};
  const dlg=$('#campaign-detail');dlg.querySelector('.detail-close').onclick=()=>dlg.close();
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});dlg.addEventListener('close',()=>{document.body.style.overflow=''});
  addEventListener('resize',fit);
 }
 function fit(){const st=$('#cpx .cx-stage');if(st)st.style.zoom=(document.documentElement.clientWidth/1586).toFixed(5)}

 /* ① timeline — positions measured on Teen's image (stage px) */
 const MX=[540,711,885,1058,1219,1377], PX0=540, PITCH=167.4, SLOTS=[266,301,330,342,365,388,400];
 function timeline(){
  const list=all().filter(c=>n(c.sent)&&c.first_day);
  const dates=list.flatMap(c=>[c.first_day,c.last_day]).sort();
  const plot=$('#cpx .cx-plot'),names=$('#cpx .cx-names');
  if(!dates.length){plot.innerHTML='<p class="cx-empty" style="left:560px;top:320px">ยังไม่มีการส่ง</p>';names.innerHTML='';return}
  const [ly,lm]=P(dates[dates.length-1]);
  const endIdx=ly*12+lm-1, startIdx=range==='6m'?endIdx-5:(()=>{const [fy,fm]=P(dates[0]);return fy*12+fm-1})();
  const nM=endIdx-startIdx+1, pitch=nM>6?PITCH*5/(nM-1):PITCH;
  const mx=i=>nM===6?MX[i]:PX0+i*pitch;
  const xOf=s=>{const [y,m,dd]=P(s);const mi=y*12+m-1-startIdx;const dim=new Date(Date.UTC(y,m,0)).getUTCDate();const a=mx(Math.max(0,Math.min(nM-1,mi))),b=mi+1<nM?mx(mi+1):a+(nM===6?158:pitch);return a+(b-a)*(dd-1)/dim};
  const mLabel=i=>{const t=startIdx+i;return `${TH[t%12]} ${String(Math.floor(t/12)+543).slice(2)}`};
  $('#cpx .cx-range span').textContent=`${range==='6m'?'ทั้งหมด':'ทุกช่วง'} (${TH[startIdx%12]}–${TH[endIdx%12]} ${Math.floor(endIdx/12)+543})`;
  $('#cpx .cx-range select').value=range;
  const from=Date.UTC(Math.floor(startIdx/12),startIdx%12,1);
  const vis=list.filter(c=>day(c.last_day)>=from);
  const placed=[];
  const items=[...vis].sort((a,b)=>day(b.last_day)-day(a.last_day)||n(b.sent)-n(a.sent)).map((c,k)=>{
   const a=xOf(c.first_day),e=Math.max(xOf(c.last_day),a),bar=e-a>=10;
   const txt=`${f(c.sent)} ฉบับ · ${span(c.first_day,c.last_day)}`,tw=txt.length*6.6+4;
   const left=(bar?e:a)+16+tw>1440;
   const x0=left?a-14-tw:a-8, x1=left?(bar?e:a)+8:(bar?e:a)+16+tw;
   const y=SLOTS.find(y=>placed.every(p=>Math.abs(p.y-y)>=19||x1<p.x0-4||x0>p.x1+4));
   if(y==null)return null;placed.push({x0,x1,y});
   return {c,a,e,bar,txt,left,y,tone:k%2?'red':'blue'}}).filter(Boolean);
  const hidden=vis.length-items.length;
  plot.innerHTML=Array.from({length:nM},(_,i)=>{const x=mx(i);return `<span class="cx-m" style="left:${x+22}px">${mLabel(i)}</span><i class="cx-mdot" style="left:${x}px"></i><i class="cx-vg" style="left:${x}px"></i>`}).join('')+`<i class="cx-axis"></i><i class="cx-base"></i>`
   +items.map((it,k)=>`<button type="button" class="cx-mk ${it.bar?'bar':'dot'} ${it.tone}${isSel(it.c)?' on':''}" style="left:${it.bar?it.a:it.a-7}px;top:${it.y-(it.bar?6:7)}px;${it.bar?`width:${it.e-it.a}px;`:''}--k:${k}" data-src="${it.c._src}" data-key="${esc(it.c.key)}" aria-label="${esc(it.c._name)} ${esc(it.txt)}"></button>
    <span class="cx-ml${it.left?' l':''}" style="${it.left?`right:${1586-it.a+8}px`:`left:${(it.bar?it.e:it.a)+11}px`};top:${it.y-10}px;--k:${k}">${esc(it.txt)}</span>`).join('')
   +(hidden>0?`<span class="cx-hidden">+ อีก ${hidden} แคมเปญ</span>`:'');
  plot.querySelectorAll('.cx-mk').forEach(b=>b.onclick=()=>select(b.dataset.src,b.dataset.key));
  // name list (Teen's image: selected first, then the others newest-start first; the running one is on the board)
  const pool=list.filter(c=>c.state!=='sending'||source==='harry');
  const ordered=[...pool].sort((a,b)=>(isSel(b)-isSel(a))||day(b.first_day)-day(a.first_day));
  const shown=listOpen?ordered:ordered.slice(0,5);
  names.innerHTML=`<div class="cx-nl${listOpen?' open':''}">${shown.map(c=>`<button type="button" class="${isSel(c)?'on':''}" data-src="${c._src}" data-key="${esc(c.key)}" title="${esc(c._name)}">${esc(c._name)}</button>`).join('')}</div>
   ${ordered.length>5?`<button type="button" class="cx-nl-more">${listOpen?'ย่อ':'ดูเพิ่มเติม'} ${I('chev','sm'+(listOpen?' up':''))}</button>`:''}`;
  names.querySelectorAll('.cx-nl button').forEach(b=>b.onclick=()=>select(b.dataset.src,b.dataset.key));
  names.querySelector('.cx-nl-more')?.addEventListener('click',()=>{listOpen=!listOpen;timeline()});
 }

 /* ② status lanes — the 4 tinted columns and their headers are Teen's image; cards are drawn into them */
 const LANE_X=[[266,176],[461,173],[654,168],[843,166]];
 function lanes(){
  const harryView=source==='harry';
  const L4=harryView?[
    ['wait','รอ Harry ตอบ','ลูกค้าตอบแล้ว ยังไม่เห็นคำตอบ',c=>n(c.waiting_reply)>0],
    ['check','ลูกค้าตอบแล้ว','ตอบกลับครบแล้ว',c=>!n(c.waiting_reply)&&n(c.customer_replies)>0],
    ['send','ยังไม่มีคนตอบ','ส่งแล้ว รอลูกค้าตอบ',c=>!n(c.customer_replies)],null]
   :[['send','กำลังส่ง','',c=>c.state==='sending'],['pause','หยุดไว้','',c=>c.state==='paused'],['check','ยังไม่เริ่ม','',c=>c.state==='not_started'],['play','เสร็จแล้ว','',c=>c.state==='done']];
  $('#cpx .cx-st-empty').hidden=!harryView;
  const list=all(), box=$('#cpx .cx-lanes');
  const tones=['blue','red','green','purple'];
  box.innerHTML=L4.map((ln,li)=>{if(!ln)return '';const [ic,t,sub,test]=ln;const cs=list.filter(test);const vis=laneOpen[li]?cs:cs.slice(0,3);const [x,w]=LANE_X[li];
   const headHtml=harryView?`<div class="cx-lh t-${tones[li]}" style="left:${x+6}px"><h3>${LANE_IC[ic]}<span>${t}</span><em>${cs.length}</em></h3><p><i></i>${sub}</p></div>`
    :(source==='gmail'&&cs.length===[1,3,5,5][li]?'':`<em class="cx-badge t-${tones[li]}" style="left:${[373,564,768,958][li]-10}px">${cs.length}</em>`);
   return headHtml+`<div class="cx-col t-${tones[li]}${laneOpen[li]?' open':''}" style="left:${x}px;width:${w}px;--li:${li}">${vis.map((c,k)=>mini(c,k)).join('')||'<p class="cx-none">—</p>'}
    ${cs.length>3?`<button type="button" class="cx-lmore" data-li="${li}">${laneOpen[li]?'− ย่อ':`+ อีก ${cs.length-3} แคมเปญ`}</button>`:''}</div>`}).join('');
  box.querySelectorAll('.cx-mini').forEach(b=>b.onclick=()=>select(b.dataset.src,b.dataset.key));
  box.querySelectorAll('.cx-lmore').forEach(b=>b.onclick=()=>{laneOpen[b.dataset.li]=!laneOpen[b.dataset.li];lanes()});
 }
 function mini(c,k){
  const on=isSel(c)?' on':'';
  if(c._src==='harry')return `<button type="button" class="cx-mini${on}" style="--k:${k}" data-src="harry" data-key="${esc(c.key)}"><b>${esc(c._name)}</b>
   <span>ส่ง ${f(c.sent)} • ${esc(span(c.start,c.end))}</span><span>${I('timer')}ตอบ ${f(c.customer_replies)} • ค้าง ${f(c.waiting_reply)}</span></button>`;
  const pct=Math.max(0,Math.min(100,n(c.progress_pct)));
  if(c.state==='sending')return `<button type="button" class="cx-mini big${on}" style="--k:${k}" data-src="gmail" data-key="${esc(c.key)}"><b>${esc(c._name)}</b><span class="cx-pb"><i style="--w:${Math.max(pct,2)}%"></i></span>
   <span>ส่งแล้ว ${f(c.contacted)}/${f(c.leads)} • ${pct}%</span><span>${I('clock')}เหลือ ${f(c.pending)}</span></button>`;
  const ic=c.state==='paused'?'calsm':c.state==='not_started'?'timer0':'timer';
  return `<button type="button" class="cx-mini${on}" style="--k:${k}" data-src="gmail" data-key="${esc(c.key)}"><b>${esc(c._name)}</b>
   ${c.state==='not_started'?`<span>${I('timer0')}ติดต่อ ${f(c.contacted)}/${f(c.leads)} • เหลือ ${f(c.pending)}</span>`
    :`<span>ติดต่อ <strong>${f(c.contacted)}/${f(c.leads)} • ${pct}%</strong></span><span>${I(ic)}เหลือ ${f(c.pending)}</span>`}</button>`;
 }

 /* ③ detail — Teen's picture is VIV Asia 2027; when another campaign is chosen its area is wiped and redrawn */
 function detail(animate){
  const c=find(sel),html=$('#cpx .cx-dt-html'),hits=$('#cpx .cx-dt-hits');
  const baked=c&&c.key===BAKED.detail&&c._src==='gmail';
  $('#cpx .cx-dt-empty').hidden=baked;$('#cpx').classList.toggle('dt-baked',baked);
  if(!c){html.innerHTML='<p class="cx-empty" style="left:1062px;top:540px">เลือกแคมเปญเพื่อดูรายละเอียด</p>';hits.innerHTML='';return}
  if(baked){html.innerHTML='';
   hits.innerHTML=`<button type="button" class="cx-hit" style="left:1056px;top:818px;width:494px;height:23px" data-ref="${esc(c.recent?.[0]?.ref||'')}" aria-label="${esc(c.recent?.[0]?.company||'')}"></button>
    <button type="button" class="cx-hit" style="left:1056px;top:841px;width:494px;height:23px" data-ref="${esc(c.recent?.[1]?.ref||'')}" aria-label="${esc(c.recent?.[1]?.company||'')}"></button>
    <button type="button" class="cx-hit" style="left:1056px;top:864px;width:494px;height:23px" data-ref="${esc(c.recent?.[2]?.ref||'')}" aria-label="${esc(c.recent?.[2]?.company||'')}"></button>
    <button type="button" class="cx-hit cx-pri-hit" style="left:1058px;top:899px;width:206px;height:41px" data-read aria-label="อ่านแคมเปญนี้"></button>
    <button type="button" class="cx-hit" style="left:1282px;top:899px;width:140px;height:41px" data-full aria-label="ดูรายชื่อทั้งหมด"></button>`;
  }else{
   hits.innerHTML='';
   const rows=c._src==='harry'?[['ส่งแล้ว',n(c.sent),'navy'],['บริษัท',n(c.customers),'navy'],['ลูกค้าตอบ',n(c.customer_replies),'red']]
    :[['รายชื่อทั้งหมด',n(c.leads),'navy'],['ติดต่อแล้ว',n(c.contacted),'navy'],['รอส่ง',n(c.pending),'red']];
   const max=Math.max(...rows.map(r=>r[1]),1);
   const chip=c._src==='harry'?'<em class="cx-chip t-blue">Harry</em>':`<em class="cx-chip st-${esc(c.state)}">${STATES[c.state]||'—'}</em>`;
   const tiles=c._src==='harry'?[['mail','ส่งแล้ว',f(c.sent)],['warn','ค้างตอบ',f(c.waiting_reply),'warn'],['clock','อัตราตอบ',n(c.reply_rate_pct)+'%'],['cal','ส่งล่าสุด',short(c.end)]]
    :[['mail','ส่งแล้ว',f(c.sent)],['warn','ผิดพลาด',f(c.errors),'warn'],['clock','รอตรวจ',f((c.status_counts||{})['Unknown - Verify Before Resend']||0)],['cal','ส่งล่าสุด',c.last_day?short(c.last_day):'—']];
   const recent=c._src==='harry'?(c.batches||[]).slice(-3).reverse().map(b=>({t:`${b.event||'ยังระบุงานไม่ได้'} · ${f(b.companies)} บริษัท`,d:short(b.date),day:b.date}))
    :(c.recent||[]).slice(0,3).map(r=>({t:r.company,d:r.time?short(r.time):'',ref:r.ref||''}));
   html.innerHTML=`<h3><span>${esc(c._name)}</span>${chip}</h3><p class="cx-subj">${esc(c._src==='harry'?`${CAT[c.category]||''} · ${span(c.start,c.end)}`:(c.subject||'—'))}</p>
    <div class="cx-fun">${rows.map(([l,v,t],i)=>`<span>${l}</span><i><b class="${t}" style="--w:${v/max*100}%;--k:${i}"></b></i><strong data-count="${v}">${f(v)}</strong>`).join('')}</div>
    <div class="cx-tiles">${tiles.map(([ic,l,v,cls],i)=>`<div class="${cls||''}" style="--k:${i}">${I(ic)}<small>${l}</small><b>${esc(v)}</b></div>`).join('')}</div>
    <h4>${c._src==='harry'?'ส่งตามงานล่าสุด':'รายชื่อล่าสุด'}</h4><ul class="cx-rec">${recent.map((r,i)=>`<li style="--k:${i}"><button type="button" ${r.ref!=null?`data-ref="${esc(r.ref)}"`:`data-day="${esc(r.day)}"`}><img src="${IMG}av${i%3+1}.webp" alt=""><span>${esc(r.t)}</span><small>${esc(r.d)}</small></button></li>`).join('')||'<li class="cx-none">ยังไม่ได้ส่ง</li>'}</ul>
    <div class="cx-btns"><button type="button" class="cx-pri" data-read ${n(c.sent)?'':'disabled'}>${I('mail')}<span>อ่านแคมเปญนี้ (${f(c.sent)})</span>${I('arrow')}</button><button type="button" class="cx-sec" data-full>${c._src==='harry'?'ดูทุกวันที่ส่ง':'ดูรายชื่อทั้งหมด'} ${I('arrow')}</button></div>`;
  }
  const box=$('#cpx .cx-dt');
  box.querySelectorAll('[data-ref]').forEach(b=>b.onclick=()=>b.dataset.ref?MailReader.open({account:'gmail',ref:b.dataset.ref},true):MailReader.open({account:'gmail',campaign:c.key}));
  box.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>MailReader.open({account:'harry',campaign:c.key,day:b.dataset.day}));
  box.querySelectorAll('[data-read]').forEach(b=>b.onclick=()=>MailReader.open({account:c._src,campaign:c.key}));
  box.querySelectorAll('[data-full]').forEach(b=>b.onclick=()=>open(c._src,c.key));
  if(animate){box.classList.remove('anim');void box.offsetWidth;box.classList.add('anim');countUp(html)}
 }
 function countUp(box){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  box.querySelectorAll('[data-count]').forEach(el=>{const to=+el.dataset.count,t0=performance.now(),dur=900;
   const step=t=>{const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=f(Math.round(to*e));if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step)});
 }
 function openList(){
  const dlg=$('#campaign-detail'),body=dlg.querySelector('.detail-body');$('#cp-detail-title').textContent='แคมเปญทั้งหมด';
  const list=[...all()].sort((a,b)=>day(b.last_day||'1970-01-01')-day(a.last_day||'1970-01-01'));
  body.innerHTML=`<div class="cp-list">${list.map(c=>`<button type="button" data-src="${c._src}" data-key="${esc(c.key)}"><strong>${esc(c._name)}${c._src==='harry'?' · Harry':''}</strong><small>${esc(STATES[c.state]||'')} · ${f(c.sent)} ฉบับ · ${esc(span(c.first_day,c.last_day))}</small></button>`).join('')}</div>`;
  body.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{dlg.close();select(b.dataset.src,b.dataset.key)});
  if(!dlg.open){document.body.style.overflow='hidden';dlg.showModal()}
 }
 function select(src,key){sel={src,key};draw(false,true)}
 function pickDefault(){
  if(find(sel))return;
  const list=all();
  const c=source==='harry'?[...list].sort((a,b)=>n(b.waiting_reply)-n(a.waiting_reply)||day(b.end)-day(a.end))[0]
   :[...list].filter(c=>c.state==='paused').sort((a,b)=>day(b.last_day||'1970-01-01')-day(a.last_day||'1970-01-01'))[0]||list.find(c=>c.state==='sending')||list[0];
  sel=c?{src:c._src,key:c.key}:null;
 }
 function draw(intro,animDetail){
  pickDefault();
  const sl=$('#cpx .cx-src-l');$('#cpx .cx-src select').value=source;sl.textContent={gmail:'Teen · Gmail',harry:'Harry',all:'ทั้งหมด'}[source];
  $('#cpx').classList.toggle('src-gmail',source==='gmail');
  timeline();lanes();detail(intro||animDetail);
  if(intro){const r=$('#cpx');r.classList.remove('intro');void r.offsetWidth;r.classList.add('intro')}
 }
 const table=(head,body,cls='')=>`<div class="detail-table-wrap"><table class="${cls}"><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body||`<tr><td colspan="${head.length}">ยังไม่มีข้อมูล</td></tr>`}</tbody></table></div>`;
 const fields=items=>`<div class="cp-fields">${items.map(([l,v])=>`<div><small>${esc(l)}</small><b class="num">${esc(v)}</b></div>`).join('')}</div>`;
 function open(src,keyName){
  const c=(src==='harry'?harry():gmail()).find(x=>x.key===keyName);if(!c)return;
  const dlg=$('#campaign-detail'),body=dlg.querySelector('.detail-body');$('#cp-detail-title').textContent=c._name;
  if(src==='harry'){
   const waiting=(payload?.accounts?.harry?.data?.waiting||[]).filter(r=>r.campaign===c.key);
   body.innerHTML=`<p class="cp-detail-sub">Harry · ${esc(CAT[c.category]||'')} · ${esc(span(c.start,c.end))}</p>`+fields([['ส่งแล้ว',f(c.sent)],['บริษัท',f(c.customers)],['ลูกค้าตอบ',f(c.customer_replies)],['อัตราตอบ',n(c.reply_rate_pct)+'%'],['ค้างตอบ',f(c.waiting_reply)],['วันส่ง',f(c.send_days)]])
    +`<h3>ส่งตามงานแสดงสินค้า (ทีละวัน)</h3>`+table(['วันที่','งาน','บริษัท','ส่ง'],(c.batches||[]).map(b=>`<tr class="cp-row" tabindex="0" data-day="${esc(b.date)}"><td>${esc(thaiDate(b.date,true))}</td><td>${esc(b.event||'ยังระบุงานไม่ได้')}${/^(research|owner):/.test(b.source||'')?` <small class="cp-src" title="${esc(b.source)}">ที่มา</small>`:''}</td><td>${f(b.companies)}</td><td>${f(b.sent)}</td></tr>`).join(''))
    +`<p class="detail-note">ชื่องานมาจากการจับคู่บริษัทผู้รับกับรายชื่อผู้ออกบูธ (ต้องตรงกันเกินครึ่ง) · "ที่มา" = ค้นเพิ่มหรือเจ้าของยืนยัน · กดแถวเพื่ออ่านเมลของวันนั้น</p>`
    +`<h3>ลูกค้าตอบแล้ว ยังไม่เห็น Harry ตอบ</h3>`+(waiting.length?`<div class="cp-list">${waiting.map(r=>`<button type="button" data-thread="${esc(r.thread||'')}"><strong>${esc(r.customer||'')}</strong><small>${esc(thaiTime(r.time))}</small></button>`).join('')}</div>`:'<p class="detail-empty">ไม่มี</p>')
    +`<div class="cp-actions"><button type="button" data-all>อ่านเมลทั้งหมดในแคมเปญนี้</button></div><p class="detail-note">เห็นเฉพาะเมลที่ Harry cc ถึงพิมพ์ชนก</p>`;
   body.querySelectorAll('.cp-row').forEach(r=>{const go=()=>MailReader.open({account:'harry',campaign:c.key,day:r.dataset.day});r.onclick=go;r.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
   body.querySelectorAll('[data-thread]').forEach(b=>b.onclick=()=>MailReader.open({account:'harry',thread:b.dataset.thread,order:'asc'},true));
   body.querySelector('[data-all]').onclick=()=>MailReader.open({account:'harry',campaign:c.key});
  }else{
   body.innerHTML=`<p class="cp-detail-sub">${esc(c.subject||'')}</p>`+fields([['บริษัทเป้าหมาย',f(c.leads)],['ติดต่อแล้ว',f(c.contacted)],['รอส่ง',f(c.pending)],['ส่งแล้ว',f(c.sent)],['พยายามส่ง',f(c.attempts)],['ผิดพลาด',f(c.errors)],['วันส่ง',f(c.send_days)],['ความคืบหน้า',c.progress_pct==null?'—':n(c.progress_pct)+'%']])
    +`<h3>สถานะบริษัท</h3>`+table(['สถานะ','บริษัท'],Object.entries(c.status_counts||{}).map(([k,v])=>`<tr><td>${esc(STATUS[k]||(String(k).startsWith('Hold')?'พักไว้':k))}</td><td>${f(v)}</td></tr>`).join(''))
    +`<h3>ยอดส่งรายวัน</h3>`+table(['วันที่','ส่ง'],(c.daily||[]).map(x=>`<tr class="cp-row" tabindex="0" data-day="${esc(x.date)}"><td>${esc(thaiDate(x.date,true))}</td><td>${f(x.sent)}</td></tr>`).join(''))
    +`<h3>ส่งล่าสุด</h3>`+((c.recent||[]).length?`<div class="cp-list">${c.recent.map(r=>`<button type="button" data-ref="${esc(r.ref)}"><strong>${esc(r.company)}</strong><small>${esc(thaiTime(r.time))}</small></button>`).join('')}</div>`:'<p class="detail-empty">ยังไม่มี</p>')
    +`<div class="cp-actions"><button type="button" data-all>อ่านเมลทั้งหมดในแคมเปญนี้</button>${c.key==='intro_2026q4_intro'?'<button type="button" data-overview>ดูหน้าภาพรวมแคมเปญนี้</button>':''}</div>`;
   body.querySelectorAll('.cp-row').forEach(r=>{const go=()=>MailReader.open({account:'gmail',campaign:c.key,day:r.dataset.day});r.onclick=go;r.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
   body.querySelectorAll('[data-ref]').forEach(b=>b.onclick=()=>MailReader.open({account:'gmail',ref:b.dataset.ref},true));
   body.querySelector('[data-all]').onclick=()=>MailReader.open({account:'gmail',campaign:c.key});
   body.querySelector('[data-overview]')?.addEventListener('click',()=>{dlg.close();location.hash=''});
  }
  body.scrollTop=0;if(!dlg.open){document.body.style.overflow='hidden';dlg.showModal()}
 }



 function render(){
  if(!payload)return;build();
  const on=location.hash==='#campaigns';
  document.body.classList.toggle('cpx-on',on);$('#cpx').hidden=!on;
  if(!on)return;
  fit();const key=JSON.stringify([payload?.accounts?.gmail?.data?.generated_at||payload?.accounts?.gmail?.updated_at||'',source]);
  draw(key!==lastKey);lastKey=key;
 }
 window.addEventListener('hashchange',()=>{lastKey='';render();if(location.hash==='#campaigns')scrollTo(0,0)});
 document.addEventListener('click',e=>{const a=e.target.closest('[data-campaign-source]');if(a){e.preventDefault();source=a.dataset.campaignSource;sel=null;location.hash='campaigns';render()}});
 return {render,open,select,show(src='gmail'){source=src;sel=null;location.hash='campaigns'}};
})();
