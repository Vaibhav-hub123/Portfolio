import * as THREE from "three";
import { showHUD, hideHUD, playHUDAnimation } from "../Detector/Detector.js";
import { openInfoPanel, hideInfoPanel } from "../TAb_UI/logic/infoPanel.js";


const raycaster = new THREE.Raycaster(); // A Raycaster shoots an invisible line from the camera into the world.


//Because hover updates continuously while clicking only needs the position once. thats why we need two mouse functions 
const mouse = new THREE.Vector2();// Stores current mouse position.
const clickMouse = new THREE.Vector2();// Stores mouse position only during a click.


const clickableObjects = [];// Every planet is pushed here.
let currentPlanet = null;// Stores the planet currently under the mouse.
const STATE = {
  IDLE: "idle",
  ROTATING: "rotating",
  WAITING: "waiting",
  TRAVELLING: "travelling",
  FOCUSED: "focused",
  RETURNING: "returning",
}; // manages the state flow of the camera 
let flightState = STATE.IDLE;// first state


let activePlanet = null;//The planet you're currently travelling to.
let pendingPlanetName = null;// travelling helper so that two planets cant be clicked at the same time 


const FOCUS_SLERP_SPEED = 0.06;// Rotation interpolation speed.
const FOCUS_DONE_THRESHOLD = 0.001;// When angle difference becomes tiny
const LOOK_PAUSE_TIME = 700; // pause time between travel
const TRAVEL_SPEED = 1.3; // Camera movement speed.
const TRAVEL_STOP_DISTANCE = 10; // distance at which the camera stops 
const RETURN_SPEED = 0.045;// How fast camera returns.


const ORIGIN_POSITION = new THREE.Vector3(0, 0, 0); // Creates a Vector3.(0,0,0)
const ORIGIN_QUATERNION = new THREE.Quaternion(); // stores camera rotation (A quaternion is a four-dimensional mathematical number system used to represent 3D rotations, written in the form (q = a + bi + cj + dk))

let originInitialized = false;// boolean value to check if origin is inisialised 
let focusTarget = null; 

const targetPos = new THREE.Vector3(); // Temporary vector.
const lookMatrix = new THREE.Matrix4(); // A Matrix4 stores transformations.x

let navLookTarget = null;
let navLooking = false;

const travelTarget = new THREE.Vector3(); // where to travel a temporary variable
const travelDirection = new THREE.Vector3();// distance between planet and camera (normalized)

let waitStart = 0;


// adds planets into clickableObjects array
export function registerPlanet(planet) {
  clickableObjects.push(planet);
}


//manges mouse click and hover 
export function setupInteractions(camera, scene) {
  // stores the origin if not already initialized
  if (!originInitialized) {
    camera.position.copy(ORIGIN_POSITION);
    ORIGIN_QUATERNION.copy(camera.quaternion);
    originInitialized = true;
  }

  // for hover 
  // three js divides the screen into basically -1 being left 0 
  // being middle and 1 being right side same can be said for top 
  // and bottom so we have to convert the mouse position into that number 
  // forr example if screen size is 1920 px and our mouse is at 960 px after converting it will be 0 .
  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  //for clicks
  window.addEventListener("click", (event) => {
    //basically stops the raycaster to go through things like infopanel themepanel so that if we click and there is a planet behind it does not travel there automatically 
    if (event.target.closest && event.target.closest("#infoPanel, #themePanel, .top-bar, #navigatorHUD")) {
      return;
    }

    // same way for finding the current mouse position 
    clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(clickMouse, camera); // cast a ray towards the mouse from the camera 
    const intersects = raycaster.intersectObjects(clickableObjects, true);// returns all the clickable objects in between that casted ray 
    if (!intersects.length) return; // if it doesnt hit anything just return dont need to travel anywhere lol
    let planet = intersects[0].object;// intersect is an array of one object 

    // store the planet if the planet contains many layers like sphere mesh or cloud mesh which are not actully registered but are still there
    while (planet.parent && !clickableObjects.includes(planet)) {
      planet = planet.parent;
    }

    goToPlanet(camera, planet.userData?.name);// go towards the planet from the camera 
  });
}


//uses built in function find to look in the array for planet 
function getPlanetByName(name) {
  return clickableObjects.find((planet) => planet.userData?.name === name);
}


