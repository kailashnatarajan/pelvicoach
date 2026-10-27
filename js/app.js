import{MQTT,VIDEOS}from"./app-config.js";
const $=s=>document.querySelector(s),app=$("#app"),x=window.x={};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),clone=o=>JSON.parse(JSON.stringify(o));
const dk=(d=new Date())=>{const z=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate())};
const back=n=>{const d=new Date();d.setDate(d.getDate()-n);return d};
const daySet=a=>new Set(a.filter(s=>s.fin>0).map(s=>s.date));
const streak=a=>{const s=daySet(a);let i=s.has(dk())?0:1,n=0;while(s.has(dk(back(i)))){n++;i++}return n};
const ago=ds=>Math.round((new Date(dk())-new Date(ds))/864e5);
const when=ts=>new Date(ts).toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"});
const FEEL={1:"Hard",2:"Okay",3:"Good"};
const DEF=[
{n:"Settle and breathe",tip:"Sit or lie comfortably. Breathe slowly and let everything soften.",reps:1,work:0,rest:20,c:"#6FC7BA"},
{n:"Quick flicks",tip:"Squeeze and let go quickly, like a light blink.",reps:10,work:1,rest:1,c:"#E8B63A"},
{n:"Slow holds",tip:"Squeeze gently and lift inward. Keep breathing.",reps:8,work:5,rest:5,c:"#B79CE0"},
{n:"Long hold",tip:"Build up slowly, hold steady, then release fully.",reps:3,work:10,rest:10,c:"#F49AB6"},
{n:"The elevator",tip:"Lift a little, a bit more, then lower slowly.",reps:5,work:6,rest:4,c:"#7FB6F0"},
{n:"Cool down",tip:"Relax completely and notice the muscles letting go.",reps:1,work:0,rest:20,c:"#6FC7BA"}];
let EX=DEF;
const S={u:null,me:null,loaded:false,tab:"patient",su:false,err:"",view:"home",sessions:[],pts:[],selS:[],sel:null,draft:null,msg:"",snd:true,note:""};
let E=null,timer=null,BR=null,btimer=null,unsubs=[];
const flower=()=>`<svg viewBox="0 0 200 200" aria-hidden="true"><g id="pet" style="transform-origin:100px 100px">${[0,1,2,3,4,5,6,7].map(i=>`<ellipse class="pt" cx="100" cy="56" rx="20" ry="40" transform="rotate(${i*45} 100 100)"/>`).join("")}</g><circle cx="100" cy="100" r="22" fill="#F6C453"/></svg>`;

/* ---------- data (kept on this device) ---------- */
const KEY="pelvicoach_v1";
function persist(){try{localStorage.setItem(KEY,JSON.stringify({sessions:S.sessions,mode:S.me.mode}))}catch(e){}}
(()=>{let d={};try{d=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}S.me={mode:d.mode==="bedridden"?"bedridden":"workout"};S.sessions=Array.isArray(d.sessions)?d.sessions:[]})();
x.save=()=>{const s={...S.pending,feel:S.fd.feel,pain:S.fd.pain,note:($("#note")?.value||S.note||"").slice(0,300)};S.sessions=[s,...S.sessions];persist();S.msg="Saved on this device.";S.note="";S.view="home";render()};
x.skipToday=()=>{S.pending={date:dk(),ts:Date.now(),mode:S.me.mode,fin:0,total:EX.length,secs:0,skip:1};S.fd={feel:0,pain:true};S.note="Skipped: reported pain, bleeding or discomfort before the session.";x.save()};
x.setMode=v=>{S.me.mode=v;persist();render()};
x.keepNote=()=>{S.note=$("#note")?.value||""};
x.shareWeek=()=>{const a=S.sessions,d=[...daySet(a)].filter(k=>ago(k)<7).length,t="PelviCoach weekly summary: practised "+d+" of 7 days, "+streak(a)+"-day streak."+(a.some(s=>ago(s.date)<7&&s.pain)?" Discomfort was reported this week.":"");
  if(navigator.share){navigator.share({text:t}).catch(()=>{});return}
  try{navigator.clipboard.writeText(t);S.msg="Summary copied. Paste it into a message."}catch(e){S.msg=t}S.view="home";render()};
