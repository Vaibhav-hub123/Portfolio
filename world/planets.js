import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const tempBox = new THREE.Box3();
const tempSphere = new THREE.Sphere();

export function createPlanet(scene, modelPath, size, x, y, z, callback) {
  loader.load(
    modelPath,

    (gltf) => {
      console.log("Planet loaded!");

      const planet = gltf.scene;

      planet.position.set(x, y, z);
      planet.scale.set(size, size, size);

      tempBox.setFromObject(planet);
      tempBox.getBoundingSphere(tempSphere);

      planet.userData.boundingSphere = tempSphere.clone();

      scene.add(planet);

      if (callback) callback(planet);
    },

    undefined,

    (error) => {
      console.error(error);
    },
  );
}