// It calculates the exact orientation the camera needs to face the selected planet, stores that orientation in focusTarget, and tells the state machine that the next step is to begin rotating toward it.
function startRotateTo(camera, planet) {
  planet.getWorldPosition(targetPos);// gets the world postion of an object (built in function) store it into temp variable 

  lookMatrix.lookAt(camera.position, targetPos, camera.up);// creates an matrix so that it can create matamatical rotation towwards the planet (learn the math behind it)
  focusTarget = new THREE.Quaternion().setFromRotationMatrix(lookMatrix); // converting that matrix into quaternion 

  flightState = STATE.ROTATING;// tells the state machine to update state so like it tells it to start to rotate
}


//This keeps the camera behavior predictable and prevents conflicting movements. No matter when the user clicks, there's only ever one active camera sequence, and any new destination is either started immediately or queued until it's safe to begin.
export function goToPlanet(camera, name) {
  const planet = getPlanetByName(name); // gets the planet we need to travel to 
  if (!planet) return; // stops the function if not found any planets 

  navLooking = false;// stops the navigator bar looking for priority to travel then to look lol

  if (activePlanet === planet && flightState !== STATE.IDLE) return; // dont restart the movement if we click the same planet again 

  // if already on a planet close the things first then move towards different planet if clicked this is where pending planet is used 
  if (flightState === STATE.FOCUSED || flightState === STATE.ROTATING) {
    hideInfoPanel();
    pendingPlanetName = name;
    startReturn();
    return;
  } 

  // lets the camera to finish returning before travelling to another planet
  if (flightState === STATE.RETURNING) {
    pendingPlanetName = name;
    return;
  }

  activePlanet = planet; // the destination 
  currentPlanet = null; // detector helper to close it 
  hideHUD();// make the detector disappear
  startRotateTo(camera, planet);// begins the movement 
}


// makes the camera rotate back to as it was in during the navigator rotation 
export function lookAtOrigin(camera) {
  if (flightState !== STATE.IDLE) {
    returnToOrigin(camera);
    return;
  }// dont do anything if already travelling 
  navLookTarget = ORIGIN_QUATERNION.clone();  // clone because origin_quaternion is like a pointer so if we jsut write equal to it will just make them both point at the same thing 
  navLooking = true;
}


//Close the panel (if open) and fly the camera back to the fixed origin. 
export function returnToOrigin(camera) {
  if (flightState === STATE.IDLE) return; // dont do anything if already at origin 
  hideInfoPanel(); // hide the panel first 
  pendingPlanetName = null; // not going anywhere 
  startReturn(); // calls for start return
}


export function focusPlanet(camera, name) {
  goToPlanet(camera, name);
}


//only rotates the camera so it faces a planet.
export function lookAtPlanet(camera, name) {
  if (flightState !== STATE.IDLE) return;// if already traveling dont do anything

  const planet = getPlanetByName(name);
  if (!planet) return;

  planet.getWorldPosition(targetPos);
  targetPos.y = camera.position.y; // keep the camera level with the planet, don't look up or down
  lookMatrix.lookAt(camera.position, targetPos, camera.up);
  navLookTarget = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
  navLooking = true;
}
export function isNavLooking() {
  return navLooking;
}

//wrapper function currently not doing much but in the future has many uses 
export function isFocusing() {
  return flightState !== STATE.IDLE;
}


