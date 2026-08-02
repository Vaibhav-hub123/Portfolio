import * as THREE from "three";

const nebulas = [];// stores the nebula in an array 


export function createNebulas(scene) {
  const nebulaData = [
    {
      texture: 2,
      x: 2200,
      y: -200,
      z: -1700,
      size: 3400,
      rotation: 1.3,
      opacity: 0.5,
    },
    {
      texture: 0,
      x: 2200,
      y: 1000,
      z: -2150,
      size: 2400,
      rotation: 0,
      opacity: 0.4,
    },

    {
      texture: 1,
      x: 2200,
      y: -1500,
      z: -1000,
      size: 5500,
      rotation: 1.2,
      opacity: 0.6,
    },

    {
      texture: 0,
      x: 2200,
      y: -100,
      z: -1500,
      size: 5000,
      rotation: -0.8,
      opacity: 0.3,
    },
    {
      texture: 2,
      x: 2200,
      y: 1300,
      z: -2110,
      size: 5000,
      rotation: -0.8,
      opacity: 0.25,
    },
    {
      texture: 2,
      x: 2000 ,
      y: -1000,
      z: -900,
      size: 3000,
      rotation: -0.8,
      opacity: 0.7,
    },
  ];

  // Load textures
  const textureLoader = new THREE.TextureLoader();

  //an array for the nebula textures 
  const nebulaTextures = [
    textureLoader.load("assets/textures/nebula1.png"),
    textureLoader.load("assets/textures/nebula2.png"),
    textureLoader.load("assets/textures/nebula3.png"),
  ];

  // adding each nebula with the data provided in the nebulaData with the texures in nebulaTextures 
  nebulaData.forEach((data) => {
    addNebula(scene, nebulaTextures[data.texture], data);// calling the addnebula functions for the nebulas we created or rather put in array 
  });
}


// adds the nebula to the scene 
function addNebula(scene, texture, options) {
  // creating a new material 
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: options.opacity,
  });

  //creating a plane mesh with the material made 
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(options.size, options.size),
    material,
  );


  mesh.position.set(options.x, options.y, options.z);// setting the position for the mesh
  mesh.rotation.z = options.rotation;// setting the rotaion a little bit
  mesh.userData.baseOpacity = options.opacity;// setting opacity 
  scene.add(mesh);//adding the mesh into the scene 
  nebulas.push(mesh);// adding the nebula into the mesh 
}


//animate the nebulas basically 
export function updateNebulas(time, camera) {
  // get all the nebulas 
  nebulas.forEach((nebula, i) => {
    nebula.lookAt(camera.position);//make the nebulas look in the direction of the camera otherwise they may look wierd 
    nebula.rotation.z += 0.00003 * (i + 1);// add a little bit of rotation to make it look alive 
    nebula.material.opacity = nebula.userData.baseOpacity + Math.sin(time * 0.2 + i) * 0.01; // changing opacity a little bit 
  });
}
