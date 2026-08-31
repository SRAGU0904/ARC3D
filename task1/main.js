import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLORS = {
  observed: "#ff8a24",
  repair: "#4bb763",
  label: "#ffffff",
  labelText: "#171918",
  edge: "#050505",
};

const VOXEL_SIZE = 1;
const GRID_SIZE = 10;
const HALF = (GRID_SIZE - 1) / 2;

const sceneEl = document.querySelector("#scene");
const statusLine = document.querySelector("#status-line");
const autoRotateInput = document.querySelector("#auto-rotate");
const testTools = document.querySelector("#test-tools");
const candidateButtons = document.querySelector("#candidate-buttons");
const jsonOutput = document.querySelector("#json-output");

let activePuzzle = "example1";
let activeMode = "input";
let selectedLabels = new Set();
let testAnswerRevealed = false;

const puzzles = {
  example1: makePuzzle({
    blocks: [
      {
        min: [1, 1, 1],
        max: [4, 4, 4],
        missingVoxels: [
          [4, 2, 4],
          [2, 4, 4],
        ],
      },
      {
        min: [6, 2, 2],
        max: [8, 5, 5],
        missingVoxels: [[7, 5, 5]],
      },
    ],
    candidates: [
      { label: "A", voxel: [4, 2, 4] },
      { label: "B", voxel: [5, 3, 4] },
      { label: "C", voxel: [2, 4, 4] },
      { label: "D", voxel: [7, 5, 5] },
      { label: "E", voxel: [8, 6, 5] },
    ],
  }),
  example2: makePuzzle({
    blocks: [
      {
        min: [1, 2, 2],
        max: [4, 5, 5],
        missingVoxels: [[4, 4, 5]],
      },
      {
        min: [6, 3, 3],
        max: [8, 6, 6],
        missingVoxels: [
          [6, 4, 6],
          [8, 5, 5],
        ],
      },
    ],
    candidates: [
      { label: "A", voxel: [4, 4, 5] },
      { label: "B", voxel: [5, 4, 5] },
      { label: "C", voxel: [6, 4, 6] },
      { label: "D", voxel: [8, 5, 5] },
      { label: "E", voxel: [7, 7, 6] },
    ],
  }),
  test: makePuzzle({
    blocks: [
      {
        min: [1, 2, 2],
        max: [4, 5, 5],
        missingVoxels: [
          [1, 3, 5],
          [3, 5, 5],
        ],
      },
      {
        min: [6, 1, 4],
        max: [8, 4, 7],
        missingVoxels: [[8, 3, 7]],
      },
    ],
    candidates: [
      { label: "A", voxel: [1, 3, 5] },
      { label: "B", voxel: [5, 4, 5] },
      { label: "C", voxel: [3, 5, 5] },
      { label: "D", voxel: [8, 3, 7] },
      { label: "E", voxel: [7, 5, 7] },
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
controls.autoRotate = true;
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
    selectedLabels = new Set();
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
  const expected = puzzles.test.answerLabels;
  const correct =
    expected.size === selectedLabels.size &&
    [...expected].every((label) => selectedLabels.has(label));
  statusLine.textContent = correct ? "Test correct" : "Test incomplete";
});

document.querySelector("#reset-answer").addEventListener("click", () => {
  selectedLabels = new Set();
  testAnswerRevealed = false;
  activeMode = "workspace";
  renderCandidateButtons();
  setActiveButtons();
  render();
});

document.querySelector("#reveal-answer").addEventListener("click", () => {
  testAnswerRevealed = true;
  selectedLabels = new Set(puzzles.test.answerLabels);
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

  toggleLabel(hit.object.userData.label);
});

window.addEventListener("resize", resize);

function makePuzzle({ blocks, candidates }) {
  const input = new Map();
  const output = new Map();
  const missing = new Set();

  blocks.forEach((block) => {
    const missingInBlock = new Set(block.missingVoxels.map(([x, y, z]) => keyOf(x, y, z)));

    forEachVoxel(block.min, block.max, (x, y, z) => {
      if (!isSurface([x, y, z], block)) return;

      const key = keyOf(x, y, z);
      if (missingInBlock.has(key)) {
        missing.add(key);
        output.set(key, "repair");
      } else {
        input.set(key, "observed");
        output.set(key, "observed");
      }
    });
  });

  const answerLabels = new Set(
    candidates.filter(({ voxel }) => missing.has(keyOf(...voxel))).map(({ label }) => label),
  );

  return { input, output, missing, candidates, answerLabels };
}

function isSurface([x, y, z], block) {
  const [minX, minY, minZ] = block.min;
  const [maxX, maxY, maxZ] = block.max;
  return x === minX || x === maxX || y === minY || y === maxY || z === minZ || z === maxZ;
}

function render() {
  voxelGroup.clear();

  const puzzle = puzzles[activePuzzle];
  const voxels = new Map();
  puzzle.input.forEach((value, key) => voxels.set(key, value));

  if (activeMode === "output") {
    puzzle.output.forEach((value, key) => voxels.set(key, value));
  }

  if (activePuzzle === "test" && activeMode === "workspace") {
    selectedLabels.forEach((label) => {
      const candidate = puzzle.candidates.find((item) => item.label === label);
      if (candidate) voxels.set(keyOf(...candidate.voxel), "repair");
    });
  }

  voxels.forEach((kind, key) => {
    const [x, y, z] = key.split(",").map(Number);
    addVoxel({ x, y, z, kind });
  });

  if (activeMode !== "output") {
    addCandidateLabels(puzzle);
  }

  updateJson();
  setStatus();
}

function addVoxel(voxel) {
  const color = voxel.kind === "observed" ? COLORS.observed : COLORS.repair;
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
    const selected = selectedLabels.has(candidate.label);
    const label = makeLabelSprite(candidate.label, selected);
    const [x, y, z] = candidate.voxel;
    label.position.copy(toPosition(x, y, z));
    label.position.y += 0.08;
    label.userData.label = candidate.label;
    label.userData.isCandidateLabel = true;
    voxelGroup.add(label);
  });
}

