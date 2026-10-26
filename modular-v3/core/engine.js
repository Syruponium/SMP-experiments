(() => {
  "use strict";
  const S=window.SMP_V3,M=S.modules;
  const canvas=document.getElementById("sim");
  if(!canvas)throw Error("Missing V2.3 simulation canvas");
  const world={
    canvas,ctx:canvas.getContext("2d"),width:canvas.width,height:canvas.height,coreRadius:3.2,
    particles:[],running:true,accumulator:0,lastGrid:null,hovered:-1,impulseEffects:[],stats:M.stats.create()
  };
  S.world=world;
  M.controls.build(world);
  M.placement.create(world);
  let prev=performance.now();
  const step=1/60;
  function frame(now) {
    const delta=Math.min(.05,(now-prev)/1000);prev=now;
    if(world.running){
      world.accumulator+=delta;
      while(world.accumulator>=step){
        const gridSize=Math.max(S.get("neighborRadius"),2*S.get("collisionShellRadius"));
        const relationGrid=M.grid.make(world.particles,world.width,world.height,gridSize);
        M.neighbors.apply(world,relationGrid);
        // Generic hook for independent live physics modules.
        S.apply("beforeMotion",{world,grid:relationGrid,dt:step},null);
        M.motion.integrate(world,step);
        const collisionGrid=M.grid.make(world.particles,world.width,world.height,gridSize);
        M.collisions.resolve(world,collisionGrid);
        world.lastGrid=collisionGrid;
        world.stats.tick(world);
        world.accumulator-=step;
      }
    }
    M.draw.draw(world,step);
    M.controls.metrics(world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
