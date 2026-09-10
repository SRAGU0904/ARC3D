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

Edit the relevant case in `variants/base.js`, or create and
register another variant, to move the labels:

```js
{ label: "A", anchor: [2, 4, 3], face: "+z" }
```

`anchor` is the existing cube that carries the label. `face` is the face where
the label is attached and where the green repair cube will be added.

## Variants

- `base` preserves the original Example 2 from the red side of the historical
  diff.
- `junction-bias-control` contains the revised Example 2 from the green side.
  It moves the correct repair away from the original junction pattern so the
  examples do not consistently reward a junction-position shortcut. Example 1
  and the held-out Test are unchanged.

Open the control variant directly with:

```text
http://localhost:4181/tasks/task3/?variant=junction-bias-control&puzzle=example2
```

Its benchmark images live under
`rendered_puzzle_images/task3/junction-bias-control/`.
