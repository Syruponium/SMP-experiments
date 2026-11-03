# Tijdsdilatatie — modulaire simulatie v0.2

Een minimale **twee-objecten-proef**, gebaseerd op de laadarchitectuur van modular-v3, zonder zware oscillatorvelden of deeltjessimulatie.

## Starten in JSFiddle

1. Open https://jsfiddle.net/ en maak een nieuwe Fiddle.
2. Kopieer de volledige inhoud van [index.html](index.html) naar het HTML-paneel.
3. Kopieer de volledige inhoud van [style.css](style.css) naar het CSS-paneel.
4. Kopieer **alleen** [loader-for-jsfiddle.js](loader-for-jsfiddle.js) naar het JavaScript-paneel.
5. Klik **Run**, controleer de bediening en sla de Fiddle op in je JSFiddle-account.

Daarna is bij iedere wijziging in GitHub alleen **Run** nodig: de loader laadt [manifest.json](manifest.json) en alle JavaScript-modules opnieuw. JSFiddle heeft geen eigen automatische schrijfkoppeling; HTML/CSS moeten na wijzigingen opnieuw worden gekopieerd. De oorspronkelijke modular-v3 blijft ongemoeid.

## Vier modules

| Module | Bestand | Wat wordt ingesteld? |
| --- | --- | --- |
| 1. Kloktempo / massaproxy | [modules/clocktempo.js](modules/clocktempo.js) | Twee onafhankelijke, relatieve kloktempo's (A/B) |
| 2. Cumulatieve duur | [modules/duration.js](modules/duration.js) | Tijdsversnelling (1–1.000.000 simulatiejaren per echte seconde), klokstanden |
| 3. Snelheid en posities | [modules/motion.js](modules/motion.js) | Beginafstand, snelheid en richting (0–360°) voor beide objecten |
| 4. Experimentele respons | [modules/response.js](modules/response.js) | Uit / huidig kloktempoverschil / opgebouwd klokverschil, koppelingssterkte |

De algemene engine en UI zitten apart in [core](core). Iedere module registreert eigen instellingen; nieuwe modules komen via het manifest binnen.

## Wat is en is niet gemodelleerd?

- **Geen Newton-zwaartekracht**: er staat nergens de gravitatieconstante, massa-afstandsversnelling of een inverse-kwadraatwet.
- **Massa is nog niet fysisch gekalibreerd**. De twee ingestelde kloktempo's zijn voorlopig *proxy's*; grotere massa wordt dus niet zelfstandig omgerekend naar sneller of langzamer tempo.
- **Een opbouwend verschil** is exact te berekenen uit de twee actuele klokstanden. Er is geen opgeslagen historie of extra veld.
- **Standaard beweegt niets uit zichzelf.** Zet respons *Uit* en beginsnelheden op nul om te controleren dat alleen klokstanden uiteenlopen.
- **Vrije 2D-beweging:** snelheid en richting per object zijn apart instelbaar. 0° is rechts, 90° omhoog, 180° links, 270° omlaag. Er zijn geen wanden of vaste bewegingsassen; de camera volgt en schaalt zodat beide objecten zichtbaar blijven.
- **De optionele respons is bewust NIET emergent.** Ze stuurt de stip met het hogere kloktempo richting de stip met het lagere kloktempo. Dat is een testwet, expliciet zichtbaar en volledig uit te schakelen. Zonder extra fysica volgt beweging niet uit twee getallen voor kloktempo alleen.
- Koppelingssterkte is niet fysisch geijkt. De optionele respons bewaart **nog geen energie of impuls** en is dus niet geschikt om conclusies over natuurkundige zwaartekracht te trekken.
- Posities, snelheid en tijd zijn speelgoed-eenheden: afstanden in eenheden, snelheid in eenheden per miljoen jaar (Mjr), tijd in jaren. **Niet** geïnterpreteerd als AU, km/s of werkelijk zonne-/aardmassa.

## Eerste gecontroleerde proeven

1. Beide snelheden 0; respons **Uit**; A=0,980, B=1,000. Het klokverschil groeit, maar beide stippen blijven staan.
2. Respons op *actueel kloktempoverschil*: vergelijk beweging na dezelfde verstreken tijd.
3. Reset; respons op *opgebouwd klokverschil*: vergelijk bij exact dezelfde beginsituatie.
4. Zet A=B=1,000 en controleer dat er geen respons is.

5. Zet beide snelheden op 2, met richting A op 0° en B op 180°. Controleer horizontale beweging. Herhaal met A op 45° en B op 225° voor diagonale beweging.

Dit zijn softwaretests van de gekozen regels, geen empirische bevestiging van een zwaartekrachtmechanisme.
