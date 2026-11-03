(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "duration",
    title: "2 · Cumulatieve duur",
    description: "Twee actuele klokstanden. Het verschil groeit wanneer de tempo's ongelijk zijn; er is geen extra geheugenmechanisme.",
    order: 20,
    controls: [
      { id: "timeExponent", label: "Tijdsversnelling (10^n jaar/s)", min: 0, max: 6, step: 1, default: 6, digits: 0, unit: "", help: "Bij 6 verstrijken 1 miljoen simulatiejaren per echte seconde.", format: "exponent" }
    ],
    update(world, dtYears) {
      world.tauA += world.rateA * dtYears;
      world.tauB += world.rateB * dtYears;
      world.years += dtYears;
    }
  });
})();