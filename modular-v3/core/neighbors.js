(() => {
  "use strict";
  const S=window.SMP_V3;
  function apply(world,grid) {
    const p=world.particles,n=p.length;
    const r=S.get("neighborRadius"),r2=r*r;
    const before=p.map(v=>({vx:v.vx,vy:v.vy}));
    const after=new Array(n),stats=world.stats;
    const dxPeriodic=S.modules.math.periodicDX;
    let neighborSum=0,speedDev=0,speedSamples=0,angleSum=0,angleSamples=0,cohSum=0;
    for(let i=0;i<n;i++){
      const self=p[i],old=before[i];let sumVX=0,sumVY=0,sumSpeed=0,weights=0,count=0;
      S.modules.grid.each(grid,self,j=>{
        if(i===j)return;
        const other=p[j],dx=dxPeriodic(other.x-self.x,world.width),dy=other.y-self.y,d2=dx*dx+dy*dy;
        if(d2>r2)return;
        const weight=S.apply("neighborWeight",{distance:Math.sqrt(d2),radius:r,self,other},1);
        if(!Number.isFinite(weight)||weight<=0)return;
        const v=before[j];
        sumVX+=v.vx*weight;sumVY+=v.vy*weight;sumSpeed+=Math.hypot(v.vx,v.vy)*weight;
        weights+=weight;count++;
      });
      neighborSum+=count;let candidate={vx:old.vx,vy:old.vy};
      if(weights>1e-9){
        const meanVX=sumVX/weights,meanVY=sumVY/weights,meanSpeed=sumSpeed/weights;
        const initialSpeed=Math.hypot(old.vx,old.vy),meanMagnitude=Math.hypot(meanVX,meanVY);
        if(meanSpeed>1e-9){speedDev+=Math.abs(initialSpeed-meanSpeed)/meanSpeed;speedSamples++;}
        if(initialSpeed>1e-9&&meanMagnitude>1e-9){
          const diff=S.modules.math.angleDiff(Math.atan2(old.vy,old.vx),Math.atan2(meanVY,meanVX));
          angleSum+=Math.abs(diff);cohSum+=Math.cos(diff);angleSamples++;
        }
        const context={self,old,meanVX,meanVY,meanSpeed,meanMagnitude,initialSpeed,neighbors:count,weightSum:weights};
        candidate=S.apply("neighborVelocity",context,candidate);
      }
      if(!Number.isFinite(candidate.vx)||!Number.isFinite(candidate.vy))candidate=old;
      after[i]=candidate;stats.edit(old,candidate);
    }
    for(let i=0;i<n;i++){p[i].vx=after[i].vx;p[i].vy=after[i].vy;}
    stats.neighborCount=neighborSum/Math.max(1,n);
    stats.relSpeed=speedSamples?speedDev/speedSamples:0;
    stats.meanAngle=angleSamples?angleSum/angleSamples:0;
    stats.coherence=angleSamples?cohSum/angleSamples:0;
  }
  S.module("neighbors",{apply});
})();
