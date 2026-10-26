(() => {
  "use strict";
  const S=window.SMP_V3;
  const groups=["Systeem / dichtheid","Neighbour properties","Collision properties"];
  const format=(v,rule)=>{
    if(rule.unit==="percent")return Math.round(v*100)+"%";
    if(rule.unit==="degrees")return v+"°";
    if(rule.unit==="px")return Number(v).toFixed(rule.step<1?1:0)+" px";
    return String(v);
  };
  function build(world) {
    const aside=document.querySelector(".controls");
    if(!aside)throw Error("V3 requires the V2.3 HTML controls panel");
    const old=[...aside.querySelectorAll(":scope > section")].slice(0,2);
    if(old.length!==2)throw Error("Expected two V2.3 physics control sections");
    for(const group of groups) {
      const section=document.createElement("section"),h=document.createElement("h2");h.textContent=group;section.appendChild(h);
      for(const rule of S.rules.filter(r=>r.group===group)){
        const label=document.createElement("label");label.className="control";
        const header=document.createElement("div"),name=document.createElement("span"),out=document.createElement("output");
        name.textContent=rule.label;out.id="v3out-"+rule.id;out.textContent=format(S.get(rule.id),rule);
        header.append(name,out);label.append(header);
        const input=document.createElement("input");
        input.type="range";input.id="v3-"+rule.id;
        input.min=rule.min;input.max=rule.max;input.step=rule.step;input.value=rule.default;
        const change=()=>{
          S.set(rule.id,input.value);out.textContent=format(Number(input.value),rule);
          if(rule.onChange==="reset")S.modules.placement.create(world);
        };
        input.addEventListener(rule.onChange==="reset"?"change":"input",change);
        if(rule.onChange==="reset")input.addEventListener("input",()=>out.textContent=format(Number(input.value),rule));
        label.append(input);
        if(rule.description){const small=document.createElement("small");small.textContent=rule.description;label.append(small);}
        section.appendChild(label);
      }
      aside.insertBefore(section,old[0]);
    }
    old.forEach(el=>el.remove());
    const eyebrow=aside.querySelector(".eyebrow");if(eyebrow)eyebrow.textContent="RELATIONAL PARTICLE BOX · MODULAR V3";
    document.getElementById("pauseBtn")?.addEventListener("click",e=>{
      world.running=!world.running;e.currentTarget.textContent=world.running?"Pause":"Resume";
    });
    document.getElementById("resetBtn")?.addEventListener("click",()=>S.modules.placement.create(world));
    S.modules.injectors.bind(world);
    const canvas=world.canvas;
    canvas.addEventListener("mousemove",e=>{
      const rect=canvas.getBoundingClientRect();
      const x=(e.clientX-rect.left)*world.width/rect.width,y=(e.clientY-rect.top)*world.height/rect.height;
      let nearest=-1,limit=14*14;
      for(let i=0;i<world.particles.length;i++){
        const p=world.particles[i],dx=S.modules.math.periodicDX(p.x-x,world.width),dy=p.y-y,d2=dx*dx+dy*dy;
        if(d2<limit){nearest=i;limit=d2;}
      }
      world.hovered=nearest;
    });
    canvas.addEventListener("mouseleave",()=>world.hovered=-1);
  }
  function metrics(world) {
    const s=world.stats;
    const values={
      mParticles:world.particles.length,
      mRadius:S.get("collisionShellRadius").toFixed(1)+" px",
      mOccupancy:(world.particles.length*Math.PI*S.get("collisionShellRadius")**2/(world.width*world.height)).toFixed(2),
      mRelSpeed:s.relSpeed.toFixed(3),mAngle:(s.meanAngle*180/Math.PI).toFixed(1)+"°",
      mCoherence:s.coherence.toFixed(3),mNeighbors:s.neighborCount.toFixed(1),
      mKE:s.kineticEnergy.toFixed(0),mCollisions:s.collisionRate.toFixed(0)+"/s",
      mEnergyLoss:s.energyLossRate.toFixed(1),mEnergyGain:s.energyGainRate.toFixed(1),
      mMomentumEdit:s.momentumEditRate.toFixed(1)
    };
    for(const [id,value] of Object.entries(values)){const el=document.getElementById(id);if(el)el.textContent=value;}
  }
  S.module("controls",{build,metrics});
})();
