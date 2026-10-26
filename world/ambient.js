import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const motes = [];
const comets = [];
const cometForward = new THREE.Vector3(1, 0, 0);
const starTexture = new THREE.TextureLoader().load("assets/textures/star.png");
const meteorLoader = new GLTFLoader();

export function createAmbientDetails(scene) {
  const geometry = new THREE.BufferGeometry();
  const count = 150;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color("#54cfff"),
    new THREE.Color("#9daaff"),
    new THREE.Color("#d4f5ff"),
  ];

  for (let i = 0; i < count; i++) {
    const radius = 130 + Math.random() * 230;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const tint = palette[Math.floor(Math.random() * palette.length)].clone();
    tint.multiplyScalar(0.35 + Math.random() * 0.5);
    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    map: starTexture,
    size: 1.15,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.34,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const dust = new THREE.Points(geometry, material);
  dust.renderOrder = -1;
  scene.add(dust);
  motes.push(dust);

  addComet(scene, createMeteorTrack({ nearby: true }));
  addComet(scene, createMeteorTrack({ nearby: true }));
  addComet(scene, createMeteorTrack());
  addComet(scene, createMeteorTrack());

  loadMeteorModel();
}

function createMeteorTrack({ nearby = false } = {}) {
  // Keep the tracks fixed in the scene, but lay them across the initial camera
  // view so each meteor enters and exits beyond a screen edge.
  const distance = nearby
    ? 110 + Math.random() * 150
    : 550 + Math.random() * 1350;
  const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(75 * 0.5));
  const halfWidth = halfHeight * (window.innerWidth / window.innerHeight);
  const center = new THREE.Vector3(
    (Math.random() - 0.5) * halfWidth * 0.75,
    (Math.random() - 0.5) * halfHeight * 0.75,
    -distance,
  );
  const travelDirection = new THREE.Vector3(
    Math.cos(Math.random() * Math.PI * 2),
    Math.sin(Math.random() * Math.PI * 2),
    0,
  );
  const positiveEdge = Math.min(
    travelDirection.x > 0
      ? (halfWidth - center.x) / travelDirection.x
      : (-halfWidth - center.x) / travelDirection.x,
    travelDirection.y > 0
      ? (halfHeight - center.y) / travelDirection.y
      : (-halfHeight - center.y) / travelDirection.y,
  );
  const negativeEdge = Math.min(
    travelDirection.x < 0
      ? (halfWidth - center.x) / -travelDirection.x
      : (-halfWidth - center.x) / -travelDirection.x,
    travelDirection.y < 0
      ? (halfHeight - center.y) / -travelDirection.y
      : (-halfHeight - center.y) / -travelDirection.y,
  );
  const margin = Math.min(halfWidth, halfHeight) * 0.2;
  const start = center.clone().addScaledVector(travelDirection, -negativeEdge - margin);
  const end = center.clone().addScaledVector(travelDirection, positiveEdge + margin);
  const span = start.distanceTo(end);
  const curveNormal = new THREE.Vector3(-travelDirection.y, travelDirection.x, 0);
  if (Math.random() < 0.5) curveNormal.negate();
  const control = center.clone().addScaledVector(curveNormal, span * (0.025 + Math.random() * 0.045));

  return {
    start,
    control,
    end,
    period: nearby ? 32 + Math.random() * 22 : 48 + Math.random() * 42,
    phase: Math.random(),
    activeFraction: 0.24 + Math.random() * 0.12,
    meteorScale: nearby ? 6.5 + Math.random() * 3 : 4.5 + Math.random() * 5,
    spinRate: new THREE.Vector3(
      0.12 + Math.random() * 0.32,
      0.16 + Math.random() * 0.38,
      0.08 + Math.random() * 0.28,
    ),
    spinPhase: new THREE.Vector3(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    ),
  };
}

function addComet(scene, {
  start,
  control,
  end,
  period,
  phase,
  activeFraction,
  meteorScale,
  spinRate,
  spinPhase,
}) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  comets.push({
    group,
    curve: new THREE.QuadraticBezierCurve3(start, control, end),
    point: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    period,
    phase,
    activeFraction,
    meteorScale,
    spinRate,
    spinPhase,
    meteor: null,
  });
}

function loadMeteorModel() {
  meteorLoader.load(
    "assets/comet/meteor.glb",
    (gltf) => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const largestDimension = Math.max(size.x, size.y, size.z);
      if (!largestDimension) return;

      model.position.sub(center);
      comets.forEach((comet) => {
        const meteor = model.clone(true);
        meteor.scale.setScalar(comet.meteorScale / largestDimension);
        comet.group.add(meteor);
        comet.meteor = meteor;
      });
    },
    undefined,
    (error) => console.error("Could not load comet model", error),
  );
}

export function updateAmbientDetails(time) {
  motes.forEach((dust, index) => {
    dust.rotation.y = time * 0.0015;
    dust.rotation.x = Math.sin(time * 0.08) * 0.025;
    dust.material.opacity = 0.29 + Math.sin(time * 0.65 + index) * 0.05;
  });

  comets.forEach(({ group, curve, point, period, phase, activeFraction, direction, meteor, spinRate, spinPhase }) => {
    const progress = (time / period + phase) % 1;
    const active = progress < activeFraction;
    group.visible = active && Boolean(meteor);
    if (!active || !meteor) return;

    const travel = progress / activeFraction;
    curve.getPointAt(travel, point);
    curve.getTangentAt(travel, direction).normalize();
    group.position.copy(point);
    group.quaternion.setFromUnitVectors(cometForward, direction);

    // Let the rock turn slowly as it crosses the scene.
    meteor.rotation.set(
      spinPhase.x + time * spinRate.x,
      spinPhase.y + time * spinRate.y,
      spinPhase.z + time * spinRate.z,
    );
  });
}
