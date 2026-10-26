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
  if(currentDistance > 0){
    retractBeam();
    navItems.forEach(i => i.classList.remove("active"));
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
  const menuTrigger = currentDistance + (targetDistance - currentDistance) * 0.75; // calculates 75 percent of the journey

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

    updatePulsePosition(progress);// call this function continuously for that effect 
    maskPath.style.strokeDashoffset = maskLength - progress;// adds or subtract based on the direction the path needs to travel 
    updateGroupsForCrossing(previousProgress, progress, direction);//make the group of strokes brighten for the effects 

    const reached = (direction > 0 && progress >= targetDistance) || (direction < 0 && progress <= targetDistance);// reached the destination :)

    //if not reached the destination 
    if (!reached) {
      pulseAnimationId = requestAnimationFrame(animate);//makes this into an animation frame and store that into a variable 
      return;
    }

    currentDistance = targetDistance; // update the current distance 
    updatePulsePosition(targetDistance);// update the postion of the pulse for real not just for the animation 
    maskPath.style.strokeDashoffset = maskLength - targetDistance;// final length till it will come 
    pulse.style.opacity = 0;
    isRouting = false;
    pulseAnimationId = null;
  }

  pulseAnimationId = requestAnimationFrame(animate);// start the animation here the first call 
}


//retracts the beam on closing the menu items or navigator
function retractBeam() {
  if (currentDistance <= 0) return; // safety check
  resetDashes();// reset the dashes so that they dont glow anymore 
  cancelAnimationFrame(pulseAnimationId);// cancel any animation if already happening 
  stopFlow();// finaly stop the flow 

  isRouting = true;
  pulse.style.opacity = 1;

  function animate() {
    currentDistance = Math.max(0, currentDistance - 12);
    flowPulse.style.opacity = currentDistance / pulseStops[pulseStops.length - 1];// fade effect a little 

    updatePulsePosition(currentDistance);
    maskPath.style.strokeDashoffset = maskLength - currentDistance;// add a little on the maskLength so that it hides away that much px's

    //if not fully retracted
    if (currentDistance > 0) {
      pulseAnimationId = requestAnimationFrame(animate); // call the animation function and store in a variable 
      return;
    }
    console.log("Finished retracting");

    pulse.style.opacity = 0;//dont show the pulse any more 
    maskPath.style.strokeDashoffset = maskLength;// make the line fully go out of the viewbox 
    isRouting = false;
    pulseAnimationId = null; //no more animating 
  }

  pulseAnimationId = requestAnimationFrame(animate);//call for the first frame
}


//just updates the position of the pulse to a certain distance 
function updatePulsePosition(distance) {
  const point = pulsePath.getPointAtLength(distance); //get the coordinate bascically in the form or x and y 
  pulse.setAttribute("cx", point.x);// make the x position of the pulse the x position of the point 
  pulse.setAttribute("cy", point.y);// make the y position of the pulse the y position of the point 
}


//this function makes the dashed glow up according to the distance the pulse is some thing like if the dashed are between the prev and next then glow that group of dashed 
function updateGroupsForCrossing(prev, next, direction) {
  groupThresholds.forEach((threshold, groupIndex) => {
    if (direction > 0 && prev < threshold && next >= threshold) {//if we have reached the threshold power up that group of pulse 
      energizeGroup(groupIndex);
      powerOnGroup(groupIndex);
    } else if (direction < 0 && prev > threshold && next <= threshold) { //if we are retracting turn them off 
      powerOffGroup(groupIndex);
    }
  });
}

//Menu reveal 
function showMenu() {
  menu.style.pointerEvents = "auto";
  menuTimers.forEach(clearTimeout);//remove any previous timeouts we do this so they appear one by one 
  menuTimers = [];

  navItems.forEach((item, index) => {
    const timer = setTimeout(() => {
      if (!navigatorOpen) return;
      item.style.opacity = "1";
      item.style.transform = "translateY(0)";
    }, index * 90);//a 90ms gap in between the nav items 

    menuTimers.push(timer);
  });
}

