import { baseVariant } from "./base.js";

export const furthestDistanceVariant = {
  id: "furthest-distance",
  title: "Furthest Distance",
  description: "Select the labeled candidate furthest from the separate blue reference voxel.",
  changeSummary:
    "The Base geometry and blue reference positions stay fixed. Example 1 swaps A/D, Example 2 swaps B/D, to reduce the influence of label input, and Test keeps the Base labels.",
  status: "ready",
  examples: ["example1", "example2"],
  tests: ["test"],
  cases: Object.fromEntries(
    Object.entries(baseVariant.cases).map(([caseId, puzzleCase]) => {
      const labelSwap = caseId === "example1" ? ["A", "D"] : caseId === "example2" ? ["B", "D"] : null;
      return [
        caseId,
        {
          ...puzzleCase,
          distanceRule: "furthest",
          candidates: labelSwap ? swapCandidateLabels(puzzleCase.candidates, ...labelSwap) : puzzleCase.candidates,
        },
      ];
    }),
  ),
};

function swapCandidateLabels(candidates, firstLabel, secondLabel) {
  return candidates.map((candidate) => {
    if (candidate.label === firstLabel) return { ...candidate, label: secondLabel };
    if (candidate.label === secondLabel) return { ...candidate, label: firstLabel };
    return { ...candidate };
  });
}
