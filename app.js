// Define constants
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Set up the renderer
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting to the scene
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
light.position.set(0.5, 1, 0.25);
scene.add(light);

// Add a cube to the scene
const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Create an XR session
function initXR() {
  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
      if (supported) {
        navigator.xr.requestSession('immersive-ar').then((session) => {
          renderer.xr.setSession(session);
          session.addEventListener('end', onSessionEnded);
          renderXRFrame();
        });
      }
    });
  }
}

// Render each frame
function renderXRFrame() {
  renderer.setAnimationLoop(() => {
    // Update cube position based on hit test result
    const hitTestSource = renderer.xr.getHitTestSource();
    const hitTestResults = renderer.xr.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      cube.position.setFromMatrixPosition(hit.getPose(sessionReferenceSpace).transform);
    }

    renderer.render(scene, camera);
  });
}

// Handle session end
function onSessionEnded() {
  renderer.xr.setSession(null);
  renderer.setAnimationLoop(null);
}

// Start the XR application
function startAR() {
  initXR();
}

// Resize the renderer on window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);
startAR();