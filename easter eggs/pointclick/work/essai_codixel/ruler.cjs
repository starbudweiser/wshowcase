const P = require('./vendor/pixel.js');
const src = P.load('hero_pr.png');
P.save(P.ruler(src, 2, { step: 20 }), 'ruler.png');
console.log(src.w, src.h);
