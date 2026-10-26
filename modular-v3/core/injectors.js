(() => {
  "use strict";
  const S=window.SMP_V3;
  const sides=["left","right","top","bottom"];
  function fire(world,side) {
    const slider=document.getElementById(side+"Impulse");
    const strength=Number(slider?.value||0),w=world.width,h=world.height;
    for(const p of world.particles){
      if(side==="left"&&p.x<72&&Math.abs(p.y-h/2)<95)p.vx+=strength;
      if(side==="right"&&p.x>w-72&&Math.abs(p.y-h/2)<95)p.vx-=strength;
      if(side==="top"&&p.y<72&&Math.abs(p.x-w/2)<95)p.vy+=strength;
      if(side==="bottom"&&p.y>h-72&&Math.abs(p.x-w/2)<95)p.vy-=strength;
    }
    world.impulseEffects.push({side,age:0});
  }
  function bind(world) {
    for(const side of sides) {
      const slider=document.getElementById(side+"Impulse");
      const output=document.getElementById(side+"ImpulseOut");
      if(slider&&output){const upd=()=>{output.textContent=slider.value;};slider.addEventListener("input",upd);upd();}
    }
    for(const btn of document.querySelectorAll("[data-fire]"))btn.addEventListener("click",()=>fire(world,btn.dataset.fire));
  }
  S.module("injectors",{fire,bind});
})();
