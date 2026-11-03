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
      if (mode === "off" || strength === 0) return;

      // EXPERIMENTELE TESTREGEL, GEEN EMERGENTE ZWAARTEKRACHT:
      // Elk ongelijk paar: de snellere klok versnelt richting de tragere.
      // Evalueer alle drie paren vóór het wijzigen van de snelheden.
      const names = ["A", "B", "C"];
      const dv = { A: { x: 0, y: 0 }, B: { x: 0, y: 0 }, C: { x: 0, y: 0 } };
      const dtMyr = dtYears / 1e6;
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          const first = names[i], second = names[j];
          const rateFirst = world["rate" + first];
          const rateSecond = world["rate" + second];
          if (rateFirst === rateSecond) continue;

          const fasterName = rateFirst > rateSecond ? first : second;
          const slowerName = rateFirst > rateSecond ? second : first;
          const faster = world[fasterName], slower = world[slowerName];
          const dx = slower.x - faster.x, dy = slower.y - faster.y;
          const r = Math.hypot(dx, dy);
          if (r < 0.0001) continue;

          const delta = mode === "rate"
            ? Math.abs(rateFirst - rateSecond)
            : Math.abs(world["tau" + first] - world["tau" + second]) / 1e6;
          // Getallen 25 en 10 zijn softwarekeuzes, geen natuurconstanten.
          const acceleration = 25 * strength * Math.min(delta, 10);
          dv[fasterName].x += acceleration * dx / r * dtMyr;
          dv[fasterName].y += acceleration * dy / r * dtMyr;
        }
      }
      for (const name of names) {
        world[name].vx += dv[name].x;
        world[name].vy += dv[name].y;
      }
    }
  });
})();
