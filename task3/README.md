# ARC-3D Task 3

Task 3 keeps the same single-screen layout as tasks 1 and 2, but changes the
rule to mirror-symmetry completion.

The model sees an incomplete orange voxel object inside the same 10 x 10 x 10
boundary. The object is almost symmetric across the faint vertical plane. Only
one voxel is missing. Candidate labels `A/B/C/D` are attached to one exposed
face each. Selecting a label adds a green voxel on that face.

Expected answer format:

```json
{"choice":"A"}
```

Edit `puzzles.example` or `puzzles.test` in `main.js` to move the labels:

```js
{ label: "A", anchor: [2, 4, 3], face: "+z" }
```

`anchor` is the existing cube that carries the label. `face` is the face where
the label is attached and where the green repair cube will be added.
