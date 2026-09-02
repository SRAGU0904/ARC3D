import * as THREE from "three";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";

const COLORS = {
  body: "#ff8a24",
  repair: "#4bb763",
  plane: "#6f7671",
  labelText: "#171918",
  edge: "#050505",
};

const VOXEL_SIZE = 1;
const GRID_SIZE = 10;
const HALF = (GRID_SIZE - 1) / 2;
const INITIAL_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const CAMERA_DISTANCE = 14.3;
const INITIAL_VIEW_ID = "corner-nx-py-pz";
const FIXED_VIEWS = {
  "face-px": { label: "x+ y0 z0", dir: [1, 0, 0], text: "+X" },
  "face-nx": { label: "x- y0 z0", dir: [-1, 0, 0], text: "-X" },
  "face-py": { label: "x0 y+ z0", dir: [0, 1, 0], text: "+Y" },
  "face-ny": { label: "x0 y- z0", dir: [0, -1, 0], text: "-Y" },
  "face-pz": { label: "x0 y0 z+", dir: [0, 0, 1], text: "+Z" },
  "face-nz": { label: "x0 y0 z-", dir: [0, 0, -1], text: "-Z" },
  "corner-nx-py-pz": { label: "x- y+ z+", dir: [-1, 1, 1], text: "↖" },
  "corner-px-py-pz": { label: "x+ y+ z+", dir: [1, 1, 1], text: "↗" },
  "corner-nx-ny-pz": { label: "x- y- z+", dir: [-1, -1, 1], text: "↙" },
  "corner-px-ny-pz": { label: "x+ y- z+", dir: [1, -1, 1], text: "↘" },
  "corner-nx-py-nz": { label: "x- y+ z-", dir: [-1, 1, -1], text: "↖" },
  "corner-px-py-nz": { label: "x+ y+ z-", dir: [1, 1, -1], text: "↗" },
  "corner-nx-ny-nz": { label: "x- y- z-", dir: [-1, -1, -1], text: "↙" },
  "corner-px-ny-nz": { label: "x+ y- z-", dir: [1, -1, -1], text: "↘" },
};
addEdgeViews();
const HORIZONTAL_RING = [
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
];
const FACE_NORMALS = {
  "+x": new THREE.Vector3(1, 0, 0),
  "-x": new THREE.Vector3(-1, 0, 0),
  "+y": new THREE.Vector3(0, 1, 0),
  "-y": new THREE.Vector3(0, -1, 0),
  "+z": new THREE.Vector3(0, 0, 1),
  "-z": new THREE.Vector3(0, 0, -1),
};

const sceneEl = document.querySelector("#scene");
const statusLine = document.querySelector("#status-line");
const autoRotateInput = document.querySelector("#auto-rotate");
const testTools = document.querySelector("#test-tools");
const candidateButtons = document.querySelector("#candidate-buttons");
const jsonOutput = document.querySelector("#json-output");
autoRotateInput.closest(".switch").hidden = true;
const exportParams = new URLSearchParams(window.location.search);
const exportMode = exportParams.get("export") === "fixed";
const requestedPuzzle = exportParams.get("puzzle");
const requestedView = exportParams.get("view");
if (exportMode) document.documentElement.classList.add("is-exporting-fixed");

let activePuzzle = ["example1", "example2", "test"].includes(requestedPuzzle) ? requestedPuzzle : "example1";
let activeMode = "input";
let selectedLabel = null;
let testAnswerRevealed = false;
let currentViewId = FIXED_VIEWS[requestedView] ? requestedView : INITIAL_VIEW_ID;
let currentSideViewId = "face-pz";
let currentCameraDirection = viewDirection(FIXED_VIEWS[currentViewId].dir);
let currentCameraUp = new THREE.Vector3(0, 1, 0);
let cameraTarget = INITIAL_CAMERA_TARGET.clone();
let lastHorizontalDirection = 1;
let viewMode = "fixed";