const GLOW_PAUSE_MS = 350;
const RESUME_JUMP = 40;
let flowPauseTimeout = null;


//the glowing flow that keeps on going in the loop 
function startFlow() {
  cancelAnimationFrame(flowAnimationId);// if any animation is already their cancel it (security check)
  clearTimeout(flowPauseTimeout);//
  flowPulse.style.opacity = "";// clear opacity left over from retracting the beam
  flowPulse.classList.remove("flow-hidden");//make the flow visible 

  let progress = 0;//so that it always return to the beginning
  let previousProgress = 0;

  //animating the loop 
  function loop() {
    //security check 
    if (!navigatorOpen) {
      stopFlow();
      return;
    }

    const safeProgress = Math.min(progress, currentDistance);//how much can we go before stopping or rather restarting 
    const point = pulsePath.getPointAtLength(safeProgress);//the current coordinate
    const nextPoint = pulsePath.getPointAtLength(Math.min(safeProgress + 1, currentDistance),); //get the distance a little bit more to it but not more that the currentDistance till the line actually is 

    const angle =(Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI;//I dont understand this mathss lol 

    flowPulse.setAttribute("transform",`translate(${point.x}, ${point.y}) rotate(${angle})`,); // we are setting transform to the points and the required angle 

    const crossedIndex = groupThresholds.findIndex((threshold) => previousProgress < threshold && safeProgress >= threshold,);// find which dashed group is in the way of the flow
    previousProgress = safeProgress;

    //if their exists a dashed group then glow them up 
    if (crossedIndex !== -1) {
      energizeGroup(crossedIndex);
      flowPulse.classList.add("flow-hidden");

      //glow  them one by one not all at once 
      flowPauseTimeout = setTimeout(() => {
        if (!navigatorOpen) return;
        flowPulse.classList.remove("flow-hidden");

        const resumed = progress + RESUME_JUMP;
        progress = resumed >= currentDistance ? 0 : resumed;
        previousProgress = progress;

        flowAnimationId = requestAnimationFrame(loop);//make it into animation 
      }, GLOW_PAUSE_MS);//only allow the glow to pass if the dashed group have all light up 
      return;
    }

    progress = progress + 5 >= currentDistance ? 0 : progress + 5;//if progress gets more than the line then sent it back to start that way repeating pattern appear 
    flowAnimationId = requestAnimationFrame(loop);//make it into animation whether there is a dashed group or not 
  }

  flowAnimationId = requestAnimationFrame(loop);//first animation call
}


//stop the flow 
function stopFlow() {
  cancelAnimationFrame(flowAnimationId);//security check 
  clearTimeout(flowPauseTimeout);//clear all timeouts 
  flowAnimationId = null;//make the animation null 
  flowPulse.classList.add("flow-hidden");//hide the flow
  flowPulse.setAttribute("transform", "translate(0,0)");//reset it back to 0,0
}


//energize one by one 
function energizeGroup(index) {
  const group = dashGroups[index];//get which dash group to glow based on the distance calculated 
  if (!group) return;//if invalid just stop 

  group.forEach((dash, i) => {
    dash.style.animation = "none";
    void dash.offsetWidth;
    setTimeout(() => {
      dash.style.animation = "dashEnergy .35s ease";
    }, i * 90);//90ms gap between each energization 
  });
}


//just makes them glow up 
function powerOnGroup(index) {
  dashGroups[index]?.forEach((dash) => dash.classList.add("active"));
}

//turns off the glow 
function powerOffGroup(index) {
  dashGroups[index]?.forEach((dash) => dash.classList.remove("active"));
}


//reset all of the dashes to their original state 
function resetDashes() {
  document.querySelectorAll(".dash").forEach((dash) => dash.classList.remove("active"));
}
