# Modular Particle Box V3 (experimental)

The original V2.3 remains archived under `baseline/v2.3/original.js`.
V3 is a **new implementation**, not a validated physics-equivalent refactor. Compare it with V2.3 before interpreting experiment outcomes.

## Launch
1. Fork https://jsfiddle.net/aaldrikb/nsLjgt1f/9/ .
2. Keep HTML and CSS intact.
3. Replace JS panel *once* with [loader-for-jsfiddle.js](loader-for-jsfiddle.js) and Run.
4. On future rule edits, refresh Run (the loader fetches manifest + modules with no-store and cache-busting queries).

## Add independent rule
1. Create `rules/<category>/<new-rule>.js` invoking `SMP_V3.registerRule({id,group,label,min,max,step,default,unit,description,hooks})`.
2. Add path to manifest.json **before** core/engine.js. No existing rule file must change.
3. A slider appears automatically. Current groups: Systeem / dichtheid, Neighbour properties, Collision properties.
4. The rule can alter only predefined hooks. New types of physical interaction require adding a new generic hook to the responsible core, which should be reviewed separately.

## Scope and physics
* `neighborWeight` shapes how neighbors contribute within `neighborRadius`; the parameter `neighborSoftness` varies the influence taper. It does NOT make physical collisions soft or penetrable.
* `neighborVelocity` constrains direction and speed; two independent rules may be combined sequentially.
* `collisionVelocity` constrains post-collision heading; at 180° the original elastic collision is unchanged.
* Collisions enforce positional overlap correction, but the discrete integrator is not continuous collision detection; high-speed tunneling remains possible. This requires a separate engineering fix before claiming guaranteed impenetrability.
* Each experimental rule may modify conservation; log energy/momentum diagnostics.
* Particle count resets on slider release; all other rule sliders update live.
* Browser regression, performance and original V2.3 equivalence are **not yet verified**.
