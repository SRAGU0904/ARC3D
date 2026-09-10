import { baseVariant } from "./base.js";

export const junctionBiasControlVariant = {
  id: "junction-bias-control",
  title: "Junction Bias Control",
  description: "A Task 3 control variant designed to reduce junction-position shortcuts.",
  changeSummary:
    "Only Example 2 changes. Its correct repair is moved away from the original junction pattern while Example 1 and the held-out Test remain fixed.",
  status: "ready",
  examples: ["example1", "example2"],
  tests: ["test"],
  cases: {
    example1: baseVariant.cases.example1,
    example2: {
      voxels: [
        { pos: [2, 3, 4], color: "#ff8a24" },
        { pos: [2, 4, 4], color: "#ff8a24" },
        { pos: [2, 5, 4], color: "#ff8a24" },
        { pos: [3, 5, 4], color: "#ff8a24" },
        { pos: [3, 4, 4], color: "#ff8a24" },
        { pos: [3, 4, 5], color: "#ff8a24" },
        { pos: [2, 5, 5], color: "#ff8a24" },
        { pos: [4, 4, 5], color: "#ff8a24" },
        { pos: [5, 4, 5], color: "#4bb763" },
        { pos: [6, 4, 4], color: "#4bb763" },
        { pos: [6, 4, 5], color: "#4bb763" },
        { pos: [6, 5, 4], color: "#4bb763" },
        { pos: [7, 5, 4], color: "#4bb763" },
        { pos: [7, 4, 4], color: "#4bb763" },
        { pos: [7, 3, 4], color: "#4bb763" },
      ],
      missing: [7, 5, 5],
      candidates: [
        { label: "A", anchor: [7, 5, 4], face: "+z" },
        { label: "B", anchor: [6, 4, 5], face: "+x" },
        { label: "C", anchor: [5, 4, 5], face: "+y" },
        { label: "D", anchor: [6, 5, 4], face: "+z" },
      ],
    },
    test: baseVariant.cases.test,
  },
};
