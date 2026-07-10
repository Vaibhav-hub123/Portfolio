import * as THREE from "three";

const sweep = document.querySelector(".sweep");
const dotsSvg = document.querySelector(".radarDots");

const centerX = 100;
const centerY = 100;
const glowSpread = 15;
const SWEEP_OFFSET = 90;

const RADAR_MIN_R = 35;
const RADAR_MAX_R = 85;
const DIST_NEAR = 30;
const DIST_FAR = 150;

let rotationAngle = 0;
let planetEntries = [];

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _toPlanet = new THREE.Vector3();

export function initRadarPlanets(planetData) {
  dotsSvg.querySelectorAll(".scannerDots").forEach((el) => el.remove());

  planetEntries = planetData.map((data) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("class", "scannerDots");
    el.setAttribute("r", "4");
    el.setAttribute("cx", centerX);
    el.setAttribute("cy", centerY);
    el.dataset.name = data.name;
    dotsSvg.appendChild(el);

    return {
      name: data.name,
      x: data.position[0],
      y: data.position[1],
      z: data.position[2],
      el,
    };
  });
}

export function updateRadarPlanets(camera) {
  if (!planetEntries.length) return;

  camera.getWorldDirection(_forward);
  _forward.y = 0;
  _forward.normalize();

  _right.set(-_forward.z, 0, _forward.x);

  planetEntries.forEach((p) => {
    _toPlanet.set(p.x - camera.position.x, 0, p.z - camera.position.z);
    const distance = _toPlanet.length();
    _toPlanet.normalize();

    const forwardDot = _toPlanet.dot(_forward);
    const rightDot = _toPlanet.dot(_right);
    const bearingDeg = Math.atan2(rightDot, forwardDot) * (180 / Math.PI);
    const angle = (270 + bearingDeg + 360) % 360;
    const rad = angle * (Math.PI / 180);

    const t = THREE.MathUtils.clamp(
      (distance - DIST_NEAR) / (DIST_FAR - DIST_NEAR),
      0,
      1,
    );
    const r = RADAR_MIN_R + t * (RADAR_MAX_R - RADAR_MIN_R);

    p.el.setAttribute("cx", centerX + r * Math.cos(rad));
    p.el.setAttribute("cy", centerY + r * Math.sin(rad));
    p.el.dataset.angle = (angle + SWEEP_OFFSET) % 360;
  });
}

function animate() {
  rotationAngle = (rotationAngle + 1) % 360;
  sweep.style.transform = `rotate(${rotationAngle}deg)`;

  planetEntries.forEach((p) => {
    const dotAngle = Number(p.el.dataset.angle ?? 0);
    let diff = Math.abs(rotationAngle - dotAngle);
    diff = Math.min(diff, 360 - diff);

    if (diff < glowSpread) {
      p.el.style.transitionDuration = "0.3s";
      p.el.setAttribute("opacity", "1");
    } else {
      p.el.style.transitionDuration = "1s";
      p.el.setAttribute("opacity", "0");
    }
  });

  requestAnimationFrame(animate);
}
animate();
