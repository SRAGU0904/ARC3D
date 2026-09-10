const DEFAULT_SEED = "0";

export function createLabelPermutationVariant(taskId, baseVariant) {
  return {
    id: "label-permutation",
    title: "Label Permutation",
    description: "A seeded robustness variant that reassigns candidate labels without changing puzzle geometry.",
    changeSummary:
      "Each case derives its own deterministic label permutation from the task id, case id, and URL seed.",
    status: "ready",
    examples: [...baseVariant.examples],
    tests: [...baseVariant.tests],
    cases: baseVariant.cases,
    materialize(seed = DEFAULT_SEED) {
      return permuteCases(baseVariant.cases, taskId, normalizeSeed(seed));
    },
  };
}

export function materializeVariant(variant, seed) {
  return typeof variant.materialize === "function" ? variant.materialize(normalizeSeed(seed)) : variant.cases;
}

export function normalizeSeed(seed) {
  const value = String(seed ?? DEFAULT_SEED).trim();
  return value || DEFAULT_SEED;
}

export function setupLabelSeedControl({ activeVariantId, exportMode, seed }) {
  if (activeVariantId !== "label-permutation" || exportMode) return;

  const form = document.createElement("form");
  form.className = "label-seed-control";
  form.innerHTML = `
    <label for="label-seed">Seed</label>
    <input id="label-seed" name="seed" value="${escapeAttribute(seed)}" autocomplete="off" />
    <button type="submit">Apply</button>
  `;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("seed", normalizeSeed(new FormData(form).get("seed")));
    window.location.assign(nextUrl);
  });
  document.querySelector(".topbar")?.appendChild(form);
}

export function labelMappingForCase(originalCase, permutedCase) {
  return originalCase.candidates.map((candidate, index) => ({
    from: candidate.label,
    to: permutedCase.candidates[index].label,
  }));
}

export function formatLabelMapping(originalCase, permutedCase) {
  return labelMappingForCase(originalCase, permutedCase)
    .map(({ from, to }) => `${from}→${to}`)
    .join(" · ");
}

function permuteCases(cases, taskId, seed) {
  return Object.fromEntries(
    Object.entries(cases).map(([caseId, puzzleCase]) => [
      caseId,
      permuteCase(puzzleCase, `${taskId}|${caseId}|${seed}`),
    ]),
  );
}

function permuteCase(puzzleCase, derivedSeed) {
  const labels = puzzleCase.candidates.map(({ label }) => label);
  const shuffled = shuffle(labels, stringHash(derivedSeed));

  if (shuffled.every((label, index) => label === labels[index]) && shuffled.length > 1) {
    shuffled.push(shuffled.shift());
  }

  return {
    ...puzzleCase,
    candidates: puzzleCase.candidates.map((candidate, index) => ({
      ...candidate,
      label: shuffled[index],
    })),
  };
}

function shuffle(values, seed) {
  const result = [...values];
  const random = mulberry32(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function stringHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function random() {
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
