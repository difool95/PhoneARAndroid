const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
light.position.set(0.5, 1, 0.25);
scene.add(light);

const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Create an XR session and set up camera access
function initXR() {
  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
      if (supported) {
        navigator.xr.requestSession('immersive-ar').then((session) => {
          renderer.xr.setSession(session);
          session.addEventListener('end', onSessionEnded);
          const glLayer = new XRWebGLLayer(session, renderer);
          session.updateRenderState({ baseLayer: glLayer });
          session.requestReferenceSpace('viewer').then((referenceSpace) => {
            sessionReferenceSpace = referenceSpace;
            session.requestAnimationFrame(onXRFrame);
          });
        });
      }
    });
  }
}

function onSessionEnded() {
  renderer.xr.setSession(null);
  renderer.setAnimationLoop(null);
}

function onXRFrame(time, frame) {
  const session = frame.session;
  const pose = frame.getViewerPose(sessionReferenceSpace);
  if (pose) {
    const view = pose.views[0];
    const viewport = session.renderState.baseLayer.getViewport(view);
    renderer.setSize(viewport.width, viewport.height);
    camera.matrix.fromArray(view.transform.inverse.matrix);
    camera.projectionMatrix.fromArray(view.projectionMatrix);
    const hitTestSource = renderer.xr.getHitTestSource();
    const hitTestResults = frame.getHitTestResults(hitTestSource);
    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      cube.position.setFromMatrixPosition(hit.getPose(sessionReferenceSpace).transform);
    }
    renderer.render(scene, camera);
  }
  session.requestAnimationFrame(onXRFrame);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);
initXR();
