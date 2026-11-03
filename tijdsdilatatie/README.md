# Tijdsdilatatie — modulaire simulatie v1.0

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
| 2. Cumulatieve duur | [modules/duration.js](modules/duration.js) | Tijdsversnelling, afgeleide begintempo's A/B/C, groeiduur en klokstanden |
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

## Proportionele begintempo's (v0.6)

De drie vaste sliders voor begintempo A/B/C zijn verwijderd. Elke startwaarde wordt nu uit de bijbehorende ingestelde eindwaarde berekend, niet onafhankelijk ingesteld.

- Referentietempo: **1,000**.
- Nieuwe instelling in module 2: **Beginaandeel van eind-tijdsdilatatie** (0–100%, standaard 50%).
- Formule: begin = 1 + (eind − 1) × (percentage / 100).
- Voorbeeld bij 50%: A 0,980 → 0,990 bij start; B 1,000 → 1,000; C 1,020 → 1,010.
- Een ander gekozen eindtempo verandert direct de berekende startwaarde: bij A = 0,600 begint A op 0,800; bij C = 1,400 begint C op 1,200.
- Tijdens de ingestelde groeiduur beweegt ieder tempo lineair naar zijn eindwaarde.
- De overgang geldt alleen in de groeimodus (module 4); de vaste-tempo-modus gebruikt vanaf het begin de eindwaarden.
- Aanpassen van de eindtempo's of het beginaandeel reset bij het loslaten van de schuif de simulatie.
- Twee nieuwe metriekvelden tonen de berekende begintempo's en actuele kloktempo's van A/B/C.
- Bij de bestaande JSFiddle volstaat **Run**; HTML en CSS blijven ongewijzigd.

Dit vervangt de beschrijving van de afzonderlijke begintempo-sliders uit v0.5 hierboven.

## Live-meting per object (v0.7)

Zonder wijzigingen aan de bestaande JSFiddle-HTML/CSS verschijnen boven de andere meetwaarden drie afzonderlijke panelen voor A, B en C:

- **Kloktempo**: actuele klokfactor (5 decimalen), inclusief de ingestelde groeifase.
- **Snelheid**: lengte van de snelheidsvector, in eenheden per miljoen jaar (eenh./Mjr).
- **Versnelling**: lengte van de netto versnellingsvector uit de responstest, in eenheden per miljoen jaar² (eenh./Mjr²).
- **Versnelling = 0** als de respons uit staat, de koppelingssterkte nul is of er geen ongelijke kloktempo's bijdragen.
- De versnelling wordt DIRECT uit de werkelijke in die simulatiestap opgetelde snelheidsverandering afgeleid, niet geschat uit de snelheid of positie op het canvas. De bijdrage van elk paar telt vectorieel mee.
- Alle bestaande baan-, klok- en koppelingsregels zijn behouden. Alleen de acceleratie-diagnostiek en de presentatie zijn toegevoegd.
- **Gebruik**: open je bestaande JSFiddle en klik alleen op Run.

## Twee afstandsschalen, ongewijzigde fysica (v0.8)

- Beginafstand A–B (zon–aarde): 1 tot 1 miljard eenheden, logaritmische slider. Standaard 10.000.
- Beginafstand B–C (aarde–maan): 0,001 tot 1 miljard eenheden, logaritmische slider. Standaard circa 25,1.
- Beginhoek C rond B: 0–360 graden. Hiermee staat C relatief aan B, niet langer met absolute X/Y-sliders.
- Camera volgt: alle drie, A, B of C. De zichtbreedte van een gekozen focus is instelbaar. In totaaloverzicht blijft automatisch schalen actief.
- A–B en B–C zijn uitsluitend **beginposities**. De eerdere kloktempo-, duur-, start­snelheid-, bewegings- en responsregels zijn exact ongewijzigd. De testkoppeling blijft onafhankelijk van afstand.
- Met camera op B kan een heel kleine B–C-beweging zichtbaar blijven wanneer A zeer ver weg is.
- Geen stabiele zon–aarde–maanbanen worden afgedwongen of voorgeprogrammeerd. Of een geneste baan ontstaat is juist de onderzoeksvraag.
- In de bestaande JSFiddle volstaat opnieuw **Run**; HTML, CSS en loader blijven gelijk.

