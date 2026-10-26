(() => {
  "use strict";
  const S=window.SMP_V3;
  function make(particles,w,h,target) {
    const columns=Math.max(1,Math.floor(w/Math.max(1,target)));
    const rows=Math.max(1,Math.floor(h/Math.max(1,target)));
    const cw=w/columns,ch=h/rows,cells=new Map();
    particles.forEach((p,i)=>{
      const cx=Math.max(0,Math.min(columns-1,Math.floor(p.x/cw)));
      const cy=Math.max(0,Math.min(rows-1,Math.floor(p.y/ch)));
      const key=cx+cy*columns;
      if(!cells.has(key))cells.set(key,[]);
      cells.get(key).push(i);
    });
    return {cells,columns,rows,cw,ch};
  }
  function each(grid,p,callback) {
    const cx=Math.floor(p.x/grid.cw),cy=Math.floor(p.y/grid.ch),seen=new Set();
    for(let yy=cy-1;yy<=cy+1;yy++){
      if(yy<0||yy>=grid.rows)continue;
      for(let xx=cx-1;xx<=cx+1;xx++){
        const wx=((xx%grid.columns)+grid.columns)%grid.columns;
        const key=wx+yy*grid.columns;
        if(seen.has(key))continue;
        seen.add(key);
        for(const i of grid.cells.get(key)||[])callback(i);
      }
    }
  }
  S.module("grid",{make,each});
})();
