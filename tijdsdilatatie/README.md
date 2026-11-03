# Tijdsdilatatie — modulaire simulatie v0.5

Een minimale **drie-objecten-proef**, gebaseerd op de laadarchitectuur van modular-v3, zonder zware oscillatorvelden of deeltjessimulatie.

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
| 1. Kloktempo / massaproxy | [modules/clocktempo.js](modules/clocktempo.js) | Drie onafhankelijke, relatieve kloktempo's (A/B/C) |
| 2. Cumulatieve duur | [modules/duration.js](modules/duration.js) | Tijdsversnelling, begintempo's A/B/C, groeiduur, integratie van klokstanden |
| 3. Snelheid en posities | [modules/motion.js](modules/motion.js) | Beginafstand, snelheid en richting (0–360°) voor A, B en C |
| 4. Experimentele respons | [modules/response.js](modules/response.js) | Uit / vaste kloktempo's / groeisnelheid van cumulatief klokverschil, koppelingssterkte |

De algemene engine en UI zitten apart in [core](core). Iedere module registreert eigen instellingen; nieuwe modules komen via het manifest binnen.

## Wat is en is niet gemodelleerd?

- **Geen Newton-zwaartekracht**: er staat nergens de gravitatieconstante, massa-afstandsversnelling of een inverse-kwadraatwet.
- **Massa is nog niet fysisch gekalibreerd**. De drie ingestelde kloktempo's zijn voorlopig *proxy's*; grotere massa wordt dus niet zelfstandig omgerekend naar sneller of langzamer tempo.
- **Het opgebouwde verschil** wordt bepaald uit de drie actuele klokstanden. In de groeimodus is zijn groeisnelheid op ieder tijdstip gelijk aan het actuele kloktempoverschil. Er is geen opgeslagen historie of extra veld.
- **Standaard beweegt niets uit zichzelf.** Zet respons *Uit* en beginsnelheden op nul om te controleren dat alleen klokstanden uiteenlopen.
- **Vrije 2D-beweging:** snelheid en richting per object zijn apart instelbaar. 0° is rechts, 90° omhoog, 180° links, 270° omlaag. Er zijn geen wanden of vaste bewegingsassen; de camera volgt en schaalt zodat alle drie objecten zichtbaar blijven.
- **De optionele respons is bewust NIET emergent.** Per paar versnelt de snellere klok richting de tragere klok. Dat is een testwet, expliciet zichtbaar en volledig uit te schakelen. Zonder extra fysica volgt beweging niet uit twee getallen voor kloktempo alleen.
- Koppelingssterkte is niet fysisch geijkt. De optionele respons bewaart **nog geen energie of impuls** en is dus niet geschikt om conclusies over natuurkundige zwaartekracht te trekken.
- Posities, snelheid en tijd zijn speelgoed-eenheden: afstanden in eenheden, snelheid in eenheden per miljoen jaar (Mjr), tijd in jaren. **Niet** geïnterpreteerd als AU, km/s of werkelijk zonne-/aardmassa.

## Eerste gecontroleerde proeven

1. Beide snelheden 0; respons **Uit**; A=0,980, B=1,000. Het klokverschil groeit, maar beide stippen blijven staan.
2. Respons op *actueel kloktempoverschil*: vergelijk beweging na dezelfde verstreken tijd.
3. Selecteer *Groeisnelheid opgebouwd klokverschil (met tempogroei)*: dit start een nieuwe run; vergelijk het gedrag terwijl de tempo's van hun beginwaarden naar hun eindwaarden evolueren.
4. Zet A=B=1,000 en controleer dat er geen respons is.

5. Zet beide snelheden op 2, met richting A op 0° en B op 180°. Controleer horizontale beweging. Herhaal met A op 45° en B op 225° voor diagonale beweging.

Dit zijn softwaretests van de gekozen regels, geen empirische bevestiging van een zwaartekrachtmechanisme.

## Derde klok (v0.3)

- C start paars boven het midden van A en B (X = 0, Y = 34,6); de beginpositie is vanaf v0.4 vrij instelbaar met twee afzonderlijke X- en Y-schuifjes (−150 tot +150 eenheden).
- C krijgt dezelfde onafhankelijke kloktempo-, snelheids- en richtingsschuifjes als A en B.
- De respons onderzoekt alle drie paren A–B, A–C, B–C; bijdragen worden opgeteld, zonder inverse-kwadraatwet.
- Alle drie klokstanden en alle paarsgewijze cumulatieve verschillen worden gemeten.
- De camera houdt de drie objecten zichtbaar. Energie en impuls zijn bij ingeschakelde respons nog niet behouden.
- Bestaande JSFiddle: alleen opnieuw op **Run** klikken. De derde legenda en metrieken worden automatisch door JavaScript toegevoegd; HTML en CSS kunnen blijven staan.

## Vrije beginpositie C (v0.4)

- Instellingen in module 3: **Beginpositie C — X** en **Beginpositie C — Y**.
- De coördinaten zijn wereldcoördinaten: midden tussen de beginposities van A en B is (0,0); X positief is rechts, Y positief is omhoog.
- De ingestelde positie geldt bij een nieuwe run/reset. Bij loslaten van een schuifje reset de simulatie automatisch, gelijk aan de bestaande startsnelheid-schuifjes.
- Andere modules, kloktempo, snelheden en bewegingsrespons zijn ongewijzigd. De canvas-camera zoomt automatisch mee.
- In de bestaande JSFiddle volstaat **Run**; HTML en CSS blijven ongewijzigd.

## Tijdsafhankelijke kloktempo's en cumulatieve verschilgroei (v0.5)

De bestaande schuifjes **Kloktempo A/B/C** zijn de **eindtempo's**. Module 2 heeft nu **Begintempo A/B/C** en **Duur van tempogroei**. Bij de keuze *Groeisnelheid opgebouwd klokverschil (met tempogroei)* veranderen de tempo's gedurende de gekozen duur **lineair** naar hun eindtempo en blijven daarna constant. Er is geen nieuwe massawet: dit zijn instelbare hypothetische tempo-trajecten.

- Voorbeeld standaard: A **0,990 → 0,980**, B **1,005 → 1,000**, C **1,023 → 1,020** in **10 miljoen jaar**.
- Het opgebouwde klokverschil wordt als integraal van de veranderlijke tempo's berekend, inclusief het overgangspunt naar een constant tempo.
- De respons in de groeimodus gebruikt **niet** het totale opgebouwde verschil, maar uitsluitend de **groeisnelheid** (verschil in actuele kloktempo's). Dit is rekenkundig gelijk aan het actuele kloktempoverschil.
- Het onderscheid met de optie *Actueel kloktempoverschil* is dus **alleen het gekozen scenario**: constante eindtempo's versus een tijdsverloop van de tempo's. Bij gelijke tempo-trajecten zijn beide responsformules identiek.
- De huidige richtingsregel (snellere klok naar tragere) blijft expliciet voorgeschreven. Energie/impulsbehoud worden nog niet gegarandeerd.
- **Duur van tempogroei** staat standaard op 10 miljoen jaar: bij 1 miljoen gesimuleerde jaren/s is dat ongeveer 10 echte seconden. Instelbaar tot 4.500 miljoen jaar.
- Wijzigen van groeitijd, begintempo's of responsmodus start de simulatie opnieuw. HTML/CSS/loader in een bestaande JSFiddle hoeven niet gewijzigd te worden; alleen **Run**.
