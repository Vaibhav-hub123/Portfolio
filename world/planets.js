import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";// helps load .glb or .gltf files in the scene 

const loader = new GLTFLoader(); // creates one loader object 
const tempBox = new THREE.Box3();// creates a box around object can be used for collisions lol yeyeye :)
const tempSphere = new THREE.Sphere(); // wraps a shpere around an object 


//creating planets :) parameters are self explainatory 
export function createPlanet(scene, modelPath, size, x, y, z, callback) {
  //loader.load(url,onLoad,onProgress,onError) this is the syntax 
  loader.load(
    modelPath,// which model to load
    (gltf) => {
      const planet = gltf.scene;// the model lives here actually lol
      planet.position.set(x, y, z);//set position 
      planet.scale.set(size, size, size);// set scale
      tempBox.setFromObject(planet);//creates a box around the planets (minimum size)
      tempBox.getBoundingSphere(tempSphere);//Create the smallest sphere that completely contains this box.
      planet.userData.boundingSphere = tempSphere.clone();// making a different shere for everyplanet otherwise all the planets will be on same sphere hence share same texture lol
      scene.add(planet);//adding the planet in the scene 
      if (callback) callback(planet);
    },
    undefined,//we dont need this thats why we did that 
    //if any error just return with error 
    (error) => {
      console.error(error);
    },
  );
}
