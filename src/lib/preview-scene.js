import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function createGeometry(mesh) {
  const positions = [];

  for (const face of mesh.faces) {
    for (const index of face) {
      const vertex = mesh.vertices[index];
      positions.push(vertex.x, vertex.y, vertex.z);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function normalizeLayers(layers) {
  if (Array.isArray(layers)) {
    return layers;
  }

  return [{ mesh: layers, color: 0x4d8fd8, name: "preview" }];
}

export function mountPreviewScene(container, layers) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xf7fbff, 1);
  container.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
  keyLight.position.set(24, 32, 18);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xc9e4ff, 0.75);
  rimLight.position.set(-18, -16, 22);
  scene.add(rimLight);

  const layerEntries = normalizeLayers(layers).map((layer) => {
    const geometry = createGeometry(layer.mesh);
    const material = new THREE.MeshStandardMaterial({
      color: layer.color ?? 0x4d8fd8,
      metalness: 0.08,
      roughness: 0.55,
    });
    const previewMesh = new THREE.Mesh(geometry, material);
    scene.add(previewMesh);
    geometry.computeBoundingBox();
    return { geometry, material, previewMesh };
  });

  const boundingBox = layerEntries.reduce((box, entry) => box.union(entry.geometry.boundingBox), new THREE.Box3());
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
  layerEntries.forEach((entry) => {
    entry.previewMesh.position.sub(center);
  });

  const maxDimension = Math.max(size.x, size.y, size.z, 1);
  camera.position.set(maxDimension * 1.6, maxDimension * 1.35, maxDimension * 1.5);
  controls.target.set(0, 0, 0);
  controls.update();

  const handleResize = () => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  handleResize();

  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  let frameId = 0;
  const renderFrame = () => {
    controls.update();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(renderFrame);
  };
  renderFrame();

  return () => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    controls.dispose();
    layerEntries.forEach((entry) => {
      entry.geometry.dispose();
      entry.material.dispose();
    });
    renderer.dispose();
    container.replaceChildren();
  };
}
