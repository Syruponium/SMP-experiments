(function () {
  "use strict";
  const S = window.TD_SIM;
  const canvas = document.getElementById("td-canvas");
  const aside = document.getElementById("td-controls");
  if (!canvas || !aside) throw new Error("HTML van index.html ontbreekt in JSFiddle.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D niet beschikbaar");
  const names = ["A", "B", "C"];
  const colors = { A: "#f6a45c", B: "#5ccff0", C: "#c19bff" };
  const world = { running: true, years: 0, tauA: 0, tauB: 0, tauC: 0, rateA: 1, rateB: 1, rateC: 1, A: null, B: null, C: null, trails: { A: [], B: [], C: [] } };
  const physicsModules = [...S.modules].sort((a, b) => (a.order || 0) - (b.order || 0));
  const nf = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 2 });
  const nfSpeed = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 3 });
  const nfAcceleration = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 3, maximumFractionDigits: 6 });

  function formatted(c, value) {
    if (c.format === "exponent") return nf.format(Math.pow(10, value)) + " jaar/s";
    if (c.type === "select") return "";
    return Number(value).toFixed(c.digits == null ? 2 : c.digits).replace(".", ",") + (c.unit ? " " + c.unit : "");
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
    const half = S.get("separation") / 2;
    world.A = { x: -half, y: 0, ...initialVelocity("A") };
    world.B = { x: half, y: 0, ...initialVelocity("B") };
    world.C = { x: S.get("positionCX"), y: S.get("positionCY"), ...initialVelocity("C") };
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
    render();
    updateNumbers();
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

  // Geen wanden; camera volgt alle drie.
  function cameraState() {
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
    world.running = !world.running;
    this.textContent = world.running ? "Pauze" : "Verder";
  });
  document.getElementById("td-reset").addEventListener("click", resetWorld);
  extendUI();
  renderControls();
  resetWorld();
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