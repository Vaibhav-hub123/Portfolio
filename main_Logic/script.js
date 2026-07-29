import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createStars } from "../world/stars.js";
import { createPlanet } from "../world/planets.js";
import {
  setupInteractions,
  registerPlanet,
  updateInteractions,
  focusPlanet,
  lookAtPlanet,
  lookAtOrigin,
  cancelFocus,
  isFocusing,
} from "./interactions.js";
import { initHUD } from "../Detector/Detector.js";
import { applyTheme } from "../Theme/themeManager.js";
import { createNebulas, updateNebulas } from "../world/nebulas.js";
import { initRadarPlanets, updateRadarPlanets } from "../scanner/scanner.js";
import { initInfoPanel } from "../TAb_UI/logic/infoPanel.js"; // ADD

initHUD();
initInfoPanel();
const scene = new THREE.Scene();

const smallStars = createStars(scene, 10000, 0.7, 1.3, 0xffffff);
const mediumStars = createStars(scene, 1000, 2, 3, 0xddeeff);
const bright1 = createStars(scene, 50, 6, 8, 0xffffff);
const bright2 = createStars(scene, 50, 6, 8, 0xddeeff);
const bright3 = createStars(scene, 50, 6, 8, 0xbbddff);
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
createNebulas(scene);

scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 5);
sun.position.set(10, 10, 10);
scene.add(sun);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100000,
);

camera.position.set(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
const planetData = [
  {
    name: "origin",
    title: "ORIGIN",
    about: "Who Am I?",
    model: "./assets/3dPlanets/planet1.glb",
    size: 6,
    position: [-18, 5, -45],
  },
  {
    name: "about",
    title: "ABOUT",
    about: "",
    model: "./assets/3dPlanets/planet2.glb",
    size: 6,
    position: [40, 40, -100],
  },
  {
    name: "projects",
    title: "PROJECTS",
    about: "",
    model: "./assets/3dPlanets/planet3.glb",
    size: 10,
    position: [100, -20, 80],
  },
  // {
  //   name: "skills",
  //   model: "./assets/3dPlanets/planet4.glb",
  //   size: 5.5,
  //   position: [18, -15, -60],
  // },
  // {
  //   name: "contact",
  //   model: "./assets/3dPlanets/planet5.glb",
  //   size: 4.5,
  //   position: [35, 12, -95],
  // },
];
initRadarPlanets(planetData);

const planets = [];
planetData.forEach((data) => {
  createPlanet(scene, data.model, data.size, ...data.position, (planet) => {
    Object.assign(planet.userData, data);

    planets.push(planet);

    registerPlanet(planet);
  });
});

let angle = 0;
let rotateLeft = false;
let rotateRight = false;

const rotationSpeed = 0.02;

document.addEventListener("keydown", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") {
    rotateLeft = true;
    cancelFocus();
  }

  if (e.key === "d" || e.key === "ArrowRight") {
    rotateRight = true;
    cancelFocus();
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") rotateLeft = false;

  if (e.key === "d" || e.key === "ArrowRight") rotateRight = false;
});

// Listen for nav clicks from navigation.js — it dispatches this event with
// the planet's name (e.g. "home", "about") instead of importing Three.js code.
window.addEventListener("navigate", (e) => {
 lookAtPlanet(camera, e.detail);
;
});
window.addEventListener("navigate-origin", () => {
  lookAtOrigin(camera);
});

let frames = 0;
let last = performance.now();
function animate() {
  frames++;

  const now = performance.now();

  if (now - last >= 1000) {
    console.log("FPS:", frames);
    frames = 0;
    last = now;
  }

  const time = performance.now() * 0.001;
  smallStars.rotation.y += 0.00001;
  const t1 = performance.now();

  updateInteractions(camera);
  // isOverPlanet(camera);
  const t2 = performance.now();

  updateNebulas(time, camera);

  const t3 = performance.now();

  renderer.render(scene, camera);

  const t4 = performance.now();

  if (Math.random() < 0.01) {
    console.log({
      interactions: (t2 - t1).toFixed(2),
      nebulas: (t3 - t2).toFixed(2),
      render: (t4 - t3).toFixed(2),
    });
  }
  mediumStars.rotation.y += 0.000015;
  bright1.rotation.y += 0.000025;
  bright2.rotation.y += 0.000018;
  bright3.rotation.y += 0.000032;
  bright1.material.opacity = 0.8 + Math.sin(time * 1.3) * 0.2;
  bright2.material.opacity = 0.8 + Math.sin(time * 0.9 + 3) * 0.2;
  bright3.material.opacity = 0.8 + Math.sin(time * 1.8 + 7) * 0.2;
  updateRadarPlanets(camera);

  requestAnimationFrame(animate);

  // Manual rotation is skipped while an auto-focus turn is in progress,
  // so the two don't fight each other frame-to-frame.
  if (!isFocusing()) {
    if (rotateLeft) camera.rotateY(rotationSpeed);
    if (rotateRight) camera.rotateY(-rotationSpeed);
  }

  planets.forEach((planet) => {
    planet.rotation.y += 0.001;
  });
  // camera.position.x = Math.sin(time * 0.1) * 0.35;
  // camera.position.y = Math.cos(time * 0.15) * 0.15;
}

animate();

setupInteractions(camera, scene);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,

    window.innerHeight,
  );
});

const panel = document.getElementById("themePanel");

themeBtn.addEventListener("click", () => {
  panel.classList.toggle("open");
});
document.querySelectorAll(".themeCard").forEach((card) => {
  card.addEventListener("click", () => {
    applyTheme(card.dataset.theme);
  });
});

let currentExpression = "neutral";
let blinking = false;
async function setExpression(name) {
  currentExpression = name;

  const response = await fetch(`assets/robo/${name}.svg`);
  let svg = await response.text();

  svg = svg.replace(/<\?xml[^>]*\?>/, "");

  document.getElementById("robotAssistant").innerHTML = svg;
}

async function blink() {
  if (blinking) return;

  blinking = true;

  const previous = currentExpression;

  await setExpression(previous + "Blink");

  await new Promise((resolve) => setTimeout(resolve, 100));

  await setExpression(previous);

  blinking = false;
}
function startBlinking() {
  function scheduleBlink() {
    const delay = 3000 + Math.random() * 4000;

    setTimeout(async () => {
      await blink();

      if (Math.random() < 0.25) {
        await new Promise((r) => setTimeout(r, 120));

        await blink();
      }

      scheduleBlink();
    }, delay);
  }

  scheduleBlink();
}
(async () => {
  await setExpression("neutral");

  startBlinking();
})();

setInterval(() => {
  console.log(renderer.info.render);
  console.log(renderer.info.memory);
}, 3000);
