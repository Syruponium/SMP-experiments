(() => {
  "use strict";
  const S=window.SMP_V3;
  function integrate(world,dt) {
    const wrap=S.modules.math.wrapX,cr=world.coreRadius;
    for(const p of world.particles) {
      p.x=wrap(p.x+p.vx*dt,world.width);
      p.y+=p.vy*dt;
      if(p.y<cr){p.y=cr;if(p.vy<0)p.vy=-p.vy;}
      else if(p.y>world.height-cr){p.y=world.height-cr;if(p.vy>0)p.vy=-p.vy;}
    }
  }
  S.module("motion",{integrate});
})();
