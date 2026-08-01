import * as THREE from "three"; // importing three js
import { createStars } from "../world/stars.js";
import { createPlanet } from "../world/planets.js";
import {
  setupInteractions,
  registerPlanet,
  updateInteractions,
  focusPlanet,
  lookAtPlanet,
  lookAtOrigin,
  isFocusing,
} from "./interactions.js";
import { initHUD } from "../Detector/Detector.js";
import { applyTheme } from "../Theme/themeManager.js";
import { createNebulas, updateNebulas } from "../world/nebulas.js";
import { initRadarPlanets, updateRadarPlanets } from "../scanner/scanner.js";
import { initInfoPanel } from "../TAb_UI/logic/infoPanel.js"; 
// import { initRobot } from "../Robot/robo.js";
import { initRobo } from "../robo/robo.js";

initHUD();// basically call this function to prepare for the detector so that it doesnt get added everytime rather just appear or dissappear 
initInfoPanel();// same thing but with infopanel
const scene = new THREE.Scene(); // creating a scene with three js 

// creating stars
const smallStars = createStars(scene, 10000, 0.7, 1.3, 0xffffff); 
const mediumStars = createStars(scene, 1000, 2, 3, 0xddeeff);
const bright1 = createStars(scene, 50, 6, 8, 0xffffff);
const bright2 = createStars(scene, 50, 6, 8, 0xddeeff);
const bright3 = createStars(scene, 50, 6, 8, 0xbbddff);

const ambient = new THREE.AmbientLight(0xffffff, 0.5); // creating ambience in the scene (incorporated in three js )(ambient light lights everything equally )
scene.add(ambient);// adding the abience into the scene

createNebulas(scene);// creating nebulas 

const sun = new THREE.DirectionalLight(0xffffff, 5); // creating the sun
sun.position.set(10, 10, 10);// seting position for the sun 
scene.add(sun);// adding the sun in the scene 

const camera = new THREE.PerspectiveCamera(75 , window.innerWidth / window.innerHeight , 0.1 , 100000 ,); // creating the camera for our scene the parameters are as follows FOV ,aspect ratio, near plane , far plane
camera.position.set(0, 0, 0);// setting the position of the camera

const renderer = new THREE.WebGLRenderer({ antialias: true }); // renderer converts the scene into pixels kindof so that the browser can display them without antialias the edges looks jagged lol dont know what that means 
renderer.setPixelRatio(1);// forcing to render at normal resolution for better performance 
renderer.setSize(window.innerWidth, window.innerHeight);// setting the canvas size 
document.body.appendChild(renderer.domElement); // inserts the renderer into the webpage basically adds a canvas tag in the body in which then different elements all come in :)

//resize everything otherwise camera can stretch when the browser changes size 
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;//changeing the aspect ratio for everyscreen size 
  camera.updateProjectionMatrix();// updating the camera 
  renderer.setSize(window.innerWidth, window.innerHeight);// updating canvas size 
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));// just clamping the pixelRatio for better performance 
});

//plant data
const planetData = [
  {
    name: "origin",
    title: "ORIGIN",
    about: "Who Am I?",
    model: "./assets/3dPlanets/planet1.glb",
    size: 6,
    position: [-18, 5, -45],
  },
  {
    name: "about",
    title: "ABOUT",
    about: "",
    model: "./assets/3dPlanets/planet2.glb",
    size: 6,
    position: [40, 40, -100],
  },
  {
    name: "projects",
    title: "PROJECTS",
    about: "",
    model: "./assets/3dPlanets/planet3.glb",
    size: 10,
    position: [100, -20, 80],
  },
  // {
  //   name: "skills",
  //   model: "./assets/3dPlanets/planet4.glb",
  //   size: 5.5,
  //   position: [18, -15, -60],
  // },
  // {
  //   name: "contact",
  //   model: "./assets/3dPlanets/planet5.glb",
  //   size: 4.5,
  //   position: [35, 12, -95],
  // },
];

initRadarPlanets(planetData); // same thing as inithud 

const planets = [];//an array to store all the planets


// adding the planets in the scene 
planetData.forEach((data) => {
  createPlanet(scene, data.model, data.size, ...data.position, (planet) => {
    Object.assign(planet.userData, data);
    planets.push(planet);// adding the plaents in the array 
    registerPlanet(planet);// registering the planets to use in interaction.js etc 
  });
});

