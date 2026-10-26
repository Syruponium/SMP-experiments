(() => {
  "use strict";
  if (window.SMP_V3) throw Error("SMP V3 already loaded");
  const rules=[], values=new Map(), modules={};
  const valid = value => Number.isFinite(value);
  window.SMP_V3 = {
    rules, values, modules,
    registerRule(rule) {
      if (!rule || !rule.id || rules.some(r => r.id===rule.id)) throw Error("Duplicate/invalid rule: " + rule?.id);
      if (!valid(rule.default) || !valid(rule.min) || !valid(rule.max) || !valid(rule.step)) throw Error("Invalid slider: " + rule.id);
      rules.push(rule); values.set(rule.id,rule.default);
    },
    module(name,api) {
      if (modules[name]) throw Error("Duplicate core module: " + name);
      modules[name]=api;
    },
    get(id) { if (!values.has(id)) throw Error("Missing parameter: " + id); return values.get(id); },
    set(id,raw) {
      const rule=rules.find(r=>r.id===id);
      if (!rule) throw Error("Unknown parameter: " + id);
      const n=Number(raw);
      if (!Number.isFinite(n)) return;
      values.set(id,Math.max(rule.min,Math.min(rule.max,n)));
    },
    apply(hook,context,value) {
      let result=value;
      for (const rule of rules) {
        const fn=rule.hooks?.[hook];
        if (typeof fn==="function") {
          const next=fn(context,result,this);
          if (next !== undefined && next !== null) result=next;
        }
      }
      return result;
    }
  };
})();
