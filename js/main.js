//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

import { ARButton } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer, controls;
let reticle, model;

init();
animate();

function init() {
  // Create a Three.JS Scene
  scene = new THREE.Scene();

  // Create a new camera with positions and angles
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Set the camera position
  camera.position.set(0, 0, 0.1);

  // Create a WebGL renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  // Add the renderer to the DOM
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(ARButton.createButton(renderer));

  // Set up the AR reticle
  reticle = new THREE.Mesh(
    new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  // Instantiate a loader for the .gltf file
  const loader = new GLTFLoader();

  // Load the GLTF file
  loader.load(
    `models/phonee/phonee.gltf`,
    function (gltf) {
      // If the file is loaded, add it to the scene
      model = gltf.scene;
      model.visible = false;
      scene.add(model);
    },
    function (xhr) {
      // While it is loading, log the progress
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      // If there is an error, log it
      console.error(error);
    }
  );

  // Set up the AR session event listeners
  renderer.xr.addEventListener("sessionstart", function () {
    reticle.visible = true;
  });

  renderer.xr.addEventListener("sessionend", function () {
    reticle.visible = false;
    model.visible = false;
  });

  // Add a listener to the window, so we can resize the window and the camera
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Handle click events
  window.addEventListener("click", function () {
    if (model.visible) {
      model.visible = false;
    } else {
      const hitTestSource = renderer.xr.getHitTestSource();
      const hitTestResults = renderer.xr.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        reticle.visible = false;
        model.position.setFromMatrixPosition(hit.getPose().matrix);
        //model.position.setFromMatrixPosition(hit.getPose(renderer.xr.getReferenceSpace()).transform.matrix);
        model.visible = true;
      }
    }
  });
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}
