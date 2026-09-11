import { baseVariant } from "./base.js";

export const reducedFaceAdjacencyVariant = {
  id: "reduced-face-adjacency",
  title: "Reduced Face Adjacency (Base)",
  description: "Select the labeled candidate nearest to the separate blue reference voxel.",
  changeSummary:
    "The examples stay fixed, while the test uses a sparser structure, a relocated blue cube, and updated candidates.",
  status: "ready",
  examples: ["example1", "example2"],
  tests: ["test"],
  cases: {
    example1: baseVariant.cases.example1,
    example2: baseVariant.cases.example2,
    test: {
      voxels: [
        [2, 2, 1], [2, 3, 1], [3, 4, 1], [2, 2, 6],
        [2, 2, 2], [2, 3, 2], [3, 4, 2],
        [3, 2, 1], [3, 3, 1],
        [3, 2, 2], [3, 3, 2], [3, 2, 6],
        [4, 2, 1], [4, 3, 1],
        [4, 2, 2], [4, 3, 2],
        [3, 4, 3], [2, 5, 3],
        [4, 3, 2], [4, 4, 3],
        [5, 3, 3], [5, 3, 4], [5, 4, 3],
        [6, 4, 3], [6, 3, 4],
        [2, 2, 3], [2, 2, 4], [2, 2, 5], [3, 5, 3], [3, 5, 2],
      ],
      blue: [2, 5, 5],
      candidates: [
        { label: "A", voxel: [3, 5, 2] },
        { label: "B", voxel: [5, 4, 3] },
        { label: "C", voxel: [6, 3, 4] },
        { label: "D", voxel: [3, 2, 6] },
      ],
    },
  },
};