//just some simple variables 
let angle = 0;

let rotateLeft = false;
let rotateRight = false;
const rotationSpeed = 0.02;


// rotating the screen logic basically when I am pressing the key make the significant variable true then on removeing the press make it false to stop 
document.addEventListener("keydown", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") rotateLeft = true;
  if (e.key === "d" || e.key === "ArrowRight") rotateRight = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") rotateLeft = false;
  if (e.key === "d" || e.key === "ArrowRight") rotateRight = false;
});


//when navigate is called we listen here then call the function look at planet in interaction.js (connection) :)
window.addEventListener("navigate", (e) => {
 lookAtPlanet(camera, e.detail);
;
});


// same concept here 
window.addEventListener("navigate-origin", () => {
  lookAtOrigin(camera);
});

let frames = 0; // just for testing purposes 
let last = performance.now();// testing purposes

//animate function basically does most of the work 
function animate() {
  //checking which things gives a toll on the site 
  frames++;
  const now = performance.now();
  if (now - last >= 1000) {
    console.log("FPS:", frames);
    frames = 0;
    last = now;
  }
  const time = performance.now() * 0.001;
  
  const t1 = performance.now();//calculating time before doign anything  
  updateInteractions(camera);// calling the update interations main thing for the all travel and stuff in interactions.js
  const t2 = performance.now();// calculating after updateinteractions then we do the math if it takes time then this is causing problem 
  updateNebulas(time, camera);// help in loading and stuff of the nebulas in nebula.js
  const t3 = performance.now();// calculating time after adding the nebulas if this takes time this is the culprit 
  renderer.render(scene, camera);// rendering the whole scene with everything in it
  const t4 = performance.now();//after the final render is this causing problems :<>
  
  // this is how the calculations works :()
  if (Math.random() < 0.01) {
    console.log({
      interactions: (t2 - t1).toFixed(2),
      nebulas: (t3 - t2).toFixed(2),
      render: (t4 - t3).toFixed(2),
    });
  }

  //adding a little rotation and varying opacity to different stars 
  smallStars.rotation.y += 0.00001;
  mediumStars.rotation.y += 0.000015;
  bright1.rotation.y += 0.000025;
  bright2.rotation.y += 0.000018;
  bright3.rotation.y += 0.000032;
  bright1.material.opacity = 0.8 + Math.sin(time * 1.3) * 0.2;
  bright2.material.opacity = 0.8 + Math.sin(time * 0.9 + 3) * 0.2;
  bright3.material.opacity = 0.8 + Math.sin(time * 1.8 + 7) * 0.2;

  //this function is for finding the planets in the radar this function call 60 frames per second so it happens at all the time 
  updateRadarPlanets(camera);

  // make this function an animation 
  requestAnimationFrame(animate);

  // Manual rotation is skipped while an auto-focus turn is in progress,so the two don't fight each other frame-to-frame.
  if (!isFocusing()) {
    if (rotateLeft) camera.rotateY(rotationSpeed);
    if (rotateRight) camera.rotateY(-rotationSpeed);
  }

  // adds a little rotation to all the planets next step -> make it so that different planets rotate with different speeds 
  planets.forEach((planet) => {
    planet.rotation.y += 0.001;
  });
}


animate();//calling the animate function atleast once before it calls for the animation frame 


setupInteractions(camera, scene);//kind of the same idea with inithud but this is for the raycaster and mouse clicks and hover


//not sure why i did it again will ask chatgpt maybe i copy pasted it above and forgot about it lol
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    window.innerWidth,
    window.innerHeight,
  );
});


//simpe opening of theme panel 
const panel = document.getElementById("themePanel");
// if theme button is clicked adds a class to it which has opacity 1 otherwise it removes it without that class it has opacity 0 lol :)
themeBtn.addEventListener("click", () => {
  panel.classList.toggle("open");
});
//changing of themes 
document.querySelectorAll(".themeCard").forEach((card) => {
  //if the card is selected the dataset is set to that theme lol 
  card.addEventListener("click", () => {
    applyTheme(card.dataset.theme); // calls for apply theme in theme manager which is something like applyTheme(colorSet)
  });
});


//adds the robo code in 
initRobo()