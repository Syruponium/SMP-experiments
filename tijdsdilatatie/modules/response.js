(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "response",
    title: "4 · Experimentele respons",
    description: "Standaard UIT. De optionele richting 'sneller naar trager' is een expliciet geprogrammeerde TESTHYPOTHESE, geen emergente zwaartekracht.",
    order: 30,
    controls: [
      { id: "responseMode", type: "select", label: "Signaal voor de bewegingsrespons", default: "off", options: [
        { value: "off", label: "Uit: alleen vrije beweging" },
        { value: "rate", label: "Actueel kloktempoverschil" },
        { value: "duration", label: "Opgebouwd klokverschil" }
      ], help: "Vergelijk actueel tempo met cumulatieve duur; dezelfde beginposities." },
      { id: "responseStrength", label: "Sterkte testkoppeling", min: 0, max: 8, step: 0.1, default: 1, digits: 1, unit: "×", help: "Geen Newton-wet of omgekeerde kwadraten. Energie en impuls zijn nog niet behouden." }
    ],
    update(world, dtYears) {
      const S = window.TD_SIM;
      const mode = S.get("responseMode");
      const strength = S.get("responseStrength");
      if (mode === "off" || strength === 0 || world.rateA === world.rateB) return;

      // BEWUSTE TESTREGEL: de snellere klok reageert richting de tragere.
      // Geen 'ontdekte' aantrekkingskracht: deze richting is expliciet gekozen.
      const faster = world.rateA > world.rateB ? world.A : world.B;
      const slower = world.rateA > world.rateB ? world.B : world.A;
      const dx = slower.x - faster.x, dy = slower.y - faster.y;
      const r = Math.hypot(dx, dy);
      if (r < 0.0001) return;
      const delta = mode === "rate"
        ? Math.abs(world.rateA - world.rateB)
        : Math.abs(world.tauB - world.tauA) / 1e6;
      // Limiet voorkomt numerieke explosie; niet opgevat als natuurwet.
      const signal = Math.min(delta, 10);
      const acceleration = 25 * strength * signal;
      const dtMyr = dtYears / 1e6;
      faster.vx += acceleration * dx / r * dtMyr;
      faster.vy += acceleration * dy / r * dtMyr;
    }
  });
})();