const puzzles = {
    example1: makePuzzle({
    voxels: [
      { pos: [1, 4, 4], color: "#ff8a24" },
      { pos: [2, 4, 4], color: "#ff8a24" },
      { pos: [2, 3, 5], color: "#ff8a24" },
      { pos: [2, 4, 5], color: "#ff8a24" },
      { pos: [3, 4, 5], color: "#ff8a24" },
      { pos: [3, 4, 4], color: "#ff8a24" },
      { pos: [5, 4, 5], color: "#4bb763" },
      { pos: [6, 4, 5], color: "#4bb763" },
      { pos: [6, 3, 5], color: "#4bb763" },
      { pos: [6, 4, 4], color: "#4bb763" },
      { pos: [7, 4, 4], color: "#4bb763" },
    ],
    missing: [5, 4, 4],
    candidates: [
      { label: "A", anchor: [6, 4, 5], face: "+y" },
      { label: "B", anchor: [5, 4, 5], face: "-z" },
      { label: "C", anchor: [6, 3, 5], face: "-x" },
      { label: "D", anchor: [6, 3, 5], face: "-z" },
    ],
  }),
  example2: makePuzzle({
    voxels: [
      { pos: [2, 3, 4], color: "#ff8a24"},
      { pos: [2, 4, 4], color: "#ff8a24"},
      { pos: [2, 5, 4], color: "#ff8a24"},
      { pos: [3, 5, 4], color: "#ff8a24"},
      { pos: [3, 4, 4], color: "#ff8a24"},
      { pos: [3, 4, 5], color: "#ff8a24"},
      { pos: [4, 4, 5], color: "#ff8a24"},
      { pos: [5, 4, 5], color: "#4bb763"},
      { pos: [6, 4, 4], color: "#4bb763"},
      { pos: [6, 5, 4], color: "#4bb763"},
      { pos: [7, 5, 4], color: "#4bb763"},
      { pos: [7, 4, 4], color: "#4bb763"},
      { pos: [7, 3, 4], color: "#4bb763"},
    ],
    missing: [6, 4, 5],
    candidates: [
      { label: "A", anchor: [6, 4, 4], face: "+z" },
      { label: "B", anchor: [6, 5, 4], face: "+z" },
      { label: "C", anchor: [5, 4, 5], face: "+y" },
      { label: "D", anchor: [7, 3, 4], face: "+z" },
    ],
  }),
  test: makePuzzle({
    voxels: [
      { pos: [2, 4, 4], color: "#ff8a24"},
      { pos: [2, 4, 3], color: "#ff8a24"},
      { pos: [2, 3, 3], color: "#ff8a24"},
      { pos: [2, 3, 4], color: "#ff8a24"},
      { pos: [3, 3, 3], color: "#ff8a24"},
      { pos: [3, 4, 3], color: "#ff8a24"},
      { pos: [3, 5, 3], color: "#ff8a24"},
      { pos: [4, 4, 3], color: "#ff8a24"},
      { pos: [5, 4, 3], color: "#4bb763"},
      { pos: [6, 5, 3], color: "#4bb763"},
      { pos: [6, 4, 3], color: "#4bb763"},
      { pos: [6, 3, 3], color: "#4bb763"},
      { pos: [7, 3, 3], color: "#4bb763"},
      { pos: [7, 4, 3], color: "#4bb763"},
      { pos: [7, 4, 4], color: "#4bb763"},
    ],
    missing: [7, 3, 4],
    candidates: [
      { label: "A", anchor: [6, 4, 3], face: "+z" },
      { label: "B", anchor: [7, 4, 3], face: "+y" },
      { label: "C", anchor: [7, 4, 4], face: "+x" },
      { label: "D", anchor: [7, 3, 3], face: "+z" },
    ],
  }),
};

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

const controls = new TrackballControls(camera, renderer.domElement);
controls.noRotate = true;
controls.noPan = true;
controls.rotateSpeed = 3.2;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.dynamicDampingFactor = 0.14;
autoRotateInput.checked = false;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.72;
resetCamera();
if (!exportMode) setupViewControls();

