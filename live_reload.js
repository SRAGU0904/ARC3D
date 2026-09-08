const scope = window.location.pathname.endsWith("/")
  ? window.location.pathname
  : window.location.pathname.slice(0, window.location.pathname.lastIndexOf("/") + 1);
const versionEndpoint = `/__arc3d_version?scope=${encodeURIComponent(scope)}`;

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
