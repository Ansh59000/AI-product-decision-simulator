
// ====== CANVAS GRID ======
(function(){
  const cv=document.getElementById('bgCanvas'),ctx=cv.getContext('2d');
  let W,H,pts=[];
  function resize(){
    W=cv.width=innerWidth;H=cv.height=innerHeight;
    pts=[];
    const sp=50;
    for(let x=0;x<W;x+=sp)for(let y=0;y<H;y+=sp)
      pts.push({x,y,ox:x,oy:y,r:Math.random()*1.3+0.3,a:Math.random()*0.5+0.15,ph:Math.random()*Math.PI*2});
  }
  let mx=-9999,my=-9999,t=0;
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
  function draw(){
    ctx.clearRect(0,0,W,H);t+=0.01;
    pts.forEach(p=>{
      const dx=mx-p.ox,dy=my-p.oy,d=Math.sqrt(dx*dx+dy*dy),rep=Math.max(0,1-d/130);
      p.x+=(p.ox-p.x)*0.07+Math.sin(t*0.9+p.ph)*0.5;
      p.y+=(p.oy-p.y)*0.07+Math.cos(t*0.9+p.ph)*0.5;
      if(rep>0){p.x-=dx*rep*0.1;p.y-=dy*rep*0.1}
      const prox=Math.max(0,1-d/180),pulse=0.5+Math.sin(t*1.4+p.ph)*0.5;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1+prox*0.9),0,Math.PI*2);
      ctx.fillStyle=prox>0.1?`rgba(200,240,74,${(p.a*0.25+prox*0.25)*pulse})`:`rgba(100,90,180,${p.a*0.25*pulse})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize();draw();addEventListener('resize',resize);
})();

// ====== REVEAL ======
addEventListener('load',()=>{
  setTimeout(()=>document.querySelectorAll('.reveal').forEach((el,i)=>setTimeout(()=>el.classList.add('in'),i*90)),80);
  document.getElementById('fts').textContent=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
});

// ====== MOUSE GLOW ON METRIC CARDS ======
document.addEventListener('mousemove',e=>{
  document.querySelectorAll('.mc').forEach(c=>{
    const r=c.getBoundingClientRect();
    c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
    c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
  });
});

// ====== PRESETS ======
const PRESETS=['Switch to a smaller model to cut costs by 60%','Add real-time web search to the assistant','Reduce max output length to improve latency','Add stricter content filtering to all outputs','Remove human review from the moderation loop','Fine-tune on customer support conversations','Enable streaming responses for all endpoints','Add multimodal image understanding'];
const MCFG=[
  {key:'accuracy',   label:'Accuracy',      bar:'fb'},
  {key:'speed',      label:'Speed',         bar:'fg'},
  {key:'cost',       label:'Cost Eff.',      bar:'fp'},
  {key:'satisfaction',label:'Satisfaction',  bar:'fa'},
  {key:'safety',     label:'Safety',         bar:'fr'},
];
let radarInst=null,history=[];
try{history=JSON.parse(localStorage.getItem('dsim2_h')||'[]')}catch(e){}

document.addEventListener('DOMContentLoaded',()=>{
  const w=document.getElementById('presetsWrap');
  PRESETS.forEach(p=>{const b=document.createElement('button');b.className='pchip';b.textContent=p;b.onclick=()=>{document.getElementById('dtarea').value=p;onInput()};w.appendChild(b)});
  renderHist();loadKeyStatus();setupTicker();
});

// ====== TICKER ======
const HINTS=['running tradeoff model','scoring metric impact','weighing risk factors','cross-referencing patterns','synthesizing feedback','generating recommendation'];
let tickI=null;
function setupTicker(){
  const t=document.getElementById('lticker');
  HINTS.forEach(h=>{const d=document.createElement('div');d.style.cssText='height:14px;display:flex;align-items:center;justify-content:center;font-size:9px;letter-spacing:0.08em;text-transform:uppercase';d.textContent=h;t.appendChild(d)});
}
function startTicker(){let i=0;const t=document.getElementById('lticker');t.style.transform='translateY(0)';tickI=setInterval(()=>{i=(i+1)%HINTS.length;t.style.transform=`translateY(${-i*14}px)`},1300)}
function stopTicker(){clearInterval(tickI);tickI=null}

// ====== INPUT ======
function onInput(){const v=document.getElementById('dtarea').value;document.getElementById('cc').textContent=v.length+' / 600'}

// ====== API KEY ======
function loadKeyStatus(){const k=localStorage.getItem('dsim_k'),dot=document.getElementById('sdot'),lbl=document.getElementById('apiLabel');if(k){dot.classList.add('on');lbl.textContent='Key active ✓'}else{dot.classList.remove('on');lbl.textContent='Add API Key'}}
function toggleApi(){const p=document.getElementById('apiPanel');p.classList.toggle('open');if(p.classList.contains('open'))document.getElementById('apiInput').value=localStorage.getItem('dsim_k')||''}
function saveKey(){const v=document.getElementById('apiInput').value.trim();if(!v)return;localStorage.setItem('dsim_k',v);loadKeyStatus();document.getElementById('apiPanel').classList.remove('open')}
function clearKey(){localStorage.removeItem('dsim_k');document.getElementById('apiInput').value='';loadKeyStatus()}

// ====== SIMULATION ======
async function runSim(){
  const decision=document.getElementById('dtarea').value.trim();
  if(!decision)return;
  const key=localStorage.getItem('dsim_k');
  if(!key){showErr('Add your Anthropic API key first — hit "Add API Key" in the top right.');return}
  setLoading(true);hideErr();startTicker();
  const SYS=`You are a senior AI product strategy consultant. Analyze the given AI product decision and return ONLY a valid JSON object with no markdown, no backticks, and nothing else before or after.

Schema:
{"metrics":{"accuracy":{"delta":<int -35 to 35>,"score":<0-100>,"description":"<max 12 words>"},"speed":{"delta":<int -35 to 35>,"score":<0-100>,"description":"<max 12 words>"},"cost":{"delta":<int -35 to 35>,"score":<0-100>,"description":"<max 12 words>"},"satisfaction":{"delta":<int -35 to 35>,"score":<0-100>,"description":"<max 12 words>"},"safety":{"delta":<int -35 to 35>,"score":<0-100>,"description":"<max 12 words>"}},"verdict":"<proceed|caution|reconsider>","summary":"<2-3 natural, conversational sentences — write like you're talking to a product manager, not writing a report>","tradeoffs":[{"type":"<gain|cost|neutral>","text":"<one specific, realistic tradeoff>"},{"type":"<gain|cost|neutral>","text":"<one specific, realistic tradeoff>"},{"type":"<gain|cost|neutral>","text":"<one specific, realistic tradeoff>"},{"type":"<gain|cost|neutral>","text":"<one specific, realistic tradeoff>"}],"recommendation":"<2 sentences — direct and actionable, like advice from a trusted colleague, not a consultant's report>","confidence":<1-5>}

delta = % change (positive = improvement). score = 0-100 performance level. Be realistic and specific.`;
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:SYS,messages:[{role:'user',content:`AI product decision: "${decision}"`}]})});
    if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error?.message||`Error ${r.status}`)}
    const data=await r.json();
    let raw=(data.content||[]).map(b=>b.text||'').join('').replace(/```json|```/g,'').trim();
    const parsed=JSON.parse(raw);
    stopTicker();setLoading(false);
    renderAll(parsed,decision);
    saveHist(decision,parsed);
  }catch(e){stopTicker();setLoading(false);showErr(e.message||'Something went wrong. Double-check your API key and try again.')}
}

// ====== RENDER ======
function renderAll(data,decision){
  renderMetrics(data.metrics);
  renderRadar(data.metrics);
  renderFeedback(data);
  document.getElementById('estate').classList.add('hidden');
  const rc=document.getElementById('rc');
  rc.classList.remove('hidden');
  rc.classList.add('fup');
}

function renderMetrics(metrics){
  const g=document.getElementById('mgrid2');
  g.innerHTML='';
  MCFG.forEach((cfg,i)=>{
    const m=metrics[cfg.key];if(!m)return;
    const d=m.delta,s=Math.min(100,Math.max(0,m.score));
    const dc=d>0?'dp':d<0?'dn':'dz',ds=(d>0?'+':'')+d+'%';
    let bar=cfg.bar;
    if(s<35)bar='fr';else if(s<60)bar='fa';
    const c=document.createElement('div');
    c.className='mc fup';c.style.animationDelay=(i*0.08)+'s';
    c.innerHTML=`<div class="mc-top"><span class="mc-name">${cfg.label}</span><span class="mcdelta ${dc}">${ds}</span></div><div style="display:flex;align-items:baseline;gap:4px;margin-bottom:2px"><span class="mc-score" data-t="${s}">0</span><span class="mc-denom">/100</span></div><div class="btrack"><div class="bfill ${bar}" style="width:0" data-w="${s}"></div></div><div class="mdesc">${m.description}</div>`;
    g.appendChild(c);
  });
  setTimeout(()=>{
    document.querySelectorAll('.bfill[data-w]').forEach(el=>el.style.width=el.dataset.w+'%');
    document.querySelectorAll('.mc-score[data-t]').forEach(el=>{
      const tgt=+el.dataset.t;let cur=0;
      const step=Math.max(1,tgt/45);
      const ti=setInterval(()=>{cur=Math.min(tgt,cur+step);el.textContent=Math.round(cur);if(cur>=tgt)clearInterval(ti)},18);
    });
  },60);
}

function renderRadar(metrics){
  if(radarInst){radarInst.destroy();radarInst=null}
  const keys=['accuracy','speed','cost','satisfaction','safety'];
  const labels=['Accuracy','Speed','Cost','Satisfaction','Safety'];
  const scores=keys.map(k=>metrics[k]?.score??50);
  radarInst=new Chart(document.getElementById('radarChart'),{
    type:'radar',
    data:{labels,datasets:[{data:scores,fill:true,backgroundColor:'rgba(200,240,74,0.08)',borderColor:'#c8f04a',borderWidth:2,pointBackgroundColor:'#c8f04a',pointBorderColor:'#07070f',pointBorderWidth:2,pointRadius:5,pointHoverRadius:7}]},
    options:{responsive:true,maintainAspectRatio:false,animation:{duration:1400,easing:'easeInOutQuart'},plugins:{legend:{display:false}},scales:{r:{min:0,max:100,ticks:{stepSize:25,color:'#48485e',font:{size:9,family:'DM Mono'},backdropColor:'transparent'},grid:{color:'rgba(120,110,200,0.1)'},angleLines:{color:'rgba(120,110,200,0.1)'},pointLabels:{color:'#8a8aaa',font:{size:11,family:'DM Sans'}}}}}
  });
}

function renderFeedback(data){
  const vc={proceed:'vp',caution:'vc',reconsider:'vr'},vl={proceed:'Proceed',caution:'Proceed with caution',reconsider:'Reconsider'};
  const v=data.verdict||'caution';
  const trHtml=(data.tradeoffs||[]).map(t=>{const tc=t.type==='gain'?'tgain':t.type==='cost'?'tcost':'tneut',ti=t.type==='gain'?'+':t.type==='cost'?'−':'~';return`<div class="trow"><div class="tico ${tc}">${ti}</div><span>${t.text}</span></div>`}).join('');
  const conf=Math.min(5,Math.max(1,data.confidence||3));
  const pips=Array.from({length:5},(_,i)=>`<div class="cpip${i<conf?' lit':''}"></div>`).join('');
  document.getElementById('fbcard').innerHTML=`<div class="vrow"><span class="vbadge ${vc[v]}"><span class="vdot"></span>${vl[v]}</span></div><p class="fbsum">${data.summary||''}</p><div class="tt">Key tradeoffs</div><div class="tlist">${trHtml}</div><div class="recblock"><div class="reclbl">Recommendation</div><div class="rectxt">${data.recommendation||''}</div></div><div class="confrow"><span class="conflbl">Confidence</span><div class="confpips">${pips}</div><span style="font-size:10px;color:var(--text3);font-family:'DM Mono',monospace">${conf}/5</span></div>`;
}

// ====== HISTORY ======
function saveHist(decision,result){const item={id:Date.now(),decision,verdict:result.verdict,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),result};history.unshift(item);if(history.length>12)history=history.slice(0,12);try{localStorage.setItem('dsim2_h',JSON.stringify(history))}catch(e){}renderHist()}
function renderHist(){
  const sec=document.getElementById('hist'),g=document.getElementById('hgrid');
  if(!history.length){sec.style.display='none';return}
  sec.style.display='block';sec.classList.add('in');
  g.innerHTML='';
  history.forEach(item=>{
    const vc={proceed:'dp',caution:'dz',reconsider:'dn'},vl={proceed:'↑ Proceed',caution:'~ Caution',reconsider:'↓ Reconsider'};
    const c=document.createElement('div');c.className='hcard';
    c.innerHTML=`<div class="hd">${item.decision}</div><div class="hmeta"><span class="hv ${vc[item.verdict]||''}">${vl[item.verdict]||item.verdict}</span><span class="ht">${item.time}</span></div>`;
    c.onclick=()=>{document.getElementById('dtarea').value=item.decision;onInput();renderAll(item.result,item.decision);scrollTo({top:0,behavior:'smooth'})};
    g.appendChild(c);
  });
}
function clearHist(){history=[];try{localStorage.removeItem('dsim2_h')}catch(e){}renderHist()}

// ====== UI HELPERS ======
function setLoading(on){document.getElementById('lstate').classList.toggle('on',on);document.getElementById('simbtn').disabled=on;if(on){document.getElementById('estate').classList.add('hidden');document.getElementById('rc').classList.add('hidden')}}
function showErr(m){const el=document.getElementById('errbanner');el.textContent='⚠ '+m;el.classList.add('on')}
function hideErr(){document.getElementById('errbanner').classList.remove('on')}

