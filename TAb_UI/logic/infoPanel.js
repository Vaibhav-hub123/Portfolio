import { syncPhotoTheme } from "../../Theme/themeManager.js";

const panel = document.getElementById("infoPanel");
const header = panel.querySelector(".info-panel-header");
const titleEl = panel.querySelector(".info-panel-title");
const bodyEl = panel.querySelector(".info-panel-body");
const closeBtn = panel.querySelector(".info-panel-close");

let onCloseCallback = null;
let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let initialized = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function centerPanel() {
  const width = panel.offsetWidth;

  panel.style.left = (window.innerWidth - width) / 2 + "px";
}

function onPointerDown(event) {
  dragging = true;

  const rect = panel.getBoundingClientRect();

  dragOffsetX = event.clientX - rect.left;
  dragOffsetY = event.clientY - rect.top;

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);

  panel.classList.add("dragging");
}

function onPointerMove(event) {
  if (!dragging) return;

  const left = clamp(
    event.clientX - dragOffsetX,
    0,
    window.innerWidth - panel.offsetWidth,
  );

  const top = clamp(
    event.clientY - dragOffsetY,
    0,
    window.innerHeight - panel.offsetHeight,
  );

  panel.style.left = left + "px";
  panel.style.top = top + "px";
}

function onPointerUp() {
  dragging = false;
  panel.classList.remove("dragging");
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
}

function handleCloseClick() {
  const callback = onCloseCallback;
  onCloseCallback = null;
  panel.classList.remove("open");
  if (callback) callback();
}

export function initInfoPanel() {
  if (initialized) return;
  initialized = true;

  header.addEventListener("pointerdown", onPointerDown);

  closeBtn.addEventListener("click", handleCloseClick);
  window.addEventListener("resize", () => {
    const rect = panel.getBoundingClientRect();
    panel.style.left =
      clamp(rect.left, 0, window.innerWidth - rect.width) + "px";
    panel.style.top =
      clamp(rect.top, 0, window.innerHeight - rect.height) + "px";
  });
}

export function openInfoPanel(data, onClose) {
  onCloseCallback = onClose ?? null;
  titleEl.textContent = data?.title ?? data?.name ?? "UNKNOWN";
  panel.classList.add("open");
  loadPanel(data.name);
  requestAnimationFrame(() => {
    centerPanel();
  });
}

async function loadPanel(name) {
  const html = await fetch(`/TAb_UI/panels/${name}.html`).then((r) => r.text());

  bodyEl.innerHTML = html;
  initOriginPanel();
   syncPhotoTheme();
  const text1 = bodyEl.querySelector(".text1");
  const text2 = bodyEl.querySelector(".text2");
  const text3 = bodyEl.querySelector(".text3");

  if (text1) text1.style.visibility = "hidden";
  if (text2) text2.style.visibility = "hidden";
  if (text3) text3.style.visibility = "hidden";
  initOriginTyping();

  initOriginDistortion();
}

export function hideInfoPanel() {
  onCloseCallback = null;
  panel.classList.remove("open");
}

export function isInfoPanelOpen() {
  return panel.classList.contains("open");
}

/*
 * Brief flicker across the main HUD when a panel finishes loading its
 * content. The element and keyframes already existed in origin.css
 * (`.origin-distortion` / `originDistortionFlicker`) with nothing wiring
 * them up — this is that connection.
 */
function initOriginDistortion() {
  const el = document.querySelector(".origin-distortion");
  if (!el || prefersReducedMotion()) return;

  el.classList.remove("is-active");
  // force reflow so the animation restarts if a panel is re-opened
  void el.offsetWidth;
  el.classList.add("is-active");
  el.addEventListener("animationend", () => el.classList.remove("is-active"), {
    once: true,
  });
}

/*
 * Smooth, physical mouse-follow tilt on the profile photo. Interpolates
 * toward the pointer target each frame instead of snapping straight to
 * it, and caps rotation to a subtle 4 degrees.
 */
