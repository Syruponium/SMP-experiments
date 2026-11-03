(function () {
  "use strict";
  const S = window.TD_SIM;
  const canvas = document.getElementById("td-canvas");
  const aside = document.getElementById("td-controls");
  if (!canvas || !aside) throw new Error("HTML van index.html ontbreekt in JSFiddle.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D niet beschikbaar");
  const world = { running: true, years: 0, tauA: 0, tauB: 0, rateA: 1, rateB: 1, A: null, B: null, trails: { A: [], B: [] } };
  const physicsModules = [...S.modules].sort((a, b) => (a.order || 0) - (b.order || 0));
  const nf = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 2 });

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
    world.years = 0;
    world.tauA = 0;
    world.tauB = 0;
    world.trails.A = [];
    world.trails.B = [];
    world.rateA = S.get("rateA");
    world.rateB = S.get("rateB");
    render();
    updateNumbers();
  }

  function updateMode() {
    const mode = S.get("responseMode");
    document.getElementById("td-mode-label").textContent =
      mode === "off" ? "Vrije beweging" : mode === "rate" ? "Test: temporespons" : "Test: duurrespons";
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

  // De wereld heeft geen wanden; de camera schaalt automatisch om beide objecten te volgen.
  function cameraState() {
    const dx = Math.abs(world.A.x - world.B.x);
    const dy = Math.abs(world.A.y - world.B.y);
    const scale = Math.min(
      canvas.width / 120, canvas.height / 88,
      (canvas.width - 150) / Math.max(dx, 1),
      (canvas.height - 130) / Math.max(dy, 1)
    );
    return {
      x: (world.A.x + world.B.x) / 2,
      y: (world.A.y + world.B.y) / 2,
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
    const rate = name === "A" ? world.rateA : world.rateB;
    ctx.fillText(rate.toFixed(3).replace(".", ",") + "×", p.x + 20, p.y + 8);
  }

  function render() {
    const camera = cameraState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(camera);
    ctx.setLineDash([4, 7]);
    ctx.strokeStyle = "#426079";
    ctx.beginPath();
    const a = toCanvas(world.A, camera), b = toCanvas(world.B, camera);
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.setLineDash([]);
    drawTrail("A", "#f6a45c", world.A, camera);
    drawTrail("B", "#5ccff0", world.B, camera);
    drawBody("A", world.A, "#f6a45c", camera);
    drawBody("B", world.B, "#5ccff0", camera);
  }

  function updateNumbers() {
    const dist = Math.hypot(world.A.x - world.B.x, world.A.y - world.B.y);
    const speedA = Math.hypot(world.A.vx, world.A.vy);
    const speedB = Math.hypot(world.B.vx, world.B.vy);
    document.getElementById("td-years").textContent = nf.format(world.years) + " jaar";
    document.getElementById("td-tau-a").textContent = nf.format(world.tauA) + " jaar";
    document.getElementById("td-tau-b").textContent = nf.format(world.tauB) + " jaar";
    document.getElementById("td-gap").textContent = nf.format(world.tauB - world.tauA) + " jaar";
    document.getElementById("td-distance").textContent = nf.format(dist) + " eenheden";
    document.getElementById("td-speed").textContent = nf.format(speedA) + " / " + nf.format(speedB) + " eenh./Mjr";
  }

  document.getElementById("td-pause").addEventListener("click", function () {
    world.running = !world.running;
    this.textContent = world.running ? "Pauze" : "Verder";
  });
  document.getElementById("td-reset").addEventListener("click", resetWorld);
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