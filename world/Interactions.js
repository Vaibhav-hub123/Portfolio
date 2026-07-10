import * as THREE from "three";
import { initHUD, showHUD, hideHUD, playHUDAnimation } from "./HUD.js";
// import { playPlanetScanning ,stopPlanetScanning} from "../scanner/scanner.js";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const clickableObjects = [];

let currentPlanet = null;

let focusTarget = null; 
let focusedPlanet = null; 
const FOCUS_SLERP_SPEED = 0.06; 
const FOCUS_DONE_THRESHOLD = 0.001; 

const _focusHelper = new THREE.Object3D();

export function registerPlanet(planet) {
  clickableObjects.push(planet);
}

export function setupInteractions(camera, scene) {
  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });
}

function getPlanetByName(name) {
  return clickableObjects.find((planet) => planet.userData?.name === name);
}

const targetPos = new THREE.Vector3();
const lookMatrix = new THREE.Matrix4();

export function focusPlanet(camera, name) {
    const planet = getPlanetByName(name);
    if (!planet) return;

planet.getWorldPosition(targetPos);

targetPos.y = camera.position.y;

lookMatrix.lookAt(
    camera.position,
    targetPos,
    camera.up
);

    focusTarget = new THREE.Quaternion().setFromRotationMatrix(
        lookMatrix
    );

    focusedPlanet = planet;
}
export function cancelFocus() {
  focusTarget = null;
  focusedPlanet = null;
}

export function isFocusing() {
  return focusTarget !== null;
}

export function updateInteractions(camera) {
  if (focusTarget) {
    camera.quaternion.slerp(focusTarget, FOCUS_SLERP_SPEED);

    if (camera.quaternion.angleTo(focusTarget) < FOCUS_DONE_THRESHOLD) {
      camera.quaternion.copy(focusTarget);
      focusTarget = null;
    }
  }
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects, true);
  if (intersects.length) {
    let planet = intersects[0].object;

    while (planet.parent && !clickableObjects.includes(planet)) {
      planet = planet.parent;
    }

    if (currentPlanet !== planet) {
      currentPlanet = planet;
      // playPlanetScanning(planet);
      playHUDAnimation(planet);
    }
    showHUD(currentPlanet, camera);
  } else {
    currentPlanet = null;
    hideHUD();
    // stopPlanetScanning();
  }
}
// let newPlanet = null;
// export function isOverPlanet(camera){
//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects(clickableObjects, true);
//   if (intersects.length) {
//     let planet = intersects[0].object;

//     while (planet.parent && !clickableObjects.includes(planet)) {
//       planet = planet.parent;
//     }
//     if(newPlanet !== planet){
//       newPlanet = planet;
      
//     }
//   }
// }