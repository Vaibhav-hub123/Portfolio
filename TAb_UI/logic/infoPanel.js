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

      /*
       * Line finished.
       *
       * Remove cursor completely.
       */

      cursor.remove();

      /*
       * Pause before next line
       */

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

function initOriginDistortion() {
  const origin = bodyEl.querySelector(".origin-panel");

  if (!origin) return;

  // Prevent duplicate canvas
  if (origin.querySelector(".origin-distortion")) return;

  const canvas = document.createElement("canvas");

  canvas.className = "origin-distortion";

  origin.appendChild(canvas);

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
  });
  if (!gl) {
    console.warn("WebGL not supported");
    return;
  }
  gl.enable(gl.BLEND);

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // --------------------------------------------------
  // Vertex shader
  // --------------------------------------------------

  const vertexShaderSource = `
        attribute vec2 aPosition;

        void main() {

            gl_Position =
                vec4(aPosition, 0.0, 1.0);

        }
    `;

  // --------------------------------------------------
  // Fragment shader
  // --------------------------------------------------

  const fragmentShaderSource = `

    precision mediump float;

    uniform vec2 uMouse;
    uniform float uTime;
    uniform float uVelocity;
    uniform vec2 uResolution;

    void main() {

        /*
         * Normalized pixel coordinates
         */
        vec2 uv = gl_FragCoord.xy / uResolution;


        /*
         * Correct the aspect ratio.
         *
         * This makes the effect physically circular
         * even though the panel is rectangular.
         */
        float aspect = uResolution.x / uResolution.y;

        vec2 delta = uv - uMouse;

        delta.x *= aspect;

        float dist = length(delta);


        /*
         * ==========================================
         * MAIN SMALL ENERGY RING
         * ==========================================
         */

        float ringRadius = 0.055;

        float ringWidth = 0.004;

        float ring =
            1.0 -
            smoothstep(
                ringWidth,
                ringWidth + 0.003,
                abs(dist - ringRadius)
            );


        /*
         * ==========================================
         * SMALL INNER GLOW
         * ==========================================
         */

        float glow =
            1.0 -
            smoothstep(
                0.0,
                0.06,
                dist
            );


        /*
         * ==========================================
         * MOVEMENT STRENGTH
         * ==========================================
         */

        float movement =
            smoothstep(
                0.001,
                0.02,
                uVelocity
            );


        /*
         * ==========================================
         * RIPPLE
         * ==========================================
         */

        float rippleRadius =
            mod(
                uTime * 0.08,
                0.18
            );


        float rippleWidth = 0.004;

        float ripple =
            1.0 -
            smoothstep(
                rippleWidth,
                rippleWidth + 0.003,
                abs(dist - rippleRadius)
            );


        /*
         * Fade ripple as it expands.
         */

        ripple *=
            1.0 -
            rippleRadius / 0.18;


        /*
         * ==========================================
         * ONLY DRAW WHEN MOVING
         * ==========================================
         */

        ring *= movement;
        glow *= movement;
        ripple *= movement;


        /*
         * ==========================================
         * LIMIT EFFECT TO A SMALL AREA
         * ==========================================
         */

        float maxRadius = 0.20;

        float areaMask =
            1.0 -
            smoothstep(
                maxRadius - 0.015,
                maxRadius,
                dist
            );


        ring *= areaMask;
        glow *= areaMask;
        ripple *= areaMask;


        /*
         * ==========================================
         * FINAL INTENSITY
         * ==========================================
         */

        float intensity =
            ring * 0.55 +
            glow * 0.04 +
            ripple * 0.65;


        /*
         * ==========================================
         * HARD TRANSPARENCY
         * ==========================================
         *
         * If there is essentially no effect,
         * don't draw the pixel at all.
         */

        if (intensity < 0.001) {
            discard;
        }


        /*
         * Your HUD cyan
         */

        vec3 color =
            vec3(
                0.0,
                0.85,
                1.0
            );


        gl_FragColor =
            vec4(
                color,
                intensity
            );
    }
`;

  // --------------------------------------------------
  // Compile shader
  // --------------------------------------------------

  function createShader(type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));

      gl.deleteShader(shader);

      return null;
    }

    return shader;
  }

  const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);

  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);

  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));

    return;
  }

  gl.useProgram(program);

  // --------------------------------------------------
  // Fullscreen quad
  // --------------------------------------------------

  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const vertices = new Float32Array([
    -1, -1, 1, -1, -1, 1,

    -1, 1, 1, -1, 1, 1,
  ]);

  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "aPosition");

  gl.enableVertexAttribArray(positionLocation);

  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // --------------------------------------------------
  // Uniforms
  // --------------------------------------------------

  const mouseLocation = gl.getUniformLocation(program, "uMouse");

  const previousMouseLocation = gl.getUniformLocation(
    program,
    "uPreviousMouse",
  );

  const timeLocation = gl.getUniformLocation(program, "uTime");

  const velocityLocation = gl.getUniformLocation(program, "uVelocity");

  const resolutionLocation = gl.getUniformLocation(program, "uResolution");

  // --------------------------------------------------
  // Mouse state
  // --------------------------------------------------

  const mouse = {
    x: 0.5,
    y: 0.5,
  };

  const targetMouse = {
    x: 0.5,
    y: 0.5,
  };

  let previousX = 0.5;
  let previousY = 0.5;

  let velocity = 0;

  origin.addEventListener("pointermove", (event) => {
    const rect = origin.getBoundingClientRect();

    targetMouse.x = (event.clientX - rect.left) / rect.width;

    targetMouse.y = 1.0 - (event.clientY - rect.top) / rect.height;
  });

  // --------------------------------------------------
  // Resize
  // --------------------------------------------------

  function resize() {
    const rect = origin.getBoundingClientRect();

    const dpr = Math.min(window.devicePixelRatio, 2);

    canvas.width = rect.width * dpr;

    canvas.height = rect.height * dpr;

    canvas.style.width = rect.width + "px";

    canvas.style.height = rect.height + "px";

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  }

  resize();

  const resizeObserver = new ResizeObserver(resize);

  resizeObserver.observe(origin);

  // --------------------------------------------------
  // Animation
  // --------------------------------------------------

  let startTime = performance.now();

  function animate() {
    /*
     * Smooth mouse
     */

    mouse.x += (targetMouse.x - mouse.x) * 0.12;

    mouse.y += (targetMouse.y - mouse.y) * 0.12;

    /*
     * Calculate velocity
     */

    const dx = mouse.x - previousX;

    const dy = mouse.y - previousY;

    const movement = Math.sqrt(dx * dx + dy * dy);

    velocity += (movement * 8.0 - velocity) * 0.15;

    velocity *= 0.96;

    previousX = mouse.x;

    previousY = mouse.y;

    /*
     * Send values to shader
     */

    gl.uniform2f(mouseLocation, mouse.x, mouse.y);

    gl.uniform2f(previousMouseLocation, previousX, previousY);

    gl.uniform1f(velocityLocation, velocity);

    gl.uniform1f(timeLocation, (performance.now() - startTime) / 1000);

    /*
     * Draw
     */

    gl.clearColor(0, 0, 0, 0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(animate);
  }

  animate();
}