x.export=()=>{const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"',rows=[["date","time","mode","done","total","minutes","feeling","discomfort","note"].join(",")];
  S.sessions.forEach(s=>rows.push([s.date,new Date(s.ts).toLocaleTimeString(),s.mode,s.fin,s.total,Math.round(s.secs/60),FEEL[s.feel]||"",s.pain?"yes":"no",q(s.note)].join(",")));
  const l=document.createElement("a");l.href=URL.createObjectURL(new Blob([rows.join("\n")],{type:"text/csv"}));l.download="pelvicoach-sessions.csv";l.click()};
x.clear=()=>{if(confirm("Delete all saved sessions on this device?")){S.sessions=[];persist();render()}};

/* ---------- workout mode engine ---------- */
const dur=()=>E.ph==="ready"?3:E.ph==="squeeze"?EX[E.ei].work:EX[E.ei].rest;
function beep(){if(navigator.vibrate)navigator.vibrate(60);if(!S.snd)return;try{const a=S.ac||(S.ac=new AudioContext()),o=a.createOscillator(),g=a.createGain();o.frequency.value=E.ph==="squeeze"?660:440;g.gain.value=.08;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.15)}catch(e){}}
x.go=()=>S.me.mode==="bedridden"?x.bio():x.startW();
x.startW=()=>{
  E={ei:0,rep:1,ph:"ready",left:3000,run:true,fin:0,active:0,last:performance.now()};
  try{S.ac=S.ac||new AudioContext();S.ac.resume()}catch(e){}
  S.view="run";S.msg="";runUI();paint();
  try{navigator.wakeLock.request("screen").then(w=>S.wl=w,()=>{})}catch(e){}
  clearInterval(timer);timer=setInterval(tick,100);
};
function tick(){const n=performance.now(),dt=Math.min(n-E.last,400);E.last=n;if(!E.run)return;E.left-=dt;E.active+=dt;if(E.left<=0)nextPhase();if(E)paint()}
function nextPhase(){const q=EX[E.ei];
  if(E.ph==="ready")E.ph=q.work?"squeeze":"relax";else if(E.ph==="squeeze")E.ph="relax";
  else if(q.work&&E.rep<q.reps){E.rep++;E.ph="squeeze"}else{E.fin++;return adv()}
  E.left=dur()*1000;beep()}
function adv(){E.ei++;E.rep=1;if(E.ei>=EX.length)return finishW();E.ph=EX[E.ei].work?"squeeze":"relax";E.left=dur()*1000;beep()}
x.skip=()=>{adv();if(E)paint()};
x.pause=()=>{E.run=!E.run;E.last=performance.now();$("#pb").textContent=E.run?"Pause":"Resume"};
x.endW=()=>finishW();
function finishW(){
  clearInterval(timer);try{S.wl&&S.wl.release()}catch(e){}
  S.pending={date:dk(),ts:Date.now(),mode:"workout",fin:E.fin,total:EX.length,secs:Math.round(E.active/1000)};
  S.fd={feel:0,pain:false};S.note="";E=null;EX=S.me.plan&&S.me.plan.items&&S.me.plan.items.length?S.me.plan.items:DEF;S.view="feel";render();
}
function runUI(){app.innerHTML=`<div class="run"><div class="top"><span id="exn"></span><span id="rep"></span></div>
<div class="stage"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="none" stroke="var(--line)" stroke-width="6"/><circle id="arc" cx="100" cy="100" r="96" fill="none" stroke-width="6" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="603.2"/></svg><div class="fw">${flower()}</div></div>
<div id="ph" class="ph" aria-live="polite"></div><div id="sec" class="sec"></div><p id="tip" class="tip"></p><div class="dots" id="dots"></div>
<div class="row"><button class="btn" id="pb" onclick="x.pause()">Pause</button><button class="btn ghost" onclick="x.skip()">Skip exercise</button></div><button class="lnk" onclick="x.endW()">End session</button></div>`}
function paint(){
  const q=EX[E.ei],d=dur();
  $("#exn").textContent=q.n;$("#rep").textContent=q.work?`Rep ${E.rep} of ${q.reps}`:"";
  $("#ph").textContent={ready:"Get ready",squeeze:"Squeeze and lift",relax:"Relax fully"}[E.ph];
  $("#sec").textContent=Math.max(1,Math.ceil(E.left/1000));$("#tip").textContent=q.tip;
  const g=$("#pet");g.style.transitionDuration=Math.min(.7,d*.6)+"s";g.style.transform="scale("+(E.ph==="squeeze"?.5:1)+")";
  $("#arc").style.strokeDashoffset=603.2*(1-E.left/(d*1000));$(".stage").style.setProperty("--pc",q.c||"#B79CE0");
  $("#dots").innerHTML=EX.map((_,i)=>`<i class="${i<E.ei?"on":i===E.ei?"cur":""}"></i>`).join("");
}
document.addEventListener("visibilitychange",()=>{if(document.hidden&&E&&E.run)x.pause()});

