(() => {
  "use strict";
  const S=window.SMP_V3;
  S.module("math", {
    clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),
    wrapX:(x,w)=>((x%w)+w)%w,
    periodicDX:(dx,w)=>dx>w/2 ? dx-w : dx< -w/2 ? dx+w : dx,
    angleDiff:(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)),
    shuffle(a) { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
  });
})();
