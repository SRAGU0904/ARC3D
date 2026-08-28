# ARC-3D Demo: task 543a7ed5

This folder contains a local webpage demo that extends the ARC-AGI-1 training
task `543a7ed5` into a 3D voxel concept with one example and one test puzzle.

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
units. Orange voxels are observed input evidence; green voxels are inferred
outer shell; yellow voxels are inferred interior missing regions.

The `Example` tab shows input and output. The `Test` tab opens in a workspace
state where the user can add green or yellow voxels by clicking faces of
existing cubes, check the answer, reset, or reveal the target answer.

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
