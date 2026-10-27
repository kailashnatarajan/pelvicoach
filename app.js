import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import{SUPABASE_URL,SUPABASE_KEY,MQTT}from"./config.js";
const sb=createClient(SUPABASE_URL,SUPABASE_KEY);
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

/* ---------- auth and data (Supabase) ---------- */
const nice=e=>{const m=String(e&&e.message||"");return/Database error/i.test(m)?"Sign-up was rejected. Doctors: check the clinic code.":/Invalid login/i.test(m)?"Email or password is incorrect.":/already registered/i.test(m)?"That email already has an account.":/at least 6/i.test(m)?"Password needs at least 6 characters.":/rate limit/i.test(m)?"Too many tries. Please wait a moment.":m||"Something went wrong."};
x.setTab=t=>{S.tab=t;S.err="";render()};
x.toggleSu=()=>{S.su=!S.su;S.err="";render()};
x.out=()=>sb.auth.signOut();
x.reset=async()=>{const em=$("#em").value.trim();if(!em){S.err="Type your email first.";return render()}const{error}=await sb.auth.resetPasswordForEmail(em);S.err=error?nice(error):"Reset link sent. Check your email.";render()};
x.submit=async()=>{
  const em=$("#em").value.trim(),pw=$("#pw").value,d=S.tab==="doctor";S.err="";
  try{
    if(!S.su){const{error}=await sb.auth.signInWithPassword({email:em,password:pw});if(error)throw error;return}
    const nm=$("#nm").value.trim();if(!nm||!$("#cn").checked)throw{message:"Please enter your name and tick the consent box."};
    const ic=d?"":$("#ic").value.trim();
    if(ic){const c=await sb.rpc("pc_check_invite",{code:ic});if(c.error)throw c.error;if(!c.data)throw{message:"That invite code wasn’t found. Check it, or leave it blank to sign up without a doctor."}}
    const meta=d?{role:"doctor",name:nm,clinic_code:$("#cc").value.trim()}:{role:"patient",name:nm,invite_code:ic};
    const{data,error}=await sb.auth.signUp({email:em,password:pw,options:{data:meta}});if(error)throw error;
    if(!data.session){S.err="Account created. Check your email to confirm it, then sign in.";S.su=false}
  }catch(e){S.err=nice(e)}
  render();
};
let poll=null;
async function load(){
  if(!S.u)return;const uid=S.u.id,live=()=>S.u&&S.u.id===uid;
  const p=await sb.from("pc_profiles").select("*").eq("id",uid).maybeSingle();if(!live())return;
  if(p.data)S.me=p.data;else if(!p.error)S.me=null;
  if(S.me&&S.me.role==="patient"&&!E)EX=S.me.doctor_id&&S.me.plan&&S.me.plan.items&&S.me.plan.items.length?S.me.plan.items:DEF;
  const s=await sb.from("pc_sessions").select("data").eq("user_id",uid).order("ts",{ascending:false});if(!live())return;if(s.data)S.sessions=s.data.map(r=>r.data);
  if(S.me&&S.me.role==="doctor"){
    const q=await sb.from("pc_profiles").select("*").eq("doctor_id",uid);if(!live())return;if(q.data)S.pts=q.data;
    if(S.sel){const z=await sb.from("pc_sessions").select("data").eq("user_id",S.sel).order("ts",{ascending:false});if(!live())return;if(z.data)S.selS=z.data.map(r=>r.data)}
  }
  render();
}
sb.auth.onAuthStateChange((ev,ses)=>{setTimeout(()=>{
  const u=ses&&ses.user||null;
  if(u&&S.u&&S.u.id===u.id){S.u=u;return}
  clearInterval(poll);
  if(!u){clearInterval(timer);clearInterval(btimer);try{S.wl&&S.wl.release()}catch(e){}if(B&&B.mq){try{B.mq.end(true)}catch(e){}}E=null;BR=null}
  S.u=u;S.me=null;S.sessions=[];S.pts=[];S.sel=null;S.view="home";S.loaded=true;
  if(!u)return render();
  render();load();poll=setInterval(()=>{const f=document.activeElement;if(!E&&!BR&&!(f&&/INPUT|TEXTAREA|SELECT/.test(f.tagName)))load()},15000);
},0)});
function summary(a){const f=a.slice(0,7).filter(s=>s.feel);return{total:a.length,lastDate:(a.find(s=>s.fin>0)||a[0]).date,streak:streak(a),days7:[...daySet(a)].filter(d=>ago(d)<7).length,feelAvg:f.length?+(f.reduce((t,s)=>t+s.feel,0)/f.length).toFixed(1):0,lastPain:!!a[0].pain,ts:Date.now()}}
x.save=async()=>{
  const s={...S.pending,feel:S.fd.feel,pain:S.fd.pain,note:($("#note")?.value||S.note||"").slice(0,300)},all=[s,...S.sessions];
  try{
    const a=await sb.from("pc_sessions").insert({id:"s"+s.ts,user_id:S.u.id,ts:s.ts,data:s});if(a.error)throw a.error;
    const b=await sb.from("pc_profiles").update({summary:summary(all)}).eq("id",S.u.id);if(b.error)throw b.error;
    S.msg=S.me.doctor_id?"Saved. Your doctor can see this session.":"Saved to your history.";S.note="";S.view="home";
  }catch(e){S.msg="Couldn’t save. Check your connection and press Save again."}
  await load();
};
x.skipToday=()=>{S.pending={date:dk(),ts:Date.now(),mode:S.me.mode,fin:0,total:EX.length,secs:0,skip:1};S.fd={feel:0,pain:true};S.note="Skipped: reported pain, bleeding or discomfort before the session.";x.save()};
x.keepNote=()=>{S.note=$("#note")?.value||""};
x.shareWeek=()=>{const a=S.sessions,d=[...daySet(a)].filter(k=>ago(k)<7).length,t="PelviCoach weekly summary: practised "+d+" of 7 days, "+streak(a)+"-day streak."+(a.some(s=>ago(s.date)<7&&s.pain)?" Discomfort was reported this week.":"");
  if(navigator.share){navigator.share({text:t}).catch(()=>{});return}
  try{navigator.clipboard.writeText(t);S.msg="Summary copied. Paste it into a message."}catch(e){S.msg=t}S.view="home";render()};

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
  else{const n=()=>Math.random()+Math.random()+Math.random()-1.5;f={pf:4+.96*B.pfS+n()*1.2,ab:4+.96*B.abS+n()*1.2,mr:.02+Math.random()*.03};
    if(B.fault==1)f.pf=.4+Math.random()*.3;if(B.fault==2){f.pf+=38;f.mr=.55+Math.random()*.1}}
  f.pf=+f.pf||0;f.ab=+f.ab||0;f.mr=+f.mr||0;
  f.q=f.pf<1.5?1:f.mr>.35?2:0;f.pp=cl((f.pf-4)/(B.mvc-4)*100,0,130);f.ap=cl((f.ab-4)/(B.mvc-4)*100,0,130);f.comp=f.ap>20&&f.ap>.5*f.pp;return f}
