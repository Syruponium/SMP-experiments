/* Required internally for neighbour queries. Slider hidden for now.
   Existing neighbour angle / speed / edge softness still use this 28 px range. */
SMP_V3.registerRule({
  id:"neighborRadius",group:"Neighbour properties",label:"Neighbour radius",
  min:10,max:120,step:2,default:28,unit:"px",hidden:true,
  description:"Intern vaste buurafstand van 28 px."
});
