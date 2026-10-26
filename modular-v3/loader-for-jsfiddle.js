/* Paste this ONCE into the existing JSFiddle JavaScript panel.
   HTML and CSS remain those from V2.3.
   New rule files will load automatically from manifest.json after Run. */
(async () => {
  const root="https://raw.githubusercontent.com/Syruponium/SMP-experiments/main/modular-v3/";
  const url=(path)=>root+path;
  const read=async(path)=>{
    const response=await fetch(url(path)+"?v="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw new Error(path+" HTTP "+response.status);
    return response.text();
  };
  try{
    const manifest=JSON.parse(await read("manifest.json"));
    for(const file of manifest.files){
      const code=await read(file);
      const script=document.createElement("script");
      script.textContent=code+"\n//# sourceURL=smp-v3/"+file;
      document.head.appendChild(script);
      script.remove();
    }
  }catch(error){
    console.error("SMP V3 load failed",error);
    const warning=document.createElement("pre");
    warning.textContent="SMP V3 load failed: "+error.message;
    warning.style.color="#ff9b91";
    document.body.prepend(warning);
  }
})();