scene.add(new THREE.HemisphereLight(0xfffbf2, 0x6f7774, 2.45));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.35);
keyLight.position.set(7, 10, 8);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x88d3ff, 0.8);
fillLight.position.set(-8, 5, -7);
scene.add(fillLight);

const root = new THREE.Group();
const voxelGroup = new THREE.Group();
scene.add(root);
root.position.y = 0.65;
root.add(voxelGroup);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderCandidateButtons();
render();
resize();
if (exportMode) frameExportCamera();
animate();

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    activePuzzle = button.dataset.puzzle;
    activeMode = activePuzzle.startsWith("example") ? "input" : "workspace";
    selectedLabel = null;
    testAnswerRevealed = false;
    renderCandidateButtons();
    setActiveButtons();
    currentViewId = INITIAL_VIEW_ID;
    currentCameraDirection.copy(viewDirection(FIXED_VIEWS[currentViewId].dir));
    currentCameraUp.set(0, 1, 0);
    lastHorizontalDirection = 1;
    resetCamera();
    render();
  });
});

document.querySelectorAll(".mode").forEach((button) => {
  button.addEventListener("click", () => {
    if (activePuzzle === "test" && button.dataset.mode === "output" && !testAnswerRevealed) return;
    activeMode = button.dataset.mode;
    setActiveButtons();
    render();
  });
});

document.querySelector("#check-answer").addEventListener("click", () => {
  statusLine.textContent = selectedLabel === puzzles.test.answer ? "Test correct" : "Test incomplete";
});

document.querySelector("#reset-answer").addEventListener("click", () => {
  selectedLabel = null;
  testAnswerRevealed = false;
  activeMode = "workspace";
  renderCandidateButtons();
  setActiveButtons();
  render();
});

document.querySelector("#reveal-answer").addEventListener("click", () => {
  testAnswerRevealed = true;
  selectedLabel = puzzles.test.answer;
  activeMode = "output";
  renderCandidateButtons();
  setActiveButtons();
  render();
});

autoRotateInput.addEventListener("change", () => {
  controls.autoRotate = autoRotateInput.checked;
});

window.addEventListener("resize", resize);

function makePuzzle({ mirrorX, voxels, missing, candidates }) {
  const answerCandidate = candidates.find(({ anchor, face }) => sameVoxel(targetVoxel(anchor, face), missing));
  const answer = answerCandidate?.label ?? null;
  return { mirrorX, voxels, missing, candidates, answer };
}

function render() {
  voxelGroup.clear();

  const puzzle = puzzles[activePuzzle];
  const highlightedLabel = activeMode === "output" ? puzzle.answer : selectedLabel;
  const selectedCandidate = puzzle.candidates.find((candidate) => candidate.label === highlightedLabel);

  puzzle.voxels.forEach((voxel) => {
    const [x, y, z] = voxel.pos ?? voxel;
    addVoxel({
      x,
      y,
      z,
      kind: "body",
      color: voxel.color,
    });
  });

  if (selectedCandidate) {
    const [x, y, z] = targetVoxel(selectedCandidate.anchor, selectedCandidate.face);
    addVoxel({ x, y, z, kind: "repair" });
  }

  addCandidateLabels(puzzle);
  updateCameraTarget();
  resetCamera();
  updateJson();
  setStatus();
}

function addVoxel(voxel) {
  const color =
    voxel.kind === "repair"
      ? COLORS.repair
      : voxel.color ?? COLORS.body;
  const geometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.copy(toPosition(voxel.x, voxel.y, voxel.z));
  cube.castShadow = true;
  cube.receiveShadow = true;
  voxelGroup.add(cube);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: COLORS.edge, transparent: true, opacity: 0.88 }),
  );
  edges.position.copy(cube.position);
  voxelGroup.add(edges);
}

