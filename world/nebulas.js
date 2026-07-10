import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";

const nebulas = [];

export function createNebulas(scene) {
  const nebulaData = [
    {
      texture: 2,
      x: 2200,
      y: -200,
      z: -1700,
      size: 3400,
      rotation: 1.3,
      opacity: 0.5,
    },
    {
      texture: 0,
      x: 2200,
      y: 1000,
      z: -2150,
      size: 2400,
      rotation: 0,
      opacity: 0.4,
    },

    {
      texture: 1,
      x: 2200,
      y: -1500,
      z: -1000,
      size: 5500,
      rotation: 1.2,
      opacity: 0.6,
    },

    {
      texture: 0,
      x: 2200,
      y: -100,
      z: -1500,
      size: 5000,
      rotation: -0.8,
      opacity: 0.3,
    },
    {
      texture: 2,
      x: 2200,
      y: 1300,
      z: -2110,
      size: 5000,
      rotation: -0.8,
      opacity: 0.25,
    },
    {
      texture: 2,
      x: 2000 ,
      y: -1000,
      z: -900,
      size: 3000,
      rotation: -0.8,
      opacity: 0.7,
    },
  ];
  // Load textures
  const textureLoader = new THREE.TextureLoader();

  const nebulaTextures = [
    textureLoader.load("assets/textures/nebula1.png"),
    textureLoader.load("assets/textures/nebula2.png"),
    textureLoader.load("assets/textures/nebula3.png"),
  ];

  nebulaData.forEach((data) => {
    addNebula(scene, nebulaTextures[data.texture], data);
  });
}

function addNebula(scene, texture, options) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: options.opacity,
  });

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(options.size, options.size),
    material,
  );

  mesh.position.set(options.x, options.y, options.z);

  mesh.rotation.z = options.rotation;

  mesh.userData.baseOpacity = options.opacity;

  scene.add(mesh);

  nebulas.push(mesh);
}
export function updateNebulas(time, camera) {
  nebulas.forEach((nebula, i) => {
    nebula.lookAt(camera.position);
    nebula.rotation.z += 0.00003 * (i + 1);

    nebula.material.opacity =
      nebula.userData.baseOpacity + Math.sin(time * 0.2 + i) * 0.01;
  });
}
