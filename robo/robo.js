let currentExpression = "neutral"; // set up the current expression of the robo 
let blinking = false;


// adds the robo into the scene with a specific expression 
async function setExpression(name) {
  currentExpression = name;
  const response = await fetch(`assets/robo/${name}.svg`);// fetch basically asks the browser for something in this case the name.svg
  let svg = await response.text();// await so that it loads properly as it takes times 
  svg = svg.replace(/<\?xml[^>]*\?>/, "");// remove this stuff basically for html use 
  document.getElementById("robotAssistant").innerHTML = svg;// add the svg in the html 
}


//make the robo blink sometimes 
async function blink() {
  if (blinking) return;
  blinking = true;
  const previous = currentExpression; // which expression will the blinking work with like there can be happy blink sad blick etc
  await setExpression(previous + "Blink");//just naming convention 
  await new Promise((resolve) => setTimeout(resolve, 100));//wait 100ms
  await setExpression(previous);// go back to expression without blinking 
  blinking = false;
}

//makes the infinite blinking loop
function startBlinking() {
    // inside this function as doesnt require any where else only this place this functions schedules blinks lol as it states 
    function scheduleBlink() {
        const delay = 3000 + Math.random() * 4000;//random delay
        setTimeout(async () => {
        await blink();// robo blicks once 
        //random event
        if (Math.random() < 0.25) {
            await new Promise((r) => setTimeout(r, 120));
            await blink();// he blinks again lol 
        }
        scheduleBlink();
        }, delay);// call the function with a delay everytime which is generated ramdomly 
    }
    scheduleBlink();
    // call the function once 
}


//export it into script.js for the starting of this function 
export async function initRobo()  {
  await setExpression("neutral");
  startBlinking();
}
