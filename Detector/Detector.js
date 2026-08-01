import * as THREE from "three";

const hud = document.getElementById("planetHUD");
let animationTimeouts = [];
const worldPos = new THREE.Vector3();
const box = new THREE.Box3();
const size = new THREE.Vector3();
const connector = document.querySelector(".connector");
const label = document.querySelector(".planetLabel");
const sphere = new THREE.Sphere();
const sphereCache = new WeakMap();

function getLocalSphere(planet) {
  let data = sphereCache.get(planet);
  if (!data) {
    const localBox = new THREE.Box3();
    const tmpBox = new THREE.Box3();
    planet.traverse((child) => {
      if (child.isMesh) {
        child.geometry.computeBoundingBox();
        tmpBox.copy(child.geometry.boundingBox).applyMatrix4(child.matrix);
        localBox.union(tmpBox);
      }
    });
    const localSphere = new THREE.Sphere();
    localBox.getBoundingSphere(localSphere);
    data = { radius: localSphere.radius };
    sphereCache.set(planet, data);
  }
  return data;
}

const centerVec = new THREE.Vector3();


export function showHUD(planet, camera) {
  scanningText.style.display = "flex";
  // typeScanning();
  const { radius } = getLocalSphere(planet);

  planet.getWorldPosition(centerVec); 
  worldPos.copy(centerVec).project(camera);

  const x = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;
  hud.style.left = Math.round(x) + "px";
  hud.style.top = Math.round(y) + "px";

  const distance = camera.position.distanceTo(centerVec);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const pixelsPerUnit = window.innerHeight / (2 * Math.tan(fov / 2) * distance);
  const worldRadius = radius * planet.scale.x; // assumes uniform scale
  const hudSize = worldRadius * 2 * pixelsPerUnit * 2;
  hud.style.width = hudSize + "px";
  hud.style.height = hudSize + "px";
  hud.style.opacity = 1;

  const gap = 15;
  const labelOffset = hudSize * 0.3125 ;
  if (x < window.innerWidth / 2) {
    label.style.left = `calc(50% + ${labelOffset}px)`;
    label.style.right = "auto";
    label.classList.add("right");
    label.classList.remove("left");
    connector.style.transform = "scaleX(-1)";
  } else {
    label.style.right = `calc(50% + ${labelOffset}px)`;
    label.style.left = "auto";
    label.classList.add("left");
    label.classList.remove("right");
    connector.style.transform = "scaleX(1)";
  }
}

export function hideHUD() {
  hud.style.opacity = 0;
  label.style.opacity = 0;
  labelTitle.textContent = "";
  resetScanning();
}

const outerCircle = document.getElementById("outerCircle");
const innerCircle = document.getElementById("innerCircle");

const centerCircles = document.querySelectorAll(
  ".centerCircle,.centerCircleThin",
);

const segments = document.querySelectorAll(".segment");
const smallSegments = document.querySelectorAll(".smallSegment");

const outerRing = document.getElementById("outerRing");
const innerRing = document.getElementById("innerRing");
const segmentRing = document.getElementById("segmentRing");
const innerSegments = document.getElementById("innerSegments");
const centerRing = document.getElementById("centerRing");

function prepareStroke(element) {
  const len = element.getTotalLength();

  element.style.strokeDasharray = len;
  element.style.strokeDashoffset = len;
}

export function initHUD() {
  prepareStroke(outerCircle);
  prepareStroke(innerCircle);
  centerCircles.forEach(prepareStroke);
  segments.forEach(prepareStroke);
  smallSegments.forEach(prepareStroke);
  resetScanning();
}

