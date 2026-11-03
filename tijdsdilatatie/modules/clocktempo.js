(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "clocktempo",
    title: "1 · Kloktempo / massaproxy",
    description: "Instelbare eindtempo's A, B en C (massaproxy). Bij 'groei opgebouwd verschil' komen de klokken geleidelijk van hun begintempo naar deze waarden.",
    order: 10,
    controls: [
      { id: "rateA", label: "Kloktempo A", min: 0.5, max: 1.5, step: 0.001, default: 0.98, digits: 3, unit: "×", help: "Lager getal = langzamere klok." },
      { id: "rateB", label: "Kloktempo B", min: 0.5, max: 1.5, step: 0.001, default: 1.0, digits: 3, unit: "×", help: "1,000 is het referentietempo." },
      { id: "rateC", label: "Kloktempo C", min: 0.5, max: 1.5, step: 0.001, default: 1.02, digits: 3, unit: "×", help: "Onafhankelijk kloktempo van C." }
    ],
    update(world) {
      world.rateA = window.TD_SIM.get("rateA");
      world.rateB = window.TD_SIM.get("rateB");
      world.rateC = window.TD_SIM.get("rateC");
    }
  });
})();