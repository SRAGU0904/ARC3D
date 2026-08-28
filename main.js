import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLORS = {
  observed: "#ff8a24",
  shell: "#4bb763",
  cavity: "#f3c747",
  edge: "#050505",
};

const VOXEL_SIZE = 1;
const GRID_SIZE = 10;
const HALF = (GRID_SIZE - 1) / 2;

const sceneEl = document.querySelector("#scene");
const statusLine = document.querySelector("#status-line");
const autoRotateInput = document.querySelector("#auto-rotate");
const testTools = document.querySelector("#test-tools");

let activePuzzle = "example";
let activeMode = "input";
let paintValue = "3";
let answer = new Map();
let testAnswerRevealed = false;

const puzzles = {
  example: makePuzzle([
    {
      min: [1, 1, 1],
      max: [4, 4, 4],
      cavityMin: [2, 2, 2],
      cavityMax: [3, 3, 3],
      observedFaces: ["front", "left", "bottom", "top-rim"],
    },
    {
      min: [6, 2, 2],
      max: [8, 6, 5],
      cavityMin: [7, 3, 3],
      cavityMax: [7, 5, 4],
      observedFaces: ["front", "right", "bottom"],
    },
  ]),
  test: makePuzzle([
    {
      min: [1, 2, 2],
      max: [4, 6, 5],
      cavityMin: [2, 3, 3],
      cavityMax: [3, 5, 4],
      observedFaces: ["front", "left", "bottom"],
    },
    {
      min: [6, 1, 4],
      max: [8, 4, 8],
      cavityMin: [7, 2, 5],
      cavityMax: [7, 3, 7],
      observedFaces: ["front", "right", "top-rim"],
    },
  ]),
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
root.add(buildBoundaryBox());
root.add(voxelGroup);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

render();
resize();
animate();

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    activePuzzle = button.dataset.puzzle;
    activeMode = activePuzzle === "example" ? "input" : "workspace";
    answer = new Map();
    testAnswerRevealed = false;
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

document.querySelectorAll(".paint").forEach((button) => {
  button.addEventListener("click", () => {
    paintValue = button.dataset.paint;
    document.querySelector(".paint.is-active").classList.remove("is-active");
    button.classList.add("is-active");
  });
});

document.querySelector("#check-answer").addEventListener("click", () => {
  const expected = puzzles.test.output;
  const candidate = new Map(puzzles.test.input);
  answer.forEach((value, key) => candidate.set(key, value));
  const correct =
    expected.size === candidate.size &&
    [...expected].every(([key, value]) => candidate.get(key) === value);
  statusLine.textContent = correct ? "Test correct" : "Test incomplete";
});

document.querySelector("#reset-answer").addEventListener("click", () => {
  answer = new Map();
  testAnswerRevealed = false;
  activeMode = "workspace";
  setActiveButtons();
  render();
});

document.querySelector("#reveal-answer").addEventListener("click", () => {
  testAnswerRevealed = true;
  activeMode = "output";
  setActiveButtons();
  render();
});

autoRotateInput.addEventListener("change", () => {
  controls.autoRotate = autoRotateInput.checked;
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (activePuzzle !== "test" || activeMode !== "workspace") return;

  const hit = pickVoxel(event);
  if (!hit) return;

  const voxel = hit.object.userData.voxel;
  if (paintValue === "erase") {
    if (!puzzles.test.input.has(keyOf(voxel.x, voxel.y, voxel.z))) {
      answer.delete(keyOf(voxel.x, voxel.y, voxel.z));
      render();
    }
    return;
  }

  const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  const target = {
    x: voxel.x + Math.round(normal.x),
    y: voxel.y + Math.round(normal.y),
    z: voxel.z + Math.round(normal.z),
  };

  if (!inBounds(target)) return;
  const key = keyOf(target.x, target.y, target.z);
  if (puzzles.test.input.has(key)) return;

  answer.set(key, paintValue === "3" ? "shell" : "cavity");
  render();
});

window.addEventListener("resize", resize);

function makePuzzle(components) {
  const input = new Map();
  const output = new Map();

  components.forEach((component, index) => {
    forEachVoxel(component.min, component.max, (x, y, z) => {
      const key = keyOf(x, y, z);
      const point = [x, y, z];
      if (within(point, component.cavityMin, component.cavityMax)) {
        output.set(key, "cavity");
        return;
      }

      if (isShell(point, component)) {
        output.set(key, "shell");
      }

      if (isObserved(point, component, index)) {
        input.set(key, "observed");
        output.set(key, "observed");
      }
    });
  });

  return { input, output };
}

function isObserved([x, y, z], component, componentIndex) {
  const [minX, minY, minZ] = component.min;
  const [maxX, maxY, maxZ] = component.max;
  const faceTests = {
    front: z === maxZ && !(x === minX && y > minY + 1),
    left: x === minX && y !== maxY,
    right: x === maxX && y !== minY,
    bottom: y === minY && z >= minZ + 1,
    "top-rim": y === maxY && x <= maxX - 1 && z === maxZ,
  };

  const faceHit = component.observedFaces.some((face) => faceTests[face]);
  const sparseAnchor = componentIndex === 1 && x === minX && y === minY && z >= minZ + 1;
  return faceHit || sparseAnchor;
}

function isShell([x, y, z], component) {
  const [minX, minY, minZ] = component.min;
  const [maxX, maxY, maxZ] = component.max;
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
    answer.forEach((value, key) => voxels.set(key, value));
  }

  voxels.forEach((kind, key) => {
    const [x, y, z] = key.split(",").map(Number);
    addVoxel({ x, y, z, kind });
  });

  setStatus();
}

function addVoxel(voxel) {
  const color = voxel.kind === "observed" ? COLORS.observed : voxel.kind === "shell" ? COLORS.shell : COLORS.cavity;
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

function pickVoxel(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(voxelGroup.children.filter((child) => child.isMesh), false)[0];
}

function setStatus() {
  const names = {
    example: "Example",
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
      (activePuzzle === "example" && button.dataset.mode === "workspace") ||
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

function within(point, min, max) {
  return point.every((value, index) => value >= min[index] && value <= max[index]);
}

function inBounds({ x, y, z }) {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && z >= 0 && z < GRID_SIZE;
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
