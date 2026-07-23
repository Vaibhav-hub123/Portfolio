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

function centerPanel() {
  const width = panel.offsetWidth;
  const height = panel.offsetHeight;

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
  console.log("Clicked");
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

    const html = await fetch(`/TAb_UI/panels/${name}.html`)
        .then(r => r.text());

    bodyEl.innerHTML = html;
}
export function hideInfoPanel() {
  onCloseCallback = null;
  panel.classList.remove("open");
}

export function isInfoPanelOpen() {
  return panel.classList.contains("open");
}
