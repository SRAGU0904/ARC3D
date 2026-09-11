let frame = document.querySelector("#task-frame");
const buttons = document.querySelectorAll(".task-link");
const DEFAULT_PAGE = "./documentation.html";
const PAGE_STORAGE_KEY = "arc3d:current-page";

function normalizePageSource(source) {
  if (!source) return null;

  const resolved = new URL(source, window.location.href);
  const isDocumentation = resolved.pathname === "/documentation.html";
  const isTask = /^\/tasks\/task[123]\/?$/.test(resolved.pathname);
  if (resolved.origin !== window.location.origin || (!isDocumentation && !isTask)) return null;

  return `.${resolved.pathname}${resolved.search}${resolved.hash}`;
}

function rememberPage(source) {
  const normalized = normalizePageSource(source);
  if (!normalized) return;
  window.sessionStorage.setItem(PAGE_STORAGE_KEY, normalized);
}

function loadTask(source, remember = true) {
  const normalized = normalizePageSource(source) ?? DEFAULT_PAGE;
  if (frame.getAttribute("src") !== normalized) frame.src = normalized;
  if (remember) rememberPage(normalized);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    loadTask(button.dataset.src);
  });
});

const rootUrl = new URL(window.location.href);
const legacyPage = normalizePageSource(rootUrl.searchParams.get("page"));
const rememberedPage = normalizePageSource(window.sessionStorage.getItem(PAGE_STORAGE_KEY));
const initialPage = legacyPage ?? rememberedPage ?? DEFAULT_PAGE;
if (rootUrl.searchParams.has("page")) {
  rootUrl.searchParams.delete("page");
  window.history.replaceState(null, "", rootUrl);
}
window.sessionStorage.setItem(PAGE_STORAGE_KEY, initialPage);
loadTask(initialPage, false);

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;

  if (event.data?.type === "arc3d:location-changed") {
    rememberPage(event.data.href);
    return;
  }

  if (event.data?.type !== "arc3d:open-case") return;

  const { taskId, variantId, caseId, seed } = event.data;
  if (!["task1", "task2", "task3"].includes(taskId)) return;

  const query = new URLSearchParams({ variant: variantId, puzzle: caseId });
  if (seed !== null && seed !== undefined) query.set("seed", seed);
  loadTask(`./tasks/${taskId}/?${query}`);
});
