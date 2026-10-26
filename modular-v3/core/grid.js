(() => {
  "use strict";
  const S=window.SMP_V3;
  // Reuse typed buffers per cell geometry. Particle order inside a cell
  // stays ascending, exactly as in the original Map<Array> implementation.
  const cache=new Map();
  function make(particles,w,h,target) {
    const columns=Math.max(1,Math.floor(w/Math.max(1,target)));
    const rows=Math.max(1,Math.floor(h/Math.max(1,target)));
    const cw=w/columns,ch=h/rows;
    const key=w+":"+h+":"+columns+":"+rows;
    let grid=cache.get(key);
    if(!grid){
      grid={
        columns,rows,cw,ch,
        head:new Int32Array(columns*rows),
        tail:new Int32Array(columns*rows),
        next:new Int32Array(particles.length)
      };
      cache.set(key,grid);
    }
    if(grid.next.length<particles.length)grid.next=new Int32Array(particles.length);
    grid.head.fill(-1);
    grid.tail.fill(-1);
    for(let i=0;i<particles.length;i++){
      const p=particles[i];
      const cx=Math.max(0,Math.min(columns-1,Math.floor(p.x/cw)));
      const cy=Math.max(0,Math.min(rows-1,Math.floor(p.y/ch)));
      const bucket=cx+cy*columns;
      if(grid.head[bucket]===-1)grid.head[bucket]=i;
      else grid.next[grid.tail[bucket]]=i;
      grid.tail[bucket]=i;
      grid.next[i]=-1;
    }
    return grid;
  }
  function each(grid,p,callback) {
    const cx=Math.floor(p.x/grid.cw),cy=Math.floor(p.y/grid.ch);
    const columns=grid.columns,rows=grid.rows;
    for(let yy=cy-1;yy<=cy+1;yy++){
      if(yy<0||yy>=rows)continue;
      for(let offset=-1;offset<=1;offset++){
        // The original Set suppresses wrapped duplicate buckets.
        // These two checks do the same without allocating a Set.
        if(columns===1&&offset!==-1)continue;
        if(columns===2&&offset===1)continue;
        const xx=cx+offset;
        const wx=((xx%columns)+columns)%columns;
        const key=wx+yy*columns;
        for(let i=grid.head[key];i!==-1;i=grid.next[i])callback(i);
      }
    }
  }
  S.module("grid",{make,each});
})();
