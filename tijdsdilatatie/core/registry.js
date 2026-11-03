(function () {
  "use strict";
  if (window.TD_SIM) throw new Error("TD_SIM is al geladen");
  const modules = [];
  const controlMap = new Map();
  const values = new Map();

  window.TD_SIM = {
    modules, values,
    registerModule(module) {
      if (!module || !module.id || modules.some(item => item.id === module.id)) {
        throw new Error("Ongeldige/dubbele module: " + (module && module.id));
      }
      for (const c of module.controls || []) {
        if (controlMap.has(c.id)) throw new Error("Dubbele instelling: " + c.id);
        controlMap.set(c.id, c);
        values.set(c.id, c.default);
      }
      modules.push(module);
    },
    get(id) {
      if (!values.has(id)) throw new Error("Onbekende instelling: " + id);
      return values.get(id);
    },
    set(id, raw) {
      const c = controlMap.get(id);
      if (!c) throw new Error("Onbekende instelling: " + id);
      if (c.type === "select") {
        if (!(c.options || []).some(option => option.value === raw)) return;
        values.set(id, raw);
      } else {
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        values.set(id, Math.max(c.min, Math.min(c.max, n)));
      }
    }
  };
})();