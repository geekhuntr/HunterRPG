# Modeling contract (Instrument Lab 3D)

Every instrument is a procedural THREE.js model (three r147, global `THREE`) in its own file `src/model_<id>.js`.
No external assets are loaded: this sandbox cannot reach any 3D or photo host, so models are built from geometry code.

## Coordinate system
- Units: 1 unit = 1 cm, true-to-size for the listed length.
- The instrument lies in the XY plane with the working end (jaws / blades) toward **+X** and the handles/rings toward **-X**.
- The pivot (box lock or screw) is at the origin. Thickness is along **Z**.
- Ring halves: half A has its finger ring at +Y; half B is the mirror (built by `scale.y = -1` inside a pivot group).

## Registration
```js
ST3D.models.<id> = {
  id, recordId,            // recordId = study record id in src/content/records.js (e.g. 'allis', 'kelly', 'crile', 'metz', 'mayo-curved')
  build() -> { group, setOpen(k /*0..1*/), center: THREE.Vector3, size /*overall length, cm*/ },
  hasArticulation: true,
  parts: [['rings','Finger rings'], ...],      // part keys match mesh.userData.part (U.mesh(geo, mat, part) sets it)
  partViews: { rings: 'front', jaws: 'jaws', ... },  // camera preset to frame each part
  views: { front, back, side, oblique, <close-ups...> }, // {pos:[x,y,z], tgt:[x,y,z]}; close-ups < 14 cm from target
  status: { state: 'complete-v1', note: '...honest description of approximations...' },
  dims: 'Overall length ...; approximations ...'
};
```

## Kit (`src/kit.js`, `ST3D.kit` = U)
- `U.steel()` stainless material; `U.mesh(geo, mat, part)` tagged mesh.
- `U.extrude(shape, thickness, bevel)` centered flat plate from a `THREE.Shape` (rings, jaws, blades).
- `U.ringShape(cx, cy, rx, ry, wall)`, `U.roundRect`, `U.spline(points)` (closed smooth outline), `U.ellipsePts`.
- `U.bar(centerline, halfWidthFn(s), thickness, zFn(x))` swept bar with rounded section (shanks; zFn gives the joggle at the joint).
- `U.ribbon(centerline, leftFn, rightFn)` flat outline along a curve (ratchets / teeth via `U.sawtooth`).
- Do not shear extruded plates (caps triangulate badly); use `U.bar` for anything that bends in Z.

## Process per instrument
1. Write down the identifying geometry and its dimensions with sources.
2. Build, render front / edge / jaw close-up / open with `tests/harness.html?model=<id>`.
3. Review against references, fix, then mark `status.state = 'complete-v1'`.
