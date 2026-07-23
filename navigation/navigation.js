


const navItems = document.querySelectorAll(".navItem");
const navigatorButton = document.getElementById("navigatorButton");
const menu = document.querySelector(".menu");

const pulse = document.getElementById("energyPulse");
const pulsePath = document.getElementById("pulsePath");
const flowPulse = document.getElementById("flowPulse");
const maskPath = document.getElementById("beamMaskPath");

const pathLength = pulsePath.getTotalLength();
const maskLength = maskPath.getTotalLength();

const pulseStops = [320, 500, 690, pathLength];
const groupThresholds = [315, 620, 820];

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
let menuTimers = [];

maskPath.style.strokeDasharray = maskLength;
maskPath.style.strokeDashoffset = maskLength;

// ---------- Connector "draw-in" intro animation ----------
connectorPaths.forEach((path) => {
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
});

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    connectorPaths.forEach((path, index) => {
      path.style.transition = "stroke-dashoffset 350ms ease";
      setTimeout(() => {
        path.style.strokeDashoffset = 0;
      }, index * 250);
    });
  });
});

// ---------- Open / close ----------
navigatorButton.addEventListener("click", () => {
  if (!navigatorOpen) {
    window.dispatchEvent(new CustomEvent("navigatorButtonClicked"));
  }
  navigatorOpen ? closeNavigator() : openNavigator();
});

// Order must match the .navItem order in the HTML (HOME, ABOUT, PROJECTS, SKILLS)
const planetNames = ["home", "about", "projects", "skills"];

navItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    if (isRouting) return;
    navItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    playPulse(index);

    window.dispatchEvent(
      new CustomEvent("navigate", { detail: planetNames[index] }),
    );
  });
});

function openNavigator() {
  if (isRouting) return;

  navigatorOpen = true;
  startFlow();

  const activeIndex = [...navItems].findIndex((item) =>
    item.classList.contains("active"),
  );
  playPulse(activeIndex);
}

function closeNavigator() {
  navigatorOpen = false;
  retractBeam();

  menu.style.pointerEvents = "none";
  menuTimers.forEach(clearTimeout);
  menuTimers = [];

  navItems.forEach((item) => {
    item.style.opacity = 0;
    item.style.transform = "translateY(8px)";
  });
}

function playPulse(index) {
  if (index < 0) return;
  cancelAnimationFrame(pulseAnimationId);

  const targetDistance = pulseStops[index];
  if (Math.abs(targetDistance - currentDistance) < 2) {
    showMenu();
    return;
  }

  const direction = Math.sign(targetDistance - currentDistance);
  const menuTrigger = currentDistance + (targetDistance - currentDistance) * 0.75;

  menuStarted = false;
  isRouting = true;
  pulse.style.opacity = 1;
  maskPath.style.transition = "none";

  let progress = currentDistance;

  function animate() {
    const previousProgress = progress;
    progress += direction * 12;
    currentDistance = progress;

    updatePulsePosition(progress);
    maskPath.style.strokeDashoffset = maskLength - progress;
    updateGroupsForCrossing(previousProgress, progress, direction);

    const reached =
      (direction > 0 && progress >= targetDistance) ||
      (direction < 0 && progress <= targetDistance);

    if (!reached) {
      if (progress >= menuTrigger && !menuStarted) {
        menuStarted = true;
        showMenu();
      }
      pulseAnimationId = requestAnimationFrame(animate);
      return;
    }

    currentDistance = targetDistance;
    updatePulsePosition(targetDistance);
    maskPath.style.strokeDashoffset = maskLength - targetDistance;
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

    // If the dot just reached a threshold, pause movement, hide it, flash the
    // dash group, then resume a bit further ahead once the pause is over.
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
    void dash.offsetWidth; // force reflow so the reset is picked up
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

export function onPlanet(planetName, state) {
  if (state) {
    const index = planetNames.indexOf(planetName);
    if (index === -1) return;

    navItems.forEach((item, i) => item.classList.toggle("active", i === index));

    // Snap instantly — the camera already made the trip, no need to re-animate
    currentDistance = pulseStops[index];
    updatePulsePosition(currentDistance);
    maskPath.style.transition = "none";
    maskPath.style.strokeDashoffset = maskLength - currentDistance;
    pulse.style.opacity = 0;

    resetDashes();
    groupThresholds.forEach((threshold, i) => {
      if (currentDistance >= threshold) powerOnGroup(i);
    });
  } else {
    navItems.forEach((item) => item.classList.remove("active"));
    currentDistance = 0;
    pulse.style.opacity = 0;
    maskPath.style.transition = "none";
    maskPath.style.strokeDashoffset = maskLength;
    resetDashes();
  }
}