/* Matériaux et ciel : atmosphère commune (brume, soleil bas, nuages), relief, forêt, lac, dragon, flammes, neige, étalonnage final. */
import * as THREE from 'three';
import { SUN, SIZE, HALF } from './terrain.js';

export const U = {
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3(...SUN) },
  uSunCol: { value: new THREE.Vector3(1.0, .6, .3).multiplyScalar(2.7) },
  uSkyUp: { value: new THREE.Vector3(.2, .33, .62).multiplyScalar(.7) },
  uGround: { value: new THREE.Vector3(.3, .3, .4).multiplyScalar(.5) },
  uFogCol: { value: new THREE.Vector3(.95, .66, .5).multiplyScalar(.95) },
  uFire: { value: new THREE.Vector4(0, -999, 0, 0) },
  uShock: { value: new THREE.Vector4(0, 0, -1, 0) },
  uDragon: { value: new THREE.Vector4(0, 100, 0, 24) },
  uPx: { value: 1 }
};

export const COMMON = /* glsl */`
uniform float uTime; uniform vec3 uSunDir, uSunCol, uSkyUp, uGround, uFogCol; uniform vec4 uFire, uShock, uDragon; uniform float uPx;
float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); float a=hash21(i),b=hash21(i+vec2(1.,0.)),c=hash21(i+vec2(0.,1.)),d=hash21(i+vec2(1.,1.)); return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
float fbm5(vec2 p){ float a=.5,f=0.; for(int i=0;i<5;i++){ f+=a*noise(p); p=p*2.02+vec2(1.7,9.2); a*=.5; } return f; }
float fbm3(vec2 p){ float a=.5,f=0.; for(int i=0;i<3;i++){ f+=a*noise(p); p=p*2.02+vec2(1.7,9.2); a*=.5; } return f; }
vec3 fogCol(vec3 rd){ float s=max(dot(rd,uSunDir),0.); return mix(vec3(.36,.44,.6)*.8,vec3(1.,.66,.4)*1.05,pow(s,3.)*.8+pow(s,12.)*.2); }
vec3 fogApply(vec3 col, vec3 wp){
  vec3 v=wp-cameraPosition; float d=length(v); vec3 rd=v/max(d,1e-3);
  float dens=.00034*(1.+3.2*exp(-max(wp.y,0.)*.011)); float f=clamp(1.-exp(-d*dens),0.,1.);
  return mix(col,fogCol(rd),f);
}
vec3 fireLight(vec3 wp, vec3 n){ vec3 d=uFire.xyz-wp; float l=length(d)+.001; float a=uFire.w/(1.+l*l*.0007); return vec3(1.,.48,.14)*a*(.3+.7*max(dot(n,d/l),0.)); }
float dragonShadow(vec3 wp){ vec3 cw=uDragon.xyz-wp; float al=dot(cw,uSunDir); if(al<0.) return 0.; float dd=length(cw-uSunDir*al); return exp(-dd*dd/(uDragon.w*uDragon.w))*smoothstep(0.,70.,al); }
float fbmC(vec2 p){ float a=.5,f=0.; for(int i=0;i<5;i++){ f+=a*noise(p); p=p*2.02+vec2(1.7,9.2); a*=.5; } return f; }
vec3 skyColor(vec3 rd){
  float y=max(rd.y,0.); float sa=max(dot(rd,uSunDir),0.);
  vec3 hor=mix(vec3(.58,.62,.8),vec3(1.0,.6,.36),pow(sa,1.5)), mid=vec3(.42,.55,.82), zen=vec3(.08,.2,.5);
  vec3 col=mix(hor,mid,smoothstep(0.,.3,y)); col=mix(col,zen,smoothstep(.2,.95,y));
  col*=1.-.35*(1.-sa)*smoothstep(.05,.5,y);
  col+=vec3(1.,.55,.25)*pow(sa,6.)*.9+vec3(1.,.78,.5)*pow(sa,48.)*1.6;
  col+=vec3(1.,.92,.75)*smoothstep(.99965,.99985,sa)*7.;
  if(rd.y>0.){
    float yy=max(rd.y,.02); vec2 p=rd.xz/(yy+.1)*1.2+vec2(uTime*.010,uTime*.005);
    float d=fbmC(p*.8); float dens=smoothstep(.5,.78,d);
    float d2=fbmC(p*.8+uSunDir.xz*.11/(yy+.1)*.7); float lit=clamp(.5+(d-d2)*6.,0.,1.);
    vec3 cc=mix(vec3(.34,.3,.42)*.7,vec3(1.35,.82,.52)*1.55,lit); cc+=vec3(1.,.65,.35)*pow(sa,3.)*.9;
    col=mix(col,cc,dens*smoothstep(0.,.22,rd.y));
    vec2 pc=vec2(rd.x/(yy+.3)*1.3+uTime*.003,rd.z/(yy+.3)*6.); float ci=smoothstep(.5,.95,fbmC(pc*.8))*.5*smoothstep(.04,.3,rd.y);
    col=mix(col,vec3(1.25,.8,.58),ci*.85);
  } else { col=mix(col,fogCol(rd)*.9,smoothstep(0.,-.25,rd.y)); }
  return col;
}`;

