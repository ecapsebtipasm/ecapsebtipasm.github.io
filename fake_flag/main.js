import { startFlagWall, resizeFlagWall } from './background.js?v=deck-3';
import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const canvas = document.querySelector('#flag');
const video = document.querySelector('#video');
const notice = document.querySelector('#notice');

startFlagWall().catch(console.error);

function showError(message) {
  notice.textContent = message;
  notice.hidden = false;
}

async function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0xffffff, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.background = null;
  // Used only for metal reflections: this room is never added to the scene.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const reflections = pmrem.fromScene(room, 0.04);
  scene.environment = reflections.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc8cdd5, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(-4, 7, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 1.8);
  fill.position.set(4, 5, -3);
  scene.add(fill);

  const camera = new THREE.OrthographicCamera(-4, 4, 3.5, -3.5, 0.1, 100);
  camera.position.set(3, 7.5, 17);
  camera.lookAt(0.05, 2.9, 0);
  function resize() {
    const width = window.innerWidth, height = window.innerHeight;
    const aspect = width / Math.max(height, 1);
    const viewHeight = Math.max(6.8, 5.6 / aspect);
    resizeFlagWall(width, height, 3.35 * height / viewHeight);
    camera.left = -viewHeight * aspect / 2;
    camera.right = viewHeight * aspect / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener('resize', resize);
  resize();

  const gltf = await new GLTFLoader().loadAsync('./assets/flag.glb');
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // Match the UV convention of the imported glTF mesh.
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const cloth = new THREE.MeshStandardMaterial({
    map: texture, color: 0xffffff, roughness: 0.72, metalness: 0,
    emissiveMap: texture, emissive: 0xffffff, emissiveIntensity: 0.14,
    side: THREE.DoubleSide, flatShading: true,
  });
  let flag;
  gltf.scene.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    if (object.material?.name === 'WEB_VIDEO_FLAG') {
      flag = object;
      object.material = cloth;
      // The undeformed bounding box cannot cover every hanging/folded pose.
      object.frustumCulled = false;
    }
  });
  if (!flag || !gltf.animations.length) throw new Error('模型没有包含旗面或循环动画。');
  scene.add(gltf.scene);
  const mixer = new THREE.AnimationMixer(gltf.scene);
  for (const clip of gltf.animations) {
    mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
  }
  const duration = Math.max(...gltf.animations.map(clip => clip.duration));
  // One media clock drives the movie and the model. No cumulative timer drift.
  renderer.setAnimationLoop(() => {
    mixer.setTime(video.currentTime % duration);
    renderer.render(scene, camera);
  });

  async function play() {
    try {
      await video.play();
      notice.hidden = true;
      canvas.dataset.ready = 'true';
    } catch {
      notice.replaceChildren();
      const button = document.createElement('button');
      button.id = 'resume';
      button.textContent = '点击播放';
      button.addEventListener('click', play, { once: true });
      notice.append(button);
      notice.hidden = false;
    }
  }
  await play();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else play();
  });
  video.addEventListener('error', () => showError('视频无法加载，请检查 assets/fake_flags.mp4。'));
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    video.pause();
  });
  canvas.addEventListener('webglcontextrestored', () => window.location.reload());
}

start().catch(error => {
  console.error(error);
  showError('旗帜加载失败。请使用 VS Code Live Server 或网站地址打开此页面。');
});