function addMirrorPlane(mirrorX) {
  const geometry = new THREE.PlaneGeometry(7.4, 5.8, 1, 1);
  const material = new THREE.MeshBasicMaterial({
    color: COLORS.plane,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.y = Math.PI / 2;
  plane.position.set((mirrorX - HALF) * VOXEL_SIZE, 0, 0);
  voxelGroup.add(plane);
}

function addCandidateLabels(puzzle) {
  puzzle.candidates.forEach((candidate) => {
    const label = makeFaceLabel(candidate.label, FACE_NORMALS[candidate.face]);
    const [x, y, z] = candidate.anchor;
    label.position.copy(toPosition(x, y, z));
    label.position.add(FACE_NORMALS[candidate.face].clone().multiplyScalar(0.506));
    label.userData.label = candidate.label;
    label.userData.isCandidateLabel = true;
    voxelGroup.add(label);
  });
}

function makeFaceLabel(text, normal) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255, 255, 255, 0.86)";
  context.fillRect(20, 20, 120, 120);
  context.strokeStyle = "rgba(5, 5, 5, 0.75)";
  context.lineWidth = 6;
  context.strokeRect(20, 20, 120, 120);
  context.fillStyle = COLORS.labelText;
  context.font = "bold 92px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 80, 84);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const geometry = new THREE.PlaneGeometry(0.72, 0.72);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  mesh.renderOrder = 2;
  return mesh;
}

function renderCandidateButtons() {
  candidateButtons.replaceChildren();
  puzzles.test.candidates.forEach(({ label }) => {
    const button = document.createElement("button");
    button.className = "candidate";
    button.textContent = label;
    button.type = "button";
    button.addEventListener("click", () => selectLabel(label));
    candidateButtons.appendChild(button);
  });
  updateJson();
}

function selectLabel(label) {
  selectedLabel = selectedLabel === label ? null : label;
  renderCandidateButtons();
  render();
}

function updateJson() {
  jsonOutput.textContent = JSON.stringify({ choice: selectedLabel });
  document.querySelectorAll(".candidate").forEach((button) => {
    button.classList.toggle("is-selected", button.textContent === selectedLabel);
  });
}

function targetVoxel(anchor, face) {
  const normal = FACE_NORMALS[face];
  return [anchor[0] + normal.x, anchor[1] + normal.y, anchor[2] + normal.z];
}

function buildBoundaryBox() {
  const geometry = new THREE.BoxGeometry(GRID_SIZE * VOXEL_SIZE, GRID_SIZE * VOXEL_SIZE, GRID_SIZE * VOXEL_SIZE);
  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({
    color: 0x8f9893,
    transparent: true,
    opacity: 0.34,
  });
  return new THREE.LineSegments(edges, material);
}

function pickCandidate(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster
    .intersectObjects(voxelGroup.children.filter((child) => child.userData.isCandidateLabel), false)
    .at(0);
}

function setStatus() {
  const names = {
    example1: "Example 1",
    example2: "Example 2",
    test: "Test",
    input: "input",
    output: activePuzzle === "test" ? "answer" : "output",
    workspace: "workspace",
  };
  statusLine.textContent = `${names[activePuzzle]} ${names[activeMode]}`;
  testTools.hidden = !(activePuzzle === "test" && activeMode === "workspace");
}

