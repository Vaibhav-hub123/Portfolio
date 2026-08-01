
let currentExpression = "neutral";
let blinking = false;
async function setExpression(name) {
  currentExpression = name;
  const response = await fetch(`assets/robo/${name}.svg`);
  let svg = await response.text();
  svg = svg.replace(/<\?xml[^>]*\?>/, "");
  document.getElementById("robotAssistant").innerHTML = svg;
}

async function blink() {
  if (blinking) return;
  blinking = true;
  const previous = currentExpression;
  await setExpression(previous + "Blink");
  await new Promise((resolve) => setTimeout(resolve, 100));
  await setExpression(previous);
  blinking = false;
}
function startBlinking() {
  function scheduleBlink() {
    const delay = 3000 + Math.random() * 4000;
    setTimeout(async () => {
      await blink();
      if (Math.random() < 0.25) {
        await new Promise((r) => setTimeout(r, 120));
        await blink();
      }
      scheduleBlink();
    }, delay);
  }
  scheduleBlink();
}
export async function initRobo()  {
  await setExpression("neutral");
  startBlinking();
}

// setInterval(() => {
//   console.log(renderer.info.render);
//   console.log(renderer.info.memory);
// }, 3000);