function initOriginPanel() {
  const card = document.querySelector(".photo-container");

  if (!card || prefersReducedMotion()) return;

  const maxRotate = 4;
  const lerpFactor = 0.12;
  const settleThreshold = 0.01;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let hovering = false;
  let rafId = null;

  function apply() {
    card.style.transform = `perspective(1000px) rotateX(${currentY.toFixed(3)}deg) rotateY(${currentX.toFixed(3)}deg) scale(${hovering ? 1.015 : 1})`;
  }

  function tick() {
    currentX += (targetX - currentX) * lerpFactor;
    currentY += (targetY - currentY) * lerpFactor;
    apply();

    const settled =
      Math.abs(targetX - currentX) < settleThreshold &&
      Math.abs(targetY - currentY) < settleThreshold;

    if (hovering || !settled) {
      rafId = requestAnimationFrame(tick);
    } else {
      currentX = targetX;
      currentY = targetY;
      apply();
      rafId = null;
    }
  }

  function ensureLoop() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  card.addEventListener("pointermove", (e) => {
    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    targetX = ((x - centerX) / centerX) * maxRotate;
    targetY = ((centerY - y) / centerY) * maxRotate;

    hovering = true;
    ensureLoop();
  });

  card.addEventListener("pointerleave", () => {
    hovering = false;
    targetX = 0;
    targetY = 0;
    ensureLoop();
  });
}

function initOriginTyping() {
  const text1 = bodyEl.querySelector(".text1");
  const text2 = bodyEl.querySelector(".text2");
  const text3 = bodyEl.querySelector(".text3");

  if (!text1 || !text2 || !text3) return;

  const typingSpeed = 20;
  const markerTime = 30;
  const linePause = 260;
  const lineStagger = 90;

  function createCursor() {
    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    cursor.textContent = "▌";
    return cursor;
  }

  // "Hello" — quick reveal rather than a slow character crawl.
  async function revealText1(element) {
    element.style.visibility = "visible";
    element.style.opacity = "0";
    element.style.transform = "translateY(8px)";
    element.style.transition = `opacity 0.28s var(--ease-premium, ease), transform 0.28s var(--ease-premium, ease)`;
    requestAnimationFrame(() => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });
    await wait(280);
  }

  // Name — kept as a type/reveal effect (this is the primary heading, it
  // earns the extra beat) but noticeably brisker than before.
  async function typeText2() {
    const whiteText = "I'm";
    const normalText = " Vaibhav Agrahari";
    text2.innerHTML = "";
    const whiteSpan = document.createElement("span");
    whiteSpan.style.color = "white";
    const normalSpan = document.createElement("span");
    const cursor = createCursor();
    text2.appendChild(whiteSpan);
    text2.appendChild(normalSpan);
    text2.appendChild(cursor);

    for (const character of whiteText) {
      await wait(markerTime);
      whiteSpan.appendChild(document.createTextNode(character));
      await wait(typingSpeed);
    }
    for (const character of normalText) {
      await wait(markerTime);
      normalSpan.appendChild(document.createTextNode(character));
      await wait(typingSpeed);
    }

    cursor.remove();
  }

  // Description — reveals line by line with opacity + translateY instead
  // of typing every character; reads as intentional rather than a
  // terminal emulator, and gets the full paragraph on screen much sooner.
  async function revealText3Lines() {
    const lines = text3.querySelectorAll("span");

    lines.forEach((line) => line.classList.add("line-reveal"));
    await wait(20); // let the class apply before we start toggling it

    for (const line of lines) {
      line.classList.add("is-visible");
      await wait(lineStagger);
    }

    await wait(linePause);
  }

  async function startTyping() {
    if (prefersReducedMotion()) {
      text1.style.visibility = "visible";
      text2.style.visibility = "visible";
      text3.style.visibility = "visible";
      text3.querySelectorAll("span").forEach((line) => {
        line.classList.remove("line-reveal");
        line.classList.add("is-visible");
      });
      return;
    }

    text1.style.visibility = "visible";
    await revealText1(text1);

    await wait(160);

    text2.style.visibility = "visible";
    await typeText2();

    await wait(160);

    text3.style.visibility = "visible";
    await revealText3Lines();
  }

  startTyping();
}