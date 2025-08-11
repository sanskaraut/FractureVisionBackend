// Simple Three.js scene with GLTFLoader, shows placeholder then real model.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { GLTFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let scene, renderer, camera, loader, currentModel, raf, controls;

export function initPreview(containerSelector) {
  const container = document.querySelector(containerSelector);
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 100);
  camera.position.set(0, 1.5, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // OrbitControls for user interaction
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1, 0);

  // Lighting for better visibility
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x333333, 1.2);
  scene.add(hemiLight);
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight1.position.set(3, 5, 2);
  scene.add(dirLight1);
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight2.position.set(-3, 2, -4);
  scene.add(dirLight2);

  loader = new GLTFLoader();

  // Show loading statement
  const viewer = document.getElementById('viewer');
  if (viewer) viewer.innerHTML = '<div id="preview-status" style="color:#8aa0b2;text-align:center;padding:40px;">Loading placeholder model...</div>';

  // Load placeholder from backend static (we’ll request the share endpoint soon)
  const placeholderUrl = 'http://localhost:5500/assets/Model1.glb';
  loadModelUrl(placeholderUrl, true);

  window.addEventListener('resize', onResize);
  animate();
}

export async function loadModelUrl(url, isPlaceholder = false) {
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
  // Show loading statement
  const viewer = document.getElementById('viewer');
  const statusDiv = document.getElementById('preview-status');
  if (viewer && !isPlaceholder) {
    viewer.innerHTML = '<div id="preview-status" style="color:#8aa0b2;text-align:center;padding:40px;">Loading generated model...</div>';
  }
  return new Promise((resolve, reject) => {
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      if (statusDiv) statusDiv.textContent = 'Loading is taking longer than usual... Please check your internet connection or try again.';
    }, 15000); // 15 seconds timeout
    loader.load(
      url,
      (gltf) => {
        if (timedOut) return;
        clearTimeout(timeout);
        currentModel = gltf.scene;
        // Center model vertically if possible
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.y -= center.y;
        currentModel.rotation.y = Math.PI;
        scene.add(currentModel);
        if (statusDiv) statusDiv.remove();
        resolve();
      },
      (xhr) => {
        if (timedOut) return;
        if (statusDiv) statusDiv.textContent = `Loading model... ${(xhr.loaded / (xhr.total||1) * 100).toFixed(0)}%`;
      },
      (err) => {
        clearTimeout(timeout);
        console.error('Failed to load model in preview:', err);
        if (viewer) {
          viewer.innerHTML = '<div style="color:#e57373;text-align:center;padding:40px;">Failed to load 3D model preview.</div>';
        }
        reject(err);
      }
    );
  });
}

function onResize() {
  if (!renderer || !camera) return;
  const el = renderer.domElement.parentElement;
  if (!el) return;
  const w = el.clientWidth, h = el.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function animate() {
  raf = requestAnimationFrame(animate);
  if (controls) controls.update();
  if (currentModel) currentModel.rotation.y += 0.005;
  renderer.render(scene, camera);
}
