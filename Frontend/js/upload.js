// Simple Three.js scene with GLTFLoader, shows placeholder then real model.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { GLTFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

let scene, renderer, camera, loader, currentModel, raf;

export function initPreview(containerSelector) {
  const container = document.querySelector(containerSelector);
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 100);
  camera.position.set(0, 1.2, 2.2);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0x333333, 1.2);
  scene.add(light);

  loader = new GLTFLoader();

  // Load placeholder from backend static (we’ll request the share endpoint soon)
  // As a simple path, use your backend assets via a static server OR upload Model1.glb to Supabase and use its public URL.
  const placeholderUrl = 'http://localhost:5500/assets/Model1.glb'; // serve static if you add a static route; or replace with Supabase public URL.
  loadModelUrl(placeholderUrl);

  window.addEventListener('resize', onResize);
  animate();
}

export async function loadModelUrl(url) {
  if (!loader) return;
  if (currentModel) {
    scene.remove(currentModel);
    currentModel.traverse?.(o => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
        else o.material.dispose?.();
      }
    });
    currentModel = null;
  }
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        currentModel = gltf.scene;
        currentModel.rotation.y = Math.PI;
        scene.add(currentModel);
        resolve();
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function onResize() {
  if (!renderer || !camera) return;
  const el = renderer.domElement.parentElement;
  const w = el.clientWidth, h = el.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function animate() {
  raf = requestAnimationFrame(animate);
  if (currentModel) currentModel.rotation.y += 0.005;
  renderer.render(scene, camera);
}
