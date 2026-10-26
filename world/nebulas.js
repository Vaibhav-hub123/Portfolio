import * as THREE from "three";

const nebulas = [];// stores the nebula in an array

// The active theme's glow color, blended into the nebula tint at a low strength.
// Kept as module-level THREE.Color objects mutated in place (not recreated every
// frame) so the per-frame update loop below does zero allocation.
const neutralWhite = new THREE.Color(0xffffff);
const targetTint = new THREE.Color(0xffffff); // only recomputed when the theme changes
const TINT_STRENGTH = 0.18; // how much theme color shows through - keep this low,
// nebulas should still read as "space", not as a theme-colored overlay

// themeManager.js dispatches this event on every applyTheme() call (see that file).
// Reading getComputedStyle only here - on the rare theme-change event - instead of
// every frame is what keeps this free performance-wise.
window.addEventListener("themechange", () => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--glow-soft").trim();
  const match = raw.match(/rgba?\(([^)]+)\)/);
  if (!match) return;
  const [r, g, b] = match[1].split(",").map((n) => parseFloat(n));
  const themeColor = new THREE.Color(r / 255, g / 255, b / 255);
  targetTint.copy(neutralWhite).lerp(themeColor, TINT_STRENGTH);
});

export function createNebulas(scene) {
  const nebulaData = [

    {
      texture: 2,
      x: 2200,
      y: -200,
      z: -1700,
      size: 3400,
      rotation: 1.3,
      opacity: 0.32,
    },
    {
      texture: 0,
      x: 2200,
      y: 1000,
      z: -2150,
      size: 2400,
      rotation: 0,
      opacity: 0.26,
    },

    {
      texture: 1,
      x: 2200,
      y: -1500,
      z: -1000,
      size: 5500,
      rotation: 1.2,
      opacity: 0.38,
    },

    {
      texture: 0,
      x: 2200,
      y: -100,
      z: -1500,
      size: 5000,
      rotation: -0.8,
      opacity: 0.2,
    },
    {
      texture: 2,
      x: 2200,
      y: 1300,
      z: -2110,
      size: 5000,
      rotation: -0.8,
      opacity: 0.16,
    },
    {
      texture: 2,
      x: 2000,
      y: -1000,
      z: -900,
      size: 3000,
      rotation: -0.8,
      opacity: 0.42,
    },
    // Softer clouds spread across the opposite side and upper sky. The staggered
    // positions and scales layer together without creating one solid color sheet.
    {
      texture: 1,
      x: -2100,
      y: 450,
      z: 1650,
      size: 3100,
      rotation: -0.55,
      opacity: 0.14,
    },
    {
      texture: 0,
      x: -1650,
      y: 1350,
      z: 2350,
      size: 2200,
      rotation: 0.2,
      opacity: 0.09,
    },
    {
      texture: 2,
      x: 350,
      y: -1550,
      z: 2200,
      size: 2600,
      rotation: 1.0,
      opacity: 0.1,
    },
    {
      texture: 0,
      x: -2900,
      y: -250,
      z: -500,
      size: 2700,
      rotation: 0.75,
      opacity: 0.12,
    },
    {
      texture: 1,
      x: 900,
      y: 2100,
      z: -900,
      size: 3000,
      rotation: -1.1,
      opacity: 0.09,
    },
    {
      texture: 2,
      x: -600,
      y: 450,
      z: 1450,
      size: 1600,
      rotation: 0.4,
      opacity: 0.07,
    },
  ];

  // Load textures
  const textureLoader = new THREE.TextureLoader();

  //an array for the nebula textures
  const nebulaTextures = [
    textureLoader.load("assets/textures/nebula1.png"),
    textureLoader.load("assets/textures/nebula2.png"),
    textureLoader.load("assets/textures/nebula3.png"),
  ];

  // adding each nebula with the data provided in the nebulaData with the texures in nebulaTextures
  nebulaData.forEach((data) => {
    addNebula(scene, nebulaTextures[data.texture], data);// calling the addnebula functions for the nebulas we created or rather put in array
  });
}


// adds the nebula to the scene
function addNebula(scene, texture, options) {
  // creating a new material
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: options.opacity,
  });

  //creating a plane mesh with the material made
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(options.size, options.size),
    material,
  );


  mesh.position.set(options.x, options.y, options.z);// setting the position for the mesh
  mesh.rotation.z = options.rotation;// setting the rotaion a little bit
  mesh.userData.baseOpacity = options.opacity;// setting opacity
  mesh.userData.baseX = options.x;
  mesh.userData.baseY = options.y;
  // VISUAL CHANGE: unique-ish per-nebula drift phase/speed/amount so the six of
  // them don't all move in lockstep - synchronized motion is exactly what made the
  // old sin(time*0.2+i) opacity pulse read as "an obvious repeating animation"
  mesh.userData.driftPhase = Math.random() * Math.PI * 2;
  mesh.userData.driftSpeed = 0.015 + Math.random() * 0.02;
  mesh.userData.driftAmount = 12 + Math.random() * 10;

  scene.add(mesh);//adding the mesh into the scene
  nebulas.push(mesh);// adding the nebula into the mesh
}


//animate the nebulas basically
export function updateNebulas(time, camera) {
  // get all the nebulas
  nebulas.forEach((nebula, i) => {
    nebula.lookAt(camera.position);//make the nebulas look in the direction of the camera otherwise they may look wierd
    nebula.rotation.z += 0.00003 * (i + 1);// add a little bit of rotation to make it look alive
    nebula.material.opacity = nebula.userData.baseOpacity + Math.sin(time * 0.2 + i) * 0.01; // changing opacity a little bit

    // VISUAL CHANGE: very slow independent positional drift on top of the rotation
    // above. Amplitude (driftAmount, ~12-22 units) is tiny relative to nebula size
    // (2400-5500) and their distance from origin (~2000+), so it stays "alive" but
    // not something you consciously notice looping.
    const d = nebula.userData;
    nebula.position.x = d.baseX + Math.sin(time * d.driftSpeed + d.driftPhase) * d.driftAmount;
    nebula.position.y = d.baseY + Math.cos(time * d.driftSpeed * 0.7 + d.driftPhase) * d.driftAmount * 0.6;

    // VISUAL CHANGE: ease the nebula's tint toward the active theme's glow color
    // (see themechange listener above) instead of staying pure white always. This
    // is what makes nebulas respect the BLUE/GREEN/RED theme per the brief, without
    // literally tinting the whole plane the theme color.
    nebula.material.color.lerp(targetTint, 0.01);
  });
}
