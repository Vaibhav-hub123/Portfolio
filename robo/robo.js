let currentExpression = "neutral";
let blinking = false;
let renderVersion = 0;
let expressionTimer = null;
let idleTimer = null;

const expressions = new Set([
  "neutral",
  "happy",
  "sad",
  "shocked",
  "sleepy",
  "curious",
  "thinking",
  "confused",
]);

async function renderExpression(name) {
  const version = ++renderVersion;
  const container = document.getElementById("robotAssistant");
  if (!container) return;

  try {
    const response = await fetch(`assets/robo/${name}.svg`);
    if (!response.ok) throw new Error(`Could not load robo expression: ${name}`);

    let svg = await response.text();
    svg = svg.replace(/<\?xml[^>]*\?>/, "");
    if (version !== renderVersion) return;

    container.style.opacity = "0";
    await new Promise(requestAnimationFrame);
    if (version !== renderVersion) return;

    container.innerHTML = svg;
    requestAnimationFrame(() => {
      if (version === renderVersion) container.style.opacity = "1";
    });
  } catch (error) {
    console.error(error);
  }
}

export function setRoboExpression(name, { resetAfter = 0, resetTo = "neutral" } = {}) {
  if (!expressions.has(name)) return;

  clearTimeout(expressionTimer);
  currentExpression = name;
  renderExpression(name);

  if (resetAfter > 0) {
    expressionTimer = setTimeout(() => {
      if (currentExpression === name) setRoboExpression(resetTo);
    }, resetAfter);
  }
}

async function blink() {
  if (blinking) return;
  blinking = true;
  const expression = currentExpression;

  try {
    await renderExpression(`${expression}Blink`);
    await new Promise((resolve) => setTimeout(resolve, 110));
    if (expression === currentExpression) await renderExpression(expression);
  } finally {
    blinking = false;
  }
}

function scheduleBlink() {
  const delay = 3000 + Math.random() * 4000;
  setTimeout(async () => {
    await blink();
    if (Math.random() < 0.25) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      await blink();
    }
    scheduleBlink();
  }, delay);
}

function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (currentExpression === "sleepy") setRoboExpression("neutral");
  idleTimer = setTimeout(() => setRoboExpression("sleepy"), 18000);
}

export function initRobo() {
  setRoboExpression("neutral");
  scheduleBlink();
  ["pointerdown", "pointermove", "keydown", "wheel"].forEach((eventName) => {
    window.addEventListener(eventName, resetIdleTimer, { passive: true });
  });
  resetIdleTimer();
}

// Keep the original helper available for existing callers.
export async function sethappy() {
  setRoboExpression("happy");
}
