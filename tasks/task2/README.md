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

Object shape is defined in `variants/base.js`:

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

## Variants

- `base` preserves the original test from the red side of the historical diff.
- `reduced-face-adjacency` contains the revised test from the green side. It
  reduces broad face-adjacent voxel connections and relocates the blue cube and
  candidate positions while reusing the same two solved examples.

Puzzle data lives in `variants/`. The revised variant can be
opened directly with:

```text
http://localhost:4181/tasks/task2/?variant=reduced-face-adjacency&puzzle=test
```

Its benchmark images live under
`rendered_puzzle_images/task2/reduced-face-adjacency/`.
