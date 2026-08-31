# ARC-3D Demo: task 543a7ed5

This folder contains a local webpage demo that extends the ARC-AGI-1 training
task `543a7ed5` into a 3D voxel repair concept with one example and one test
puzzle.

## Source task

- ARC-AGI-1 stores tasks as JSON files with `train` demonstration pairs and
  `test` pairs. Each grid is a rectangle of integers `0` to `9`, visualized as
  colors.
- Task `543a7ed5` is an ARC-AGI-1 public training task with 15 x 15 examples.
  The test output is also 15 x 15 in the official JSON.
- The visible rule used for this concept: orange shapes are incomplete object
  evidence; the output adds green enclosing boundaries and yellow inferred
  internal missing regions.

## 3D interpretation

The demo uses a theoretical 10 x 10 x 10 voxel reasoning volume. Empty cells are
not drawn. Visible voxels touch directly, with black edge lines separating cube
units. Orange voxels are observed intact surface blocks; green voxels are
surface blocks that were missing from the broken object and should be repaired.

The `Example` tab shows input and output. The `Test` tab opens in a workspace
state where the user or model selects labeled candidate positions such as `A`,
`C`, or `D`. The selected labels are shown as a JSON action:

```json
{"repairs":["A","D"]}
```

`Check` compares the selected labels with the hidden answer. `Reveal` shows the
target repaired object.

To make a puzzle easier or harder, edit `missingVoxels` and `candidates` in
`main.js`. Each missing voxel is one visible surface block removed from the
completed cuboid:

```js
missingVoxels: [
  [4, 2, 4],
  [2, 4, 4],
]
```

One entry means the user only needs to repair one block.

Candidate labels define what the model is allowed to answer:

```js
candidates: [
  { label: "A", voxel: [4, 2, 4] },
  { label: "B", voxel: [5, 3, 4] },
]
```

If a candidate voxel is also in `missingVoxels`, it is a correct repair label.
Otherwise it is a distractor.

## Run locally

From this directory:

```sh
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/
```

The page imports Three.js from jsDelivr, so the browser needs internet access
the first time it loads the demo.
