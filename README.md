# SMP Particle Box — experiment workflow

## Baseline
`baseline/v2.3/original.js` is the unchanged original JavaScript supplied in chat. Never overwrite it.

## Experiment
`sandbox-v23/engine.js` is a copy of V2.3 with three OPTIONAL replaceable rule hooks.
`sandbox-v23/rules.js` defines these hooks; `null` leaves the original physics active.

Rule hooks:
- `collisionTurn`: called before the original collision-angle limiter
- `neighborDirection`: called when the original neighbour-angle limit is exceeded
- `neighborSpeed`: called when original speed constraint requires adjustment

## Use with the EXISTING JSFiddle HTML and CSS
Keep the HTML and CSS panels of https://jsfiddle.net/aaldrikb/nsLjgt1f/9/ unchanged.
For a NEW fork only, replace the JavaScript panel with:

```javascript
(async () => {
  const base = "https://cdn.jsdelivr.net/gh/Syruponium/SMP-experiments@main/sandbox-v23";
  async function load(file) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${base}/${file}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Could not load " + file));
      document.head.appendChild(script);
    });
  }
  await load("rules.js");
  await load("engine.js");
})();
```

Changes committed to the rules file are not necessarily immediately visible through jsDelivr's branch cache; for immediate reproducible tests point the URLs at an exact commit SHA or use another versioned release.

## Rules protocol
Edit only `sandbox-v23/rules.js` for experimental laws.
- Return a pair of finite velocities `[vx, vy]` to override the named rule.
- Set the function to `null` to use original behaviour.
- Hooks run only at the points where the original restriction applies. For laws applying unconditionally, the engine must first be extended with an explicit hook.
- Hook return values can change energy or momentum. Always inspect the diagnostic metrics.

## Validation
- Source JavaScript parse checked successfully.
- Browser equivalence and conservation regression tests not yet completed; do not claim the experimental engine is physically equivalent until measured.
- Keep a copy of each rule config and JS URL or commit SHA per test run.