/* ---------- bedridden biofeedback mode (from the first project) ---------- */
const QN=["ok","flat (lift-off)","mains noise"];
let B=null;
function bfeat(){let f;
  if(B.src==="live"){if(!B.live||performance.now()-B.liveT>3000)return null;f={...B.live}}
  else{const n=()=>Math.random()+Math.random()+Math.random()-1.5;f={pf:4+.96*(B.phase==="hold"||B.phase==="cal"?B.pfS:2)+n()*1.2,ab:4+.96*(B.phase==="hold"||B.phase==="cal"?B.abS:2)+n()*1.2,mr:.02+Math.random()*.03};
    if(B.fault==1)f.pf=.4+Math.random()*.3;if(B.fault==2){f.pf+=38;f.mr=.55+Math.random()*.1}}
  f.pf=+f.pf||0;f.ab=+f.ab||0;f.mr=+f.mr||0;
  f.q=f.pf<1.5?1:f.mr>.35?2:0;f.pp=cl((f.pf-4)/(B.mvc-4)*100,0,130);f.ap=cl((f.ab-4)/(B.mvc-4)*100,0,130);f.comp=f.ap>20&&f.ap>.5*f.pp;return f}
const bsay=(t,c)=>{B.msg=[t,c||""]},bgo=(p,now)=>{B.phase=p;B.t0=now};
function endRep(now){const t0=B.target,h0=B.hold,a=B.a,vf=a.v/a.n,nv=a.np/a.n>=.8,bad=a.bad/a.n>.3;let res,why;
  if(vf<.7){res="INVALID";why="signal rejected ("+QN[a.lq||1]+"): not scored, repeat"}
  else if(a.c/a.v>.3){res="COMPENSATED";why="abdominal co-activation: relax cue"}
  else if(a.p/a.v>=.8){res="OK";why="target held on valid windows"}else{res="MISS";why="below target on valid windows"}
  if(res!=="INVALID"){B.done++;
    if(res==="OK"){B.fails=0;if(++B.streak>=3){B.streak=0;if(B.hold<8&&B.done%2){B.hold++}else{B.target=Math.min(80,B.target+5)}}}
    else if(++B.fails>=2){B.fails=0;B.streak=0;B.hold=Math.max(2,B.hold-1);B.target=Math.max(15,B.target-5)}else B.streak=0}
  B.last=res;B.adapt=B.target>t0?"Target raised to "+B.target+"%. Well done.":B.target<t0?"Target lowered to "+B.target+"%. Let's make it easier.":"";
  B.log.push({res,tgt:a.tgt,hold:a.hold,avg:a.v?Math.round(a.pf/a.v):0,fc:nv&&bad});
  if(B.done>=B.goal){bgo("idle",now);bsay("Session complete. Well done.","ok");B.complete=true}else bgo("rest",now)}
