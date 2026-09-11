import { baseVariant } from "./base.js";

const ORANGE = "#ff8a24";
const GREEN = "#4bb763";

export const translationalCorrespondenceVariant = {
  id: "translational-correspondence",
  title: "Translational Correspondence",
  description: "Complete the correspondence between two identically oriented 3D structures by locating the missing voxel.",
  changeSummary:
    "Both structures have exactly the same orientation and voxel arrangement; only their x positions differ.",
  status: "ready",
  examples: ["example1", "example2"],
  tests: ["test"],
  cases: createCases(),
};

// Edit the missing source voxel and candidates here. The missing voxel shown
// in the green structure is always missingSource translated along +X.
function createCases() {
  const caseSettings = {
    example1: {
      translationX: 4,
      missingSource: [1, 4, 4],
      candidates: [
        { label: "A", anchor: [6, 3, 5], face: "-y" },
        { label: "B", anchor: [6, 4, 4], face: "-x" },
        { label: "C", anchor: [7, 4, 5], face: "+x" },
        { label: "D", anchor: [6, 4, 5], face: "+y" },
      ],
    },
    example2: {
      translationX: 4,
      missingSource: [3, 4, 5],
      candidates: [
        { label: "A", anchor: [8, 4, 5], face: "-x" },
        { label: "B", anchor: [6, 3, 4], face: "-y" },
        { label: "C", anchor: [7, 5, 4], face: "+z" },
        { label: "D", anchor: [6, 4, 4], face: "-z" },
      ],
    },
    test: {
      translationX: 4,
      missingSource: [2, 4, 4],
      candidates: [
        { label: "A", anchor: [6, 4, 3], face: "+z" },
        { label: "B", anchor: [7, 5, 3], face: "+y" },
        { label: "C", anchor: [8, 4, 3], face: "+x" },
        { label: "D", anchor: [6, 3, 4], face: "-y" },
      ],
    },
  };

  return Object.fromEntries(
    Object.entries(caseSettings).map(([caseId, settings]) => [
      caseId,
      makeTranslatedCase(baseVariant.cases[caseId], settings),
    ]),
  );
}

function makeTranslatedCase(baseCase, { translationX, missingSource, candidates }) {
  const orangeVoxels = baseCase.voxels
    .filter((voxel) => voxel.color.toLowerCase() === ORANGE)
    .map((voxel) => ({ pos: [...voxel.pos], color: ORANGE }));

  if (!orangeVoxels.some((voxel) => samePosition(voxel.pos, missingSource))) {
    throw new Error(`Missing source voxel ${missingSource.join(",")} is not present in the orange structure`);
  }

  const missing = translateX(missingSource, translationX);
  const greenVoxels = orangeVoxels
    .filter((voxel) => !samePosition(voxel.pos, missingSource))
    .map((voxel) => ({ pos: translateX(voxel.pos, translationX), color: GREEN }));

  return {
    translationX,
    missingSource: [...missingSource],
    voxels: [...orangeVoxels, ...greenVoxels],
    missing,
    candidates: candidates.map((candidate) => ({
      ...candidate,
      anchor: [...candidate.anchor],
    })),
  };
}

function translateX([x, y, z], offset) {
  return [x + offset, y, z];
}

function samePosition(left, right) {
  return left[0] === right[0] && left[1] === right[1] && left[2] === right[2];
}