## Volledig onafhankelijke beginposities (v0.9)

De eerdere koppeling A–B = zon–aarde en B–C = aarde–maan is verwijderd. A, B en C krijgen nu elk onafhankelijke wereldcoördinaten: **X en Y**. Je kiest zelf welk object welke rol heeft.

- Zes instellingen: **Beginpositie A — X/Y**, **Beginpositie B — X/Y**, **Beginpositie C — X/Y**.
- Elke coördinaat loopt van −1.000.000.000 tot +1.000.000.000 eenheden.
- Gebruik de **logaritmische schuif** voor snelle bediening over grote en kleine afstanden, of het **numerieke veld** om de exacte coördinaat in te voeren (ook waarden tussen schuifstappen).
- Alle coördinaten zijn **absoluut en onafhankelijk**: het verplaatsen van B verandert de ingestelde positie van C niet.
- Standaard: A=(0,0), B=(10000,0), C=(10000,25), enkel als neutrale startconfiguratie; niets is geprogrammeerd als een gekoppelde maan of zon.
- De camera kan alle drie objecten volgen of op één van A/B/C focussen, met eigen zichtbreedte. Camera en beginposities zijn enkel bediening en presentatie.
- Kloktempo's, cumulatieve duur, testrespons, versnelling, snelheden en bewegingswetten zijn niet veranderd. Alle bestaande JSFiddle-panelen (HTML/CSS/loader) blijven gelijk; klik op Run.

NB: de beschrijving van de onderling gekoppelde beginafstanden in v0.8 hierboven is historische versie-informatie en geldt vanaf v0.9 niet meer.

## Positie-editor direct onder het canvas (v1.0)

**Wat is opgelost:** de X/Y-schuifjes stonden ver van het canvas, de automatische camera verplaatste het beeld bij elke wijziging en de getoonde punten waren tijdens het bijstellen onhandig te volgen.

- Nieuwe plaatsingsmodus bij openen: simulatie staat stil, met geselecteerd object A.
- Klik onder het canvas op **A / B / C**, klik daarna ergens in het canvas om dat object te plaatsen; of pak een zichtbare stip rechtstreeks met de muis en sleep deze.
- Tijdens een sleepactie blijft de camera volledig vast; de automatische camera mag de coördinaten niet laten springen.
- Onder het canvas staan zes exacte numerieke **X/Y-invoervelden**, gegroepeerd per object. De coördinaten blijven onafhankelijk, van −1 miljard tot +1 miljard eenheden.
- **Alle tonen**, **Focus op selectie**, **Zoom +**, **Zoom −** regelen uitsluitend de camera in plaatsingsmodus. Ze veranderen geen enkele fysicavariabele.
- Met **Start simulatie** start de tijdsintegratie vanuit de geplaatste objecten.
- Met **Posities bewerken** keer je vanuit de actieve simulatie terug naar de startposities en wordt de simulatie gepauzeerd.
- De zijbalk bevat nog steeds de kloktempo-, snelheids-, richtings- en cameraparameters, maar niet meer de X/Y-positievelden.
- De numerieke positievelden zijn geschikt voor grote afstandsverhoudingen waarbij niet alle punten tegelijk op een bruikbare schaal zichtbaar zijn.
- Bestaande JSFiddle: alleen op **Run** klikken. De positioneringsinterface wordt door JavaScript onder het bestaande canvas ingevoegd; HTML/CSS/loader hoeven niet te worden gewijzigd.
- De bestanden modules/response.js, modules/duration.js, modules/clocktempo.js en alle krachtsregels zijn ongewijzigd.
