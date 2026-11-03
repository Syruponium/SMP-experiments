(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "duration",
    title: "2 · Cumulatieve duur",
    description: "De klokstanden tellen op; in de groeimodus veranderen de kloktempo's lineair van beginwaarde naar eindwaarde. De respons gebruikt de groeisnelheid van het klokverschil.",
    order: 20,
    controls: [
      { id: "timeExponent", label: "Tijdsversnelling (10^n jaar/s)", min: 0, max: 6, step: 1, default: 6, digits: 0, unit: "", help: "Bij 6 verstrijken 1 miljoen simulatiejaren per echte seconde.", format: "exponent" },
      { id: "growthMyr", label: "Duur van tempogroei", min: 1, max: 4500, step: 1, default: 10, digits: 0, unit: "miljoen jaar", reset: true, help: "Bij 10 miljoen jaar duurt de overgang 10 seconden op tijdsversnelling 10^6. Alleen in de cumulatieve groeimodus." },
      { id: "startRateA", label: "Begintempo A", min: 0.5, max: 1.5, step: 0.001, default: 0.990, digits: 3, unit: "×", reset: true, help: "Bij massagroei (hypothese) kan het tempo richting het ingestelde eindtempo vertragen." },
      { id: "startRateB", label: "Begintempo B", min: 0.5, max: 1.5, step: 0.001, default: 1.005, digits: 3, unit: "×", reset: true },
      { id: "startRateC", label: "Begintempo C", min: 0.5, max: 1.5, step: 0.001, default: 1.023, digits: 3, unit: "×", reset: true }
    ],
    // Lineaire overgang van begin- naar eindtempo. De geschiedenis is geen
    // extra krachtveld: uitsluitend de actuele klokstanden worden bijgehouden.
    rateAt(name, years) {
      const S = window.TD_SIM;
      const target = S.get("rate" + name);
      if (S.get("responseMode") !== "duration") return target;
      const start = S.get("startRate" + name);
      const yearsOfGrowth = S.get("growthMyr") * 1e6;
      const fraction = Math.max(0, Math.min(1, years / yearsOfGrowth));
      return start + (target - start) * fraction;
    },
    update(world, dtYears) {
      if (!(dtYears > 0)) return;
      const S = window.TD_SIM;
      const startYears = world.years;
      const endYears = startYears + dtYears;
      const growthEnd = S.get("growthMyr") * 1e6;

      for (const name of ["A", "B", "C"]) {
        // Analytisch juiste integraal van een lineair tempo:
        // trapezium tijdens de groeifase + constante eindwaarde erna.
        // Bij overschrijden van growthEnd splitsen we de tijdstap.
        const firstPart = S.get("responseMode") === "duration"
          ? Math.min(dtYears, Math.max(0, growthEnd - startYears))
          : 0;
        let increment;
        if (firstPart > 0) {
          const startRate = this.rateAt(name, startYears);
          const boundaryRate = this.rateAt(name, startYears + firstPart);
          increment = firstPart * (startRate + boundaryRate) / 2
            + (dtYears - firstPart) * S.get("rate" + name);
        } else {
          increment = dtYears * this.rateAt(name, startYears);
        }
        world["tau" + name] += increment;
        world["rate" + name] = this.rateAt(name, endYears);
      }
      world.years = endYears;
    }
  });
})();