/* ---------- ciel ---------- */
export const skyMat = () => new THREE.ShaderMaterial({
  uniforms: U, side: THREE.BackSide, depthWrite: false, depthTest: true,
  vertexShader: `varying vec3 vD; void main(){ vD=position; vec4 p=projectionMatrix*viewMatrix*vec4(position*1000.+cameraPosition,1.); gl_Position=p.xyww; }`,
  fragmentShader: COMMON + `varying vec3 vD; void main(){ gl_FragColor=vec4(skyColor(normalize(vD)),1.); }`
});

/* ---------- relief ---------- */
export function terrainMat(shadeTex) {
  return new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `attribute float aShade; attribute float aAo; varying vec3 vW; varying vec3 vN; varying float vS; varying float vA; varying float vR; uniform vec4 uShock;
      void main(){ vec3 p=position; float d=length(p.xz-uShock.xy); float r=uShock.z*300.; float ring=exp(-pow((d-r)/42.,2.))*exp(-uShock.z*.6)*step(0.,uShock.z)*uShock.w; p.y+=ring*9.; vR=ring;
        vW=p; vN=normal; vS=aShade; vA=aAo; gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
    fragmentShader: COMMON + `varying vec3 vW; varying vec3 vN; varying float vS; varying float vA; varying float vR;
      void main(){
        vec3 n=normalize(vN); float h=vW.y; vec2 q=vW.xz;
        float lod=smoothstep(60.,420.,length(cameraPosition-vW));
        float n1=noise(q*.18), n2=noise(q*.9), n3=noise(q*4.1), n4=noise(q*17.);
        float slope=n.y;
        vec3 np=normalize(n+vec3(n2-.5,0.,n3-.5)*.55+vec3(n4-.5,0.,n4-.5)*.18);
        float strata=mix(sin(h*.09+n1*5.)*.5+.5,.5,lod);
         n3=mix(n3,.5,lod); n4=mix(n4,.5,lod); n2=mix(n2,.5,lod*.6);
        vec3 rock=mix(vec3(.045,.048,.058),vec3(.2,.2,.22),n2*.65+strata*.35);
        vec3 tundra=mix(vec3(.05,.07,.045),vec3(.17,.15,.08),n1)*(.8+.4*n3);
        vec3 gravel=mix(vec3(.2,.18,.16),vec3(.33,.3,.27),n3);
        float wet=smoothstep(4.,-.5,h);
        float snowLine=95.+n1*70.-(1.-slope)*150.;
        float snow=smoothstep(snowLine,snowLine+60.,h)*smoothstep(.35,.7,slope)+smoothstep(.9,.98,slope)*smoothstep(25.,110.,h)*.9;
        snow=clamp(snow+smoothstep(.6,.9,n1)*smoothstep(40.,100.,h)*.3,0.,1.);
        vec3 alb=mix(tundra,rock,clamp(smoothstep(10.,150.,h)+(1.-slope)*1.4,0.,1.)); alb=mix(alb,gravel,wet*.7); alb=mix(alb,vec3(.88,.92,1.),snow);
        alb*=mix(.55,1.,wet*0.+1.)*(.88+.24*n4);
        float ndl=max(dot(np,uSunDir),0.); float wrap=max((dot(np,uSunDir)+.4)/1.4,0.);
        float sh=vS*(1.-.82*dragonShadow(vW));
        vec3 direct=uSunCol*mix(ndl,wrap,snow*.6)*sh;
        vec3 amb=mix(uGround,uSkyUp,np.y*.5+.5)*vA*(.55+.45*vS);
        vec3 col=alb*(direct+amb*1.0);
        vec3 vv=normalize(cameraPosition-vW); vec3 rr=reflect(-uSunDir,np);
        col+=uSunCol*pow(max(dot(rr,vv),0.),18.)*snow*.12*sh;
        col+=pow(1.-max(dot(np,vv),0.),4.)*snow*uSkyUp*.4;
        col+=alb*fireLight(vW,np);
        col+=vec3(.75,.85,1.)*vR*.9;
        gl_FragColor=vec4(fogApply(col,vW),1.);
      }`
  });
}

/* ---------- forêt ---------- */
export function treeMat(shadeTex) {
  const u = { ...U, tShade: { value: shadeTex } };
  return new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: `attribute vec3 aCol; varying vec3 vCol; varying vec3 vW; varying vec3 vN;
      void main(){ vec4 wp=modelMatrix*instanceMatrix*vec4(position,1.); vW=wp.xyz; vN=normalize(mat3(modelMatrix*instanceMatrix)*normal); vCol=aCol; gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: COMMON + `uniform sampler2D tShade; varying vec3 vCol; varying vec3 vW; varying vec3 vN;
      void main(){
        vec3 n=normalize(vN); vec2 uv=(vW.xz+${HALF.toFixed(1)})/${SIZE.toFixed(1)}; float sh=texture2D(tShade,uv).r;
        float sn=smoothstep(8.,110.,vW.y)*smoothstep(.15,.75,n.y); vec3 alb=mix(vCol,vec3(.88,.93,1.),sn*.85);
        float ndl=max(dot(n,uSunDir),0.); vec3 amb=mix(uGround,uSkyUp,n.y*.5+.5);
        vec3 col=alb*(uSunCol*ndl*sh*(1.-.8*dragonShadow(vW))+amb*1.5);
        col+=alb*fireLight(vW,n);
        gl_FragColor=vec4(fogApply(col,vW),1.);
      }`
  });
}

