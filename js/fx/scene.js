/* Scène plein écran en WebGL2 : paysage tracé par lancer de rayons, ciel, reflets, dragon, ondes de choc, son synthétisé. Aucune bibliothèque, aucun fichier lourd. */
import { sfx } from '../audio.js';
import { lang } from '../i18n.js';

const VS = `#version 300 es
void main(){ vec2 p=vec2((gl_VertexID<<1)&2, gl_VertexID&2); gl_Position=vec4(p*2.-1.,0.,1.); }`;

const FS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes; uniform float uTime; uniform vec2 uLook; uniform vec4 uShock; uniform float uFade;
#define PI 3.14159265
#define WATER 0.15
#define MAXT 420.
const vec3 MOON = vec3(-.36,.36,-.86);
float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float hash13(vec3 p){ p=fract(p*.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); float a=hash21(i),b=hash21(i+vec2(1,0)),c=hash21(i+vec2(0,1)),d=hash21(i+vec2(1,1)); return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float fbm(vec2 p,int oct){ float a=.5,f=0.; for(int i=0;i<6;i++){ if(i>=oct)break; f+=a*noise(p); p=p*2.03+vec2(3.1,1.7); a*=.5; } return f; }
float ridge(vec2 p,int oct){ float a=.5,f=0.; for(int i=0;i<6;i++){ if(i>=oct)break; float n=1.-abs(noise(p)*2.-1.); f+=a*n*n; p=p*2.07+vec2(1.7,9.2); a*=.5; } return f; }
float pathX(float z){ return sin(z*.045)*14.+sin(z*.013)*18.; }
float height(vec2 p,int oct){
  float d=abs(p.x-pathX(p.y)); float mask=smoothstep(5.,48.,d);
  float base=ridge(p*.017,oct)*50.*mask; float roll=fbm(p*.07,min(oct,3))*3.;
  return base+roll*(.35+.65*mask)+mask*mask*22.-1.4;
}
/* aurore boréale (variation d'un tracé classique à bruit triangulaire) */
float tri(float x){ return clamp(abs(fract(x)-.5),.01,.49); }
vec2 tri2(vec2 p){ return vec2(tri(p.x)+tri(p.y),tri(p.y+tri(p.x))); }
const mat2 M2=mat2(.95534,.29552,-.29552,.95534);
float triNoise(vec2 p,float spd){
  float z=1.8,z2=2.5,rz=0.; p*=rot(p.x*.06); vec2 bp=p;
  for(int i=0;i<5;i++){ vec2 dg=tri2(bp*1.85)*.75; dg*=rot(uTime*spd); p-=dg/z2; bp*=1.3; z2*=.45; z*=.42; p*=1.21+(rz-1.)*.02; rz+=tri(p.x+tri(p.y))*z; p*=-M2; }
  return clamp(1./pow(rz*29.,1.3),0.,.55);
}
vec4 aurora(vec3 ro,vec3 rd){
  vec4 col=vec4(0), avg=vec4(0);
  for(int i=0;i<30;i++){
    float of=.006*hash21(gl_FragCoord.xy+uTime)*smoothstep(0.,15.,float(i));
    float pt=((.8+pow(float(i),1.4)*.002)-ro.y)/(rd.y*2.+.4); pt-=of;
    vec3 bp=ro+pt*rd; float rzt=triNoise(bp.zx,.06);
    vec4 c2=vec4(0,0,0,rzt); c2.rgb=(sin(1.-vec3(2.15,-.5,1.2)+float(i)*.043)*.5+.5)*rzt;
    avg=mix(avg,c2,.5); col+=avg*exp2(-float(i)*.065-2.5)*smoothstep(0.,5.,float(i));
  }
  col*=clamp(rd.y*15.+.4,0.,1.); return col*3.4;
}
vec3 sky(vec3 rd,bool full){
  float y=max(rd.y,0.);
  vec3 col=mix(vec3(.23,.11,.24),vec3(.006,.012,.045),pow(y,.42));
  col+=vec3(.55,.26,.2)*pow(1.-y,7.)*.34;
  float m=max(dot(rd,MOON),0.);
  col+=vec3(.55,.62,.85)*(pow(m,220.)*.55+pow(m,14.)*.07);
  col+=vec3(.9,.93,1.)*smoothstep(.9987,.9993,m)*1.6;
  if(full){
    vec3 q=rd*190.; vec3 id=floor(q); float h=hash13(id); vec3 f=fract(q)-.5;
    float st=step(.9972,h)*smoothstep(.45,.0,length(f.xy+vec2(hash13(id+7.)-.5,hash13(id+3.)-.5)*.3));
    st*=.6+.4*sin(uTime*(2.+h*9.)+h*40.); col+=vec3(.8,.85,1.)*st*smoothstep(.02,.35,rd.y)*1.3;
    vec4 au=aurora(vec3(0.,0.,-6.7+uTime*.015),rd); col=col*(1.-au.a*.55)+au.rgb;
  }
  return col;
}
float march(vec3 ro,vec3 rd,float tmax,int steps){
  float t=.4;
  for(int i=0;i<110;i++){
    if(i>=steps)break;
    vec3 p=ro+rd*t; int o=int(mix(5.,2.,clamp(t/280.,0.,1.)));
    float h=p.y-height(p.xz,o);
    if(h<.0018*t) return t;
    t+=h*.58+.006*t; if(t>tmax) return -1.;
  }
  return -1.;
}
vec3 nrm(vec3 p,float t){ float e=.0025*t+.02; float h0=height(p.xz,5);
  return normalize(vec3(h0-height(p.xz+vec2(e,0.),5),e,h0-height(p.xz+vec2(0.,e),5))); }
float shadow(vec3 p){ float s=1.; float t=.35; for(int i=0;i<16;i++){ vec3 q=p+MOON*t; float h=q.y-height(q.xz,2); s=min(s,smoothstep(0.,1.,h*6./t)); t+=.45+t*.14; } return clamp(s,0.,1.); }
vec3 terrain(vec3 ro,vec3 rd,float t,bool cheap){
  vec3 p=ro+rd*t; vec3 n=nrm(p,t); float h=p.y, slope=n.y;
  float nz=noise(p.xz*.45);
  vec3 rock=mix(vec3(.085,.088,.115),vec3(.2,.19,.215),nz);
  vec3 grass=mix(vec3(.04,.06,.045),vec3(.09,.085,.05),nz);
  float snow=clamp(smoothstep(9.,24.,h+noise(p.xz*.22)*9.)*smoothstep(.42,.82,slope)+smoothstep(.84,.97,slope)*smoothstep(2.,10.,h)*.85,0.,1.);
  vec3 alb=mix(grass,rock,clamp(smoothstep(1.,14.,h)+(1.-slope)*.9,0.,1.)); alb=mix(alb,vec3(.8,.87,1.),snow);
  float dif=max(dot(n,MOON),0.); float sh=cheap?1.:shadow(p+n*.1);
  vec3 lit=alb*(vec3(.5,.62,.95)*dif*sh*1.5+vec3(.1,.14,.27)*(.55+.45*n.y)+vec3(.04,.24,.16)*n.y*1.1);
  lit+=vec3(.5,.55,.8)*snow*pow(max(dot(reflect(rd,n),MOON),0.),24.)*.5*sh;
  float fog=1.-exp(-t*.0046-max(0.,5.-h)*.016);
  vec3 fc=mix(vec3(.12,.12,.22),vec3(.28,.17,.24),pow(1.-max(rd.y,0.),4.));
  return mix(lit,fc,fog);
}
vec3 water(vec3 ro,vec3 rd,float tw){
  vec3 p=ro+rd*tw; vec2 q=p.xz;
  vec3 n=normalize(vec3((noise(q*.8+uTime*.35)-.5)*.30+(noise(q*.17-uTime*.1)-.5)*.25,1.,(noise(q*.8+vec2(5.,uTime*.3))-.5)*.30+(noise(q*.17+vec2(9.,uTime*.1))-.5)*.25));
  vec3 r=reflect(rd,n); r.y=abs(r.y)+.002;
  vec3 refl=sky(r,true);
  float tr=march(p+vec3(0.,.05,0.),r,200.,44);
  if(tr>0.) refl=terrain(p+vec3(0.,.05,0.),r,tr,true);
  float f=pow(1.-max(dot(-rd,n),0.),4.)*.88+.12;
  vec3 col=mix(vec3(.006,.02,.034),refl,f);
  col+=vec3(.7,.78,1.)*pow(max(dot(r,MOON),0.),400.)*3.;
  float fog=1.-exp(-tw*.0042); return mix(col,vec3(.14,.13,.24),fog);
}
float sdSeg(vec2 p,vec2 a,vec2 b,float ra,float rb){ vec2 pa=p-a,ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-mix(ra,rb,h); }
float sdTri(vec2 p,vec2 p0,vec2 p1,vec2 p2){
  vec2 e0=p1-p0,e1=p2-p1,e2=p0-p2,v0=p-p0,v1=p-p1,v2=p-p2;
  vec2 pq0=v0-e0*clamp(dot(v0,e0)/dot(e0,e0),0.,1.),pq1=v1-e1*clamp(dot(v1,e1)/dot(e1,e1),0.,1.),pq2=v2-e2*clamp(dot(v2,e2)/dot(e2,e2),0.,1.);
  float s=sign(e0.x*e2.y-e0.y*e2.x);
  vec2 d=min(min(vec2(dot(pq0,pq0),s*(v0.x*e0.y-v0.y*e0.x)),vec2(dot(pq1,pq1),s*(v1.x*e1.y-v1.y*e1.x))),vec2(dot(pq2,pq2),s*(v2.x*e2.y-v2.y*e2.x)));
  return -sqrt(d.x)*sign(d.y);
}
float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float wing(vec2 u,vec2 S,float ang,float sc){
  mat2 R=rot(ang);
  vec2 E=S+R*vec2(-.04,.30)*sc,T1=S+R*vec2(-.50,.66)*sc,T2=S+R*vec2(-.72,.40)*sc,T3=S+R*vec2(-.54,.06)*sc;
  float d=sdTri(u,S,E,T1); d=min(d,sdTri(u,S,T1,T2)); d=min(d,sdTri(u,S,T2,T3));
  return min(d,min(sdSeg(u,S,E,.016,.012),sdSeg(u,E,T1,.011,.004)));
}
float dragon(vec2 u,float a){
  float body=(length(u/vec2(.30,.075))-1.)*.075;
  float neck=sdSeg(u,vec2(.20,.03),vec2(.43,.12),.050,.030);
  float head=sdSeg(u,vec2(.43,.12),vec2(.53,.135),.030,.024);
  float snout=sdSeg(u,vec2(.53,.135),vec2(.62,.115),.020,.010);
  float jaw=sdSeg(u,vec2(.50,.105),vec2(.60,.092),.012,.006);
  float tail=min(sdSeg(u,vec2(-.22,-.005),vec2(-.55,-.07),.055,.028),min(sdSeg(u,vec2(-.55,-.07),vec2(-.95,-.03),.028,.008),sdSeg(u,vec2(-.95,-.03),vec2(-1.2,.03),.008,.003)));
  float d=smin(body,neck,.05); d=smin(d,head,.03); d=smin(d,snout,.02); d=min(d,jaw); d=smin(d,tail,.05);
  d=min(d,sdTri(u,vec2(.45,.15),vec2(.39,.25),vec2(.49,.16))); d=min(d,sdTri(u,vec2(.47,.15),vec2(.44,.27),vec2(.51,.155)));
  d=min(d,sdSeg(u,vec2(.08,-.05),vec2(.15,-.13),.02,.012));
  return min(d,min(wing(u,vec2(.08,.05),a,1.),wing(u,vec2(.02,.04),a*.8-.2,.86)));
}
vec3 dragonPos(float t){ float ph=fract(t/34.+.1); return vec3(mix(-1.3,1.3,ph),.21+.09*sin(ph*PI*1.5)+.012*sin(t*2.6*2.),mix(.12,.30,smoothstep(0.,1.,ph))); }
float roarAmt(float t){ float ph=fract(t/34.+.1); return smoothstep(.455,.47,ph)*smoothstep(.56,.5,ph); }
vec3 snowfall(vec2 uv){
  vec3 s=vec3(0.);
  for(int i=0;i<3;i++){
    float sc=7.+float(i)*6.; vec2 p=uv*sc; p.y+=uTime*(.5+.2*float(i)); p.x+=sin(uTime*.35+float(i)*2.)*.5+uTime*.15;
    vec2 id=floor(p),f=fract(p)-.5; vec2 o=(vec2(hash21(id+3.1+float(i)),hash21(id+float(i)*17.))-.5)*.6;
    s+=vec3(.8,.88,1.)*smoothstep(.07,.0,length(f-o))*(.35-.08*float(i));
  }
  return s;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y; float T=uTime;
  float age=uShock.z, act=step(0.,age), w0=uShock.w;
  float ring=0.;
  if(act>0.){
    vec2 d=uv-uShock.xy; float dist=length(d), r=age*1.2;
    float w=exp(-pow((dist-r)*6.,2.))*exp(-age*1.15)*w0; ring=w;
    uv+=normalize(d+1e-5)*sin((dist-r)*30.)*w*.05;
    uv*=1.-.06*w0*exp(-age*3.2);
    uv+=vec2(sin(T*57.),cos(T*63.))*.0032*w0*exp(-age*4.);
  }
  float z=-T*9.; float k=.045;
  float dx=pathX(z-1.)-pathX(z+1.); float yaw=atan(dx*.5)*.8+uLook.x;
  vec3 ro=vec3(pathX(z)+sin(T*.31)*3.,0.,z);
  ro.y=max(height(ro.xz,3),WATER)+6.5+sin(T*.5)*1.1;
  float pitch=.1+uLook.y;
  vec3 ww=normalize(vec3(sin(yaw)*cos(pitch),sin(pitch),-cos(yaw)*cos(pitch)));
  vec3 uu=normalize(cross(ww,vec3(0.,1.,0.))); vec3 vv=cross(uu,ww);
  vec3 rd=normalize(uv.x*uu+uv.y*vv+1.55*ww);
  float tw=rd.y<0.?(WATER-ro.y)/rd.y:1e9;
  float t=march(ro,rd,min(tw,MAXT),104);
  vec3 col;
  if(t>0.) col=terrain(ro,rd,t,false);
  else if(tw<MAXT) col=water(ro,rd,tw);
  else col=sky(rd,true);
  /* dragon */
  vec3 dp=dragonPos(T); float s=dp.z; vec2 u=(uv-dp.xy)/s; float ro_=roarAmt(T);
  float flap=-.55+1.*sin(T*2.6);
  float dd=dragon(u,flap)*s; float px=1.3/uRes.y;
  float al=1.-smoothstep(-px,px,dd);
  vec3 dc=vec3(.007,.009,.015); float edge=exp(-max(dd,0.)*170.);
  col+=vec3(.1,.4,.33)*edge*.35*(1.-al);
  vec2 eye=dp.xy+s*vec2(.505,.142);
  col=mix(col,dc+vec3(.04,.1,.09)*smoothstep(.02,-.0,dd+.004)*.0,al*.94);
  col+=vec3(1.,.5,.15)*exp(-length(uv-eye)*(900.*(1.-.5*ro_)))*(.7+ro_*2.)*al;
  vec2 mouth=dp.xy+s*vec2(.62,.11); col+=vec3(1.,.42,.1)*exp(-length(uv-mouth)*(16.-6.*ro_))*ro_*1.9;
  /* ondes de choc, flocons, finitions */
  col+=vec3(.75,.85,1.)*ring*.55*smoothstep(.0,.6,w0);
  col+=snowfall(uv)*(1.-smoothstep(.0,.35,max(rd.y,0.)*0.));
  col*=1.-dot(uv,uv)*.8; col=1.-exp(-col*2.1); col=pow(col,vec3(.92));
  col+=(hash21(gl_FragCoord.xy+T)-.5)*.018;
  col*=uFade;
  fragColor=vec4(col,1.);
}`;

/* ---------- position de la tête du dragon (même formule que le shader) ---------- */
function dragonHead(t) {
  const ph = (((t / 34 + .1) % 1) + 1) % 1, x = -1.3 + 2.6 * ph, sm = ph * ph * (3 - 2 * ph);
  const y = .21 + .09 * Math.sin(ph * Math.PI * 1.5) + .012 * Math.sin(t * 5.2), s = .12 + .18 * sm;
  return { x: x + s * .6, y: y + s * .11, ph };
}

/* ---------- son : vent, chœur grave, rugissement, voix ---------- */
class Audio {
  constructor() {
    try { this.c = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.c = null; return; }
    const c = this.c; this.m = c.createGain(); this.m.gain.value = 0; this.m.gain.linearRampToValueAtTime(.9, c.currentTime + 3);
    const comp = c.createDynamicsCompressor(); this.m.connect(comp).connect(c.destination);
    const n = c.sampleRate * 3, b = c.createBuffer(2, n, c.sampleRate); for (let k = 0; k < 2; k++) { const d = b.getChannelData(k); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.4); }
    this.v = c.createConvolver(); this.v.buffer = b; const vg = c.createGain(); vg.gain.value = .55; this.v.connect(vg).connect(this.m);
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.nb = nb;
    /* vent */
    const wind = c.createBufferSource(); wind.buffer = nb; wind.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .8; bp.frequency.value = 420;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .11; lg.gain.value = 220; lfo.connect(lg).connect(bp.frequency); lfo.start();
    const wg = c.createGain(); wg.gain.value = .22; wind.connect(bp).connect(wg).connect(this.m); wg.connect(this.v); wind.start();
    /* chœur grave */
    [[73.4, .09], [110, .07], [146.8, .06], [174.6, .045], [220, .03]].forEach(([f, g], i) => {
      [-6, 7].forEach(dt => { const o = c.createOscillator(), og = c.createGain(), lp = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; lp.type = 'lowpass'; lp.frequency.value = 520;
        og.gain.value = 0; og.gain.linearRampToValueAtTime(g * .5, c.currentTime + 4 + i); const l2 = c.createOscillator(), l2g = c.createGain(); l2.frequency.value = .06 + i * .013; l2g.gain.value = g * .25; l2.connect(l2g).connect(og.gain); l2.start();
        o.connect(lp).connect(og).connect(this.m); og.connect(this.v); o.start(); });
    });
  }
  noise(dur, f0, f1, g, t = 0, type = 'lowpass') {
    const c = this.c, s = c.createBufferSource(); s.buffer = this.nb; const f = c.createBiquadFilter(); f.type = type; const t0 = c.currentTime + t; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const e = c.createGain(); e.gain.setValueAtTime(.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + dur * .12); e.gain.exponentialRampToValueAtTime(.0001, t0 + dur); s.connect(f).connect(e).connect(this.m); e.connect(this.v); s.start(t0, 0, dur);
  }
  tone(f0, f1, dur, g, type = 'sawtooth', t = 0, lpf = 900) {
    const c = this.c, o = c.createOscillator(), e = c.createGain(), lp = c.createBiquadFilter(), t0 = c.currentTime + t; o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    lp.type = 'lowpass'; lp.frequency.value = lpf; e.gain.setValueAtTime(.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + dur * .1); e.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(lp).connect(e).connect(this.m); e.connect(this.v); o.start(t0); o.stop(t0 + dur + .1);
  }
  roar() { if (!this.c) return; this.tone(88, 34, 2.4, .5, 'sawtooth', 0, 700); this.tone(132, 52, 2.2, .25, 'square', .05, 500); this.noise(2.2, 1400, 90, .5); this.tone(46, 28, 2.6, .6, 'sine'); }
  shout(i) {
    if (!this.c) return; const base = [98, 110, 123.5][i % 3];
    this.tone(base * .5, base * .25, 1.8, .7, 'sine'); this.noise(1.6, 900, 60, .5 + i * .1);
    [1, 1.5, 2].forEach((m, k) => this.tone(base * m, base * m * .94, 1.5, .16, 'sawtooth', k * .02, 1100 + i * 300));
    this.noise(.9, 4000, 300, .2, 0, 'highpass');
  }
  close() { if (!this.c) return; const c = this.c; this.m.gain.cancelScheduledValues(c.currentTime); this.m.gain.setValueAtTime(this.m.gain.value, c.currentTime); this.m.gain.linearRampToValueAtTime(0, c.currentTime + 1.2); setTimeout(() => c.close(), 1400); }
}

/* ---------- plein écran ---------- */
let active = null;
export function enter(x = innerWidth / 2, y = innerHeight / 2) {
  if (active) return;
  const T = (fr, en) => (lang() === 'fr' ? fr : en);
  const css = document.createElement('style'); css.textContent = `
.fx9{position:fixed;inset:0;z-index:5000;background:#000;overflow:hidden;cursor:crosshair;clip-path:circle(0px at var(--x) var(--y));animation:fx9in 1.5s cubic-bezier(.6,0,.2,1) forwards;font-family:-apple-system,"SF Pro Display","Helvetica Neue",sans-serif}
@keyframes fx9in{to{clip-path:circle(160vmax at var(--x) var(--y))}}
.fx9 canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.fx9 .bar{position:absolute;left:0;right:0;height:0;background:#000;animation:fx9bar 2.2s 1.2s cubic-bezier(.3,.8,.2,1) forwards}.fx9 .bar.t{top:0}.fx9 .bar.b{bottom:0}
@keyframes fx9bar{to{height:7.5vh}}
.fx9 .word{position:absolute;left:0;right:0;bottom:17vh;text-align:center;font-size:clamp(34px,7vw,110px);font-weight:800;letter-spacing:.28em;color:#e9f4ff;opacity:0;text-shadow:0 0 30px #6fd3ff,0 0 80px #2a7bff;pointer-events:none;padding-left:.28em}
.fx9 .word.go{animation:fx9word 1.9s ease-out}
@keyframes fx9word{0%{opacity:0;transform:scale(.7);filter:blur(14px)}12%{opacity:1;transform:scale(1);filter:blur(0)}70%{opacity:1}100%{opacity:0;transform:scale(1.25);filter:blur(6px)}}
.fx9 .hint{position:absolute;left:0;right:0;bottom:10.5vh;text-align:center;font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:rgba(220,235,255,.65);opacity:0;animation:fx9hint 2s 6s ease forwards;pointer-events:none}
@keyframes fx9hint{to{opacity:1}}
.fx9 .x{position:absolute;right:22px;top:calc(7.5vh + 16px);border:0;background:rgba(255,255,255,.12);backdrop-filter:blur(14px);color:#fff;font-size:13px;border-radius:999px;padding:8px 16px;cursor:pointer;opacity:0;transition:opacity .4s}
.fx9:hover .x{opacity:.8}.fx9 .x:hover{opacity:1;background:rgba(255,255,255,.22)}
.fx9.out{animation:none;clip-path:circle(160vmax at var(--x) var(--y));transition:opacity 1s;opacity:0}`;
  const root = document.createElement('div'); root.className = 'fx9'; root.style.setProperty('--x', x + 'px'); root.style.setProperty('--y', y + 'px');
  const cv = document.createElement('canvas'); root.append(css, cv);
  const gl = cv.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) { return; }
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  const pext = gl.getExtension('KHR_parallel_shader_compile'); let uRes, uTime, uLook, uShock, uFade, ready = false;
  const word = document.createElement('div'); word.className = 'word'; const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = T('Cliquez · Espace', 'Click · Space');
  const bt = document.createElement('button'); bt.className = 'x'; bt.textContent = 'Esc ✕';
  root.append(h2('bar t'), h2('bar b'), word, hint, bt); document.body.append(root);
  function h2(c) { const d = document.createElement('div'); d.className = c; return d; }
  const au = sfx.on ? new Audio() : { roar() {}, shout() {}, close() {} };
  let scale = Math.min(.7, 1.2 / Math.max(1, devicePixelRatio)), look = [0, 0], tgt = [0, 0], shock = { x: 0, y: 0, t0: -99, s: 0 }, n = 0, t0 = performance.now(), last = t0, acc = 0, frames = 0, raf = 0, roared = -1, count = 0;
  const size = () => { const w = Math.max(320, Math.round(innerWidth * Math.min(devicePixelRatio, 2) * scale)), hh = Math.max(180, Math.round(innerHeight * Math.min(devicePixelRatio, 2) * scale)); if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; gl.viewport(0, 0, w, hh); } };
  const trigger = (ux, uy, s) => { shock = { x: ux, y: uy, t0: (performance.now() - t0) / 1000, s }; };
  const shout = () => { const i = count++ % 3; trigger(0, -.02, .55 + i * .35); au.shout(i); word.textContent = ['FUS', 'RO', 'DAH'][i]; word.classList.remove('go'); void word.offsetWidth; word.classList.add('go'); hint.style.animation = 'none'; hint.style.opacity = 0; };
  const move = e => { tgt = [((e.clientX / innerWidth) - .5) * .55, -((e.clientY / innerHeight) - .5) * .3]; };
  const key = e => { if (e.key === 'Escape') close(); else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); shout(); } };
  const close = () => { if (!active) return; active = null; removeEventListener('keydown', key, true); removeEventListener('pointermove', move); root.classList.add('out'); au.close(); cancelAnimationFrame(raf); setTimeout(() => { root.remove(); const ext = gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); }, 1000); };
  root.addEventListener('pointerdown', e => { if (e.target === bt) return; shout(); });
  bt.onclick = close; addEventListener('keydown', key, true); addEventListener('pointermove', move); addEventListener('resize', size);
  active = { close };
  const frame = now => {
    raf = requestAnimationFrame(frame);
    if (!ready) {                                  /* compilation en parallèle : le temps de la scène démarre quand elle est prête */
      if (pext && !gl.getProgramParameter(pr, pext.COMPLETION_STATUS_KHR)) { t0 = now; last = now; return; }
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(pr)); close(); return; }
      gl.useProgram(pr); gl.bindVertexArray(gl.createVertexArray());
      const U = n => gl.getUniformLocation(pr, n); uRes = U('uRes'); uTime = U('uTime'); uLook = U('uLook'); uShock = U('uShock'); uFade = U('uFade');
      ready = true; t0 = now; last = now;
    }
    const dt = now - last; last = now; acc += dt; frames++;
    if (frames % 40 === 0) { const avg = acc / 40; acc = 0; if (avg > 26 && scale > .38) { scale *= .85; } else if (avg < 11 && scale < .95) { scale = Math.min(.95, scale * 1.1); } }
    size(); const time = (now - t0) / 1000;
    look[0] += (tgt[0] - look[0]) * .05; look[1] += (tgt[1] - look[1]) * .05;
    const hd = dragonHead(time); if (roared !== Math.floor(time / 34 + .1) && hd.ph > .468 && hd.ph < .52) { roared = Math.floor(time / 34 + .1); trigger(hd.x, hd.y, 1.05); au.roar(); }
    gl.uniform2f(uRes, cv.width, cv.height); gl.uniform1f(uTime, time); gl.uniform2f(uLook, look[0], look[1]);
    gl.uniform4f(uShock, shock.x, shock.y, time - shock.t0 < 6 ? time - shock.t0 : -1, shock.s); gl.uniform1f(uFade, Math.min(1, time / 2.2));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  size(); raf = requestAnimationFrame(frame);
  return active;
}
