(() => {
  "use strict";
  const S=window.SMP_V3;
  function create() {
    const stats={
      collisions:0,energyLost:0,energyGained:0,momentumEdited:0,
      collisionRate:0,energyLossRate:0,energyGainRate:0,momentumEditRate:0,
      kineticEnergy:0,neighborCount:0,relSpeed:0,meanAngle:0,coherence:0,
      started:performance.now(),
      reset() {this.collisions=0;this.energyLost=0;this.energyGained=0;this.momentumEdited=0;this.started=performance.now();},
      edit(before,after) {
        const e0=0.5*(before.vx**2+before.vy**2),e1=0.5*(after.vx**2+after.vy**2);
        if(e1<e0)this.energyLost+=e0-e1;else this.energyGained+=e1-e0;
        this.momentumEdited+=Math.hypot(after.vx-before.vx,after.vy-before.vy);
      },
      tick(world) {
        this.kineticEnergy=world.particles.reduce((e,p)=>e+0.5*(p.vx*p.vx+p.vy*p.vy),0);
        const elapsed=(performance.now()-this.started)/1000;
        if(elapsed>=0.5){
          this.collisionRate=this.collisions/elapsed;
          this.energyLossRate=this.energyLost/elapsed;
          this.energyGainRate=this.energyGained/elapsed;
          this.momentumEditRate=this.momentumEdited/elapsed;
          this.reset();
        }
      }
    };
    return stats;
  }
  S.module("stats",{create});
})();
