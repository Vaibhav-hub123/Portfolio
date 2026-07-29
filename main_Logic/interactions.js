import * as THREE from "three";
import { showHUD, hideHUD, playHUDAnimation } from "../Detector/Detector.js";
import { openInfoPanel, hideInfoPanel } from "../TAb_UI/logic/infoPanel.js";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickMouse = new THREE.Vector2();
const clickableObjects = [];

let currentPlanet = null;

const STATE = {
  IDLE: "idle",
  ROTATING: "rotating",
  WAITING: "waiting",
  TRAVELLING: "travelling",
  FOCUSED: "focused",
  RETURNING: "returning",
};

let flightState = STATE.IDLE;
let activePlanet = null;
let pendingPlanetName = null;

const FOCUS_SLERP_SPEED = 0.06;
const FOCUS_DONE_THRESHOLD = 0.001;

const LOOK_PAUSE_TIME = 700; // milliseconds

const TRAVEL_SPEED = 1.3; // 0.02 slow, 0.05 medium, 0.08 fast
const TRAVEL_STOP_DISTANCE = 10; // distance from planet centre

// ---------- Return ----------
const RETURN_SPEED = 0.045;

// ---- Fixed origin (Option 1) ----
// The camera always starts at (0,0,0) with whatever rotation is set right
// after camera.position.set(0, 0, 0) runs in script.js. Since that never
// changes, we bake it in as constants instead of tracking/copying it every
// flight. No saveOrigin(), no returnPos/returnQuat copying needed anymore.
const ORIGIN_POSITION = new THREE.Vector3(0, 0, 0);
const ORIGIN_QUATERNION = new THREE.Quaternion();
let originInitialized = false;

let focusTarget = null; // THREE.Quaternion camera is slerping towards while ROTATING

const targetPos = new THREE.Vector3();
const lookMatrix = new THREE.Matrix4();

// ---- Navigator "look only" state (fully separate from the flightState
// machine above — never opens the info panel, never sets activePlanet) ----
let navLookTarget = null;
let navLooking = false;

const travelTarget = new THREE.Vector3();
const travelDirection = new THREE.Vector3();

let waitStart = 0;

export function registerPlanet(planet) {
  clickableObjects.push(planet);
  console.log(planet.userData.name);
}

export function setupInteractions(camera, scene) {
  // Capture the origin rotation once, right after the camera is placed at
  // (0,0,0) in script.js. This replaces saveOrigin().
  if (!originInitialized) {
    camera.position.copy(ORIGIN_POSITION);
    ORIGIN_QUATERNION.copy(camera.quaternion);
    originInitialized = true;
  }

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

function getPlanetByName(name) {
  return clickableObjects.find((planet) => planet.userData?.name === name);
}

function startRotateTo(camera, planet) {
  planet.getWorldPosition(targetPos);

  lookMatrix.lookAt(camera.position, targetPos, camera.up);
  focusTarget = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);

  flightState = STATE.ROTATING;
}

export function goToPlanet(camera, name) {
  const planet = getPlanetByName(name);
  if (!planet) return;

  // A real planet click always wins over a navigator "look" in progress.
  navLooking = false;

  if (activePlanet === planet && flightState !== STATE.IDLE) return;

  if (flightState === STATE.FOCUSED || flightState === STATE.ROTATING) {
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

export function lookAtOrigin(camera) {
  if (flightState !== STATE.IDLE) return;

  navLookTarget = ORIGIN_QUATERNION.clone();
  navLooking = true;
}

/** Close the panel (if open) and fly the camera back to the fixed origin. */
export function returnToOrigin(camera) {
  if (flightState === STATE.IDLE) return;
  hideInfoPanel();
  pendingPlanetName = null;
  startReturn();
}

export function focusPlanet(camera, name) {
  goToPlanet(camera, name);
}

/**
 * Navigator-only camera rotation. Turns the camera to face the planet's
 * direction — nothing else. No info panel, no HUD, no flightState changes.
 * Ignored while a real planet-click flight is in progress, so the two
 * systems can never fight over the camera.
 */
export function lookAtPlanet(camera, name) {
  if (flightState !== STATE.IDLE) return;

  const planet = getPlanetByName(name);
  if (!planet) return;

  planet.getWorldPosition(targetPos);
  lookMatrix.lookAt(camera.position, targetPos, camera.up);
  navLookTarget = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
  navLooking = true;
}

export function cancelFocus() {
  // Manual rotation is only allowed in IDLE, so nothing to cancel here.
}

export function isFocusing() {
  return flightState !== STATE.IDLE;
}

export function updateInteractions(camera) {
  // Navigator "look only" rotation — independent of the flightState
  // machine, only runs while nothing else owns the camera.
  if (navLooking && flightState === STATE.IDLE) {
    camera.quaternion.slerp(navLookTarget, FOCUS_SLERP_SPEED);
    if (camera.quaternion.angleTo(navLookTarget) < FOCUS_DONE_THRESHOLD) {
      camera.quaternion.copy(navLookTarget);
      navLooking = false;
    }
  }

  switch (flightState) {
    case STATE.ROTATING: {
      camera.quaternion.slerp(focusTarget, FOCUS_SLERP_SPEED);

      if (camera.quaternion.angleTo(focusTarget) < FOCUS_DONE_THRESHOLD) {
        camera.quaternion.copy(focusTarget);

        waitStart = performance.now();

        flightState = STATE.WAITING;
      }

      break;
    }
    case STATE.WAITING: {
      if (performance.now() - waitStart >= LOOK_PAUSE_TIME) {
        activePlanet.getWorldPosition(travelTarget);

        travelDirection
          .subVectors(travelTarget, camera.position)
          .normalize();

        flightState = STATE.TRAVELLING;
      }

      break;
    }
    case STATE.TRAVELLING: {
      activePlanet.getWorldPosition(travelTarget);

      const distance = camera.position.distanceTo(travelTarget);

      if (distance > TRAVEL_STOP_DISTANCE) {
        camera.position.addScaledVector(travelDirection, TRAVEL_SPEED);
      } else {
        flightState = STATE.FOCUSED;

        openInfoPanel(activePlanet.userData, () => returnToOrigin(camera));
      }

      break;
    }
    case STATE.RETURNING: {
      camera.position.lerp(ORIGIN_POSITION, RETURN_SPEED);
      camera.quaternion.slerp(ORIGIN_QUATERNION, FOCUS_SLERP_SPEED);

      const posDone =
        camera.position.distanceTo(ORIGIN_POSITION) < 0.02;
      const rotDone =
        camera.quaternion.angleTo(ORIGIN_QUATERNION) < FOCUS_DONE_THRESHOLD;

      if (posDone && rotDone) {
        camera.position.copy(ORIGIN_POSITION);
        camera.quaternion.copy(ORIGIN_QUATERNION);

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

function startReturn() {
  flightState = STATE.RETURNING;
  hideHUD();
  currentPlanet = null;
}