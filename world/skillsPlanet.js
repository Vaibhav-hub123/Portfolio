import * as THREE from "three";

const planetRadius = 4.5;
const mapSkills = ["JAVASCRIPT", "THREE.JS", "HTML", "CSS", "GODOT", "UNREAL"];

export function createSkillsPlanet(scene, data) {
  const planet = new THREE.Group();
  planet.position.set(...data.position);
  planet.userData = { ...data };

  const tiltAxis = new THREE.Group();
  tiltAxis.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0.35, 0.82, 0.45).normalize(),
  );
  planet.add(tiltAxis);

  const spinGroup = new THREE.Group();
  tiltAxis.add(spinGroup);

  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(planetRadius, 64, 48),
    new THREE.MeshStandardMaterial({
      map: createSurfaceMap(),
      roughness: 0.72,
      metalness: 0.22,
      emissive: "#07182a",
      emissiveIntensity: 0.35,
    }),
  );
  spinGroup.add(surface);

  const equatorialMap = new THREE.Mesh(
    new THREE.CylinderGeometry(planetRadius * 1.025, planetRadius * 1.025, 1.35, 160, 1, true),
    new THREE.MeshBasicMaterial({
      map: createEquatorialMap(),
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  spinGroup.add(equatorialMap);

  const rings = new THREE.Group();
  rings.add(makeRing(5.5, 6.15, "#72e4ff", 0.7));
  rings.add(makeRing(6.3, 7.35, "#8b8bff", 0.42));
  rings.add(makeRing(7.55, 8.5, "#4eaaff", 0.56));
  rings.add(makeRing(8.7, 8.9, "#b4f6ff", 0.65));
  tiltAxis.add(rings);
  planet.userData.spinGroup = spinGroup;
  planet.userData.ringGroup = rings;

  scene.add(planet);
  return planet;
}

function makeRing(innerRadius, outerRadius, color, opacity) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(innerRadius, outerRadius, 160, 2),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.1;
  return ring;
}

function createSurfaceMap() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const ocean = ctx.createLinearGradient(0, 0, 0, canvas.height);
  ocean.addColorStop(0, "#07182e");
  ocean.addColorStop(0.5, "#10375a");
  ocean.addColorStop(1, "#081a36");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(36, 185, 222, 0.36)";
  drawLandmass(ctx, 150, 135, 105, 52, -0.28);
  drawLandmass(ctx, 410, 108, 125, 63, 0.32);
  drawLandmass(ctx, 710, 155, 132, 68, -0.18);
  drawLandmass(ctx, 920, 122, 82, 47, 0.25);
  ctx.fillStyle = "rgba(124, 143, 255, 0.25)";
  drawLandmass(ctx, 300, 355, 145, 60, -0.2);
  drawLandmass(ctx, 760, 365, 110, 55, 0.34);

  ctx.strokeStyle = "rgba(118, 222, 255, 0.19)";
  ctx.lineWidth = 1;
  for (let y = 0; y <= canvas.height; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let x = 0; x <= canvas.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  const equator = ctx.createLinearGradient(0, 0, canvas.width, 0);
  equator.addColorStop(0, "rgba(46, 212, 255, 0)");
  equator.addColorStop(0.5, "rgba(81, 231, 255, 0.78)");
  equator.addColorStop(1, "rgba(46, 212, 255, 0)");
  ctx.fillStyle = equator;
  ctx.fillRect(0, 249, canvas.width, 14);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function drawLandmass(ctx, x, y, width, height, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(-width * 0.5, -height * 0.12);
  ctx.bezierCurveTo(-width * 0.45, -height * 0.68, -width * 0.08, -height * 0.5, width * 0.02, -height * 0.34);
  ctx.bezierCurveTo(width * 0.25, -height * 0.55, width * 0.48, -height * 0.18, width * 0.36, height * 0.04);
  ctx.bezierCurveTo(width * 0.52, height * 0.38, width * 0.16, height * 0.55, -width * 0.03, height * 0.34);
  ctx.bezierCurveTo(-width * 0.24, height * 0.56, -width * 0.48, height * 0.26, -width * 0.5, -height * 0.12);
  ctx.fill();
  ctx.restore();
}

function createEquatorialMap() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(2, 15, 35, 0.82)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(86, 211, 255, 0.42)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= canvas.width; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(101, 205, 255, 0.26)";
  [28, 226].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  });

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cellWidth = canvas.width / mapSkills.length;
  mapSkills.forEach((skill, index) => {
    const x = cellWidth * (index + 0.5);
    ctx.fillStyle = "#9ceeff";
    ctx.shadowColor = "#28c9ff";
    ctx.shadowBlur = 14;
    ctx.font = "600 42px monospace";
    ctx.fillText(skill, x, 108);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#5b9dbd";
    ctx.font = "22px monospace";
    ctx.fillText(`SECTOR 0${index + 1}`, x, 157);
    ctx.fillStyle = "#7fe4ff";
    ctx.beginPath();
    ctx.arc(x, 205, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}