const bsay=(t,c)=>{B.msg=[t,c||""]},bgo=(p,now)=>{B.phase=p;B.t0=now};
function endRep(now){const a=B.a,vf=a.v/a.n,nv=a.np/a.n>=.8,bad=a.bad/a.n>.3;let res,why;
  if(vf<.7){res="INVALID";why="signal rejected ("+QN[a.lq||1]+"): not scored, repeat"}
  else if(a.c/a.v>.3){res="COMPENSATED";why="abdominal co-activation: relax cue"}
  else if(a.p/a.v>=.8){res="OK";why="target held on valid windows"}else{res="MISS";why="below target on valid windows"}
  if(res!=="INVALID"){B.done++;
    if(res==="OK"){B.fails=0;if(++B.streak>=3){B.streak=0;if(B.hold<8&&B.done%2){B.hold++}else{B.target=Math.min(80,B.target+5)}}}
    else if(++B.fails>=2){B.fails=0;B.streak=0;B.hold=Math.max(2,B.hold-1);B.target=Math.max(15,B.target-5)}else B.streak=0}
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
function bpaint(f){if(!BR)return;const[m,c]=B.msg;$("#bmsg").textContent=m;$("#bmsg").style.color=c==="bad"?"var(--warn)":c==="ok"?"var(--ok)":"inherit";
  if(f){$("#orb").style.width=$("#orb").style.height=(30+f.pp*1.6)+"px";$("#rr").textContent=`Pelvic floor ${Math.round(f.pp)}% · Abdomen ${Math.round(f.ap)}% · Signal ${QN[f.q]}`}
  $("#tgt").style.width=$("#tgt").style.height=(30+B.target*1.6)+"px";
  $("#binfo").textContent=`Good reps ${B.done}/${B.goal} · target ${B.target}% · hold ${B.hold} s`}
x.bio=()=>{
  B={mvc:100,mvt:0,target:30,hold:3,rest:3,goal:8,done:0,att:0,phase:"idle",t0:0,a:null,log:[],pfS:5,abS:3,fault:0,streak:0,fails:0,src:"sim",live:null,liveT:0,msg:["Press Calibrate, then Start session",""],t00:performance.now()};
  BR=true;S.view="bio";S.msg="";bioUI();btimer=setInterval(btick,50)};
function bioUI(){app.innerHTML=`<h1>Guided biofeedback</h1>
<label>Signal source<select onchange="x.src(this.value)"><option value="sim">Built-in simulator</option><option value="live">Live sensor (Wokwi ESP32 over MQTT)</option></select></label>
<p class="mute" id="mqs"></p>
<div class="card" style="text-align:center"><div id="bmsg" class="ph" role="status" aria-live="polite"></div><div class="orbw"><div id="tgt"></div><div id="orb"></div></div><p id="binfo"></p><p class="mute" id="rr"></p></div>
<div class="row"><button class="btn ghost" onclick="B.mvt=0;bgo('cal',performance.now())">Calibrate</button><button class="btn" onclick="B.done=0;B.att=0;B.log=[];B.target=30;B.hold=3;B.streak=B.fails=0;B.t00=performance.now();bgo('rest',performance.now())">Start session</button></div>
<div id="simbox" class="card"><h2>Simulator</h2><label>Pelvic floor squeeze<input type="range" min="0" max="100" value="5" oninput="B.pfS=+this.value"></label><label>Abdomen<input type="range" min="0" max="100" value="3" oninput="B.abS=+this.value"></label>
<div class="row"><button class="btn ghost" onclick="B.fault=B.fault==1?0:1">Lift-off</button><button class="btn ghost" onclick="B.fault=B.fault==2?0:2">Noise</button></div></div>
<button class="lnk" onclick="finishBio()">End session</button>`;window.B=B;window.bgo=bgo}
x.src=v=>{B.src=v;$("#simbox").hidden=v!=="sim";
  if(v==="live"&&!B.mq){$("#mqs").textContent="Connecting to the sensor…";
    try{B.mq=mqtt.connect(MQTT.url);B.mq.on("connect",()=>{B.mq.subscribe(MQTT.topic);$("#mqs")&&($("#mqs").textContent="Connected. Waiting for the device to publish.")});
      B.mq.on("message",(t,p)=>{try{B.live=JSON.parse(p.toString());B.liveT=performance.now()}catch(e){}});
      B.mq.on("error",()=>{$("#mqs")&&($("#mqs").textContent="Couldn’t connect. Switch back to the simulator.")})}catch(e){$("#mqs").textContent="MQTT unavailable here. Use the simulator."}}
  else if(v==="live")$("#mqs").textContent="Connected. Waiting for the device to publish."; else $("#mqs").textContent=""};
function finishBio(){
  clearInterval(btimer);if(B.mq){try{B.mq.end(true)}catch(e){}}
  const ok=B.log.filter(r=>r.res==="OK").length,log=B.log;BR=null;
  if(!log.length){S.view="home";return render()}
  S.pending={date:dk(),ts:Date.now(),mode:"bedridden",fin:ok,total:B.goal,secs:Math.round((performance.now()-B.t00)/1000),reps:log.map(r=>({r:r.res,t:r.tgt,h:r.hold,a:r.avg})),falseAvoided:log.filter(r=>r.fc).length};
  S.fd={feel:0,pain:false};S.note="";S.view="feel";render()}
x.finishBio=finishBio;window.finishBio=finishBio;

/* ---------- views ---------- */
function render(){
  if(E||BR)return;
  let h;
  if(!S.loaded)h="<p>Loading…</p>";
  else if(!S.u)h=authView();
  else if(!S.me)h=`<h1>Setting up your account…</h1><p class="mute">If this doesn’t finish, sign out and try again.</p><button class="lnk" onclick="x.out()">Sign out</button>`;
  else h=`<header><b>PelviCoach</b><span>${esc(S.me.name)} · ${S.me.role} <button class="lnk" onclick="x.out()">Sign out</button></span></header>`+(S.me.role==="doctor"?doctorView():patientView())+`<p class="disc">Prototype for exercise guidance. Not medical advice. Stop and tell your doctor if you feel pain.</p>`;
  app.innerHTML=h;
}
function authView(){const d=S.tab==="doctor",su=S.su;return`<h1>PelviCoach</h1><p class="mute">Pelvic floor rehabilitation, guided and tracked.</p>
<div class="tabs"><button class="${!d?"on":""}" onclick="x.setTab('patient')">I’m a patient</button><button class="${d?"on":""}" onclick="x.setTab('doctor')">I’m a doctor</button></div>
<div class="card"><h2>${su?"Create account":"Sign in"}</h2>
${su?`<label>Full name<input id="nm" autocomplete="name"></label>`:""}
<label>Email<input id="em" type="email" autocomplete="email"></label>
<label>Password<input id="pw" type="password" autocomplete="${su?"new-password":"current-password"}"></label>
${su?(d?`<label>Clinic code<input id="cc"></label>`:`<label>Doctor’s invite code (optional)<input id="ic" autocapitalize="characters"></label>`)+`<label class="chk"><input type="checkbox" id="cn">I understand this is a prototype for exercise guidance, not medical advice, and I agree to my exercise data being stored and shared with my doctor.</label>`:""}
<p class="err" role="alert">${esc(S.err)}</p>
<button class="btn" onclick="x.submit()">${su?"Create account":"Sign in"}</button>
<button class="lnk" onclick="x.toggleSu()">${su?"I already have an account":"Create an account"}</button>
${su?"":`<button class="lnk" onclick="x.reset()">Forgot password?</button>`}</div>`}
function patientView(){
  const a=S.sessions,done=daySet(a).has(dk()),st=streak(a),bed=S.me.mode==="bedridden";
  if(S.view==="check")return`<h1>Before you begin</h1><div class="card"><p>Do you have any pain, bleeding or unusual discomfort today?</p><button class="btn ghost" onclick="x.skipToday()">Yes, I do</button><button class="btn" onclick="x.go()">No, I feel fine</button></div><button class="lnk" onclick="S.view='home';render()">Back</button>`;
  if(S.view==="feel"){const f=S.fd;return`<h1>How did that feel?</h1><p class="mute">${S.me.doctor_id?"Your doctor will see this.":"This is saved to your own history."}</p>
<div class="feel">${[1,2,3].map(i=>`<button class="${f.feel===i?"sel":""}" onclick="S.fd.feel=${i};x.keepNote();render()">${FEEL[i]}</button>`).join("")}</div>
<label class="chk"><input type="checkbox" ${f.pain?"checked":""} onchange="S.fd.pain=this.checked">I had discomfort or leakage</label>
<textarea id="note" oninput="S.note=this.value" placeholder="Anything to tell your doctor? (optional)">${esc(S.note)}</textarea>
<p class="err" role="alert">${esc(S.msg)}</p><button class="btn" ${f.feel?"":"disabled"} onclick="x.save()">Save my session</button>`}
  const tabs=`<div class="tabs"><button class="${S.view==="home"?"on":""}" onclick="S.view='home';render()">Today</button><button class="${S.view==="hist"?"on":""}" onclick="S.view='hist';render()">My history</button></div>`;
  if(S.view==="hist")return tabs+`<div class="card"><h2>Past sessions</h2><button class="btn ghost" onclick="x.shareWeek()">Share this week’s summary</button>${a.length?`<ul class="list">${a.map(s=>`<li><span>${when(s.ts)}<br><span class="mute">${s.skip?"Skipped (discomfort)":s.fin+" of "+s.total+(s.mode==="bedridden"?" good reps":" exercises")} · ${Math.round(s.secs/60)} min${s.note&&!s.skip?" · “"+esc(s.note)+"”":""}</span></span><b>${FEEL[s.feel]||""}${s.pain?" ⚑":""}</b></li>`).join("")}</ul>`:`<p class="mute">No sessions yet.</p>`}</div>`;
  const wk=[6,5,4,3,2,1,0].map(i=>{const d=back(i);return`<div class="day">${d.toLocaleDateString(undefined,{weekday:"narrow"})}<i class="${daySet(a).has(dk(d))?"on":""} ${i===0?"today":""}"></i></div>`}).join("");
  const miss=!done&&a.length&&ago((a.find(s=>s.fin>0)||a[0]).date)>=1,paused=S.me.doctor_id&&S.me.plan&&S.me.plan.paused;
  return tabs+`<div class="card hero">${flower()}<div><h1>${done?"Well done today":"Time for your session"}</h1><p>${st?st+"-day streak":"Start your streak today"}</p></div></div>
${S.msg?`<div class="nudge">${esc(S.msg)}</div>`:""}
${miss?`<div class="nudge">You haven’t done today’s session yet. It only takes a few minutes.</div>`:""}
${a[0]&&a[0].skip&&a[0].date===dk()?`<div class="nudge">You reported discomfort today. Please rest and contact your doctor.</div>`:""}
<div class="card"><h2>This week</h2><div class="week">${wk}</div></div>
<div class="card"><h2>${bed?"Today’s session":"Today’s exercises"}</h2><div class="tabs" style="margin-bottom:8px"><button class="${bed?"":"on"}" onclick="x.setMode('workout')">Workout</button><button class="${bed?"on":""}" onclick="x.setMode('bedridden')">Bedridden</button></div>
${bed?`<p>Guided biofeedback with live squeeze feedback, from the simulator or your sensor.</p>`:`<ul class="list">${EX.map(q=>`<li><span>${esc(q.n)}</span><span class="mute">${q.work?q.reps+" × "+q.work+"s":q.rest+"s"}</span></li>`).join("")}</ul>`}
${paused?`<div class="nudge">Your doctor has paused your plan. Rest today and check back soon.</div>`:`<button class="btn" onclick="S.view='check';render()">${done?"Do it again":"Start today’s session"}</button>`}
${bed?"":`<button class="lnk" onclick="S.snd=!S.snd;render()">Sound cues: ${S.snd?"on":"off"}</button>`}</div>${docCard()}`;
}
function docCard(){return S.me.doctor_id?`<div class="card"><h2>Your doctor</h2><p class="mute">Linked. They can see your sessions and feedback${S.me.plan?" and have set your plan":""}.</p><button class="btn ghost" onclick="x.unlink()">Unlink my doctor</button></div>`:`<div class="card"><h2>Link a doctor (optional)</h2><p class="mute">Enter your doctor’s invite code so they can follow your progress.</p><label>Invite code<input id="lc" autocapitalize="characters"></label><p class="err" role="alert">${esc(S.lerr||"")}</p><button class="btn ghost" onclick="x.link()">Link my doctor</button></div>`}
x.link=async()=>{const c=$("#lc").value.trim();if(!c){S.lerr="Type the invite code first.";return render()}const r=await sb.rpc("pc_link_doctor",{code:c});S.lerr=r.error?"Couldn’t link. Try again.":r.data?"":"That invite code wasn’t found.";if(r.data)S.msg="Doctor linked.";await load()};
x.unlink=async()=>{if(!confirm("Unlink your doctor? They will no longer see your sessions."))return;await sb.rpc("pc_link_doctor",{code:null});S.msg="Doctor unlinked.";await load()};
x.setMode=async v=>{if(S.me.mode===v)return;const r=await sb.from("pc_profiles").update({mode:v}).eq("id",S.u.id);if(!r.error)S.me.mode=v;await load()};
const status=p=>{const s=p.summary;if(!s)return["No sessions yet","bad"];const g=ago(s.lastDate);return g===0?["Done today","ok"]:g===1?["Due today",""]:["Missed "+g+" days","bad"]};
function doctorView(){
  const code=`<div class="card"><p class="mute">Give this invite code to your patients</p><h1 style="letter-spacing:.1em">${esc(S.me.invite_code)}</h1></div>`;
  if(S.sel){const p=S.pts.find(q=>q.id===S.sel)||{},s=p.summary||{},a=S.selS,[t,c]=status(p),d=S.draft||DEF;
    const bars=[13,12,11,10,9,8,7,6,5,4,3,2,1,0].map(i=>{const k=dk(back(i)),m=a.filter(z=>z.date===k).reduce((n,z)=>n+z.secs,0)/60;return`<i class="${m?"":"z"}" style="height:${Math.min(100,m*20)}%" title="${k}"></i>`}).join("");
    const d14=new Set(a.filter(z=>z.fin>0&&ago(z.date)<14).map(z=>z.date)).size,cr=a.length?Math.round(a.reduce((n,z)=>n+z.fin/z.total,0)/a.length*100):0;
    return`<button class="lnk" onclick="x.sel(null)">‹ All patients</button><h1>${esc(p.name||"Patient")}</h1><span class="chip ${c}">${t}</span>
<div class="grid" style="margin-top:12px"><div class="stat"><b>${s.streak||0}</b>day streak</div><div class="stat"><b>${d14} / 14</b>days practised</div><div class="stat"><b>${cr}%</b>completed</div><div class="stat"><b>${s.feelAvg||"–"} / 3</b>average feeling</div></div>
<div class="card"><h2>Patient mode</h2><p class="mute">The patient can also change this themselves.</p><select onchange="x.mode(this.value)"><option value="workout" ${p.mode!=="bedridden"?"selected":""}>Workout (can move around)</option><option value="bedridden" ${p.mode==="bedridden"?"selected":""}>Bedridden (biofeedback)</option></select><p class="mute">${esc(S.pm||"")}</p></div>
<div class="card"><h2>Workout plan</h2><p class="mute">${p.plan?(p.plan.paused?"Paused for this patient.":"Custom plan."):"Default plan."} A hold of 0 makes a relax-only step.</p>
${d.map((q,i)=>`<div><b>${esc(q.n)}</b><div class="pr"><label>Reps<input type="number" inputmode="numeric" value="${q.reps}" onchange="x.pe(${i},'reps',this.value)"></label><label>Hold (s)<input type="number" inputmode="numeric" value="${q.work}" onchange="x.pe(${i},'work',this.value)"></label><label>Rest (s)<input type="number" inputmode="numeric" value="${q.rest}" onchange="x.pe(${i},'rest',this.value)"></label></div></div>`).join("")}
<button class="btn" onclick="x.plan(false)">Save plan</button><button class="btn ghost" onclick="x.plan(true)">${p.plan&&p.plan.paused?"Resume plan":"Pause plan"}</button><button class="lnk" onclick="S.draft=clone(DEF);render()">Reset to default</button></div>
<div class="card"><h2>Minutes per day, last 14 days</h2><div class="bars">${bars}</div></div>
<div class="card"><h2>Sessions and feedback</h2>${a.length?`<ul class="list">${a.map(z=>`<li><span>${when(z.ts)}<br><span class="mute">${z.skip?"Skipped (discomfort)":(z.mode==="bedridden"?"Biofeedback · ":"")+z.fin+" of "+z.total+" · "+Math.round(z.secs/60)+" min"}${z.note?"<br>“"+esc(z.note)+"”":""}</span></span><b>${FEEL[z.feel]||""}${z.pain?" ⚑":""}</b></li>`).join("")}</ul><p class="mute">⚑ marks discomfort or leakage reported.</p>`:`<p class="mute">No sessions yet.</p>`}</div>`}
  const L=[...S.pts].sort((p,q)=>((p.summary&&p.summary.lastDate)||"").localeCompare((q.summary&&q.summary.lastDate)||""));
  return code+`<h2>Your patients</h2>${L.length?L.map(p=>{const[t,c]=status(p),s=p.summary||{};return`<button class="card pcard" onclick="x.sel('${esc(p.id)}')"><b>${esc(p.name)}</b> <span class="chip ${c}">${t}</span><p class="mute">${p.mode==="bedridden"?"Bedridden mode":"Workout mode"} · ${s.streak||0}-day streak · ${s.days7||0} of 7 days${s.lastPain?" · ⚑ discomfort":""}</p></button>`}).join(""):`<div class="card"><p>No patients yet. Share your invite code above.</p></div>`}`;
}
const LIM={reps:[1,30],work:[0,30],rest:[1,60]};
x.sel=async id=>{S.sel=id;S.selS=[];S.pm="";
  if(id){const p=S.pts.find(q=>q.id===id)||{};S.draft=clone(p.plan&&p.plan.items&&p.plan.items.length?p.plan.items:DEF)}
  render();await load()};
x.pe=(i,k,v)=>{const q=S.draft[i],[a,b]=LIM[k];q[k]=cl(Math.round(+v)||a,a,b);if(!q.work)q.reps=1;if(k==="work"||k==="reps")render()};
x.plan=async paused=>{const p=S.pts.find(q=>q.id===S.sel)||{},pz=paused?!(p.plan&&p.plan.paused):!!(p.plan&&p.plan.paused);
  const r=await sb.rpc("pc_set_patient",{pid:S.sel,new_mode:null,new_plan:{items:S.draft,paused:pz}});
  S.pm=r.error?"Couldn’t save the plan.":paused?(pz?"Plan paused.":"Plan resumed."):"Plan saved.";await load()};
x.mode=async v=>{const r=await sb.rpc("pc_set_patient",{pid:S.sel,new_mode:v,new_plan:null});S.pm=r.error?"Couldn’t change the mode.":"Mode updated. The patient sees it next time they open the app.";await load()};
window.S=S;window.render=render;window.clone=clone;window.DEF=DEF;
