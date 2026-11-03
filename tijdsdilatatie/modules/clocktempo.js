(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "clocktempo",
    title: "1 · Kloktempo / massaproxy",
    description: "Instelbare eindtempo's A, B en C (massaproxy). In de groeimodus worden de begintempo's automatisch proportioneel uit deze eindwaarden afgeleid.",
    order: 10,
    controls: [
      { id: "rateA", label: "Kloktempo A (eind)", min: 0.5, max: 1.5, step: 0.001, default: 0.98, digits: 3, unit: "×", reset: true, help: "Lager getal = langzamere klok. Een aanpassing herstart het experiment." },
      { id: "rateB", label: "Kloktempo B (eind)", min: 0.5, max: 1.5, step: 0.001, default: 1.0, digits: 3, unit: "×", reset: true, help: "1,000 is het referentietempo. Een aanpassing herstart het experiment." },
      { id: "rateC", label: "Kloktempo C (eind)", min: 0.5, max: 1.5, step: 0.001, default: 1.02, digits: 3, unit: "×", reset: true, help: "Eindtempo van C. Een aanpassing herstart het experiment." }
    ],
    update(world) {
      world.rateA = window.TD_SIM.get("rateA");
      world.rateB = window.TD_SIM.get("rateB");
      world.rateC = window.TD_SIM.get("rateC");
    }
  });
})();