function setActiveButtons() {
  document.querySelectorAll(".tab").forEach((button) => {
    const active = button.dataset.puzzle === activePuzzle;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".mode").forEach((button) => {
    const disabled =
      (activePuzzle.startsWith("example") && button.dataset.mode === "workspace") ||
      (activePuzzle === "test" && button.dataset.mode === "output" && !testAnswerRevealed);
    button.disabled = disabled;
    button.classList.toggle("is-active", button.dataset.mode === activeMode);
  });
}

function sameVoxel(a, b) {
  return a.every((value, index) => value === b[index]);
}

function toPosition(x, y, z) {
  return new THREE.Vector3((x - HALF) * VOXEL_SIZE, (y - HALF) * VOXEL_SIZE, (z - HALF) * VOXEL_SIZE);
}

function resize() {
  const { width, height } = sceneEl.getBoundingClientRect();
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (controls.handleResize) controls.handleResize();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function resetCamera() {
  camera.position.copy(currentCameraDirection.clone().multiplyScalar(CAMERA_DISTANCE).add(cameraTarget));
  camera.up.copy(currentCameraUp);
  controls.target.copy(cameraTarget);
  camera.lookAt(cameraTarget);
  camera.updateMatrixWorld(true);
  controls.update();
  updateViewControls();
}

function updateCameraTarget() {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(voxelGroup);
  if (box.isEmpty()) {
    cameraTarget.copy(INITIAL_CAMERA_TARGET);
    return;
  }
  box.getCenter(cameraTarget);
}

function frameExportCamera() {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(voxelGroup);
  if (box.isEmpty()) return;

  const view = FIXED_VIEWS[currentViewId] ?? FIXED_VIEWS[INITIAL_VIEW_ID];
  const direction = viewDirection(view.dir);
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const fitFov = Math.min(verticalFov, horizontalFov);
  const distance = (sphere.radius / Math.sin(fitFov / 2)) * 1.18;

  camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));
  camera.up.set(0, 1, 0);
  if (Math.abs(direction.y) > 0.98) camera.up.set(0, 0, 1);
  camera.near = 0.1;
  camera.far = Math.max(100, distance + sphere.radius * 4);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
  renderer.render(scene, camera);
}

function viewDirection(dir) {
  const adjusted = dir[0] === 0 && dir[2] === 0 ? [0, dir[1], 0.001] : dir;
  return new THREE.Vector3(...adjusted).normalize();
}

function setupViewControls() {
  const panel = document.createElement("div");
  panel.className = "view-panel";
  panel.innerHTML = `
    <button class="view-mode-toggle" type="button">Free view</button>
    <button class="view-arrow view-arrow-up" data-move="up" title="move up">↑</button>
    <button class="view-arrow view-arrow-left" data-move="left" title="move left">←</button>
    <button class="view-arrow view-arrow-right" data-move="right" title="move right">→</button>
    <button class="view-arrow view-arrow-down" data-move="down" title="move down">↓</button>
    <div class="view-readout" aria-live="polite"></div>
  `;
  sceneEl.appendChild(panel);
  panel.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextView = getNextView(button.dataset.move);
      if (isSameViewState(nextView)) return;
      setView(nextView);
    });
  });
  panel.querySelector(".view-mode-toggle").addEventListener("click", () => {
    setViewMode(viewMode === "fixed" ? "free" : "fixed");
  });
  updateViewControls();
}

function updateViewControls() {
  const panel = sceneEl.querySelector(".view-panel");
  if (!panel) return;
  panel.classList.toggle("is-free", viewMode === "free");
  panel.querySelectorAll("[data-move]").forEach((button) => {
    const nextView = getNextView(button.dataset.move);
    button.disabled = viewMode === "free" || isSameViewState(nextView);
  });
  panel.querySelector(".view-mode-toggle").textContent = viewMode === "fixed" ? "Free view" : "Fixed view";
  const headLabel = `head: ${directionLabel(headDisplayDirection())}`;
  panel.querySelector(".view-readout").textContent =
    viewMode === "fixed" ? `view: ${FIXED_VIEWS[currentViewId].label} | ${headLabel}` : "view: free drag";
}

function setView(nextView) {
  if (nextView.direction) currentCameraDirection.copy(nextView.direction);
  if (nextView.upVector) currentCameraUp.copy(nextView.upVector);
  const viewId = nextView.viewId;
  currentViewId = viewId;
  if (!isPureVertical(viewId)) {
    const [x, , z] = FIXED_VIEWS[viewId].dir;
    currentSideViewId = sideFromHorizontal(x, z);
  }
  resetCamera();
}

function setViewMode(mode) {
  viewMode = mode;
  controls.noRotate = mode !== "free";
  controls.noPan = true;
  if (mode === "fixed") {
    currentCameraDirection.copy(viewDirection(FIXED_VIEWS[currentViewId].dir));
    currentCameraUp.set(0, 1, 0);
    lastHorizontalDirection = 1;
    resetCamera();
  }
  updateViewControls();
}

