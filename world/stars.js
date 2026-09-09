import * as THREE from "three";
const loader = new THREE.TextureLoader(); // make a loader object its job is to convert the texture into something the gpu can load in the scene

const starTexture = loader.load("../assets/textures/star.png"); // load the star texture

/**
 * create a layer of stars
 *
 * VISUAL CHANGE: the old version scattered points in a CUBE
 * ((Math.random()-0.5)*3000 on each axis). That clusters extra density toward the
 * cube's corners and gives no sense of "this star is far, that one is near" - every
 * layer just looked like a denser/sparser version of the same flat noise.
 *
 * Now each layer is a SPHERICAL SHELL (radiusMin -> radiusMax), so different layers
 * genuinely sit at different distances from the camera - that's most of what "depth
 * perception" in a star field actually is. Combined with different point sizes per
 * layer (already how the old code worked) you get: tiny+dim+far, then bigger+closer.
 *
 * VISUAL CHANGE: per-star brightness variation via vertex colors. PointsMaterial
 * supports `vertexColors: true` natively, so this is free at runtime (no shader, no
 * per-frame cost) - it just multiplies the base color per-vertex. That's what gives
 * "occasional brighter stars" instead of every star in a layer being identical.
 *
 * FUNCTIONAL FIX: the original function accepted minSize/maxSize but never used them
 * (size was hardcoded to 2). They're now actually used (averaged) to size the layer.
 */
export function createStars(scene, count, minSize, maxSize, color, options = {}) {
  const {
    radiusMin = 400,
    radiusMax = 1600,
    opacity = 1,
    brightnessRange = [0.5, 1], // [min, max] per-star multiplier applied to `color`
  } = options;

  const starGeometry = new THREE.BufferGeometry(); // creates a geometry
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const base = new THREE.Color(color);
  const tmp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // random point on a sphere shell between radiusMin and radiusMax - this is the
    // depth band for this layer (see the different radius ranges passed in script.js)
    const r = radiusMin + Math.random() * (radiusMax - radiusMin);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // cube the random value so brightness skews low - most stars dim, a handful
    // noticeably brighter, instead of a flat/uniform distribution
    const brightness =
      brightnessRange[0] + Math.pow(Math.random(), 3) * (brightnessRange[1] - brightnessRange[0]);
    tmp.copy(base).multiplyScalar(brightness);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  // built in function setAttribute() this sets position ,color ,normal maps, UVs etc
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // tells how will the star look in the scene
  const starMaterial = new THREE.PointsMaterial({
    map: starTexture,
    transparent: true,
    vertexColors: true, // lets each star use the brightness baked into the color attribute above
    size: (minSize + maxSize) / 2,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity,
  });

  const stars = new THREE.Points(starGeometry, starMaterial); // creating the stars according to the geometry and material
  stars.userData.baseOpacity = opacity;

  scene.add(stars); // adding the stars in the scene
  return stars; // returning as we need to use them in the script.js
}