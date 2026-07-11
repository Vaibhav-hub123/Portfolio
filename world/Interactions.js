import * as THREE from "three";
import { showHUD, hideHUD, playHUDAnimation } from "./HUD.js";
import { openInfoPanel, hideInfoPanel } from "./infoPanel.js";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickMouse = new THREE.Vector2();

const clickableObjects = [];

let currentPlanet = null;

const STATE = {
  IDLE: "idle",
  ROTATING: "rotating",
  MOVING: "moving",
  FOCUSED: "focused",
  RETURNING: "returning",
};

let flightState = STATE.IDLE;
let activePlanet = null;
let pendingPlanetName = null;

const FOCUS_SLERP_SPEED = 0.06;
const FOCUS_DONE_THRESHOLD = 0.001;

const POS_LERP_SPEED = 0.045;
const POS_DONE_THRESHOLD = 0.02;

const APPROACH_MULTIPLIER = 0.9;
const APPROACH_MARGIN = 0.011;

const originPos = new THREE.Vector3();
const originQuat = new THREE.Quaternion();
let originSaved = false;

let focusTarget = null; // THREE.Quaternion camera is slerping towards while ROTATING
const moveTargetPos = new THREE.Vector3();

const targetPos = new THREE.Vector3();
const lookMatrix = new THREE.Matrix4();
const dirVec = new THREE.Vector3();

export function registerPlanet(planet) {
  clickableObjects.push(planet);
}

export function setupInteractions(camera, scene) {
  saveOrigin(camera);

  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener("click", (event) => {
    if (
      event.target.closest &&
      event.target.closest("#infoPanel, #themePanel, .top-bar, #navigatorHUD")
    ) {
      return;
    }

    clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(clickMouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);
    if (!intersects.length) return;

    let planet = intersects[0].object;
    while (planet.parent && !clickableObjects.includes(planet)) {
      planet = planet.parent;
    }

    goToPlanet(camera, planet.userData?.name);
  });
}

function saveOrigin(camera) {
  if (originSaved) return;
  originPos.copy(camera.position);
  originQuat.copy(camera.quaternion);
  originSaved = true;
}

function getPlanetByName(name) {
  return clickableObjects.find((planet) => planet.userData?.name === name);
}

function startRotateTo(camera, planet) {
  planet.getWorldPosition(targetPos);
  targetPos.y = camera.position.y;

  lookMatrix.lookAt(camera.position, targetPos, camera.up);
  focusTarget = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);

  flightState = STATE.ROTATING;
}

function startMoveTo(camera, planet) {
    const worldRadius =
        planet.userData.boundingSphere.radius;

    const stopDistance =
        worldRadius * APPROACH_MULTIPLIER +
        APPROACH_MARGIN;

    planet.getWorldPosition(targetPos);

    const forward = new THREE.Vector3(0,0,-1)
        .applyQuaternion(camera.quaternion)
        .normalize();

    moveTargetPos.copy(targetPos)
        .sub(forward.multiplyScalar(stopDistance));
      console.log("Camera:", camera.position);

  console.log("Planet:", targetPos);

  console.log("Move Target:", moveTargetPos);

    flightState = STATE.MOVING;
}

export function goToPlanet(camera, name) {
  const planet = getPlanetByName(name);
  if (!planet) return;

  if (activePlanet === planet && flightState !== STATE.IDLE) return;

  if (
    flightState === STATE.FOCUSED ||
    flightState === STATE.MOVING ||
    flightState === STATE.ROTATING
  ) {
    hideInfoPanel();
    pendingPlanetName = name;
    startReturn();
    return;
  }

  if (flightState === STATE.RETURNING) {
    pendingPlanetName = name;
    return;
  }

  activePlanet = planet;
  currentPlanet = null;
  hideHUD();
  startRotateTo(camera, planet);
}

/** Close the panel (if open) and fly the camera back to its saved origin. */
export function returnToOrigin(camera) {
  if (flightState === STATE.IDLE) return;
  hideInfoPanel();
  pendingPlanetName = null;
  startReturn();
}

// Kept for the nav-menu integration (navigation.js dispatches a "navigate" event).
export function focusPlanet(camera, name) {
  goToPlanet(camera, name);
}

export function cancelFocus() {
  // Manual rotation is only allowed in IDLE, so nothing to cancel here.
}

export function isFocusing() {
  return flightState !== STATE.IDLE;
}

export function updateInteractions(camera) {
  switch (flightState) {
    case STATE.ROTATING: {
      camera.quaternion.slerp(focusTarget, FOCUS_SLERP_SPEED);
      if (camera.quaternion.angleTo(focusTarget) < FOCUS_DONE_THRESHOLD) {
        camera.quaternion.copy(focusTarget);
        startMoveTo(camera, activePlanet);
      }
      break;
    }

    case STATE.MOVING: {
      const speed = 2.5;

      const distance = camera.position.distanceTo(moveTargetPos);

      if (distance > speed) {
        const direction = new THREE.Vector3()
          .subVectors(moveTargetPos, camera.position)
          .normalize();

        camera.position.addScaledVector(direction, speed);
      } else {
        camera.position.copy(moveTargetPos);

        flightState = STATE.FOCUSED;

        openInfoPanel(activePlanet.userData, () => returnToOrigin(camera));
      }

      break;
    }

    case STATE.RETURNING: {
      camera.position.lerp(originPos, POS_LERP_SPEED);
      camera.quaternion.slerp(originQuat, FOCUS_SLERP_SPEED);

      const posDone =
        camera.position.distanceTo(originPos) < POS_DONE_THRESHOLD;
      const rotDone =
        camera.quaternion.angleTo(originQuat) < FOCUS_DONE_THRESHOLD;

      if (posDone && rotDone) {
        camera.position.copy(originPos);
        camera.quaternion.copy(originQuat);
        activePlanet = null;

        if (pendingPlanetName) {
          const name = pendingPlanetName;
          pendingPlanetName = null;
          flightState = STATE.IDLE;
          goToPlanet(camera, name);
        } else {
          flightState = STATE.IDLE;
        }
      }
      break;
    }

    default:
      break;
  }

  // Hover HUD only while free-floating; suppressed mid-flight / while docked.
  if (flightState === STATE.IDLE) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length) {
      let planet = intersects[0].object;

      while (planet.parent && !clickableObjects.includes(planet)) {
        planet = planet.parent;
      }

      if (currentPlanet !== planet) {
        currentPlanet = planet;
        playHUDAnimation(planet);
      }
      showHUD(currentPlanet, camera);
    } else {
      currentPlanet = null;
      hideHUD();
    }
  }
}
