(() => {
  "use strict";
  const S=window.SMP_V3;
  function create(world) {
    const {width:w,height:h,coreRadius:c}=world;
    const count=S.get("particleCount"),radius=S.get("collisionShellRadius");
    const diameter=radius*2,minDistance=diameter*1.03;
    const cellTarget=Math.max(diameter*1.2,4);
    const cols=Math.max(1,Math.floor(w/cellTarget)),rows=Math.max(1,Math.floor(h/cellTarget));
    const cw=w/cols,ch=h/rows,cells=new Map(),particles=[];
    const dxPeriodic=S.modules.math.periodicDX;
    const key=(cx,cy)=>((cx%cols+cols)%cols)+cy*cols;
    for(let i=0;i<count;i++){
      let x=0,y=0,ok=false;
      for(let trial=0;trial<300&&!ok;trial++){
        x=Math.random()*w;
        y=c+Math.random()*(h-2*c);
        ok=true;
        const cx=Math.floor(x/cw),cy=Math.floor(y/ch);
        for(let yy=cy-1;yy<=cy+1&&ok;yy++){
          if(yy<0||yy>=rows)continue;
          for(let xx=cx-1;xx<=cx+1&&ok;xx++)
            for(const j of cells.get(key(xx,yy))||[]){
              const p=particles[j],dx=dxPeriodic(p.x-x,w),dy=p.y-y;
              if(dx*dx+dy*dy<minDistance*minDistance){ok=false;break;}
            }
        }
      }
      if(!ok){x=Math.random()*w;y=c+Math.random()*(h-2*c);}
      const angle=Math.random()*Math.PI*2,speed=35+Math.random()*25;
      const particle={x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed};
      particles.push(particle);
      const cx=Math.floor(x/cw),cy=Math.floor(y/ch),k=key(cx,Math.max(0,Math.min(rows-1,cy)));
      if(!cells.has(k))cells.set(k,[]);
      cells.get(k).push(i);
    }
    const avx=particles.reduce((v,p)=>v+p.vx,0)/Math.max(1,count);
    const avy=particles.reduce((v,p)=>v+p.vy,0)/Math.max(1,count);
    for(const p of particles){p.vx-=avx;p.vy-=avy;}
    world.particles=particles;world.hovered=-1;world.lastGrid=null;
    world.stats.reset();world.impulseEffects=[];world.accumulator=0;
  }
  S.module("placement",{create});
})();