function draw(element, duration) {
  const len = element.getTotalLength();

  element.style.opacity = "1";

  let start = null;

  function animate(time) {
    if (!start) start = time;

    let progress = (time - start) / duration;

    if (progress > 1) progress = 1;

    element.style.strokeDashoffset = len * (1 - progress);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function resetHUD() {
  const all = [
    outerCircle,
    innerCircle,
    ...centerCircles,
    ...segments,
    ...smallSegments,
  ];

  all.forEach((el) => {
    const len = el.getTotalLength();

    el.style.opacity = "0";
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
  });

  outerRing.classList.remove("rotateCW");
  innerRing.classList.remove("rotateCCW");
  segmentRing.classList.remove("rotateCW");
  innerSegments.classList.remove("rotateCCW");
  centerRing.classList.remove("rotateCW");
}

export function playHUDAnimation(planet) {
  animationTimeouts.forEach(clearTimeout);
  animationTimeouts = [];
  const connectorPaths = document.querySelectorAll(
    ".connectorPath, .connectorGlow",
  );

  connectorPaths.forEach((path) => {
    const len = path.getTotalLength();

    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
  });
  label.style.opacity = "0";
  resetHUD();
  resetScanning();
  scanningText.style.display = "flex";
  typeScanning();
  resetHUD();

  animationTimeouts.push(
    setTimeout(() => {
      draw(outerCircle, 500);
    }, 100),
  );

  animationTimeouts.push(
    setTimeout(() => {
      draw(innerCircle, 900);
    }, 500),
  );

  animationTimeouts.push(
    setTimeout(() => {
      centerCircles.forEach((c, i) => {
        animationTimeouts.push(
          setTimeout(() => {
            draw(c, 700);
          }, i * 150),
        );
      });
    }, 900),
  );

  animationTimeouts.push(
    setTimeout(() => {
      segments.forEach((seg, i) => {
        animationTimeouts.push(
          setTimeout(() => {
            draw(seg, 350);
          }, i * 100),
        );
      });
    }, 1300),
  );

  animationTimeouts.push(
    setTimeout(() => {
      smallSegments.forEach((seg, i) => {
        animationTimeouts.push(
          setTimeout(() => {
            draw(seg, 250);
          }, i * 70),
        );
      });
    }, 1700),
  );

  animationTimeouts.push(
    setTimeout(() => {
      outerRing.classList.add("rotateCW");
      innerRing.classList.add("rotateCCW");
      segmentRing.classList.add("rotateCW");
      innerSegments.classList.add("rotateCCW");
      centerRing.classList.add("rotateCW");
    }, 2200),
  );

  animationTimeouts.push(
    setTimeout(() => {
      label.style.opacity = "1";
      connectorPaths.forEach((path) => {
        const len = path.getTotalLength();

        path.animate(
          [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],

          {
            duration: 600,
            easing: "ease-out",
            fill: "forwards",
          },
        );
      });
    }, 2250),
  );
  animationTimeouts.push(
    setTimeout(() => {
      typeWriter(planet.userData.title);
    }, 3000),
  );
  animationTimeouts.push(
    setTimeout(() => {
      loaderEl.style.display = "none";
      entityNameEl.textContent = `Entity : ${
        planet.userData?.title ?? planet.userData?.name ?? "Unknown"
      }`;
      messageEl.textContent = `> Who Am I?`;
      foundEl.classList.add("visible");
    }, 2900),
  );

}
const labelTitle = document.querySelector(".labelTitle");

function typeWriter(text, speed = 70) {
  let i = 0;

  const timer = setInterval(() => {
    labelTitle.textContent = text.substring(0, i) + "_";

    i++;

    if (i > text.length) {
      labelTitle.textContent = text;

      clearInterval(timer);
    }
  }, speed);
}

const scanningText = document.querySelector(".scanningText");
const loaderEl = scanningText.querySelector(".loader");
const foundEl = scanningText.querySelector(".found");
const entityNameEl = scanningText.querySelector(".entityName");
const messageEl = scanningText.querySelector(".message");

function resetScanning() {
  clearTimeout(scanningText._foundTimeout);
  scanningText.style.display = "none";
  foundEl.classList.remove("visible");
  loaderText.textContent = "";
  loaderDots.style.display = "none";
  loaderDots.classList.remove("animate");

  loaderEl.style.display = "";
}

const loaderText = loaderEl.querySelector(".scanText");
const loaderDots = loaderEl.querySelector(".dots");
let scanTimer = null;
function typeScanning(speed = 80) {
  
  clearInterval(scanTimer);
  loaderText.textContent = "";
  loaderDots.style.display = "none";
  loaderDots.classList.remove("animate");

  const text = "Scanning";
  let i = 0;

  scanTimer = setInterval(() => {
    loaderText.textContent = text.substring(0, i + 1);
    i++;
    if (i >= text.length) {
      clearInterval(scanTimer);
      loaderDots.style.display = "inline-block";
      loaderDots.classList.add("animate");
    }
  }, speed);
}