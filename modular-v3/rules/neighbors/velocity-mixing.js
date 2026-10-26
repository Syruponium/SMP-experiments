/* Velocity variation through LOCAL pairwise scattering.
   Each pair is transformed by rotating its relative-velocity vector.
   This conserves pair momentum and pair kinetic energy to rounding precision.
   It is an EXTRA, experimental interaction within the internal neighbour radius:
   not a pressure, heat or stochastic-energy injection law. */
SMP_V3.registerRule({
  id:"velocityMixing",group:"Neighbour properties",label:"Speed variation (mixing)",
  min:0,max:1,step:0.05,default:0,unit:"percent",
  description:"0% = uit. Sterker mengen van snelheden bij nabije deeltjes; impuls en kinetische energie blijven behouden.",
  hooks:{
    beforeMotion({world,grid},ignored,S){
      const strength=S.get("velocityMixing");
      if(strength<=0)return;
      const particles=world.particles,n=particles.length,r=S.get("neighborRadius"),r2=r*r;
      // About 0..8% of N pair interactions per tick (60 physics ticks/sec).
      const expected=n*0.08*strength;
      let count=Math.floor(expected);
      if(Math.random()<expected-count)count++;
      const periodicDX=S.modules.math.periodicDX;
      const each=S.modules.grid.each;
      for(let k=0;k<count;k++){
        const i=Math.floor(Math.random()*n);
        const a=particles[i],available=[];
        each(grid,a,j=>{
          if(j===i)return;
          const b=particles[j],dx=periodicDX(b.x-a.x,world.width),dy=b.y-a.y;
          if(dx*dx+dy*dy<=r2)available.push(j);
        });
        if(!available.length)continue;
        const b=particles[available[Math.floor(Math.random()*available.length)]];
        const cx=0.5*(a.vx+b.vx),cy=0.5*(a.vy+b.vy);
        const rx=0.5*(a.vx-b.vx),ry=0.5*(a.vy-b.vy);
        // Rotation changes individual speeds when pair COM and relative v are not aligned.
        const angle=(Math.random()*2-1)*Math.PI*strength;
        const cos=Math.cos(angle),sin=Math.sin(angle);
        const nx=cos*rx-sin*ry,ny=sin*rx+cos*ry;
        a.vx=cx+nx;a.vy=cy+ny;
        b.vx=cx-nx;b.vy=cy-ny;
      }
    },
    renderMetrics({world}){
      let output=document.getElementById("mSpeedSpreadCV");
      if(!output){
        const metrics=document.querySelector(".metrics");
        if(!metrics)return;
        const element=document.createElement("div");
        element.className="metric";
        const label=document.createElement("span");
        label.textContent="Speed variation (CV)";
        output=document.createElement("strong");
        output.id="mSpeedSpreadCV";
        output.textContent="0.000";
        element.append(label,output);metrics.appendChild(element);
      }
      // Throttle diagnostics to roughly 4 Hz.
      const now=performance.now();
      if(now-(world.lastCVUpdate||0)<250)return;
      world.lastCVUpdate=now;
      const particles=world.particles,n=particles.length;
      if(!n){output.textContent="0.000";return;}
      let speedSum=0, speed2Sum=0;
      for(const p of particles){const speed=Math.hypot(p.vx,p.vy);speedSum+=speed;speed2Sum+=speed*speed;}
      const mean=speedSum/n;
      const variance=Math.max(0,speed2Sum/n-mean*mean);
      output.textContent=mean>1e-9?(Math.sqrt(variance)/mean).toFixed(3):"0.000";
    }
  }
});