/* ---------- lac (reflecteur) ---------- */
export const waterShader = depthTex => ({
  name: 'Lake',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, tDepth: { value: depthTex }, ...U },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; void main(){ vUv=textureMatrix*vec4(position,1.); vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: COMMON + `uniform sampler2D tDiffuse; uniform sampler2D tDepth; varying vec4 vUv; varying vec3 vW;
    float wave(vec2 p,float t){ return noise(p*.35+vec2(t*.5,t*.3))*.55+noise(p*1.1-vec2(t*.4,-t*.35))*.3+noise(p*3.2+t*.7)*.15; }
    void main(){
      vec2 q=vW.xz; float t=uTime; float e=.35; float h0=wave(q,t);
      vec3 n=normalize(vec3((h0-wave(q+vec2(e,0.),t))/e*.55,1.,(h0-wave(q+vec2(0.,e),t))/e*.55));
      vec2 tuv=(q+${HALF.toFixed(1)})/${SIZE.toFixed(1)}; float depth=texture2D(tDepth,tuv).r;
      vec4 uv=vUv; uv.xy+=n.xz*uv.w*.03; vec3 refl=texture2DProj(tDiffuse,uv).rgb;
      vec3 v=normalize(cameraPosition-vW); float fres=.04+.96*pow(1.-max(dot(v,n),0.),5.);
      vec3 deep=mix(vec3(.04,.16,.2),vec3(.006,.03,.05),smoothstep(.0,.5,depth));
      vec3 col=mix(deep*(.6+.5*max(uSunDir.y,0.)*3.),refl,clamp(fres,0.,1.));
      vec3 r=reflect(-v,n); col+=uSunCol*pow(max(dot(r,uSunDir),0.),420.)*5.;
      float foam=smoothstep(.07,.0,depth)*(.55+.45*noise(q*1.3+t*.6)); col=mix(col,vec3(.9,.95,1.)*1.1,foam*.7);
      col=fogApply(col,vW);
      gl_FragColor=vec4(col,smoothstep(.0,.02,depth+.012));
    }`
});