function getNextView(move) {
  const view = FIXED_VIEWS[currentViewId];
  if (!view) return null;
  const directionVector = viewDirection(view.dir);
  const upVector = currentCameraUp.clone().normalize();

  if (move === "left" || move === "right") {
    const nextDirection = rotateVector(directionVector, upVector, move === "right" ? Math.PI / 4 : -Math.PI / 4);
    const nextDir = snapVectorToDirection(nextDirection);
    if (countNonZero(nextDir) === 0) return null;
    return {
      viewId: viewIdForDirection(nextDir),
      direction: viewDirection(nextDir),
      upVector,
    };
  }

  if (isCurrentVertexView()) return null;

  if (move === "up" || move === "down") {
    const rightAxis = screenRightVector(directionVector, upVector);
    const angle = move === "up" ? -Math.PI / 4 : Math.PI / 4;
    const nextDirection = rotateVector(directionVector, rightAxis, angle);
    const nextUp = rotateVector(upVector, rightAxis, angle);
    const nextDir = snapVectorToDirection(nextDirection);
    if (countNonZero(nextDir) === 0) return null;
    return {
      viewId: viewIdForDirection(nextDir),
      direction: viewDirection(nextDir),
      upVector: snapCameraUp(nextUp, nextDir, upVector),
    };
  }
  return null;
}

function isSameViewState(nextView) {
  if (!nextView?.viewId) return true;
  const nextUp = nextView.upVector ?? currentCameraUp;
  const nextDirection = nextView.direction ?? currentCameraDirection;
  return nextView.viewId === currentViewId &&
    nextUp.distanceTo(currentCameraUp) < 0.001 &&
    nextDirection.distanceTo(currentCameraDirection) < 0.001;
}

function isCurrentVertexView() {
  return countNonZero(snapVectorToDirection(currentCameraDirection)) === 3;
}

function addEdgeViews() {
  for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      for (const z of [-1, 0, 1]) {
        if (countNonZero([x, y, z]) !== 2) continue;
        const id = viewIdForDirection([x, y, z]);
        FIXED_VIEWS[id] = { label: directionLabel([x, y, z]), dir: [x, y, z], text: "edge" };
      }
    }
  }
}

function viewIdForDirection(dir) {
  const [x, y, z] = dir;
  const nonZero = countNonZero(dir);
  if (nonZero === 1) {
    if (x !== 0) return `face-${axisToken("x", x)}`;
    if (y !== 0) return `face-${axisToken("y", y)}`;
    return `face-${axisToken("z", z)}`;
  }
  const prefix = nonZero === 1 ? "face" : nonZero === 2 ? "edge" : "corner";
  return `${prefix}-${axisToken("x", x)}-${axisToken("y", y)}-${axisToken("z", z)}`;
}

function axisToken(axis, value) {
  if (value > 0) return `p${axis}`;
  if (value < 0) return `n${axis}`;
  return `${axis}0`;
}

function directionLabel(dir) {
  return dir.map((value, index) => {
    const axis = ["x", "y", "z"][index];
    if (value > 0) return `${axis}+`;
    if (value < 0) return `${axis}-`;
    return `${axis}0`;
  }).join(" ");
}

function countNonZero(dir) {
  return dir.filter((value) => value !== 0).length;
}

function vectorToDiscreteDirection(vector) {
  const axisValues = [vector.x, vector.y, vector.z];
  const max = Math.max(...axisValues.map(Math.abs));
  return axisValues.map((value) => Math.abs(value) >= max * 0.65 ? Math.sign(value) : 0);
}

function headDisplayDirection() {
  const projected = currentCameraUp.clone().projectOnPlane(currentCameraDirection);
  return snapVectorToAxis(projected.lengthSq() < 0.001 ? currentCameraUp : projected);
}

