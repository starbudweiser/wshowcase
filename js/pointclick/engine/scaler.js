/* Agrandisseurs d'image à la ScummVM (WebGL) : le jeu est dessiné en 480×270 puis agrandi vers l'écran.
   sharp   = pixels nets : bords francs, lissage limité aux limites de pixels (recommandé, sans irrégularités quel que soit le facteur)
   nearest = pixels bruts (plus proche voisin)           smooth = bilinéaire
   scale2x = Scale2x/EPX (angles adoucis) puis pixels nets     scale4x = Scale2x appliqué deux fois puis pixels nets */
const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*0.5+0.5;gl_Position=vec4(p,0.,1.);}';
const HEAD = 'precision mediump float;uniform sampler2D t;uniform vec2 size;uniform float scale;varying vec2 uv;';
const FS = {
  nearest: HEAD + 'void main(){gl_FragColor=texture2D(t,uv);}',
  smooth: HEAD + 'void main(){gl_FragColor=texture2D(t,uv);}',
  sharp: HEAD + 'void main(){vec2 tx=uv*size,fl=floor(tx),s=tx-fl,rg=vec2(0.5-0.5/scale),d=s-0.5,f=(d-clamp(d,-rg,rg))*scale+0.5;gl_FragColor=texture2D(t,(fl+f)/size);}',
  epx: HEAD + `vec4 T(vec2 b,float dx,float dy){return texture2D(t,(clamp(b+vec2(dx,dy),vec2(0.),size-1.)+0.5)/size);}
bool eq(vec4 a,vec4 b){return all(lessThan(abs(a-b),vec4(0.035)));}
void main(){vec2 tx=uv*size,b=floor(tx),f=tx-b;vec4 P=T(b,0.,0.),A=T(b,0.,1.),B=T(b,1.,0.),C=T(b,-1.,0.),D=T(b,0.,-1.),r=P;bool left=f.x<0.5,top=f.y>=0.5;
if(top&&left){if(eq(C,A)&&!eq(C,D)&&!eq(A,B))r=A;}else if(top){if(eq(A,B)&&!eq(A,C)&&!eq(B,D))r=B;}else if(left){if(eq(D,C)&&!eq(D,B)&&!eq(C,A))r=C;}else{if(eq(B,D)&&!eq(B,A)&&!eq(D,C))r=D;}
gl_FragColor=r;}`
};

export class Scaler {
  static create(src, out) { try { const s = new Scaler(src, out); return s.gl ? s : null; } catch { return null; } }
  constructor(src, out) {
    this.src = src; this.out = out; this.mode = 'sharp';
    const gl = this.gl = out.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false }); if (!gl) return;
    this.prog = {}; for (const k of ['nearest', 'smooth', 'sharp', 'epx']) this.prog[k] = this.mk(FS[k]);
    const b = this.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.tex0 = this.tex(); this.fb = [0, 1].map(() => ({ tex: this.tex(), fbo: gl.createFramebuffer(), w: 0, h: 0 }));
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }
  mk(fs) {
    const gl = this.gl, sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }, p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('shader');
    return { p, loc: { pos: gl.getAttribLocation(p, 'p'), t: gl.getUniformLocation(p, 't'), size: gl.getUniformLocation(p, 'size'), scale: gl.getUniformLocation(p, 'scale') } };
  }
  tex() { const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); for (const [a, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST]]) gl.texParameteri(gl.TEXTURE_2D, a, v); return t; }
  filter(t, linear) { const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, t); const f = linear ? gl.LINEAR : gl.NEAREST; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f); }
  resize(cssW, cssH) { const d = Math.min(2, window.devicePixelRatio || 1), w = Math.max(2, Math.round(cssW * d)), h = Math.max(2, Math.round(cssH * d)); if (this.out.width !== w || this.out.height !== h) { this.out.width = w; this.out.height = h; } }
  draw(prog, tex, size, scale, w, h, fbo) {
    const gl = this.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, fbo || null); gl.viewport(0, 0, w, h); gl.useProgram(prog.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.loc.t, 0); gl.uniform2f(prog.loc.size, size[0], size[1]); gl.uniform1f(prog.loc.scale, scale);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf); gl.enableVertexAttribArray(prog.loc.pos); gl.vertexAttribPointer(prog.loc.pos, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  pass(i, w, h) { const gl = this.gl, f = this.fb[i]; if (f.w !== w || f.h !== h) { f.w = w; f.h = h; gl.bindTexture(gl.TEXTURE_2D, f.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.bindFramebuffer(gl.FRAMEBUFFER, f.fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, f.tex, 0); } return f; }
  render() {
    const gl = this.gl, sw = this.src.width, sh = this.src.height, ow = this.out.width, oh = this.out.height; if (!gl || !ow) return;
    gl.bindTexture(gl.TEXTURE_2D, this.tex0); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.src);
    let tex = this.tex0, w = sw, h = sh; const m = this.mode;
    if (m === 'scale2x' || m === 'scale4x') for (let i = 0; i < (m === 'scale4x' ? 2 : 1); i++) { const f = this.pass(i, w * 2, h * 2); this.draw(this.prog.epx, tex, [w, h], 1, w * 2, h * 2, f.fbo); tex = f.tex; w *= 2; h *= 2; }
    const sharp = m !== 'nearest' && m !== 'smooth'; this.filter(tex, m !== 'nearest');
    this.draw(sharp ? this.prog.sharp : this.prog[m], tex, [w, h], ow / w, ow, oh, null);
  }
}
