(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "duration",
    title: "2 · Cumulatieve duur",
    description: "De begintempo's worden automatisch afgeleid uit het eindtempo en één gemeenschappelijk beginaandeel. De klokstanden tellen de veranderende tempo's op.",
    order: 20,
    controls: [
      { id: "timeExponent", label: "Tijdsversnelling (10^n jaar/s)", min: 0, max: 12, step: 1, default: 6, digits: 0, unit: "", help: "6 = 1 miljoen jaar/s; 9 = 1 miljard jaar/s; 12 = 1 biljoen jaar/s. Alleen de tijdlijn, niet de krachten, wordt versneld. Bij extreme standen geldt een rekenlimiet.", format: "exponent" },
      { id: "growthMyr", label: "Duur van tempogroei", min: 1, max: 4500, step: 1, default: 10, digits: 0, unit: "miljoen jaar", reset: true, help: "Bij 10 miljoen jaar duurt de overgang 10 seconden op tijdsversnelling 10^6. Alleen in de cumulatieve groeimodus." },
      { id: "initialFractionPct", label: "Beginaandeel van eind-tijdsdilatatie", min: 0, max: 100, step: 1, default: 50, digits: 0, unit: "%", reset: true, help: "50% = starten halverwege referentietempo 1,000 en het gekozen eindtempo; geldt voor A, B en C." }
    ],
    // Lineaire overgang van begin- naar eindtempo. De geschiedenis is geen
    // extra krachtveld: uitsluitend de actuele klokstanden worden bijgehouden.
    initialRate(name) {
      const S = window.TD_SIM;
      const target = S.get("rate" + name);
      const fraction = S.get("initialFractionPct") / 100;
      // Starttempo = referentie plus beginaandeel van het eindverschil.
      return 1 + (target - 1) * fraction;
    },
    rateAt(name, years) {
      const S = window.TD_SIM;
      const target = S.get("rate" + name);
      if (S.get("responseMode") !== "duration") return target;
      const start = this.initialRate(name);
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
