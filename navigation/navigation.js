const navItems = document.querySelectorAll(".navItem");
const navigatorButton = document.getElementById("navigatorButton");
const menu = document.querySelector(".menu");

const planetNames = ["origin", "about", "projects", "skills"]; // for displaying the buttons and then numbering them for easier use 

const pulse = document.getElementById("energyPulse");
const pulsePath = document.getElementById("pulsePath");
const flowPulse = document.getElementById("flowPulse");
const maskPath = document.getElementById("beamMaskPath");

const pathLength = pulsePath.getTotalLength(); // gets the total length of the pulsepath
const maskLength = maskPath.getTotalLength(); // its basically the same but without the breaks in between 

const pulseStops = [320, 500, 690, pathLength]; // destinations for the pulse basically location of where our origin about projects etc are located
const groupThresholds = [315, 620, 820];//location of each deccorative lines 

let isRetracted = false;

const dashGroups = [
  document.querySelectorAll("#decorGroup1 .dash"),
  document.querySelectorAll("#decorGroup2 .dash"),
  document.querySelectorAll("#decorGroup3 .dash"),
];

const connectorPaths = [
  document.getElementById("connectorPath1"),
  document.getElementById("connectorPath2"),
  document.getElementById("connectorPath3"),
  document.getElementById("connectorPath4"),
];

let navigatorOpen = false;
let isRouting = false;
let menuStarted = false;
let currentDistance = 0;

let pulseAnimationId = null;
let flowAnimationId = null;
let menuTimers = []; // how much time each item will take to open 

maskPath.style.strokeDasharray = maskLength; // dash length is the pathLength
maskPath.style.strokeDashoffset = maskLength;// move the dash completely off so nothing is visible at first 


//Connector intro animation 
connectorPaths.forEach((path) => {
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;// imagine the path length 100 px and strokeDashArray = 10 then it will create a dash effect with every 10 px being empty so now if we make it equal to the length the stroke will be drawn all at once 
  path.style.strokeDashoffset = length;// it moves the dash by a certain px now if the value is equal to the length the whole thing hass moved so it seems invisible
});


//makes the dashes appear one by one as they are in 4 parts basically revealing them one by one using a loop
//refresh the screen 60 times per second so when dashoffset is decresed it gives the effect of the line being drawn 
requestAnimationFrame(() => {
  //two because sometimes browser doesnt understand the values changing that much so two guarentees the animation 
  requestAnimationFrame(() => {
    connectorPaths.forEach((path, index) => {
      path.style.transition = "stroke-dashoffset 350ms ease";
      setTimeout(() => {
        path.style.strokeDashoffset = 0;
      }, index * 250);
    });
  });
});


// Open / close
navigatorButton.addEventListener("click", () => {
  if (isRouting) return;// if the beam is travelling or any other acttion is taking place return 
  navigatorOpen ? closeNavigator() : openNavigator();// if the navigator is already open close it and vice versa 
});


// what happens when navItems buttons are clicked 
navItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    if (isRouting) return;//if the beam is travelling or any other acttion is taking place return 

    const alreadyActive = item.classList.contains("active");//if the button is already pressed 
    if (alreadyActive) {
      item.classList.remove("active");//turn it off
      retractBeam();//retract the beam 
      isRetracted = true;//tell that it is retracted
      window.dispatchEvent(new CustomEvent("navigate-origin"));// call this function in script.js so that camera returns bacck to the origin 
      return;
    }

    //if not active 
    navItems.forEach(i => i.classList.remove("active"));//remove active from anything which is active 
    item.classList.add("active");//add active to this item 
    startFlow();// Start the background flow only after a destination is selected

    currentDistance = 0;
    playPulse(index);//animate the beam to the specific index or item 

    //call this function again in script.js to look towards the planet 
    window.dispatchEvent(
      new CustomEvent("navigate", {
        detail: planetNames[index],
      })
    );
  });
});


