(() => {
  "use strict";
  const S=window.SMP_V3;
  function draw(world,dt) {
    const {ctx:c,width:w,height:h,coreRadius:core,particles:p}=world;
    c.fillStyle="#071019";c.fillRect(0,0,w,h);
    c.strokeStyle="#4e7186";c.lineWidth=2;c.beginPath();c.moveTo(0,1);c.lineTo(w,1);c.moveTo(0,h-1);c.lineTo(w,h-1);c.stroke();
    c.save();c.setLineDash([5,8]);c.strokeStyle="rgba(103,189,232,.38)";c.beginPath();c.moveTo(1,0);c.lineTo(1,h);c.moveTo(w-1,0);c.lineTo(w-1,h);c.stroke();c.restore();
    c.fillStyle="#e7f4ff";
    for(const v of p){
      for(const x of v.x<core?[v.x,v.x+w]:v.x>w-core?[v.x,v.x-w]:[v.x]){
        c.beginPath();c.arc(x,v.y,core,0,Math.PI*2);c.fill();
      }
    }
    if(document.getElementById("showVectors")?.checked){
      c.save();c.strokeStyle="rgba(106,205,255,.62)";c.lineWidth=1;
      for(const v of p){c.beginPath();c.moveTo(v.x,v.y);c.lineTo(v.x+v.vx*.08,v.y+v.vy*.08);c.stroke();}
      c.restore();
    }
    if(document.getElementById("showNeighborhood")?.checked && world.hovered>=0){
      const i=world.hovered,v=p[i],r=S.get("neighborRadius"),grid=world.lastGrid;
      if(v && grid){
        c.save();c.strokeStyle="rgba(255,207,92,.30)";
        for(const x of v.x<r?[v.x,v.x+w]:v.x>w-r?[v.x,v.x-w]:[v.x]){c.beginPath();c.arc(x,v.y,r,0,Math.PI*2);c.stroke();}
        S.modules.grid.each(grid,v,j=>{
          if(i===j)return;
          const o=p[j],dx=S.modules.math.periodicDX(o.x-v.x,w),dy=o.y-v.y;
          if(dx*dx+dy*dy>r*r)return;
          c.beginPath();c.moveTo(v.x,v.y);c.lineTo(v.x+dx,v.y+dy);c.stroke();
        });
        c.fillStyle="#ffd35c";c.beginPath();c.arc(v.x,v.y,core*1.9,0,Math.PI*2);c.fill();c.restore();
      }
    }
    const locations={left:[1,h/2,1,0],right:[w-1,h/2,-1,0],top:[w/2,1,0,1],bottom:[w/2,h-1,0,-1]};
    for(const side of ["left","right","top","bottom"]){
      const [x,y,dx,dy]=locations[side];c.save();c.fillStyle="#f5b942";c.strokeStyle="#f5b942";c.lineWidth=2;
      c.beginPath();c.arc(x,y,7,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x+dx*8,y+dy*8);c.lineTo(x+dx*31,y+dy*31);c.stroke();c.restore();
    }
    world.impulseEffects=world.impulseEffects.filter(v=>v.age<.55);
    for(const effect of world.impulseEffects){
      effect.age+=dt;const t=Math.min(1,effect.age/.55),distance=20+t*110;
      c.save();c.globalAlpha=1-t;c.strokeStyle="#f5b942";c.lineWidth=3;c.beginPath();
      if(effect.side==="left"||effect.side==="right"){
        const x=effect.side==="left"?distance:w-distance;c.moveTo(x,h/2-90);c.lineTo(x,h/2+90);
      }else{
        const y=effect.side==="top"?distance:h-distance;c.moveTo(w/2-90,y);c.lineTo(w/2+90,y);
      }
      c.stroke();c.restore();
    }
  }
  S.module("draw",{draw});
})();
