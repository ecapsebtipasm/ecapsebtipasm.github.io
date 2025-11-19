import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';

// ----- basic setup -----

const container = document.getElementById('app');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x181818);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(2, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// ----- controls -----

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0); // look a bit above origin

// ----- lights -----

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x404040, 1.0);
hemiLight.position.set(0, 1, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 7.5);
dirLight.castShadow = true;
scene.add(dirLight);

// optional ground to give some visual reference
const groundGeo = new THREE.PlaneGeometry(20, 20);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x202020 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// ----- load GLB -----

const loader = new GLTFLoader();
loader.load(
  './assets/entrance.glb',
  (gltf) => {
    const model = gltf.scene;

    // optional: enable shadow casting on meshes
    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    // center & scale model to fit nicely in view
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // move model so its center is at the origin
    model.position.sub(center);

    // scale so that the longest side is ~2 units
    const maxSide = Math.max(size.x, size.y, size.z);
    if (maxSide > 0) {
      const scale = 2 / maxSide;
      model.scale.setScalar(scale);
    }

    scene.add(model);

    // adjust camera / controls to focus on model
    controls.target.copy(new THREE.Vector3(0, 0, 0));
    controls.update();
  },
  undefined,
  (error) => {
    console.error('Error loading entrance.glb:', error);
  }
);

// ----- resize handling -----

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

// ----- render loop -----

function animate() {
  requestAnimationFrame(animate);

  controls.update(); // for damping

  renderer.render(scene, camera);
}

animate();