function rotateHorizontalStep(x, y, z, direction) {
  if (y !== 0 && countNonZero([x, y, z]) === 2) return [0, y, 0];
  if (x === 0 && z === 0) {
    const side = FIXED_VIEWS[currentSideViewId]?.dir ?? [0, 0, 1];
    return [side[0], y, side[2]];
  }
  const [nextX, nextZ] = rotateHorizontalPair(x, z, direction);
  return [nextX, y, nextZ];
}

function sideEdgeFromVerticalFace(y, direction) {
  const side = screenRightVector(new THREE.Vector3(0, y, 0)).multiplyScalar(direction);
  const [sideX, sideZ] = snapHorizontalAxis(side);
  return [sideX, y, sideZ];
}

function snapHorizontalAxis(vector) {
  if (Math.abs(vector.x) >= Math.abs(vector.z)) return [Math.sign(vector.x) || 1, 0];
  return [0, Math.sign(vector.z) || 1];
}

function rotateHorizontalPair(x, z, direction) {
  const ring = HORIZONTAL_RING;
  const index = ring.findIndex(([rx, rz]) => rx === x && rz === z);
  const [nextX, nextZ] = ring[(index + direction + ring.length) % ring.length];
  return [nextX, nextZ];
}

function rotateHeadAroundY(upVector, direction) {
  const [upX, upY, upZ] = vectorToDiscreteDirection(upVector);
  if (upX === 0 && upZ === 0) return upVector.clone();
  const [nextX, nextZ] = rotateHorizontalPair(upX, upZ, direction);
  return new THREE.Vector3(nextX, upY, nextZ).normalize();
}

function pitchDirectionStep(fromDir, direction) {
  const viewVector = new THREE.Vector3(...fromDir).normalize();
  const upDir = screenUpVector(viewVector);
  const next = new THREE.Vector3(...fromDir)
    .normalize()
    .add(upDir.multiplyScalar(direction));
  if (next.lengthSq() < 0.001) return null;
  return snapVectorToDirection(next);
}

function screenUpVector(viewVector) {
  const projected = currentCameraUp.clone().projectOnPlane(viewVector);
  if (projected.lengthSq() < 0.001) return new THREE.Vector3(0, 1, 0).projectOnPlane(viewVector).normalize();
  return projected.normalize();
}

function screenRightVector(viewVector, upVector = currentCameraUp) {
  const forward = viewVector.clone().multiplyScalar(-1);
  const projectedUp = upVector.clone().projectOnPlane(viewVector);
  if (projectedUp.lengthSq() < 0.001) {
    projectedUp.copy(new THREE.Vector3(0, 1, 0).projectOnPlane(viewVector));
  }
  if (projectedUp.lengthSq() < 0.001) {
    projectedUp.copy(new THREE.Vector3(1, 0, 0).projectOnPlane(viewVector));
  }
  return new THREE.Vector3().crossVectors(forward, projectedUp).normalize();
}

function snapVectorToDirection(vector) {
  const normalized = vector.clone().normalize();
  const values = [normalized.x, normalized.y, normalized.z];
  const max = Math.max(...values.map(Math.abs));
  return values.map((value) => Math.abs(value) >= max * 0.65 ? Math.sign(value) : 0);
}

function snapVector(vector, fallback) {
  const dir = snapVectorToAxis(vector);
  if (countNonZero(dir) === 0) return fallback.clone().normalize();
  return new THREE.Vector3(...dir).normalize();
}

function snapCameraUp(upVector, viewDir, fallback) {
  const view = new THREE.Vector3(...viewDir).normalize();
  const projected = upVector.clone().projectOnPlane(view);
  const source = projected.lengthSq() < 0.001 ? fallback.clone().projectOnPlane(view) : projected;
  const candidates = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ].filter((axis) => Math.abs(axis.dot(view)) < 0.75);
  if (source.lengthSq() < 0.001) return candidates[0].clone();
  let best = candidates[0];
  for (const axis of candidates) {
    if (axis.dot(source) > best.dot(source)) best = axis;
  }
  return best.clone();
}

