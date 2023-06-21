//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

//Create a Three.JS Scene
const scene = new THREE.Scene();
//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

//Keep track of the mouse position, so we can make the eye move
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

//Keep the 3D object on a global variable so we can access it later
let object;

//OrbitControls allow the camera to move around the scene
let controls;

//Set which object to render
let objToRender = 'dino';

//Instantiate a loader for the .gltf file
const loader = new GLTFLoader();

//Load the file
loader.load(
  `models/phone/phone.gltf`,
  function (gltf) {
    //If the file is loaded, add it to the scene
    object = gltf.scene;
    scene.add(object);
  },
  function (xhr) {
    //While it is loading, log the progress
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    //If there is an error, log it
    console.error(error);
  }
);

//Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ alpha: true }); //Alpha: true allows for the transparent background
renderer.setSize(window.innerWidth, window.innerHeight);

//Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);

//Set how far the camera will be from the 3D model
camera.position.z = objToRender === "dino" ? 25 : 500;

//Add lights to the scene, so we can actually see the 3D model
/*const topLight = new THREE.DirectionalLight(0xffffff, 3); // (color, intensity)
topLight.position.set(500, 500, 500) //top-left-ish
topLight.castShadow = true;
scene.add(topLight);*/

const ambientLight = new THREE.AmbientLight(0xffffff, objToRender === "dino" ? 12 : 1);
scene.add(ambientLight);

// Add lights to the scene, so we can actually see the 3D model
const lights = [];

// Top Light
const topLight = new THREE.DirectionalLight(0xffffff, 4); // (color, intensity)
topLight.position.set(0, 500, 0); // directly above the scene
topLight.castShadow = true;
topLight.shadow.camera.top = 500; // adjust these values according to your scene size
topLight.shadow.camera.bottom = -500;
topLight.shadow.camera.left = -500;
topLight.shadow.camera.right = 500;
lights.push(topLight);

// Bottom Light
const bottomLight = new THREE.DirectionalLight(0xffffff, 4); // (color, intensity)
bottomLight.position.set(0, -500, 0); // directly below the scene
lights.push(bottomLight);

// Left Light
const leftLight = new THREE.DirectionalLight(0xffffff, 4); // (color, intensity)
leftLight.position.set(-500, 0, 0); // left side of the scene
lights.push(leftLight);

// Right Light
const rightLight = new THREE.DirectionalLight(0xffffff, 4); // (color, intensity)
rightLight.position.set(500, 0, 0); // right side of the scene
lights.push(rightLight);

// Add lights to the scene
lights.forEach(light => {
  scene.add(light);
});

// Set up a single light to cast shadows
const shadowLight = lights[0];
lights.slice(1).forEach(light => {
  light.castShadow = false; // disable shadow casting for the remaining lights
});





//This adds controls to the camera, so we can rotate / zoom it with the mouse
if (objToRender === "dino") {
  controls = new OrbitControls(camera, renderer.domElement);
}

//Render the scene
function animate() {
  requestAnimationFrame(animate);
  //Here we could add some code to update the scene, adding some automatic movement

  //Make the eye move
  if (object && objToRender === "eye") {
    //I've played with the constants here until it looked good 
    object.rotation.y = -3 + mouseX / window.innerWidth * 3;
    object.rotation.x = -1.2 + mouseY * 2.5 / window.innerHeight;
  }
  renderer.render(scene, camera);
}

//Add a listener to the window, so we can resize the window and the camera
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//add mouse position listener, so we can make the eye move
document.onmousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

//Start the 3D rendering
animate();