//opening the navigator menu basically 
function openNavigator() {
  if (isRouting) return;//  if the beam is travelling or any other acttion is taking place return 

  navigatorOpen = true; // tell it that navigator is opened so if clicked again it can close 
  isRetracted = false; //initialize it as at first their is no need for retraction as their is no beam  

  currentDistance = 0;// Keep the beam hidden when opening.
  maskPath.style.strokeDashoffset = maskLength;// hide the beam 
  pulse.style.opacity = 0;// hide the pulse 

  resetDashes();// Reset the dash indicators
  showMenu();// Simply reveal the menu
}


//closing the navigor
function closeNavigator() {
  navigatorOpen = false;//tell it that the navigator is closed so if it is cllicked again navigator can open 
  if(!isRetracted){// if the beam is their but we didnt click the the menu button so it didnt retract the beam so just do it here 
    retractBeam();
  }
  
  menu.style.pointerEvents = "none";// make the menu not able to click 
  menuTimers.forEach(clearTimeout);// clear the timeout 
  menuTimers = []; // clear the array 

  //we dont remove the active from here so that when menu restarts the pulse will tarvel to where it was previously
  navItems.forEach((item) => {
    item.style.opacity = 0;
    item.style.transform = "translateY(8px)";
  });

  window.dispatchEvent(new CustomEvent("navigate-origin"));//call this function so that camera travels towands the origin
}


//the main logic for the pulse animation 
function playPulse(index) {
  if (index < 0) return; // if the index is invalid dont do anything 
  cancelAnimationFrame(pulseAnimationId);//cancelling any animation before anything happens again for safety purposes 

  const targetDistance = pulseStops[index];// get the distance from the array 

  //baiscally here for multiple clicks on the navigator and menu buttons etc 
  if (Math.abs(targetDistance - currentDistance) < 2) { 
    showMenu();
    return;
  }

  const direction = Math.sign(targetDistance - currentDistance); // which direction do the pulse need to travel only forward and backwards (positive or negative )
  const menuTrigger = currentDistance + (targetDistance - currentDistance) * 0.75; 

  menuStarted = false;
  isRouting = true;
  pulse.style.opacity = 1;
  maskPath.style.transition = "none";

  let progress = currentDistance;

  //this is the animation function which runs 60 frames per second actually this depends on the moniter if its a 144hz it will run more frames per second 
  function animate() {
    const previousProgress = progress; //save this for the decorations in between the lines the three vertical lines
    progress += direction * 12;//ig 12 is the medium speed can and will tweak this more lol 
    currentDistance = progress; //we just do this many frames persecond to look like an animation lol 

    updatePulsePosition(progress);// call this function continuasly for that effect 
    maskPath.style.strokeDashoffset = maskLength - progress;// adds or subtract based on the direction the path needs to travel 
    updateGroupsForCrossing(previousProgress, progress, direction);//make the group of strokes brighten for the effects 

    const reached =(direction > 0 && progress >= targetDistance) || (direction < 0 && progress <= targetDistance);// reached the destination :)

    //if not reached the destination 
    if (!reached) {
      //for better workflow
      if (progress >= menuTrigger && !menuStarted) {
        menuStarted = true;
        showMenu();
      }
      pulseAnimationId = requestAnimationFrame(animate);//makes this into an animation frame and store that into a variable 
      return;
    }

    currentDistance = targetDistance; // update the current distance 
    updatePulsePosition(targetDistance);// update the postion of the pulse for real not just for the animation 
    maskPath.style.strokeDashoffset = maskLength - targetDistance;// final length till it will come 
    pulse.style.opacity = 0;
    isRouting = false;
    pulseAnimationId = null;

    if (!menuStarted) {
      menuStarted = true;
      showMenu();
    }
  }

  pulseAnimationId = requestAnimationFrame(animate);
}

function retractBeam() {
  resetDashes();
  cancelAnimationFrame(pulseAnimationId);
  stopFlow();

  isRouting = true;
  pulse.style.opacity = 1;

  function animate() {
    currentDistance = Math.max(0, currentDistance - 12);
    flowPulse.style.opacity = currentDistance / pulseStops[pulseStops.length - 1];

    updatePulsePosition(currentDistance);
    maskPath.style.strokeDashoffset = maskLength - currentDistance;

    if (currentDistance > 0) {
      pulseAnimationId = requestAnimationFrame(animate);
      return;
    }
    console.log("Finished retracting");

    pulse.style.opacity = 0;
    maskPath.style.strokeDashoffset = maskLength;
    isRouting = false;
    pulseAnimationId = null;
  }

  pulseAnimationId = requestAnimationFrame(animate);
}

