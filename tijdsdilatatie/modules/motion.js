(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "motion",
    title: "3 · Snelheid en posities",
    description: "Zeer grote A–B-afstand met onafhankelijke, veel kleinere B–C-afstand. De klok- en bewegingsregels blijven exact ongewijzigd.",
    order: 40,
    controls: [
      { id: "separation", label: "Beginafstand A–B (zon–aarde)", min: 0, max: 9, step: 0.05, default: 4, digits: 2, format: "distanceExponent", reset: true, help: "Logaritmische schaal: 1 tot 1 miljard eenheden. Alleen de beginpositie verandert." },
      { id: "moonDistanceLog", label: "Beginafstand B–C (aarde–maan)", min: -3, max: 9, step: 0.05, default: 1.4, digits: 2, format: "distanceExponent", reset: true, help: "Logaritmische schaal: 0,001 tot 1 miljard eenheden. C wordt relatief aan B geplaatst." },
      { id: "moonAngle", label: "Beginhoek C rond B", min: 0, max: 360, step: 1, default: 90, digits: 0, unit: "°", reset: true, help: "0° rechts, 90° omhoog, 180° links, 270° omlaag ten opzichte van B." },
      { id: "cameraTarget", type: "select", label: "Camera volgt", default: "all", options: [
        { value: "all", label: "Alle drie (automatisch uitgezoomd)" },
        { value: "A", label: "Object A (zon)" },
        { value: "B", label: "Object B (aarde + maan)" },
        { value: "C", label: "Object C (maan)" }
      ], help: "Alleen beeldweergave, geen invloed op de beweging." },
      { id: "cameraRangeLog", label: "Zichtbreedte bij volgen", min: -2, max: 10, step: 0.1, default: 2, digits: 1, format: "distanceExponent", help: "Alleen bij camerafocus op A, B of C. Geen invloed op fysica." },
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