/* ---------- dragon ---------- */
const DRAGON_VS = `attribute vec3 aCol; attribute vec2 aUv; varying vec3 vCol; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
  void main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); vCol=aCol; vUv=aUv; gl_Position=projectionMatrix*viewMatrix*wp; }`;
export const dragonMat = () => new THREE.ShaderMaterial({
  uniforms: U, vertexShader: DRAGON_VS, side: THREE.DoubleSide,
  fragmentShader: COMMON + `varying vec3 vCol; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
    void main(){
      vec3 n=normalize(vN); if(!gl_FrontFacing) n=-n; vec3 v=normalize(cameraPosition-vW);
      vec2 sc=vUv*vec2(34.,12.); vec2 id=floor(sc); vec2 f=fract(sc)-.5; f.x+=mod(id.y,2.)*.5-.25; float sca=smoothstep(.62,.18,length(f*vec2(1.,1.15)));
      vec3 alb=vCol*(.55+.75*sca)*(.85+.3*noise(vUv*90.));
      float ndl=dot(n,uSunDir); float dif=max(ndl*.75+.25,0.);
      float rim=pow(1.-max(dot(n,v),0.),3.)*smoothstep(.6,.99,dot(-v,uSunDir));
      vec3 amb=mix(uGround,uSkyUp,n.y*.5+.5);
      vec3 col=alb*(uSunCol*dif*.95+amb*1.6)+uSunCol*vec3(1.,.72,.45)*rim*.12;
      col+=pow(max(dot(reflect(-uSunDir,n),v),0.),48.)*uSunCol*.05*sca;
      col+=pow(max(dot(reflect(-v,n),vec3(0.,1.,0.)),0.),3.)*uSkyUp*.25;
      col+=alb*fireLight(vW,n)*1.6;
      gl_FragColor=vec4(fogApply(col,vW),1.);
    }`
});
export const wingMat = () => new THREE.ShaderMaterial({
  uniforms: U, vertexShader: DRAGON_VS, side: THREE.DoubleSide,
  fragmentShader: COMMON + `varying vec3 vCol; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
    void main(){
      vec3 n=normalize(vN); if(!gl_FrontFacing) n=-n; vec3 v=normalize(cameraPosition-vW);
      float bone=smoothstep(.07,.0,min(vUv.y,1.-vUv.y)); float vein=smoothstep(.035,.0,abs(fract(vUv.x*5.)-.5)-.44)*.4;
      float thin=.55+.45*noise(vUv*vec2(14.,9.));
      vec3 skin=mix(vec3(.3,.09,.055),vec3(.12,.045,.045),vUv.y*.7);
      float ndl=dot(n,uSunDir); float dif=max(abs(ndl)*.5+.1,0.);
      float trans=pow(max(dot(-v,uSunDir),0.),2.2);
      vec3 amb=mix(uGround,uSkyUp,n.y*.5+.5);
      vec3 col=skin*thin*(uSunCol*(dif*.45+trans*1.5)+amb*1.1);
      col=mix(col,vec3(.02,.02,.025)*(uSunCol*dif*.3+amb),clamp(bone+vein,0.,1.));
      col+=skin*fireLight(vW,n)*1.5;
      gl_FragColor=vec4(fogApply(col,vW),1.);
    }`
});
export const eyeMat = () => new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 1.3, .15), toneMapped: false });

