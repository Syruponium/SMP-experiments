(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "motion",
    title: "3 · Snelheid en posities",
    description: "Drie stippen bewegen vrij in het 2D-vlak, met instelbare snelheid en richting (0–360°). Geen wanden of begrensde banen.",
    order: 40,
    controls: [
      { id: "separation", label: "Beginafstand", min: 10, max: 70, step: 1, default: 40, digits: 0, unit: "eenheden", reset: true, help: "Wijziging start de meting opnieuw." },
      { id: "speedA", label: "Startsnelheid A", min: 0, max: 8, step: 0.1, default: 0, digits: 1, unit: "eenh./Mjr", reset: true, help: "Snelheid onafhankelijk van kloktempo." },
      { id: "angleA", label: "Bewegingsrichting A", min: 0, max: 360, step: 1, default: 90, digits: 0, unit: "°", reset: true, help: "0° = rechts · 90° = omhoog · 180° = links · 270° = omlaag." },
      { id: "speedB", label: "Startsnelheid B", min: 0, max: 8, step: 0.1, default: 0, digits: 1, unit: "eenh./Mjr", reset: true, help: "Snelheid onafhankelijk van kloktempo." },
      { id: "angleB", label: "Bewegingsrichting B", min: 0, max: 360, step: 1, default: 90, digits: 0, unit: "°", reset: true, help: "0° = rechts · 90° = omhoog · 180° = links · 270° = omlaag." },
      { id: "positionCX", label: "Beginpositie C — X", min: -150, max: 150, step: 0.1, default: 0, digits: 1, unit: "eenheden", reset: true, help: "Horizontale startpositie: negatief = links, positief = rechts. Ten opzichte van het midden tussen A en B." },
      { id: "positionCY", label: "Beginpositie C — Y", min: -150, max: 150, step: 0.1, default: 34.6, digits: 1, unit: "eenheden", reset: true, help: "Verticale startpositie: negatief = omlaag, positief = omhoog." },
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