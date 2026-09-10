export function defineTask(definition) {
  requireText(definition.id, "task.id");
  requireText(definition.title, `${definition.id}.title`);
  requireText(definition.defaultVariant, `${definition.id}.defaultVariant`);

  if (!Object.hasOwn(definition.variants, definition.defaultVariant)) {
    throw new Error(`${definition.id}: default variant '${definition.defaultVariant}' is not registered`);
  }

  for (const [variantId, variant] of Object.entries(definition.variants)) {
    if (variant.id !== variantId) {
      throw new Error(`${definition.id}: variant key '${variantId}' does not match id '${variant.id}'`);
    }

    const referencedCases = [...variant.examples, ...variant.tests];
    for (const caseId of referencedCases) {
      if (!Object.hasOwn(variant.cases, caseId)) {
        throw new Error(`${definition.id}/${variantId}: missing referenced case '${caseId}'`);
      }
    }

    for (const [caseId, puzzleCase] of Object.entries(variant.cases)) {
      if (!Array.isArray(puzzleCase.candidates) || puzzleCase.candidates.length === 0) {
        throw new Error(`${definition.id}/${variantId}/${caseId}: candidates are required`);
      }
      const labels = puzzleCase.candidates.map((candidate) => candidate.label);
      if (new Set(labels).size !== labels.length) {
        throw new Error(`${definition.id}/${variantId}/${caseId}: candidate labels must be unique`);
      }
    }
  }

  return definition;
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
}
