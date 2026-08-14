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
  const html = await fetch(`/TAb_UI/panels/${name}.html`).then((r) => r.text());

  bodyEl.innerHTML = html;
  initOriginPanel();
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

function initOriginPanel() {
  const card = document.querySelector(".photo-container");

  if (!card) return;

  card.addEventListener("mousemove", (e) => {
    console.log("moving");

    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 10;
    const rotateX = ((centerY - y) / centerY) * 10;

    card.style.transform = `perspective(1000px)
         rotateX(${rotateX}deg)
         rotateY(${rotateY}deg)
         scale(1.02)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = `perspective(1000px)
         rotateX(0deg)
         rotateY(0deg)
         scale(1)`;
  });
}

function initOriginTyping() {
  const text1 = bodyEl.querySelector(".text1");
  const text2 = bodyEl.querySelector(".text2");
  const text3 = bodyEl.querySelector(".text3");

  if (!text1 || !text2 || !text3) return;

  const typingSpeed = 35;
  const markerTime = 50;
  const linePause = 500;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function createCursor() {
    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    cursor.textContent = "▌";
    return cursor;
  }

  async function typeElement(element) {
    const text = element.textContent.trim();
    element.textContent = "";
    const cursor = createCursor();
    element.appendChild(cursor);
    for (const character of text) {
      await wait(markerTime);
      const characterNode = document.createTextNode(character);
      element.insertBefore(characterNode, cursor);
      await wait(typingSpeed);
    }
    cursor.remove();
  }

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

      await wait(typingSpeed + 10);
    }

    cursor.remove();
  }

  /*
   * TEXT 3
   */
  
  async function typeText3() {
    const lines = text3.querySelectorAll("span");
    const lineTexts = [];
    lines.forEach((line) => {
      lineTexts.push(line.textContent.trim());
      line.textContent = "";
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const text = lineTexts[i];

      const cursor = createCursor();
      line.appendChild(cursor);

      for (const character of text) {
        cursor.style.opacity = "1";

        await wait(markerTime - 25);
        line.insertBefore(document.createTextNode(character), cursor);

        await wait(typingSpeed);
      }


      cursor.remove();


      await wait(linePause);
    }
  }

  /*
   * MAIN SEQUENCE
   */

  async function startTyping() {
    /*
     * Hello
     */
    text1.style.visibility = "visible";

    await typeElement(text1);

    await wait(linePause);

    /*
     * Name
     */
    text2.style.visibility = "visible";

    await typeText2();

    await wait(linePause);

    /*
     * Description
     */
    text3.style.visibility = "visible";

    await typeText3();
  }

  startTyping();
}

 