function updatePulsePosition(distance) {
  const point = pulsePath.getPointAtLength(distance);
  pulse.setAttribute("cx", point.x);
  pulse.setAttribute("cy", point.y);
}

function updateGroupsForCrossing(prev, next, direction) {
  groupThresholds.forEach((threshold, groupIndex) => {
    if (direction > 0 && prev < threshold && next >= threshold) {
      energizeGroup(groupIndex);
      powerOnGroup(groupIndex);
    } else if (direction < 0 && prev > threshold && next <= threshold) {
      powerOffGroup(groupIndex);
    }
  });
}

// ---------- Menu reveal ----------
function showMenu() {
  menu.style.pointerEvents = "auto";
  menuTimers.forEach(clearTimeout);
  menuTimers = [];

  navItems.forEach((item, index) => {
    const timer = setTimeout(() => {
      if (!navigatorOpen) return;
      item.style.opacity = "1";
      item.style.transform = "translateY(0)";
    }, index * 90);

    menuTimers.push(timer);
  });
}

const GLOW_PAUSE_MS = 350;
const RESUME_JUMP = 40;
let flowPauseTimeout = null;

function startFlow() {
  cancelAnimationFrame(flowAnimationId);
  clearTimeout(flowPauseTimeout);
  flowPulse.classList.remove("flow-hidden");

  let progress = 0;
  let previousProgress = 0;

  function loop() {
    if (!navigatorOpen) {
      stopFlow();
      return;
    }

    const safeProgress = Math.min(progress, currentDistance);
    const point = pulsePath.getPointAtLength(safeProgress);
    const nextPoint = pulsePath.getPointAtLength(
      Math.min(safeProgress + 1, currentDistance),
    );

    const angle =
      (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI;

    flowPulse.setAttribute(
      "transform",
      `translate(${point.x}, ${point.y}) rotate(${angle})`,
    );

    const crossedIndex = groupThresholds.findIndex(
      (threshold) => previousProgress < threshold && safeProgress >= threshold,
    );
    previousProgress = safeProgress;

    if (crossedIndex !== -1) {
      energizeGroup(crossedIndex);
      flowPulse.classList.add("flow-hidden");

      flowPauseTimeout = setTimeout(() => {
        if (!navigatorOpen) return;
        flowPulse.classList.remove("flow-hidden");

        const resumed = progress + RESUME_JUMP;
        progress = resumed >= currentDistance ? 0 : resumed;
        previousProgress = progress;

        flowAnimationId = requestAnimationFrame(loop);
      }, GLOW_PAUSE_MS);
      return;
    }

    progress = progress + 5 >= currentDistance ? 0 : progress + 5;
    flowAnimationId = requestAnimationFrame(loop);
  }

  flowAnimationId = requestAnimationFrame(loop);
}

function stopFlow() {
  cancelAnimationFrame(flowAnimationId);
  clearTimeout(flowPauseTimeout);
  flowAnimationId = null;
  flowPulse.classList.add("flow-hidden");
  flowPulse.setAttribute("transform", "translate(0,0)");
}

function energizeGroup(index) {
  const group = dashGroups[index];
  if (!group) return;

  group.forEach((dash, i) => {
    dash.style.animation = "none";
    void dash.offsetWidth;
    setTimeout(() => {
      dash.style.animation = "dashEnergy .35s ease";
    }, i * 90);
  });
}

function powerOnGroup(index) {
  dashGroups[index]?.forEach((dash) => dash.classList.add("active"));
}

function powerOffGroup(index) {
  dashGroups[index]?.forEach((dash) => dash.classList.remove("active"));
}

function resetDashes() {
  document.querySelectorAll(".dash").forEach((dash) => dash.classList.remove("active"));
}