function bctl(f,now){const el=(now-B.t0)/1000;
  if(B.phase==="cal"){if(f.q==0)B.mvt=Math.max(B.mvt,f.pf);bsay("Squeeze as hard as comfortable… "+Math.max(0,Math.ceil(4-el)));
    if(el>=4){B.mvc=Math.max(30,B.mvt);bgo("idle",now);bsay("Calibrated. Your maximum is set.","ok")}}
  else if(B.phase==="rest"){bsay("Relax completely");if(el>=B.rest){B.att++;B.a={n:0,v:0,p:0,np:0,c:0,bad:0,pf:0,lq:0,tgt:B.target,hold:B.hold};bgo("hold",now)}}
  else if(B.phase==="hold"){const a=B.a;a.n++;if(f.pp>=B.target)a.np++;if(f.q||f.comp)a.bad++;
    if(f.q==0){a.v++;a.pf+=f.pp;if(f.pp>=B.target)a.p++;if(f.comp)a.c++}else a.lq=f.q;
    if(f.q)bsay("Sensor not reading well. Check the patch.","bad");else if(f.comp)bsay("Relax your tummy and thighs","warn");else bsay("Squeeze gently and hold… "+Math.max(0,Math.ceil(B.hold-el)),"ok");
    if(el>=B.hold)endRep(now)}}
function btick(){const now=performance.now(),f=bfeat();
  if(!f){bsay("Waiting for sensor data… check that the device is on.","warn");return bpaint(null)}
  bctl(f,now);bpaint(f);if(B.complete){B.complete=false;finishBio()}}
const VT={OK:"✓ Correct squeeze.",COMPENSATED:"⚠ Your tummy helped too. Relax it.",MISS:"✕ Below the target. Squeeze a little harder.",INVALID:"⚠ Sensor not reading well. That one did not count."};
function bpaint(f){if(!BR)return;const[m,c]=B.msg,e=id=>document.getElementById(id);
  e("bmsg").textContent=m;e("bmsg").style.color=c==="bad"?"var(--warn)":c==="ok"?"var(--ok)":"inherit";
  if(f){e("orb").style.width=e("orb").style.height=(30+f.pp*1.6)+"px";e("pfv").textContent=Math.round(f.pp)+"%";e("pfb").style.width=cl(f.pp,0,100)+"%";e("abv").textContent=Math.round(f.ap)+"%";e("abb").style.width=cl(f.ap,0,100)+"%";e("sq").textContent=["Good","Patch not touching skin","Electrical noise"][f.q];e("sq").style.color=f.q?"var(--warn)":"var(--ok)"}
  e("tgt").style.width=e("tgt").style.height=(30+B.target*1.6)+"px";
  e("binfo").textContent=`Squeeze ${Math.min(B.done+(B.phase==="hold"?1:0),B.goal)} of ${B.goal} · Correct: ${B.log.filter(r=>r.res==="OK").length} · Target ${B.target}% · Hold ${B.hold} s`;
  const r=e("bres");r.hidden=!B.last;if(B.last){r.className="verdict "+(B.last==="OK"?"ok":"warn");r.textContent=VT[B.last]+(B.adapt?" "+B.adapt:"")}
  document.querySelectorAll("[data-sc]").forEach(b=>b.classList.toggle("sel",+b.dataset.sc===B.sc))}
const SC=[["Correct squeeze",70,4,0],["Tummy helping too",70,55,0],["Weak squeeze",12,4,0],["Loose patch",70,4,1],["Electrical noise",70,4,2]];
x.scen=i=>{const s=SC[i];B.sc=i;B.pfS=s[1];B.abS=s[2];B.fault=s[3]};
x.startBio=()=>{const P=Rpt.plan();Object.assign(B,{done:0,att:0,log:[],target:P.target,hold:P.hold,goal:P.goal,streak:0,fails:0,last:"",adapt:"",complete:false,t00:performance.now()});bgo("rest",performance.now())};

x.bio=()=>{
  const P=Rpt.plan();B={last:"",adapt:"",sc:0,mvc:100,mvt:0,target:P.target,hold:P.hold,rest:3,goal:P.goal,done:0,att:0,phase:"idle",t0:0,a:null,log:[],pfS:5,abS:3,fault:0,streak:0,fails:0,src:"sim",live:null,liveT:0,msg:["Press Calibrate, then Start session",""],t00:performance.now()};
  BR=true;S.view="bio";S.msg="";bioUI();btimer=setInterval(btick,50)};
