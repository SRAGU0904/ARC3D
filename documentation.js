import { taskCatalog } from "./tasks/catalog.js";

const indexElement = document.querySelector("#task-index");
const detailElement = document.querySelector("#task-detail");
const countElement = document.querySelector("#task-count");
const taskButtons = new Map();

countElement.textContent = taskCatalog.length;

for (const [index, task] of taskCatalog.entries()) {
  const button = document.createElement("button");
  button.className = "task-index-button";
  button.type = "button";
  button.dataset.taskId = task.id;
  button.innerHTML = `
    <span class="task-number">${String(index + 1).padStart(2, "0")}</span>
    <span class="task-index-copy">
      <strong>${task.title}</strong>
      <span>${task.subtitle}</span>
    </span>
  `;
  button.addEventListener("click", () => selectTask(task.id, true));
  indexElement.appendChild(button);
  taskButtons.set(task.id, button);
}

function selectTask(taskId, updateUrl = false) {
  const task = taskCatalog.find((item) => item.id === taskId) ?? taskCatalog[0];
  if (!task) return;

  taskButtons.forEach((button, id) => {
    const active = id === task.id;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });

  renderTask(task);
  if (updateUrl) {
    window.history.replaceState(null, "", `#${task.id}`);
    notifyArc3dParentLocation();
  }
}

function renderTask(task) {
  const article = document.createElement("article");
  article.className = "task-card";

  const variants = Object.values(task.variants);
  article.innerHTML = `
    <div class="task-heading">
      <div>
        <p class="task-id">${task.title}</p>
        <h2>${task.subtitle}</h2>
      </div>
      <span class="answer-format">${task.answerFormat}</span>
    </div>
    <p class="summary">${task.summary}</p>
    <p class="rule"><strong>Reasoning rule</strong>${task.rule}</p>
    <div class="variant-list"></div>
  `;

  const variantList = article.querySelector(".variant-list");
  for (const variant of variants) {
    const caseIds = Object.keys(variant.cases);
    const variantElement = document.createElement("section");
    variantElement.className = "variant";
    variantElement.innerHTML = `
      <div class="variant-heading">
        <div>
          <span class="variant-label">Variant</span>
          <h3>${variant.title}</h3>
        </div>
        <span class="status status-${variant.status}">${variant.status}</span>
      </div>
      <p>${variant.description}</p>
      ${variant.changeSummary ? `<p class="change-summary"><strong>Controlled change</strong>${variant.changeSummary}</p>` : ""}
      <div class="case-list"></div>
    `;

    const caseList = variantElement.querySelector(".case-list");
    for (const caseId of caseIds) {
      const link = document.createElement("a");
      link.className = "case-link";
      const query = new URLSearchParams({ variant: variant.id, puzzle: caseId });
      if (variant.id === "label-permutation") query.set("seed", "0");
      link.href = `./tasks/${task.id}/?${query}`;
      link.textContent = caseId;
      link.addEventListener("click", (event) => {
        if (window.parent === window) return;
        event.preventDefault();
        window.parent.postMessage(
          {
            type: "arc3d:open-case",
            taskId: task.id,
            variantId: variant.id,
            caseId,
            seed: variant.id === "label-permutation" ? "0" : null,
          },
          window.location.origin,
        );
      });
      caseList.appendChild(link);
    }
    variantList.appendChild(variantElement);
  }

  detailElement.replaceChildren(article);
}

window.addEventListener("hashchange", () => selectTask(window.location.hash.slice(1)));
selectTask(window.location.hash.slice(1));