function snapVectorToAxis(vector) {
  const values = [vector.x, vector.y, vector.z];
  let axisIndex = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (Math.abs(values[index]) > Math.abs(values[axisIndex])) axisIndex = index;
  }
  const dir = [0, 0, 0];
  dir[axisIndex] = Math.sign(values[axisIndex]) || 1;
  return dir;
}

function rotateVector(vector, axis, angle) {
  const rotation = new THREE.Quaternion().setFromAxisAngle(axis.clone().normalize(), angle);
  return vector.clone().applyQuaternion(rotation).normalize();
}

function rotateHeadForTilt(fromDir, direction) {
  const [fromX, fromY, fromZ] = fromDir;
  const upDir = vectorToDiscreteDirection(currentCameraUp);
  const next = new THREE.Vector3(...upDir)
    .normalize()
    .sub(new THREE.Vector3(fromX, fromY, fromZ).normalize().multiplyScalar(direction));
  if (next.lengthSq() < 0.001) return new THREE.Vector3(...upDir).normalize();
  return new THREE.Vector3(...snapVectorToAxis(next)).normalize();
}

function horizontalCornerFromEdge(x, y, z, direction) {
  const ring = HORIZONTAL_RING;
  const index = ring.findIndex(([rx, rz]) => rx === x && rz === z);
  const [nextX, nextZ] = ring[(index + direction + ring.length) % ring.length];
  return [nextX, y, nextZ];
}

function centerFaceFromCornerMove(move, x, z) {
  const movesTowardXCenter = (move.endsWith("right") && x < 0) || (move.endsWith("left") && x > 0);
  return movesTowardXCenter ? faceForZ(z) : faceForX(x);
}

function rotateSideOrCorner(viewId, direction) {
  if (isSideFace(viewId)) return rotateSide(viewId, direction);
  const [x, y, z] = FIXED_VIEWS[viewId].dir;
  const [nextX, nextZ] = rotateHorizontal(x, z, direction);
  return cornerByVector(nextX, y, nextZ);
}

function rotateHorizontal(x, z, direction) {
  return direction > 0 ? [z, -x] : [-z, x];
}

function rotateSide(sideViewId, direction) {
  const sides = ["face-pz", "face-px", "face-nz", "face-nx"];
  const index = sides.indexOf(sideViewId);
  return sides[(index + direction + sides.length) % sides.length];
}

function cornerForSide(sideViewId, y) {
  const side = FIXED_VIEWS[sideViewId].dir;
  const z = side[2] || (sideViewId === "face-px" || sideViewId === "face-nx" ? 1 : side[2]);
  const x = side[0] || (sideViewId === "face-pz" || sideViewId === "face-nz" ? -1 : side[0]);
  const key = vectorKey([x, y, z]);
  return Object.keys(FIXED_VIEWS).find((id) => vectorKey(FIXED_VIEWS[id].dir) === key);
}

function cornerByVector(x, y, z) {
  const key = vectorKey([x, y, z]);
  return Object.keys(FIXED_VIEWS).find((id) => vectorKey(FIXED_VIEWS[id].dir) === key);
}

function sideFromHorizontal(x, z) {
  if (Math.abs(z) >= Math.abs(x)) return z >= 0 ? "face-pz" : "face-nz";
  return x >= 0 ? "face-px" : "face-nx";
}

function faceForX(x) {
  return x >= 0 ? "face-px" : "face-nx";
}

function faceForZ(z) {
  return z >= 0 ? "face-pz" : "face-nz";
}

function isSideFace(viewId) {
  return ["face-pz", "face-px", "face-nz", "face-nx"].includes(viewId);
}

function isCornerView(viewId) {
  const [x, y, z] = FIXED_VIEWS[viewId].dir;
  return x !== 0 && y !== 0 && z !== 0;
}

function isPureVertical(viewId) {
  return viewId === "face-py" || viewId === "face-ny";
}

function vectorKey(dir) {
  return dir.join(",");
}