/* ---------- flammes et braises ---------- */
export const fireMat = () => new THREE.ShaderMaterial({
  uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float aT; attribute float aSize; attribute float aKind; varying float vT; varying float vK; uniform float uPx;
    void main(){ vT=aT; vK=aKind; vec4 mv=viewMatrix*modelMatrix*vec4(position,1.); float s=aSize*(1.+aT*2.6)*(aKind>.5?.22:1.); gl_PointSize=clamp(s*(1.+clamp((-mv.z-70.)/110.,0.,1.)*1.6)*uPx*900./max(-mv.z,1.),0.,420.); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vT; varying float vK; void main(){ vec2 p=gl_PointCoord-.5; float d=length(p); if(d>.5) discard; float a=smoothstep(.5,.0,d); a*=a;
    vec3 c=mix(vec3(1.,.9,.6)*3.2,vec3(1.,.45,.08)*2.0,smoothstep(0.,.3,vT)); c=mix(c,vec3(.8,.12,.02)*1.2,smoothstep(.3,.8,vT));
    if(vK>.5) c=mix(vec3(1.,.7,.2)*3.,vec3(1.,.2,.02),vT);
    gl_FragColor=vec4(c*a*(1.-vT)*(vK>.5?1.1:.34),1.); }`
});

/* ---------- neige en suspension ---------- */
export const snowMat = () => new THREE.ShaderMaterial({
  uniforms: U, transparent: true, depthWrite: false,
  vertexShader: `attribute float aS; uniform float uTime; uniform float uPx; varying float vA;
    void main(){ vec3 p=position; p.y-=uTime*(2.+aS*3.); p.x+=sin(uTime*.4+aS*20.)*3.+uTime*4.; p.z+=cos(uTime*.3+aS*11.)*3.; p=mod(p-cameraPosition+vec3(300.,150.,300.),vec3(600.,300.,600.))-vec3(300.,150.,300.)+cameraPosition;
      vec4 mv=viewMatrix*vec4(p,1.); vA=smoothstep(280.,40.,-mv.z)*smoothstep(0.,6.,-mv.z); gl_PointSize=(1.2+aS*2.2)*uPx*(120./max(-mv.z,1.))+1.; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(vec3(.95,.97,1.)*1.2,smoothstep(.5,.1,d)*.6*vA); }`
});

/* ---------- étalonnage final : ondes, rayons, aberration, vignette, grain ---------- */
export const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uSun: { value: new THREE.Vector3(.5, .5, 0) }, uShockC: { value: new THREE.Vector2(.5, .5) }, uShockR: { value: -1 }, uShockS: { value: 0 }, uFlash: { value: 0 }, uFade: { value: 1 }, uAspect: { value: 1.78 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime,uShockR,uShockS,uFlash,uFade,uAspect; uniform vec3 uSun; uniform vec2 uShockC; varying vec2 vUv;
    float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
    void main(){
      vec2 uv=vUv; vec2 d=uv-uShockC; d.x*=uAspect; float dist=length(d);
      if(uShockR>0.){ float w=exp(-pow((dist-uShockR)*7.,2.))*uShockS; uv+=normalize(d+1e-4)*sin((dist-uShockR)*34.)*w*.03*vec2(1./uAspect,1.); uv=mix(uv,uShockC+(uv-uShockC)*(1.-.04*uShockS*exp(-uShockR*2.)),1.); }
      vec2 p=uv-.5; float ca=dot(p,p)*.016;
      vec3 col=vec3(texture2D(tDiffuse,uv+p*ca).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-p*ca).b);
      /* rayons crépusculaires */
      if(uSun.z>0.){ vec2 sd=(uSun.xy-uv); float len=length(sd); vec2 stepv=sd/32.*.9; vec2 sp=uv; float acc=0.; float w=1.;
        for(int i=0;i<32;i++){ sp+=stepv; vec3 s=texture2D(tDiffuse,sp).rgb; float l=dot(s,vec3(.3,.55,.15)); acc+=max(l-3.2,0.)*w; w*=.955; }
        col+=vec3(1.,.62,.3)*acc*.005*uSun.z*smoothstep(1.2,.0,len); }
      float lum=dot(col,vec3(.3,.55,.15));
      col=mix(col,col*vec3(1.06,.97,.9),smoothstep(.6,2.2,lum)); col+=vec3(-.004,.002,.012)*(1.-smoothstep(0.,.35,lum));
      col*=1.-dot(p,p)*.9;
      col+=(h(uv*vec2(1920.,1080.)+uTime)-.5)*.022;
      col+=uFlash*vec3(1.,.88,.75); col*=uFade;
      gl_FragColor=vec4(col,1.);
    }`
};
