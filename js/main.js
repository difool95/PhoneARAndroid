//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

import { RGBELoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js";

import { XREstimatedLight } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/webxr/XREstimatedLight.js';

import { ARButton } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/webxr/ARButton.js";
let scene, camera, renderer, controls;
let reticle, model;
let hitTestSourceRequested = false;
let hitTestSource = null;
let defaultEnvironment;
let scanContainer = document.getElementById('scan-ground-panel');
let scaleStartDistance = 0;
let scaleStartObjectScale = 1;
let objectPlace = false;
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
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.useLegacyLights = false;
  // Get the loading container element
  var loadingContainer = document.getElementById('loading-panel');
  // Create the <img> element
  //var loadingImage = document.createElement('img');
  // Set the source (URL) of your loading GIF
  //loadingImage.src = 'models/loading/loading.gif';
  // Append the <img> element to the container
  //loadingContainer.appendChild(loadingImage);
  // Add the renderer to the DOM
  document.body.appendChild(renderer.domElement);
  //Add the renderer to the DOM
  document.body.appendChild(ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ['dom-overlay', 'light-estimation'],
    domOverlay: { root: document.getElementById('content') }
  }));

  const defaultLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  defaultLight.position.set(0.5, 1, 0.25);
  scene.add(defaultLight);
  // Don't add the XREstimatedLight to the scene initially.
  // It doesn't have any estimated lighting values until an AR session starts.
  //const ambientLight = new THREE.AmbientLight(0x333333, 2);
  //scene.add(ambientLight);

  const xrLight = new XREstimatedLight(renderer);


  xrLight.addEventListener('estimationstart', () => {
    console.log('estimationstart');

    // Swap the default light out for the estimated one one we start getting some estimated values.
    scene.add(xrLight);
    scene.remove(defaultLight);

    // The estimated lighting also provides an environment cubemap, which we can apply here.
    if (xrLight.environment) {
      //scene.environment = xrLight.environment;
    }
  });

  xrLight.addEventListener('estimationend', () => {
    console.log('estimationend');
    // Swap the lights back when we stop receiving estimated values.
    //scene.add(defaultLight);
    //scene.remove(xrLight);

    // Revert back to the default environment.
    scene.environment = defaultEnvironment;

  });
  ///////////////////////////////////////////////////////////////
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.8;
  const rgbeloader = new RGBELoader();
  rgbeloader.load('media/hdr/background.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    defaultEnvironment = texture;
    scene.environment = defaultEnvironment;
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Instantiate a loader for the .gltf file
    const loader = new GLTFLoader();
    loadingContainer.style.display = 'flex';
    // Load the GLTF file
    loader.load(
      `models/arch/arch.gltf`,
      function (gltf) {
        // If the file is loaded, add it to the scene
        model = gltf.scene;
        model.visible = false;
        scene.add(model);
        //Remove Loading
        loadingContainer.style.display = 'none';
        // Add touch event listeners to the renderer
        renderer.domElement.addEventListener('touchstart', onTouchStart, false);
        renderer.domElement.addEventListener('touchmove', onTouchMove, false);
      },
      function (xhr) {
        // While it is loading, log the progress
        //console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        console.log(xhr);
        console.log(xhr.loaded);
      },
      function (error) {
        // If there is an error, log it
        console.error(error);
      }
    );
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  });
  addReticleToScene(); //circular visual aid
  let controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  function onSelect() {
    if (reticle.visible) {
      if (model != null) {
        model.position.setFromMatrixPosition(reticle.matrix);
        model.name = "phone";
        model.visible = true;
        objectPlace = true;
        reticle.visible = false;
      }
    }
  }


  // Set up the AR session event listeners
  renderer.xr.addEventListener("sessionstart", function () {
    //reticle.visible = true;
    scanContainer.style.display = "flex";

  });

  renderer.xr.addEventListener("sessionend", function () {
    //reticle.visible = false;
    //model.visible = false;
    scanContainer.style.display = "none";

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

function onTouchStart(event) {
  const touches = event.touches;
  if (touches.length === 2) {
    // Calculate the initial distance between the two fingers
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    scaleStartDistance = Math.sqrt(dx * dx + dy * dy);
    scaleStartObjectScale = model.scale.x; // Store the object's initial scale
  }
}

function onTouchMove(event) {
  event.preventDefault();
  const touches = event.touches;
  if (touches.length === 2) {
    // Calculate the current distance between the two fingers
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    // Calculate the scale factor based on the distance change
    const scale = scaleStartObjectScale * (currentDistance / scaleStartDistance);
    console.log(scale);
    // Apply the scale to the object
    model.scale.set(scale, scale, scale);
  }
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();
    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace('viewer').then(referenceSpace => {
        session.requestHitTestSource({ space: referenceSpace }).then(source =>
          hitTestSource = source)
      })
      hitTestSourceRequested = true;
      session.addEventListener("end", () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
      })
    }
    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0 && !objectPlace) {
        const hit = hitTestResults[0];
        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
        //disable scanContainer
        scanContainer.style.display = "none";
      }
      else {
        reticle.visible = false;
      }
    }
  }
  scene.children.forEach(object => {
    if (object.name === "phone") {
      //object.rotation.y += 0.01
    }
  })
  renderer.render(scene, camera);
}

function addReticleToScene() {
  const geometry = new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff * Math.random() });
  reticle = new THREE.Mesh(geometry, material);
  reticle.name = "reticle";
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
}
