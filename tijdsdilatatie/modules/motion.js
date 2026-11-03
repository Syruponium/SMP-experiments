(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "motion",
    title: "3 · Snelheid en posities",
    description: "Vrije beweging: zonder ingeschakelde respons bewegen beide stippen rechtlijnig. Eenheden zijn nog geen AU/km/s.",
    order: 40,
    controls: [
      { id: "separation", label: "Beginafstand", min: 10, max: 70, step: 1, default: 40, digits: 0, unit: "eenheden", reset: true, help: "Wijziging start de meting opnieuw." },
      { id: "speedA", label: "Startsnelheid A (verticaal)", min: -4, max: 4, step: 0.1, default: 0, digits: 1, unit: "eenh./Mjr", reset: true },
      { id: "speedB", label: "Startsnelheid B (verticaal)", min: -4, max: 4, step: 0.1, default: 0, digits: 1, unit: "eenh./Mjr", reset: true }
    ],
    update(world, dtYears) {
      const dtMyr = dtYears / 1e6;
      for (const body of [world.A, world.B]) {
        body.x += body.vx * dtMyr;
        body.y += body.vy * dtMyr;
      }
    }
  });
})();