function bioUI(){app.innerHTML=`<h1>Squeeze practice</h1>
<div class="card" style="text-align:center"><div id="bmsg" class="ph" role="status" aria-live="polite"></div><div class="orbw"><div id="tgt"></div><div id="orb"></div></div>
<p id="binfo" style="font-weight:800"></p><div id="bres" class="verdict" role="status" aria-live="polite" hidden></div></div>
<div class="card"><div class="meters"><div class="m"><span>Pelvic floor</span><b id="pfv">0%</b><div class="bar"><i id="pfb"></i></div></div><div class="m"><span>Tummy</span><b id="abv">0%</b><div class="bar"><i id="abb"></i></div></div></div><p>Sensor: <b id="sq">…</b></p></div>
<div class="row"><button class="btn" onclick="x.startBio()">Start</button><button class="btn ghost" onclick="finishBio()">Stop and save</button></div>
<div id="simbox" class="card"><h2>Try a situation</h2><p class="mute">Demo: tap one, then press Start.</p><div class="grid">${SC.map((s,i)=>`<button class="btn ghost" data-sc="${i}" onclick="x.scen(${i})">${s[0]}</button>`).join("")}</div></div>
<div class="card"><label>Where does the signal come from?<select onchange="x.src(this.value)"><option value="sim">Demo (no sensor needed)</option><option value="live">My sensor (Wokwi / ESP32)</option></select></label><p class="mute" id="mqs"></p><button id="cal" hidden class="btn ghost" onclick="B.mvt=0;bgo('cal',performance.now())">Calibrate first</button></div>`;window.B=B;window.bgo=bgo}
x.src=v=>{B.src=v;$("#cal").hidden=v!=="live";$("#simbox").hidden=v!=="sim";
  if(v==="live"&&!B.mq){$("#mqs").textContent="Connecting to the sensor…";
    try{B.mq=mqtt.connect(MQTT.url);B.mq.on("connect",()=>{B.mq.subscribe(MQTT.topic);$("#mqs")&&($("#mqs").textContent="Connected. Waiting for the device to publish.")});
      B.mq.on("message",(t,p)=>{try{B.live=JSON.parse(p.toString());B.liveT=performance.now()}catch(e){}});
      B.mq.on("error",()=>{$("#mqs")&&($("#mqs").textContent="Couldn’t connect. Switch back to the simulator.")})}catch(e){$("#mqs").textContent="MQTT unavailable here. Use the simulator."}}
  else if(v==="live")$("#mqs").textContent="Connected. Waiting for the device to publish."; else $("#mqs").textContent=""};
function finishBio(){
  clearInterval(btimer);if(B.mq){try{B.mq.end(true)}catch(e){}}
  const ok=B.log.filter(r=>r.res==="OK").length,log=B.log;BR=null;
  if(!log.length){S.view="home";return render()}
  S.pending={date:dk(),ts:Date.now(),mode:"bedridden",fin:ok,total:B.goal,secs:Math.round((performance.now()-B.t00)/1000),reps:log.map(r=>({r:r.res,t:r.tgt,h:r.hold,a:r.avg})),endTarget:B.target,falseAvoided:log.filter(r=>r.fc).length};
  S.fd={feel:0,pain:false};S.note="";S.view="feel";render()}


