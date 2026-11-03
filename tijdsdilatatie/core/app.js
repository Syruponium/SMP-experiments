(function () {
  "use strict";
  const S = window.TD_SIM;
  const canvas = document.getElementById("td-canvas");
  const aside = document.getElementById("td-controls");
  if (!canvas || !aside) throw new Error("HTML van index.html ontbreekt in JSFiddle.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D niet beschikbaar");
  // 1400x1400 square viewport; widen the existing JSFiddle layout at runtime.
  canvas.width = 1400;
  canvas.height = 1400;
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  canvas.style.aspectRatio = "1 / 1";
  const appLayout = document.querySelector(".td-app");
  if (appLayout) appLayout.style.maxWidth = "2000px";
  const names = ["A", "B", "C"];
  const colors = { A: "#f6a45c", B: "#5ccff0", C: "#c19bff" };
  const world = { running: true, years: 0, tauA: 0, tauB: 0, tauC: 0, rateA: 1, rateB: 1, rateC: 1, A: null, B: null, C: null, trails: { A: [], B: [], C: [] } };
  const physicsModules = [...S.modules].sort((a, b) => (a.order || 0) - (b.order || 0));
  const nf = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 2 });
  const nfSpeed = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 3 });
  const nfAcceleration = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 3, maximumFractionDigits: 6 });
  // Positiebewerking is uitsluitend bediening, geen fysicawet.
  let editingPositions = true;
  let selectedBody = "A";
  let editorCamera = null;
  let pointerDragging = false;
  const positionInputs = {};
  let positionPanel = null;
  let editorStatus = null;
  let editButton = null;

  function formatted(c, value) {
    if (c.format === "exponent") return nf.format(Math.pow(10, value)) + " jaar/s";
    if (c.format === "distanceExponent") return Math.pow(10, value).toLocaleString("nl-NL", {maximumFractionDigits: 5}) + " eenheden";
    if (c.type === "select") return "";
    return Number(value).toFixed(c.digits == null ? 2 : c.digits).replace(".", ",") + (c.unit ? " " + c.unit : "");
  }

  // Getekende afstandschuiven werken logaritmisch; de opgeslagen X/Y-posities
  // zijn gewone wereldcoördinaten. Zo blijven kleine en enorme afstanden
  // onafhankelijk instelbaar. Direct numeriek invoeren blijft ook mogelijk.
  function positionToSlider(value) {
    return Math.sign(value) * Math.log10(1 + Math.abs(value));
  }
  function sliderToPosition(value) {
    return Math.sign(value) * (Math.pow(10, Math.abs(value)) - 1);
  }
  function formatPosition(value) {
    return value.toLocaleString("nl-NL", { maximumFractionDigits: 3 }) + " eenheden";
  }

  function renderControls() {
    for (const module of S.modules) {
      const section = document.createElement("section");
      section.className = "td-module";
      const h2 = document.createElement("h2");
      h2.textContent = module.title;
      const description = document.createElement("p");
      description.textContent = module.description;
      section.append(h2, description);
      for (const c of module.controls || []) {
        // Begincoördinaten staan direct onder het canvas, niet in de zijbalk.
        if (c.type === "coordinate") continue;
        const label = document.createElement("label");
        label.className = "td-control";
        const header = document.createElement("span");
        header.className = "td-control-head";
        const name = document.createElement("span");
        name.textContent = c.label;
        header.appendChild(name);
        label.appendChild(header);

        let input;
        const value = S.get(c.id);
        if (c.type === "coordinate") {
          const output = document.createElement("output");
          output.textContent = formatPosition(value);
          header.appendChild(output);

          const slider = document.createElement("input");
          slider.type = "range";
          slider.min = "-9";
          slider.max = "9";
          slider.step = "0.01";
          slider.value = String(positionToSlider(value));
          slider.setAttribute("aria-label", c.label + " via schuif");

          const number = document.createElement("input");
          number.type = "number";
          number.min = String(c.min);
          number.max = String(c.max);
          number.step = "any";
          number.value = String(value);
          number.setAttribute("aria-label", c.label + " exact");
          number.style.cssText = "display:block;width:100%;margin:5px 0 3px;padding:7px 9px;border:1px solid #39516b;border-radius:7px;color:#edf4fb;background:#0b1724;font:inherit;font-size:12px";

          const commit = function (raw) {
            S.set(c.id, raw);
            const actual = S.get(c.id);
            number.value = String(actual);
            slider.value = String(positionToSlider(actual));
            output.textContent = formatPosition(actual);
            resetWorld();
          };
          slider.addEventListener("input", function () {
            const preview = sliderToPosition(Number(slider.value));
            number.value = String(Number(preview.toPrecision(8)));
            output.textContent = formatPosition(preview);
          });
          slider.addEventListener("change", function () {
            commit(sliderToPosition(Number(slider.value)));
          });
          number.addEventListener("change", function () {
            if (!number.value.trim() || !Number.isFinite(Number(number.value))) {
              number.value = String(S.get(c.id));
              return;
            }
            commit(Number(number.value));
          });
          label.append(slider, number);
          if (c.help) {
            const help = document.createElement("small");
            help.textContent = c.help;
            label.appendChild(help);
          }
          section.appendChild(label);
          continue;
        }
        if (c.type === "select") {
          input = document.createElement("select");
          for (const option of c.options) {
            const el = document.createElement("option");
            el.value = option.value;
            el.textContent = option.label;
            input.appendChild(el);
          }
          input.value = value;
        } else {
          const output = document.createElement("output");
          output.textContent = formatted(c, value);
          header.appendChild(output);
          input = document.createElement("input");
          input.type = "range";
          input.min = c.min;
          input.max = c.max;
          input.step = c.step;
          input.value = value;
          input.addEventListener("input", function () {
            output.textContent = formatted(c, Number(input.value));
          });
        }
        input.addEventListener(c.reset ? "change" : "input", function () {
          S.set(c.id, input.value);
          if (c.reset) resetWorld();
          if (c.id === "responseMode") updateMode();
        });
        label.appendChild(input);
        if (c.help) {
          const help = document.createElement("small");
          help.textContent = c.help;
          label.appendChild(help);
        }
        section.appendChild(label);
      }
      aside.appendChild(section);
    }
  }

  function initialVelocity(name) {
    const speed = S.get("speed" + name);
    const radians = S.get("angle" + name) * Math.PI / 180;
    return { vx: speed * Math.cos(radians), vy: speed * Math.sin(radians) };
  }

  function resetWorld() {
    // Alleen beginposities: de bewegings- en versnellingsregels veranderen niet.
    world.A = { x: S.get("posXA"), y: S.get("posYA"), ...initialVelocity("A") };
    world.B = { x: S.get("posXB"), y: S.get("posYB"), ...initialVelocity("B") };
    world.C = { x: S.get("posXC"), y: S.get("posYC"), ...initialVelocity("C") };
    for (const name of names) {
      world[name].ax = 0;
      world[name].ay = 0;
    }
    world.years = 0;
    world.tauA = 0;
    world.tauB = 0;
    world.tauC = 0;
    for (const name of names) world.trails[name] = [];
    const durationModule = S.modules.find(module => module.id === "duration");
    for (const name of names) world["rate" + name] =
      durationModule.rateAt(name, 0);
    if (editingPositions) editorCamera = null; // opnieuw kadreren bij een expliciete reset
    render();
    updateNumbers();
    if (positionPanel) refreshPositionEditor();
  }

  function updateMode() {
    const mode = S.get("responseMode");
    document.getElementById("td-mode-label").textContent =
      mode === "off" ? "Vrije beweging" : mode === "rate" ? "Test: vaste tempo's" : "Test: groei klokverschil";
  }

  function step(dtYears) {
    // Kleine deelstappen houden de integratie bij tijdsversnelling beheersbaar.
    const count = Math.max(1, Math.ceil(dtYears / 20000));
    const h = dtYears / count;
    for (let i = 0; i < count; i++) {
      for (const module of physicsModules) {
        if (typeof module.update === "function") module.update(world, h);
      }
    }
  }

  // De camera is uitsluitend een weergave-instelling.
  function cameraState() {
    if (editingPositions && editorCamera) return editorCamera;
    const follow = S.get("cameraTarget");
    if (follow !== "all") {
      const body = world[follow];
      return { x: body.x, y: body.y, scale: canvas.width / Math.pow(10, S.get("cameraRangeLog")) };
    }
    const xs = names.map(name => world[name].x);
    const ys = names.map(name => world[name].y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const dx = maxX - minX;
    const dy = maxY - minY;
    const scale = Math.min(
      canvas.width / 120, canvas.height / 88,
      (canvas.width - 150) / Math.max(dx, 1),
      (canvas.height - 130) / Math.max(dy, 1)
    );
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      scale
    };
  }

  function toCanvas(point, camera) {
    return {
      x: canvas.width / 2 + (point.x - camera.x) * camera.scale,
      y: canvas.height / 2 - (point.y - camera.y) * camera.scale
    };
  }

  // Roosterlijnen liggen vast in wereldcoördinaten en maken camerabeweging zichtbaar.
  function drawGrid(camera) {
    const desiredStep = 80 / camera.scale;
    const decade = Math.pow(10, Math.floor(Math.log10(desiredStep)));
    const ratio = desiredStep / decade;
    const step = decade * (ratio > 5 ? 10 : ratio > 2 ? 5 : ratio > 1 ? 2 : 1);
    const left = camera.x - canvas.width / (2 * camera.scale);
    const right = camera.x + canvas.width / (2 * camera.scale);
    const bottom = camera.y - canvas.height / (2 * camera.scale);
    const top = camera.y + canvas.height / (2 * camera.scale);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#192c3e";
    for (let i = Math.ceil(left / step); i <= Math.floor(right / step); i++) {
      const x = toCanvas({ x: i * step, y: 0 }, camera).x;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let i = Math.ceil(bottom / step); i <= Math.floor(top / step); i++) {
      const y = toCanvas({ x: 0, y: i * step }, camera).y;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
  }

  function drawTrail(name, color, body, camera) {
    const points = world.trails[name];
    const last = points[points.length - 1];
    if (!last || Math.hypot(body.x - last.x, body.y - last.y) * camera.scale > 2.5) {
      points.push({ x: body.x, y: body.y });
      if (points.length > 200) points.shift();
    }
    if (points.length > 1) {
      const start = toCanvas(points[0], camera);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < points.length; i++) {
        const p = toCanvas(points[i], camera);
        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawBody(name, body, color, camera) {
    const p = toCanvas(body, camera);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e9f5ff";
    ctx.font = "bold 15px system-ui";
    ctx.fillText(name, p.x + 20, p.y - 10);
    ctx.font = "12px system-ui";
    const rate = world["rate" + name];
    ctx.fillText(rate.toFixed(3).replace(".", ",") + "×", p.x + 20, p.y + 8);
  }

  function render() {
    const camera = cameraState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(camera);
    ctx.setLineDash([4, 7]);
    ctx.strokeStyle = "#426079";
    ctx.beginPath();
    for (const [first, second] of [["A","B"],["A","C"],["B","C"]]) {
      const p1 = toCanvas(world[first], camera), p2 = toCanvas(world[second], camera);
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    for (const name of names) drawTrail(name, colors[name], world[name], camera);
    for (const name of names) drawBody(name, world[name], colors[name], camera);
    if (editingPositions) {
      const p = toCanvas(world[selectedBody], camera);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // De nieuwe metrieken en C-legenda komen dynamisch in de bestaande JSFiddle-HTML.
  function addMetric(id, label) {
    const div = document.createElement("div");
    const caption = document.createElement("span");
    caption.textContent = label;
    const value = document.createElement("strong");
    value.id = id;
    value.textContent = "0";
    div.append(caption, value);
    document.querySelector(".td-metrics").appendChild(div);
  }

  // Drie compacte meetkaarten bovenaan de bestaande metriek-sectie.
  // Geen wijzigingen nodig in de HTML of CSS van de opgeslagen JSFiddle.
  function extendObjectMetrics() {
    const metrics = document.querySelector(".td-metrics");
    const cards = [];
    for (const name of names) {
      const card = document.createElement("div");
      const heading = document.createElement("strong");
      heading.textContent = "Object " + name;
      heading.style.color = colors[name];
      heading.style.display = "block";
      heading.style.marginBottom = "10px";
      card.appendChild(heading);
      for (const [key, label] of [
        ["rate", "Kloktempo"],
        ["speed", "Snelheid"],
        ["accel", "Versnelling"]
      ]) {
        const line = document.createElement("div");
        line.style.display = "flex";
        line.style.justifyContent = "space-between";
        line.style.alignItems = "baseline";
        line.style.gap = "8px";
        const caption = document.createElement("span");
        caption.textContent = label;
        const value = document.createElement("strong");
        value.id = "td-" + key + "-" + name.toLowerCase();
        value.style.fontSize = "13px";
        line.append(caption, value);
        card.appendChild(line);
      }
      cards.push(card);
    }
    metrics.prepend(...cards);
  }


  function numericPosition(value) {
    return String(Number(value.toPrecision(12)));
  }

  function refreshPositionEditor() {
    for (const name of names) {
      const controls = positionInputs[name];
      if (!controls) continue;
      controls.button.style.borderColor = selectedBody === name ? colors[name] : "#38506a";
      controls.button.style.background = selectedBody === name ? "#243d58" : "#17283a";
      for (const axis of ["X", "Y"]) {
        const input = controls[axis];
        if (document.activeElement !== input) input.value = numericPosition(S.get("pos" + axis + name));
      }
    }
    if (positionPanel) {
      positionPanel.style.opacity = "1";
      if (editorStatus) editorStatus.textContent = editingPositions
        ? "Plaatsingsmodus — stilstaand. Sleep een punt of klik om het geselecteerde punt te verplaatsen."
        : "Simulatie actief. Klik op 'Posities bewerken' om de startposities aan te passen.";
      if (editButton) editButton.textContent = editingPositions ? "Start simulatie" : "Posities bewerken";
      canvas.style.cursor = editingPositions ? "crosshair" : "default";
      canvas.style.touchAction = editingPositions ? "none" : "auto";
    }
  }

  function editStartPosition(name, x, y) {
    if (!editingPositions) return;
    const max = 1e15;
    const finiteX = Math.max(-max, Math.min(max, x));
    const finiteY = Math.max(-max, Math.min(max, y));
    if (!Number.isFinite(finiteX) || !Number.isFinite(finiteY)) return;
    S.set("posX" + name, finiteX);
    S.set("posY" + name, finiteY);
    // De integratie is tijdens de plaatsing uitgeschakeld.
    world[name].x = finiteX;
    world[name].y = finiteY;
    refreshPositionEditor();
    render();
    updateNumbers();
  }

  function editorPointFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    const canvasX = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const canvasY = (event.clientY - bounds.top) * canvas.height / bounds.height;
    const camera = editorCamera || cameraState();
    return {
      screenX: canvasX,
      screenY: canvasY,
      x: camera.x + (canvasX - canvas.width / 2) / camera.scale,
      y: camera.y - (canvasY - canvas.height / 2) / camera.scale
    };
  }

  function buildPositionEditor() {
    const stage = canvas.parentNode;
    const editor = document.createElement("section");
    editor.setAttribute("aria-label", "Beginposities onder het canvas");
    editor.style.cssText = "margin:10px 0 16px;padding:13px;border:1px solid #36546d;border-radius:11px;background:#122437;color:#edf4fb";
    positionPanel = editor;

    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:10px";
    const title = document.createElement("strong");
    title.textContent = "Plaats objecten op het scherm:";
    title.style.cssText = "font-size:12px;margin-right:6px";
    row.append(title);
    for (const name of names) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "● " + name;
      button.style.cssText = "padding:6px 13px;background:#17283a;border:1px solid #38506a;border-radius:7px;font-size:12px";
      button.style.color = colors[name];
      button.addEventListener("click", () => {
        selectedBody = name;
        refreshPositionEditor();
        render();
      });
      positionInputs[name] = {button};
      row.append(button);
    }
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:9px";
    const mkButton = (label, callback) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.style.cssText = "padding:6px 10px;background:#17283a;border:1px solid #38506a;font-size:12px";
      b.addEventListener("click", callback);
      return b;
    };
    const alignEditorCamera = () => {
      editorCamera = null;
      editorCamera = cameraState();
      render();
    };
    actions.append(mkButton("Alle tonen", () => {
      const xs=names.map(name => world[name].x), ys=names.map(name => world[name].y);
      const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
      editorCamera = {
        x:(minX+maxX)/2, y:(minY+maxY)/2,
        scale:Math.min(canvas.width / 120, canvas.height / 88,
          (canvas.width-150)/Math.max(maxX-minX,1),
          (canvas.height-130)/Math.max(maxY-minY,1))
      };
      render();
    }));
    actions.append(mkButton("Focus op selectie", () => {
      const center = world[selectedBody];
      // Kies automatisch de lokale schaal: de dichtstbijzijnde andere stip
      // wordt zichtbaar, zelfs als de derde vele grootteordes verderop ligt.
      const near = names.filter(name => name !== selectedBody)
        .map(name => Math.hypot(world[name].x-center.x, world[name].y-center.y))
        .filter(distance => distance > 0);
      const nearest = near.length ? Math.min(...near) : 100;
      const scale = Math.min(1e12, Math.max(1e-15, canvas.width * 0.34 / nearest));
      editorCamera = { x:center.x, y:center.y, scale };
      render();
    }));
    actions.append(mkButton("Zoom +", () => {
      const camera = editorCamera || cameraState();
      editorCamera = {...camera, scale:Math.min(camera.scale*2,1e9)};
      render();
    }));
    actions.append(mkButton("Zoom −", () => {
      const camera = editorCamera || cameraState();
      editorCamera = {...camera, scale:Math.max(camera.scale/2,1e-10)};
      render();
    }));
    editButton = mkButton("Start simulatie", () => {
      if (editingPositions) {
        editingPositions = false;
        world.running = true;
        document.getElementById("td-pause").textContent = "Pauze";
        editorCamera = null;
      } else {
        // Opnieuw beginnen vanaf de ingestelde startcoördinaten.
        editingPositions = true;
        world.running = false;
        resetWorld();
        editorCamera = cameraState();
        document.getElementById("td-pause").textContent = "Verder";
      }
      refreshPositionEditor();
      render();
    });
    editButton.style.background = "#236caa";
    actions.append(editButton);
    editorStatus = document.createElement("p");
    editorStatus.style.cssText = "color:#a9c0d5;margin:7px 0 10px;font-size:11px;line-height:1.4";

    const coords = document.createElement("div");
    coords.style.cssText = "display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px";
    for (const name of names) {
      const cell = document.createElement("div");
      cell.style.cssText = "min-width:0;background:#172c40;padding:9px;border-radius:8px";
      const head = document.createElement("strong");
      head.textContent = "Object " + name;
      head.style.cssText = "display:block;font-size:12px;margin-bottom:7px";
      head.style.color = colors[name];
      cell.append(head);
      for (const axis of ["X","Y"]) {
        const label = document.createElement("label");
        label.style.cssText = "display:block;font-size:11px;color:#a9c0d5;margin:4px 0";
        label.textContent = axis + " (eenheden)";
        const input = document.createElement("input");
        input.type = "number";
        input.step = "any";
        input.min = "-1000000000000000";
        input.max = "1000000000000000";
        input.style.cssText = "display:block;width:100%;margin-top:4px;padding:6px 7px;border:1px solid #45617d;border-radius:6px;background:#0b1724;color:#edf4fb;font-size:12px";
        input.addEventListener("change", () => {
          const value = Number(input.value);
          if (!input.value.trim() || !Number.isFinite(value)) {
            refreshPositionEditor();
            return;
          }
          if (!editingPositions) {
            editingPositions = true;
            world.running = false;
            resetWorld();
            editorCamera = cameraState();
            document.getElementById("td-pause").textContent = "Verder";
          }
          const body = world[name];
          if (axis === "X") editStartPosition(name, value, body.y);
          else editStartPosition(name, body.x, value);
          refreshPositionEditor();
        });
        label.append(input);
        cell.append(label);
        positionInputs[name][axis] = input;
      }
      coords.append(cell);
    }
    editor.append(row, actions, editorStatus, coords);
    // Na het canvas en vóór de bestaande meetpanelen.
    canvas.insertAdjacentElement("afterend", editor);

    // Scrollwiel zoomt rond de aanwijzer zonder de wereldposities te veranderen.
    canvas.addEventListener("wheel", event => {
      if (!editingPositions) return;
      event.preventDefault();
      const camera = editorCamera || cameraState();
      const point = editorPointFromEvent(event);
      const newScale = Math.min(1e12, Math.max(1e-15,
        camera.scale * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.008)
      ));
      editorCamera = {
        x:point.x - (point.screenX - canvas.width/2)/newScale,
        y:point.y + (point.screenY - canvas.height/2)/newScale,
        scale:newScale
      };
      render();
    }, { passive:false });

    canvas.addEventListener("pointerdown", event => {
      if (!editingPositions || event.button !== 0) return;
      if (!editorCamera) editorCamera = cameraState();
      const pos = editorPointFromEvent(event);
      let nearest = null, minDist = 24;
      for (const name of names) {
        const screen = toCanvas(world[name], editorCamera);
        const dist = Math.hypot(screen.x-pos.screenX,screen.y-pos.screenY);
        if (dist < minDist) {minDist=dist;nearest=name;}
      }
      if (nearest) selectedBody = nearest;
      else editStartPosition(selectedBody,pos.x,pos.y);
      pointerDragging = true;
      canvas.setPointerCapture(event.pointerId);
      refreshPositionEditor();
      render();
      event.preventDefault();
    });
    canvas.addEventListener("pointermove", event => {
      if (!editingPositions || !pointerDragging) return;
      const pos = editorPointFromEvent(event);
      editStartPosition(selectedBody,pos.x,pos.y);
      event.preventDefault();
    });
    const stopDrag = event => {
      if (!pointerDragging) return;
      pointerDragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    canvas.addEventListener("pointerup",stopDrag);
    canvas.addEventListener("pointercancel",stopDrag);
    // Zonder afhankelijkheid van native canvas-breedte of pagina-scroll.
    refreshPositionEditor();
  }

  function extendUI() {
    const title = document.querySelector(".td-header h1");
    if (title) title.textContent = "Tijdsdilatatie — drie klokken";
    const legend = document.createElement("span");
    const dot = document.createElement("i");
    dot.className = "td-dot";
    dot.style.backgroundColor = colors.C;
    legend.appendChild(dot);
    legend.appendChild(document.createTextNode(" C "));
    const small = document.createElement("small");
    small.textContent = "paars";
    legend.appendChild(small);
    const mode = document.getElementById("td-mode-label");
    mode.parentNode.insertBefore(legend, mode);
    canvas.setAttribute("aria-label", "Drie objecten met instelbare kloktempo's");
    addMetric("td-tau-c", "Klok C");
    addMetric("td-gap-ca", "Opgebouwd verschil C − A");
    addMetric("td-gap-cb", "Opgebouwd verschil C − B");
    addMetric("td-distance-ac", "Afstand A–C");
    addMetric("td-distance-bc", "Afstand B–C");
    addMetric("td-start-rates", "Berekend begintempo A / B / C");
    addMetric("td-current-rates", "Huidig kloktempo A / B / C");
    const caption = document.getElementById("td-speed").previousElementSibling;
    if (caption) caption.textContent = "Snelheden A / B / C";
    extendObjectMetrics();
    buildPositionEditor();
  }

  function distance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function updateNumbers() {
    document.getElementById("td-years").textContent = nf.format(world.years) + " jaar";
    for (const name of names) {
      const id = name.toLowerCase();
      const body = world[name];
      document.getElementById("td-tau-" + id).textContent =
        nf.format(world["tau" + name]) + " jaar";
      document.getElementById("td-rate-" + id).textContent =
        world["rate" + name].toFixed(5).replace(".", ",") + " ×";
      document.getElementById("td-speed-" + id).textContent =
        nfSpeed.format(Math.hypot(body.vx, body.vy)) + " eenh./Mjr";
      document.getElementById("td-accel-" + id).textContent =
        nfAcceleration.format(Math.hypot(body.ax, body.ay)) + " eenh./Mjr²";
    }
    const durationModule = S.modules.find(module => module.id === "duration");
    document.getElementById("td-start-rates").textContent = names.map(name =>
      durationModule.rateAt(name, 0).toFixed(3).replace(".", ",")
    ).join(" / ") + " ×";
    document.getElementById("td-current-rates").textContent = names.map(name =>
      world["rate" + name].toFixed(3).replace(".", ",")
    ).join(" / ") + " ×";
    document.getElementById("td-gap").textContent = nf.format(world.tauB - world.tauA) + " jaar";
    document.getElementById("td-gap-ca").textContent = nf.format(world.tauC - world.tauA) + " jaar";
    document.getElementById("td-gap-cb").textContent = nf.format(world.tauC - world.tauB) + " jaar";
    document.getElementById("td-distance").textContent = nf.format(distance(world.A, world.B)) + " eenheden";
    document.getElementById("td-distance-ac").textContent = nf.format(distance(world.A, world.C)) + " eenheden";
    document.getElementById("td-distance-bc").textContent = nf.format(distance(world.B, world.C)) + " eenheden";
    document.getElementById("td-speed").textContent = names.map(name =>
      nf.format(Math.hypot(world[name].vx, world[name].vy))
    ).join(" / ") + " eenh./Mjr";
  }

  document.getElementById("td-pause").addEventListener("click", function () {
    if (editingPositions) {
      editingPositions = false;
      editorCamera = null;
      refreshPositionEditor();
    }
    world.running = !world.running;
    this.textContent = world.running ? "Pauze" : "Verder";
  });
  document.getElementById("td-reset").addEventListener("click", resetWorld);
  extendUI();
  renderControls();
  resetWorld();
  // Bij laden eerst rustig de drie beginposities instellen.
  world.running = false;
  document.getElementById("td-pause").textContent = "Verder";
  editorCamera = cameraState();
  refreshPositionEditor();
  updateMode();
  let previous = performance.now();
  let previousMetrics = 0;
  function frame(now) {
    const dtReal = Math.min(Math.max((now - previous) / 1000, 0), 0.05);
    previous = now;
    if (world.running) {
      step(dtReal * Math.pow(10, S.get("timeExponent")));
      render();
    }
    if (now - previousMetrics > 100) { updateNumbers(); previousMetrics = now; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();