// runs every frame using the animation frame in script.js
export function updateInteractions(camera) {
  //if we click using the navigator and the ew are not travelling or at a planet then look in the direction of the planet 
  if (navLooking && flightState === STATE.IDLE) {
    camera.quaternion.slerp(navLookTarget, FOCUS_SLERP_SPEED);// slerp is a mathematical function used to smoothly transition between two points in this can two quaternion also in this case only the rotation aspect
    
    //if really small angle difference just make it the required angle lol maybe that angle can add up but for now leave it lmao 
    if (camera.quaternion.angleTo(navLookTarget) < FOCUS_DONE_THRESHOLD) {
      camera.quaternion.copy(navLookTarget);// navLookTarget stores the required value 
      navLooking = false;
    }
  }

  // state flow of the camera 
  switch (flightState) {

    // make the camera look towards the planet first 
    case STATE.ROTATING: {
      camera.quaternion.slerp(focusTarget, FOCUS_SLERP_SPEED);//smoothly rotates the quaternion

      //becomes tiny leave it
      if (camera.quaternion.angleTo(focusTarget) < FOCUS_DONE_THRESHOLD) {
        camera.quaternion.copy(focusTarget);//make focusTarget that angle 
        waitStart = performance.now();// calculates the amount of time that have passed till the website has started (is very precise and in ms)
        flightState = STATE.WAITING;//move towards next state
      }
      break;
    }

    //wait before moving towards the planet
    case STATE.WAITING: {
      // now we calculate it again ,and the previous wait start is subtracted from it which tell us how much time has passed from the previous time an as it runs everyframe it calculates time that way :)
      // if the time passed is more that the pause time currently 700 ms then start travelling 
      if (performance.now() - waitStart >= LOOK_PAUSE_TIME) {
        activePlanet.getWorldPosition(travelTarget); // gets the position of the planet we need to travel too
        travelDirection.subVectors(travelTarget, camera.position).normalize(); // subvectors give the distance and then after normalising it example (10,0,0) -> (1,0,0) so this is the direcction in which we need to travel 
        flightState = STATE.TRAVELLING;// change the state to travel
      }
      break;
    }

    //travel toward the planet 
    case STATE.TRAVELLING: {
      activePlanet.getWorldPosition(travelTarget);// get our destination planet 
      const distance = camera.position.distanceTo(travelTarget); //distance from the camera and planet 

      //if we are far from our distination add some value in that direction in the position of our camera 
      if (distance > TRAVEL_STOP_DISTANCE) {
        camera.position.addScaledVector(travelDirection, TRAVEL_SPEED); // pretty self explainatory
      } 
      //if we reach near the destination or close to it update the state to focus and open the infopanel
      else {
        flightState = STATE.FOCUSED; // update the state
        openInfoPanel(activePlanet.userData, () => returnToOrigin(camera));// opens infoPanel
      }
      break;
    }

    // return state
    case STATE.RETURNING: {
      camera.position.lerp(ORIGIN_POSITION, RETURN_SPEED); // smoothly go back to the original position 
      camera.quaternion.slerp(ORIGIN_QUATERNION, FOCUS_SLERP_SPEED); // smoothly rotate to the original angle 

      const posDone = camera.position.distanceTo(ORIGIN_POSITION) < 0.02; //calculate distance from origin 
      const rotDone = camera.quaternion.angleTo(ORIGIN_QUATERNION) < FOCUS_DONE_THRESHOLD;// calculate angle difference to the original angle 

      //if thhey are near the given values just get the camera to the original position and update the state
      if (posDone && rotDone) {
        camera.position.copy(ORIGIN_POSITION);// give the original position to the camera 
        camera.quaternion.copy(ORIGIN_QUATERNION);// give the original angle to the camera

        activePlanet = null;// not travelling to any planets now 

        //if we have to travel anywhere then call go to planet function for that planet and make the pending planet null 
        if (pendingPlanetName) {
          const name = pendingPlanetName;
          pendingPlanetName = null;
          flightState = STATE.IDLE;// update the state and restart for the that planel 
          goToPlanet(camera, name);
        }
        // if no pending pllanet just update the state   
        else {
          flightState = STATE.IDLE;
        }
      }
      break;
    }

    default:
      break;
  }

  //if we are idle not travelling to any planets and hovering over a planet play the detector animation or rather call the function for hud.js
  if (flightState === STATE.IDLE) {
    raycaster.setFromCamera(mouse, camera);// cast a ray from the camera towards the world 
    const intersects = raycaster.intersectObjects(clickableObjects, true);// check for any collision between the ray and any clickable objects to check if any planet is in the way 

    //if there is any planet present in the way 
    if (intersects.length) {
      let planet = intersects[0].object;//get which planet is it 

      //get towards the planet layer if made of multiple layers 
      while (planet.parent && !clickableObjects.includes(planet)) {
        planet = planet.parent;
      }

      //if its a new planet only then play the animation no need to repeat the animation for the planet 
      if (currentPlanet !== planet) {
        currentPlanet = planet;
        playHUDAnimation(planet);
      }
      showHUD(currentPlanet, camera);
    } 
    //if state is not idle hide the detector
    else {
      currentPlanet = null;
      hideHUD();
    }
  }
}


//updates the state for return when the infotab closes in the infotab.js
function startReturn() {
  flightState = STATE.RETURNING;
  hideHUD();
  currentPlanet = null;
}
