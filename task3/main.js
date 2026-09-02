import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableRotate = false;
controls.enablePan = false;
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
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function resetCamera() {
  const view = FIXED_VIEWS[currentViewId] ?? FIXED_VIEWS[INITIAL_VIEW_ID];
  camera.position.copy(viewDirection(view.dir).multiplyScalar(CAMERA_DISTANCE).add(INITIAL_CAMERA_TARGET));
  camera.up.set(0, 1, 0);
  controls.target.copy(INITIAL_CAMERA_TARGET);
  controls.update();
  updateViewControls();
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
    <button class="view-arrow view-arrow-up-left" data-move="up-left" title="move up-left">↖</button>
    <button class="view-arrow view-arrow-up" data-move="up" title="move up">↑</button>
    <button class="view-arrow view-arrow-up-right" data-move="up-right" title="move up-right">↗</button>
    <button class="view-arrow view-arrow-left" data-move="left" title="move left">←</button>
    <button class="view-arrow view-arrow-right" data-move="right" title="move right">→</button>
    <button class="view-arrow view-arrow-down-left" data-move="down-left" title="move down-left">↙</button>
    <button class="view-arrow view-arrow-down" data-move="down" title="move down">↓</button>
    <button class="view-arrow view-arrow-down-right" data-move="down-right" title="move down-right">↘</button>
    <div class="view-readout" aria-live="polite"></div>
  `;
  sceneEl.appendChild(panel);
  panel.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextViewId = getNextViewId(button.dataset.move);
      if (!nextViewId || nextViewId === currentViewId) return;
      setView(nextViewId);
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
    const nextViewId = getNextViewId(button.dataset.move);
    button.disabled = viewMode === "free" || !nextViewId || nextViewId === currentViewId;
  });
  panel.querySelector(".view-mode-toggle").textContent = viewMode === "fixed" ? "Free view" : "Fixed view";
  panel.querySelector(".view-readout").textContent =
    viewMode === "fixed" ? `view: ${FIXED_VIEWS[currentViewId].label}` : "view: free drag";
}

function setView(viewId) {
  currentViewId = viewId;
  if (!isPureVertical(viewId)) {
    const [x, , z] = FIXED_VIEWS[viewId].dir;
    currentSideViewId = sideFromHorizontal(x, z);
  }
  resetCamera();
}

function setViewMode(mode) {
  viewMode = mode;
  controls.enableRotate = mode === "free";
  controls.enablePan = false;
  if (mode === "fixed") resetCamera();
  updateViewControls();
}

function getNextViewId(move) {
  const view = FIXED_VIEWS[currentViewId];
  const [x, y, z] = view.dir;

  if (isCornerView(currentViewId)) {
    if (move === "up") return y > 0 ? null : cornerByVector(x, 1, z);
    if (move === "down") return y < 0 ? null : cornerByVector(x, -1, z);
    if (move === "left") return rotateSideOrCorner(currentViewId, -1);
    if (move === "right") return rotateSideOrCorner(currentViewId, 1);
    if (move === "up-left" || move === "up-right") return y > 0 ? null : centerFaceFromCornerMove(move, x, z);
    if (move === "down-left" || move === "down-right") return y < 0 ? null : centerFaceFromCornerMove(move, x, z);
    return null;
  }

  const side = isSideFace(currentViewId) ? currentViewId : currentSideViewId;
  const leftSide = rotateSide(side, -1);
  const rightSide = rotateSide(side, 1);

  if (move === "left") return isPureVertical(currentViewId) ? null : rotateSideOrCorner(currentViewId, -1);
  if (move === "right") return isPureVertical(currentViewId) ? null : rotateSideOrCorner(currentViewId, 1);
  if (move === "up") {
    if (y > 0) return null;
    return y < 0 ? side : "face-py";
  }
  if (move === "down") {
    if (y < 0) return null;
    return y > 0 ? side : "face-ny";
  }
  if (move === "up-left") return y > 0 ? null : cornerForSide(leftSide, 1);
  if (move === "up-right") return y > 0 ? null : cornerForSide(rightSide, 1);
  if (move === "down-left") return y < 0 ? null : cornerForSide(leftSide, -1);
  if (move === "down-right") return y < 0 ? null : cornerForSide(rightSide, -1);
  return null;
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
