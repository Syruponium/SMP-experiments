(() => {
  "use strict";
  const S=window.SMP_V3;
  function resolve(world,grid) {
    const p=world.particles,r=S.get("collisionShellRadius");
    const M=S.modules.math;
    const order=M.shuffle(Array.from({length:p.length},(_,i)=>i));
    for(const i of order){
      const a=p[i],near=[];
      S.modules.grid.each(grid,a,j=>{if(j!==i)near.push(j);});
      M.shuffle(near);
      for(const j of near){
        if(j<=i)continue;
        const b=p[j];let dx=M.periodicDX(b.x-a.x,world.width),dy=b.y-a.y;
        let d2=dx*dx+dy*dy,diameter=2*r;
        if(d2>=diameter*diameter)continue;
        if(d2<1e-9){dx=(Math.random()-0.5)*0.001;dy=(Math.random()-0.5)*0.001;d2=dx*dx+dy*dy;}
        const distance=Math.sqrt(d2),nx=dx/distance,ny=dy/distance;
        const overlap=diameter-distance;
        a.x=M.wrapX(a.x-nx*overlap*0.5,world.width);
        b.x=M.wrapX(b.x+nx*overlap*0.5,world.width);
        a.y=M.clamp(a.y-ny*overlap*0.5,world.coreRadius,world.height-world.coreRadius);
        b.y=M.clamp(b.y+ny*overlap*0.5,world.coreRadius,world.height-world.coreRadius);
        const rvx=b.vx-a.vx,rvy=b.vy-a.vy,normal=rvx*nx+rvy*ny;
        if(normal>=0)continue;
        const oldA={vx:a.vx,vy:a.vy},oldB={vx:b.vx,vy:b.vy};
        const impulse=S.apply("collisionImpulse",{a,b,oldA,oldB,nx,ny,normal},-normal);
        let nextA={vx:a.vx-impulse*nx,vy:a.vy-impulse*ny};
        let nextB={vx:b.vx+impulse*nx,vy:b.vy+impulse*ny};
        nextA=S.apply("collisionVelocity",{old:oldA,other:oldB,nx,ny},nextA);
        nextB=S.apply("collisionVelocity",{old:oldB,other:oldA,nx:-nx,ny:-ny},nextB);
        if(![nextA.vx,nextA.vy,nextB.vx,nextB.vy].every(Number.isFinite))continue;
        world.stats.edit(oldA,nextA);world.stats.edit(oldB,nextB);
        a.vx=nextA.vx;a.vy=nextA.vy;b.vx=nextB.vx;b.vy=nextB.vy;
        world.stats.collisions++;
      }
    }
  }
  S.module("collisions",{resolve});
})();