/* ---------- views ---------- */
function render(){
  if(E||BR)return;
  app.innerHTML=`<header><b>PelviCoach</b><span>${S.user?esc(S.user.full_name||"")+' <button class="lnk" onclick="Auth.signOut()">Sign out</button>':'Demo mode · <a href="index.html">Home</a>'}</span></header>`+view()+`<p class="disc">Prototype for exercise guidance. Not medical advice. Stop and tell your doctor if you feel pain. Your sessions are saved on this device only.</p>`;
}
const tabs=()=>`<div class="tabs">${[["home","Today"],["learn","Videos"],["hist","My report"]].map(([k,l])=>`<button class="${S.view===k?"on":""}" onclick="S.view='${k}';render()">${l}</button>`).join("")}</div>`;
function view(){
  const a=S.sessions,done=daySet(a).has(dk()),st=streak(a),bed=S.me.mode==="bedridden";
  if(S.view==="check")return`<h1>Before you begin</h1><div class="card"><p>Do you have any pain, bleeding or unusual discomfort today?</p><button class="btn ghost" onclick="x.skipToday()">Yes, I do</button><button class="btn" onclick="x.go()">No, I feel fine</button></div><button class="lnk" onclick="S.view='home';render()">Back</button>`;
  if(S.view==="feel"){const f=S.fd;return`<h1>How did that feel?</h1><p class="mute">This is saved on this device.</p>
<div class="feel">${[1,2,3].map(i=>`<button class="${f.feel===i?"sel":""}" onclick="S.fd.feel=${i};x.keepNote();render()">${FEEL[i]}</button>`).join("")}</div>
<label class="chk"><input type="checkbox" ${f.pain?"checked":""} onchange="S.fd.pain=this.checked">I had discomfort or leakage</label>
<textarea id="note" oninput="S.note=this.value" placeholder="Any notes? (optional)">${esc(S.note)}</textarea>
<button class="btn" ${f.feel?"":"disabled"} onclick="x.save()">Save my session</button>`}
  if(S.view==="learn")return tabs()+`<h1>Videos</h1>${VIDEOS.map(v=>`<div class="card"><h2>${esc(v.title)}</h2><video src="${esc(v.src)}" controls preload="metadata" playsinline onerror="this.nextElementSibling.hidden=false"></video><p class="mute" hidden>Video not found. Upload it to your repository as <b>${esc(v.src)}</b>.</p></div>`).join("")}`;
  if(S.view==="hist")return tabs()+Rpt.clientHtml(a);
  const wk=[6,5,4,3,2,1,0].map(i=>{const d=back(i);return`<div class="day">${d.toLocaleDateString(undefined,{weekday:"narrow"})}<i class="${daySet(a).has(dk(d))?"on":""} ${i===0?"today":""}"></i></div>`}).join("");
  const miss=!done&&a.length&&ago((a.find(s=>s.fin>0)||a[0]).date)>=1;
  return tabs()+`<div class="card hero">${flower()}<div><h1>${done?"Well done today":"Time for your session"}</h1><p>${st?st+"-day streak":"Start your streak today"}</p></div></div>
${S.msg?`<div class="nudge">${esc(S.msg)}</div>`:""}
${miss?`<div class="nudge">You haven’t done today’s session yet. It only takes a few minutes.</div>`:""}
${a[0]&&a[0].skip&&a[0].date===dk()?`<div class="nudge">You reported discomfort today. Please rest and contact your doctor.</div>`:""}
<div class="card"><h2>This week</h2><div class="week">${wk}</div></div>
<div class="card"><h2>${bed?"Today’s session":"Today’s exercises"}</h2><div class="tabs" style="margin-bottom:8px"><button class="${bed?"":"on"}" onclick="x.setMode('workout')">Follow the timer</button><button class="${bed?"on":""}" onclick="x.setMode('bedridden')">Use the sensor</button></div>
${bed?`<p>The sensor shows how well you squeeze. Practise with the demo, or connect the real sensor.</p>`:`<ul class="list">${EX.map(q=>`<li><span>${esc(q.n)}</span><span class="mute">${q.work?q.reps+" × "+q.work+"s":q.rest+"s"}</span></li>`).join("")}</ul>`}
<button class="btn" onclick="S.msg='';S.view='check';render()">${done?"Do it again":"Start today’s session"}</button>
${bed?"":`<button class="lnk" onclick="S.snd=!S.snd;render()">Sound cues: ${S.snd?"on":"off"}</button>`}</div>`;
}
x.finishBio=finishBio;window.finishBio=finishBio;window.S=S;window.render=render;window.clone=clone;window.DEF=DEF;
S.user=await Auth.guard("patient");render();
