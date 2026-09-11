export const baseVariant = {
  id: "base",
  title: "Base: Surface Repair",
  description: "Repair incomplete 3D solid blocks by identifying their missing surface voxels.",
  status: "ready",
  examples: ["example1", "example2"],
  tests: ["test"],
  cases: {
    example1: {
      blocks: [
        {
          min: [2, 1, 1],
          max: [5, 4, 4],
          missingVoxels: [[5, 1, 4], [3, 4, 4]],
        },
        {
          min: [7, 2, 2],
          max: [9, 5, 5],
          missingVoxels: [[7, 5, 5]],
        },
      ],
      candidates: [
        { label: "A", anchor: [5, 1, 3], face: "+z" },
        { label: "B", anchor: [4, 3, 4], face: "+z" },
        { label: "C", anchor: [3, 4, 3], face: "+z" },
        { label: "D", anchor: [7, 5, 4], face: "+z" },
        { label: "E", anchor: [9, 5, 5], face: "+y" },
      ],
    },
    example2: {
      blocks: [
        {
          min: [1, 2, 2],
          max: [4, 5, 5],
          missingVoxels: [[4, 4, 5]],
        },
        {
          min: [6, 3, 3],
          max: [8, 6, 6],
          missingVoxels: [[7, 4, 6], [8, 5, 5]],
        },
      ],
      candidates: [
        { label: "A", anchor: [1, 4, 3], face: "-x" },
        { label: "B", anchor: [4, 4, 4], face: "+z" },
        { label: "C", anchor: [7, 4, 5], face: "+z" },
        { label: "D", anchor: [7, 5, 5], face: "+x" },
        { label: "E", anchor: [7, 6, 6], face: "+y" },
      ],
    },
    test: {
      blocks: [
        {
          min: [1, 2, 2],
          max: [4, 5, 5],
          missingVoxels: [[1, 3, 5], [4, 5, 5]],
        },
        {
          min: [6, 1, 4],
          max: [7, 4, 7],
          missingVoxels: [[7, 2, 5]],
        },
      ],
      candidates: [
        { label: "A", anchor: [7, 4, 7], face: "+y" },
        { label: "B", anchor: [4, 4, 3], face: "+x" },
        { label: "C", anchor: [4, 5, 4], face: "+z" },
        { label: "D", anchor: [6, 2, 5], face: "+x" },
        { label: "E", anchor: [1, 3, 4], face: "+z" },
      ],
    },
  },
};
