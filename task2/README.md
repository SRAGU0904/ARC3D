# ARC-3D Task 2

Task 2 keeps the same single-screen 3D layout as task 1, but changes the rule.

The scene contains:

- a hand-authored voxel object made from unit cubes;
- an irregular broken surface;
- one blue unit cube placed at a distance from that face;
- four labeled candidate blocks on the broken face.

The model should choose the candidate label closest to the blue cube and return
a JSON action:

```json
{"choice":"B"}
```

Object shape is defined manually in `main.js`:

```js
voxels: [
  [1, 2, 3],
  [1, 3, 3],
  [3, 4, 5],
]
```

The blue cube is controlled by:

```js
blue: [8, 4, 5]
```

Candidate positions are defined under `candidates`. The closest candidate to
the blue cube is computed automatically.
