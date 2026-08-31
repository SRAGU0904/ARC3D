import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLORS = {
  body: "#ff8a24",
  closest: "#4bb763",
  blue: "#2f72c4",
  label: "#ffffff",
  labelText: "#171918",
  edge: "#050505",
};

const VOXEL_SIZE = 1;
const GRID_SIZE = 10;
const HALF = (GRID_SIZE - 1) / 2;
const FACE_DIRECTIONS = [
  { normal: new THREE.Vector3(1, 0, 0) },
  { normal: new THREE.Vector3(-1, 0, 0) },
  { normal: new THREE.Vector3(0, 1, 0) },
  { normal: new THREE.Vector3(0, -1, 0) },
  { normal: new THREE.Vector3(0, 0, 1) },
  { normal: new THREE.Vector3(0, 0, -1) },
];

const sceneEl = document.querySelector("#scene");
const statusLine = document.querySelector("#status-line");
const autoRotateInput = document.querySelector("#auto-rotate");
const testTools = document.querySelector("#test-tools");
const candidateButtons = document.querySelector("#candidate-buttons");
const jsonOutput = document.querySelector("#json-output");

let activePuzzle = "example1";
let activeMode = "input";
let selectedLabel = null;
let testAnswerRevealed = false;

const puzzles = {
    example1: makePuzzle({
    voxels: [
      [3, 2, 2], [3, 3, 2], [3, 4, 2], [3, 5, 2], 
      [3, 4, 3], [3, 5, 3], [3, 2, 3], [3, 3, 3],
      [3, 2, 4], [3, 3, 4], [3, 4, 4], [3, 5, 4], 
      [3, 2, 5], [3, 3, 5], [3, 4, 5], [3, 5, 5], 
      [4, 2, 3], [4, 3, 3], [4, 4, 4], [4, 5, 5], [4, 6, 5],
      [5, 3, 4], [5, 4, 4], [5, 5, 5],
    ],
    blue: [1, 5, 4],
    candidates: [
      { label: "A", voxel: [3, 5, 3] },
      { label: "B", voxel: [3, 3, 3] },
      { label: "C", voxel: [3, 5, 4] },
      { label: "D", voxel: [3, 2, 5] },
    ],
  }),
  example2: makePuzzle({
    voxels: [
      [1, 4, 3], [1, 5, 3],
      [1, 2, 4], [1, 3, 4], [1, 4, 4], [1, 5, 4],
      [2, 4, 3], [2, 5, 3],
      [2, 2, 4], [2, 3, 4], [2, 4, 4], [2, 5, 4],
      [2, 2, 5], [2, 3, 5], [2, 4, 5], [2, 5, 5],
      [2, 5, 6], [2, 4, 6], [2, 3, 6],
      [3, 2, 4], [3, 3, 4], [3, 4, 4], [3, 5, 4],
      [4, 3, 4], [4, 4, 4], [4, 5, 4], [4, 6, 4],
      [5, 3, 4], [5, 6, 4],
      [3, 3, 5], [3, 4, 5], [3, 5, 5],
    ],
    blue: [7, 4, 5],
    candidates: [
      { label: "A", voxel: [5, 3, 4] },
      { label: "B", voxel: [5, 6, 4] },
      { label: "C", voxel: [3, 4, 5] },
      { label: "D", voxel: [2, 5, 6] },
    ],
  }),
  test: makePuzzle({
    voxels: [
      [1, 2, 2], [1, 3, 2], [1, 4, 2], [1, 5, 2],
      [1, 2, 3], [1, 3, 3], [1, 4, 3], [1, 5, 3],
      [2, 2, 2], [2, 3, 2], [2, 4, 2], 
      [2, 2, 3], [2, 3, 3], [2, 4, 3],
      [3, 2, 2], [3, 3, 2], [3, 4, 2],
      [3, 2, 3], [3, 3, 3], [3, 4, 3],
      [2, 5, 4],
      [3, 3, 3], [3, 4, 3], [3, 5, 4],
      [4, 3, 4], [4, 3, 5],
      [4, 4, 4], [4, 5, 4],
      [5, 4, 4], [5, 5, 4],
      [1, 2, 4], [1, 2, 5], [1, 2, 6],
    ],
    blue: [3, 5, 6],
    candidates: [
      { label: "A", voxel: [2, 5, 4] },
      { label: "B", voxel: [5, 5, 4] },
      { label: "C", voxel: [4, 3, 5] },
      { label: "D", voxel: [1, 2, 6] },
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
camera.position.set(12, 11, 14);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
autoRotateInput.checked = false;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.72;
controls.target.set(0, 0, 0);

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
root.add(voxelGroup);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderCandidateButtons();
render();
resize();
animate();

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    activePuzzle = button.dataset.puzzle;
    activeMode = activePuzzle.startsWith("example") ? "input" : "workspace";
    selectedLabel = null;
    testAnswerRevealed = false;
    renderCandidateButtons();
    setActiveButtons();
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

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (activePuzzle !== "test" || activeMode !== "workspace") return;

  const hit = pickCandidate(event);
  if (!hit) return;

  selectLabel(hit.object.userData.label);
});

window.addEventListener("resize", resize);

function makePuzzle({ voxels, blue, candidates }) {
  const occupied = new Set(voxels.map(([x, y, z]) => keyOf(x, y, z)));
  const answer = candidates
    .map((candidate) => ({ ...candidate, distance: distance(candidate.voxel, blue) }))
    .sort((a, b) => a.distance - b.distance)[0].label;

  return { blue, candidates, voxels, occupied, answer };
}

function render() {
  voxelGroup.clear();

  const puzzle = puzzles[activePuzzle];
  const highlightedLabel = activeMode === "output" ? puzzle.answer : selectedLabel;
  const highlightedVoxel = puzzle.candidates.find((item) => item.label === highlightedLabel)?.voxel;
  const highlightedKey = highlightedVoxel ? keyOf(...highlightedVoxel) : null;

  puzzle.voxels.forEach(([x, y, z]) => {
    const kind = keyOf(x, y, z) === highlightedKey ? "closest" : "body";
    addVoxel({ x, y, z, kind });
  });
  addVoxel({ x: puzzle.blue[0], y: puzzle.blue[1], z: puzzle.blue[2], kind: "blue" });

  addCandidateLabels(puzzle);
  updateJson();
  setStatus();
}

function addVoxel(voxel) {
  const color = voxel.kind === "blue" ? COLORS.blue : voxel.kind === "closest" ? COLORS.closest : COLORS.body;
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
  cube.userData.voxel = voxel;
  voxelGroup.add(cube);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: COLORS.edge, transparent: true, opacity: 0.88 }),
  );
  edges.position.copy(cube.position);
  voxelGroup.add(edges);
}

function addCandidateLabels(puzzle) {
  puzzle.candidates.forEach((candidate) => {
    exposedFaces(candidate.voxel, puzzle.occupied).forEach((face) => {
      const label = makeFaceLabel(candidate.label, face);
      const [x, y, z] = candidate.voxel;
      label.position.copy(toPosition(x, y, z));
      label.position.add(face.normal.clone().multiplyScalar(0.506));
      label.userData.label = candidate.label;
      label.userData.isCandidateLabel = true;
      voxelGroup.add(label);
    });
  });
}

function makeFaceLabel(text, face) {
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
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal);
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

function exposedFaces(voxel, occupied) {
  const [x, y, z] = voxel;
  return FACE_DIRECTIONS.filter(({ normal }) => {
    const nx = x + normal.x;
    const ny = y + normal.y;
    const nz = z + normal.z;
    return !occupied.has(keyOf(nx, ny, nz));
  });
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

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function keyOf(x, y, z) {
  return `${x},${y},${z}`;
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