function makeLabelSprite(text, selected) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.beginPath();
  context.arc(80, 80, 54, 0, Math.PI * 2);
  context.fillStyle = selected ? COLORS.repair : COLORS.label;
  context.fill();
  context.lineWidth = 8;
  context.strokeStyle = COLORS.edge;
  context.stroke();
  context.fillStyle = selected ? "#ffffff" : COLORS.labelText;
  context.font = "bold 76px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 80, 84);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.86, 0.86, 0.86);
  return sprite;
}

function renderCandidateButtons() {
  candidateButtons.replaceChildren();
  puzzles.test.candidates.forEach(({ label }) => {
    const button = document.createElement("button");
    button.className = "candidate";
    button.textContent = label;
    button.type = "button";
    button.addEventListener("click", () => toggleLabel(label));
    candidateButtons.appendChild(button);
  });
  updateJson();
}

function toggleLabel(label) {
  if (selectedLabels.has(label)) {
    selectedLabels.delete(label);
  } else {
    selectedLabels.add(label);
  }
  renderCandidateButtons();
  render();
}

function updateJson() {
  const repairs = [...selectedLabels].sort();
  jsonOutput.textContent = JSON.stringify({ repairs });
  document.querySelectorAll(".candidate").forEach((button) => {
    button.classList.toggle("is-selected", selectedLabels.has(button.textContent));
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

function forEachVoxel(min, max, callback) {
  for (let x = min[0]; x <= max[0]; x += 1) {
    for (let y = min[1]; y <= max[1]; y += 1) {
      for (let z = min[2]; z <= max[2]; z += 1) {
        callback(x, y, z);
      }
    }
  }
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
