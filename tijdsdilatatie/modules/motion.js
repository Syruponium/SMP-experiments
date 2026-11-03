(function () {
  "use strict";
  window.TD_SIM.registerModule({
    id: "motion",
    title: "3 · Snelheid en posities",
    description: "Nieuw: A, B en C erven hun startsnelheid uit één gedeeld lokaal omgevingsveld. Nabije objecten erven vergelijkbare beweging. Handmatige beginsnelheden blijven alleen als controletest.",
    order: 40,
    controls: [
      { id: "initialVelocityMode", type: "select", label: "Oorsprong van de beginbeweging", default: "inherited", reset: true, options: [
        { value: "inherited", label: "Erf lokale omgevingsbeweging (experiment)" },
        { value: "manual", label: "Handmatige startsnelheden (controle)" }
      ], help: "In overervingsmodus hoef je niet per object een snelheid/richting te kiezen. De beginbeweging komt uit een gedeeld, ruimtelijk samenhangend omgevingsveld; daarna verandert alleen de bestaande klokrespons de snelheid." },
      { id: "ambientMotion", type: "logMagnitude", label: "Bewegingsniveau van de omgeving", min: 0, max: 1000000, step: 0.01, default: 20, unit: "eenh./Mjr", inheritedOnly: true, reset: true, help: "Eén gemeenschappelijke schaal voor de geërfde startsnelheden. Geen orbit-instelling en geen nieuwe kracht." },
      { id: "ambientCoherence", type: "logMagnitude", label: "Ruimtelijke samenhang van de omgeving", min: 1, max: 1000000000, step: 0.01, default: 120, unit: "eenheden", inheritedOnly: true, reset: true, help: "Grotere waarde: lokaal nabijgelegen objecten erven meer dezelfde beweging. Kleinere waarde: grotere verschillen bij dezelfde onderlinge afstand." },
      { id: "ambientSeed", label: "Starttoestand van de omgeving", min: 1, max: 1000, step: 1, default: 41, digits: 0, inheritedOnly: true, reset: true, help: "Andere, deterministische bewegingsgeschiedenis van het startmedium; reproduceerbaar met dezelfde instellingen. Geen baan geprogrammeerd." },
      { id: "posXA", type: "coordinate", label: "Beginpositie A — X", min: -1000000000000000, max: 1000000000000000, default: 0, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "posYA", type: "coordinate", label: "Beginpositie A — Y", min: -1000000000000000, max: 1000000000000000, default: 0, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "posXB", type: "coordinate", label: "Beginpositie B — X", min: -1000000000000000, max: 1000000000000000, default: 400, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "posYB", type: "coordinate", label: "Beginpositie B — Y", min: -1000000000000000, max: 1000000000000000, default: 0, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "posXC", type: "coordinate", label: "Beginpositie C — X", min: -1000000000000000, max: 1000000000000000, default: 400, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "posYC", type: "coordinate", label: "Beginpositie C — Y", min: -1000000000000000, max: 1000000000000000, default: 35, reset: true, help: "Positie via het canvas of het exacte invoerveld onder de simulatie." },
      { id: "activeA", type: "bodyToggle", label: "Object A interactie", min: 0, max: 1, step: 1, default: 1 },
      { id: "activeB", type: "bodyToggle", label: "Object B interactie", min: 0, max: 1, step: 1, default: 1 },
      { id: "activeC", type: "bodyToggle", label: "Object C interactie", min: 0, max: 1, step: 1, default: 1 },
      { id: "cameraTarget", type: "select", label: "Camera volgt", default: "all", options: [
        { value: "all", label: "Alle drie (automatisch uitgezoomd)" },
        { value: "A", label: "Object A" },
        { value: "B", label: "Object B" },
        { value: "C", label: "Object C" }
      ], help: "Alleen beeldweergave, geen invloed op de beweging." },
      { id: "cameraRangeLog", label: "Zichtbreedte bij volgen", min: -2, max: 10, step: 0.1, default: 2, digits: 1, format: "distanceExponent", help: "Kies het zichtveld bij de camera op A, B of C. Geen invloed op fysica." },
      { id: "speedA", manualOnly: true, type: "speed", label: "Startsnelheid A", min: 0, max: 1000000, step: 0.1, default: 0, digits: 1, unit: "eenh./Mjr", reset: true, help: "0 = stilstand, dus een gekozen hoek alleen heeft dan geen bewegingseffect. Logaritmische schuif + exacte numerieke invoer, tot 1 miljoen eenh./Mjr." },
      { id: "angleA", manualOnly: true, label: "Bewegingsrichting A", min: 0, max: 360, step: 1, default: 90, digits: 0, unit: "°", reset: true, help: "0° = rechts · 90° = omhoog · 180° = links · 270° = omlaag." },
      { id: "speedB", manualOnly: true, type: "speed", label: "Startsnelheid B", min: 0, max: 1000000, step: 0.1, default: 0, digits: 1, unit: "eenh./Mjr", reset: true, help: "0 = stilstand, dus een gekozen hoek alleen heeft dan geen bewegingseffect. Logaritmische schuif + exacte numerieke invoer, tot 1 miljoen eenh./Mjr." },
      { id: "angleB", manualOnly: true, label: "Bewegingsrichting B", min: 0, max: 360, step: 1, default: 90, digits: 0, unit: "°", reset: true, help: "0° = rechts · 90° = omhoog · 180° = links · 270° = omlaag." },
      { id: "speedC", manualOnly: true, type: "speed", label: "Startsnelheid C", min: 0, max: 1000000, step: 0.1, default: 0, digits: 1, unit: "eenh./Mjr", reset: true, help: "0 = stilstand, dus een gekozen hoek alleen heeft dan geen bewegingseffect. Logaritmische schuif + exacte numerieke invoer, tot 1 miljoen eenh./Mjr." },
      { id: "angleC", manualOnly: true, label: "Bewegingsrichting C", min: 0, max: 360, step: 1, default: 90, digits: 0, unit: "°", reset: true, help: "0° = rechts · 90° = omhoog · 180° = links · 270° = omlaag." }
    ],
    // Dit veld is een expliciet gekozen beginvoorwaarde, geen attractiekracht.
    // Het is continu in (x,y), onafhankelijk van objectnamen en geeft bij gelijke
    // posities exact dezelfde snelheid. Geen centrum, straal of cirkelbaan.
    // De beweging wordt bij ontstaan éénmalig geërfd; daarna niet afgedwongen.
    inheritedVelocity(position) {
      const S = window.TD_SIM;
      const amplitude = S.get("ambientMotion");
      const scale = S.get("ambientCoherence");
      const phase = S.get("ambientSeed") * 0.6180339887498948;
      const x = position.x / scale, y = position.y / scale;
      const vx = amplitude * (
        0.52 * Math.sin(0.71*x + 0.37*y + phase)
        + 0.31 * Math.cos(-0.43*x + 0.83*y + 1.7*phase)
        + 0.17 * Math.sin(0.19*x - 0.57*y + 3.1*phase)
      );
      const vy = amplitude * (
        0.52 * Math.cos(-0.59*x + 0.29*y + 2.3*phase)
        + 0.31 * Math.sin(0.79*x + 0.41*y + 0.7*phase)
        + 0.17 * Math.cos(0.23*x - 0.89*y + 3.7*phase)
      );
      return { vx, vy };
    },
    update(world, dtYears) {
      const dtMyr = dtYears / 1e6;
      const S = window.TD_SIM;
      for (const name of ["A", "B", "C"]) {
        // Object uit: positie én snelheid blijven onveranderd opgeslagen.
        // Bij opnieuw activeren gaat het verder vanaf diezelfde toestand.
        if (S.get("active" + name) !== 1) continue;
        const body = world[name];
        body.x += body.vx * dtMyr;
        body.y += body.vy * dtMyr;
      }
    }
  });
})();