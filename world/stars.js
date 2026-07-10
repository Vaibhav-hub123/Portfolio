import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";
const loader = new THREE.TextureLoader();

const starTexture = loader.load("../assets/textures/star.png");

export function createStars(scene, count, minSize, maxSize, color) {
  const starGeometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const sizes = [];

  for (let i = 0; i < count; i++) {
    positions.push(
      (Math.random() - 0.5) * 3000,
      (Math.random() - 0.5) * 3000,
      (Math.random() - 0.5) * 3000,
    );
    sizes.push(minSize + Math.random() * (maxSize - minSize));
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  const starMaterial = new THREE.PointsMaterial({
    map: starTexture,
    transparent: true,
    color: color,
    size: 2,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);

  scene.add(stars);
  return stars;
}
