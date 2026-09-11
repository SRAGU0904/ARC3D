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
- `translational-correspondence` keeps each Base orange structure fixed and generates an
  identical green structure translated four voxels along the positive x axis.
  Edit `caseSettings` in `variants/translational-correspondence.js` to change the missing
  source voxel, translation distance, or candidate labels.

Open the control variant directly with:

```text
http://localhost:4181/tasks/task3/?variant=junction-bias-control&puzzle=example2
```

Its benchmark images live under
`rendered_puzzle_images/task3/junction-bias-control/`.

Open the identical-translation variant directly with:

```text
http://localhost:4181/tasks/task3/?variant=translational-correspondence&puzzle=example1
```

### Y-Axis Chiral Correspondence

The `y-axis-correspondence` variant changes the spatial layout from a pair
spread along x to a vertically arranged pair spread along y. The orange shapes
keep their orientation and sit in the upper part of the volume. Their
opposite-handed green correspondences sit directly below them. Candidate
anchors and labeled faces preserve the Base answer letters.

Unlike derived robustness variants, this file does not import or transform
`base.js`. Every orange voxel, green voxel, missing position, candidate anchor,
and candidate face is written explicitly in
`variants/y-axis-correspondence.js`, so individual cubes can be edited directly.

Open it directly with:

```text
http://localhost:4181/tasks/task3/?variant=y-axis-correspondence&puzzle=example1
```

### 180° Rotational Correspondence

The `rotational-correspondence` variant replaces the chiral reflection with a proper
rotation. The orange structures keep their Base coordinates. Each green
structure is obtained by rotating its orange counterpart 180 degrees around
the y axis: x and z reverse around the case center while y stays unchanged.
The missing voxel and every candidate anchor/face follow the same rotation.

All voxel and candidate coordinates are written explicitly in
`variants/rotational-correspondence.js`, so the cases can be edited cube by cube without
depending on `base.js`.

Open it directly with:

```text
http://localhost:4181/tasks/task3/?variant=rotational-correspondence&puzzle=example1
```

### Point-Symmetric Correspondence

The `point-symmetric-correspondence` variant uses central inversion rather than
a plane reflection or an axis rotation. The orange structures retain their
Base coordinates. Every green voxel is obtained by reflecting x, y, and z
through the center of its case. The complete orange and green pair is therefore
point-symmetric around that center.

All voxel, missing, and candidate coordinates are written explicitly in
`variants/point-symmetric-correspondence.js` for direct cube-by-cube editing.

Open it directly with:

```text
http://localhost:4181/tasks/task3/?variant=point-symmetric-correspondence&puzzle=example1
```
