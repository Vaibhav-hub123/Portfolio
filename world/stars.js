import * as THREE from "three";
const loader = new THREE.TextureLoader();// make a loader object its job is to convert the texture into something the gpu can load in the scene 

const starTexture = loader.load("../assets/textures/star.png");// load the star texture 


//create stars of different parameters 
export function createStars(scene, count, minSize, maxSize, color) {
  const starGeometry = new THREE.BufferGeometry(); // creates a geometry
  const positions = []; // array of positions

  // make random position 
  for (let i = 0; i < count; i++) {
    positions.push(
      (Math.random() - 0.5) * 3000,//x
      (Math.random() - 0.5) * 3000,//y
      (Math.random() - 0.5) * 3000,//z
    );
  }

  // built in function setAttribute() this sets position ,color ,normal maps, UVs etc  
  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );

  // tells how will the star look in the scene 
  const starMaterial = new THREE.PointsMaterial({
    map: starTexture,
    transparent: true,
    color: color,
    size: 2,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);// creating the stars according to the geometry and material 

  scene.add(stars);// adding the stars in the scene 
  return stars;// returning as we need to use them in the script.js
}
