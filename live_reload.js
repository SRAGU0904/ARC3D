const scope = window.location.pathname;
const versionEndpoint = `/__arc3d_version?scope=${encodeURIComponent(scope)}`;

function notifyArc3dParentLocation() {
  if (window.parent === window) return;
  window.parent.postMessage(
    { type: "arc3d:location-changed", href: window.location.href },
    window.location.origin,
  );
}

let loadedVersion = null;
let reloadStarted = false;

async function checkForSavedChanges() {
  if (reloadStarted) return;

  try {
    const response = await fetch(versionEndpoint, { cache: "no-store" });
    if (!response.ok) return;
    const currentVersion = await response.text();

    if (loadedVersion === null) {
      loadedVersion = currentVersion;
    } else if (currentVersion !== loadedVersion) {
      reloadStarted = true;
      window.location.reload();
    }
  } catch {
    // The server may be restarting; the next polling attempt will retry.
  }
}

checkForSavedChanges();
window.setInterval(checkForSavedChanges, 500);
notifyArc3dParentLocation();
window.addEventListener("hashchange", notifyArc3dParentLocation);
window.addEventListener("popstate", notifyArc3dParentLocation);
