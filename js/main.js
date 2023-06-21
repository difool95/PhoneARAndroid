//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

import { ARButton } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer, controls;
let reticle, model;
let hitTestSourceRequested = false;
let hitTestSource = null;
const hdrTextureURL = new URL('media/image/hdr/background.hdr');
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
  document.body.appendChild(ARButton.createButton(renderer,{
    requiredFeatures: ["hit-test"]
  }));


  // Set up the AR reticle
  /*reticle = new THREE.Mesh(
    new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);*/
  // Add lights to the scene, so we can actually see the 3D model
const lights = [];

// Top Light
const topLight = new THREE.DirectionalLight(0xffffff, 2); // (color, intensity)
topLight.position.set(0, 500, 0); // directly above the scene
topLight.castShadow = true;
lights.push(topLight);

// Bottom Light
const bottomLight = new THREE.DirectionalLight(0xffffff, 1); // (color, intensity)
bottomLight.position.set(0, -500, 0); // directly below the scene
lights.push(bottomLight);

// Left Light
const leftLight = new THREE.DirectionalLight(0xffffff, 1); // (color, intensity)
leftLight.position.set(-500, 0, 0); // left side of the scene
lights.push(leftLight);

// Right Light
const rightLight = new THREE.DirectionalLight(0xffffff, 1); // (color, intensity)
rightLight.position.set(500, 0, 0); // right side of the scene
lights.push(rightLight);

// Add lights to the scene
lights.forEach(light => {
  scene.add(light);
});
const ambientLight = new THREE.AmbientLight(0x333333, 4);
scene.add(ambientLight);
// Set up a single light to cast shadows
const shadowLight = lights[0];
lights.slice(1).forEach(light => {
  light.castShadow = false; // disable shadow casting for the remaining lights
});
  addReticleToScene(); //circular visual aid
  // Instantiate a loader for the .gltf file
  const loader = new GLTFLoader();

  // Load the GLTF file
  loader.load(
    `models/phone/phone.gltf`,
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
  let controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  function onSelect(){
    if(reticle.visible){
      model.position.setFromMatrixPosition(reticle.matrix);
      model.name = "phone";
      model.visible = true;
    }
  }
  

  // Set up the AR session event listeners
  renderer.xr.addEventListener("sessionstart", function () {
    //reticle.visible = true;
  });

  renderer.xr.addEventListener("sessionend", function () {
    //reticle.visible = false;
    //model.visible = false;
  });

  // Add a listener to the window, so we can resize the window and the camera
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Handle click events
 /* window.addEventListener("click", function () {
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
  });*/
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if(frame){
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();
    if(hitTestSourceRequested === false){
      console.log("hey");
        session.requestReferenceSpace('viewer').then(referenceSpace=>{
          session.requestHitTestSource({space : referenceSpace}).then(source => 
            hitTestSource = source)
          })
          hitTestSourceRequested = true;
          session.addEventListener("end", ()=>{
            hitTestSourceRequested= false;
            hitTestSource = null;
          })
        }
        if(hitTestSource){
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          if(hitTestResults.length > 0){
            const hit = hitTestResults[0];
            reticle.visible = true;
            reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix)
          }
          else{
              reticle.visible = false;
          }
        } 
  }
  scene.children.forEach(object=>{
    if(object.name === "phone"){
      object.rotation.y += 0.01
    }
  })
  renderer.render(scene, camera);
}

function addReticleToScene(){
  const geometry = new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI/2);
  const material = new THREE.MeshStandardMaterial({color : 0xffffff * Math.random() });
  reticle = new THREE.Mesh(geometry, material);
  reticle.name = "reticle";
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
  console.log(reticle);
}
