(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "motion",
    title: "3 · Snelheid en posities",
    description: "Onafhankelijke beginposities tot ±10^15 eenheden. Plaats ze op het grote vierkante canvas of exact via de coördinaten eronder. Alle bewegingsregels blijven gelijk.",
    order: 40,
    controls: [
      { id: "posXA", type: "coordinate", label: "Beginpositie A — X", min: -1000000000000000, max: 1000000000000000, default: 0, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "posYA", type: "coordinate", label: "Beginpositie A — Y", min: -1000000000000000, max: 1000000000000000, default: 0, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "posXB", type: "coordinate", label: "Beginpositie B — X", min: -1000000000000000, max: 1000000000000000, default: 10000000, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "posYB", type: "coordinate", label: "Beginpositie B — Y", min: -1000000000000000, max: 1000000000000000, default: 0, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "posXC", type: "coordinate", label: "Beginpositie C — X", min: -1000000000000000, max: 1000000000000000, default: 10000000, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "posYC", type: "coordinate", label: "Beginpositie C — Y", min: -1000000000000000, max: 1000000000000000, default: 1000, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "cameraTarget", type: "select", label: "Camera volgt", default: "all", options: [
        { value: "all", label: "Alle drie (automatisch uitgezoomd)" },
        { value: "A", label: "Object A" },
        { value: "B", label: "Object B" },
        { value: "C", label: "Object C" }
      ], help: "Alleen beeldweergave, geen invloed op de beweging." },
      { id: "cameraRangeLog", label: "Zichtbreedte bij volgen", min: -2, max: 10, step: 0.1, default: 2, digits: 1, format: "distanceExponent", help: "Kies het zichtveld bij de camera op A, B of C. Geen invloed op fysica." },
      { id: "speedA", label: "Startsnelheid A", min: 0, max: 8, step: 0.1, default: 0, digits: 1, unit: "eenh./Mjr", reset: true, help: "Snelheid onafhankelijk van kloktempo." },
      { id: "angleA", label: "Bewegingsrichting A", min: 0, max: 360, step: 1, default: 90, digits: 0, unit: "°", reset: true, help: "0° = rechts · 90° = omhoog · 180° = links · 270° = omlaag." },
      { id: "speedB", label: "Startsnelheid B", min: 0, max: 8, step: 0.1, default: 0, digits: 1, unit: "eenh./Mjr", reset: true, help: "Snelheid onafhankelijk van kloktempo." },
      { id: "angleB", label: "Bewegingsrichting B", min: 0, max: 360, step: 1, default: 90, digits: 0, unit: "°", reset: true, help: "0° = rechts · 90° = omhoog · 180° = links · 270° = omlaag." },
      { id: "speedC", label: "Startsnelheid C", min: 0, max: 8, step: 0.1, default: 0, digits: 1, unit: "eenh./Mjr", reset: true, help: "Snelheid onafhankelijk van kloktempo." },
      { id: "angleC", label: "Bewegingsrichting C", min: 0, max: 360, step: 1, default: 90, digits: 0, unit: "°", reset: true, help: "0° = rechts · 90° = omhoog · 180° = links · 270° = omlaag." }
    ],
    update(world, dtYears) {
      const dtMyr = dtYears / 1e6;
      for (const body of [world.A, world.B, world.C]) {
        body.x += body.vx * dtMyr;
        body.y += body.vy * dtMyr;
      }
    }
  });
})();