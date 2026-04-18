import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const OVERLAY_LAYER_NAMES = new Set(["legend", "homing"]);

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

function updatePointerVector(pointer, domElement, clientX, clientY) {
  const rect = domElement.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }

  const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const normalizedY = -((clientY - rect.top) / rect.height) * 2 + 1;

  if (normalizedX < -1 || normalizedX > 1 || normalizedY < -1 || normalizedY > 1) {
    return false;
  }

  pointer.set(normalizedX, normalizedY);
  return true;
}

function getDefaultCameraOffset(sceneScale) {
  return new THREE.Vector3(1.42, 1.18, 1.32).multiplyScalar(sceneScale);
}

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function isValidVector3Array(values) {
  return Array.isArray(values)
    && values.length === 3
    && values.every((value) => isFiniteNumber(value));
}

function captureViewState({ camera, controls, sceneScale }) {
  const target = controls.target.clone();
  const offset = camera.position.clone().sub(target);
  const distance = Math.max(offset.length(), 0.001);

  return {
    direction: offset.normalize().toArray(),
    distanceScale: distance / sceneScale,
    targetScale: target.divideScalar(sceneScale).toArray(),
  };
}

function restoreViewState({ camera, controls, sceneScale, viewState }) {
  if (
    !viewState
    || !isFiniteNumber(viewState.distanceScale)
    || viewState.distanceScale <= 0
    || !isValidVector3Array(viewState.direction)
    || !isValidVector3Array(viewState.targetScale)
  ) {
    camera.position.copy(getDefaultCameraOffset(sceneScale));
    controls.target.set(0, 0, 0);
    controls.update();
    return;
  }

  const direction = new THREE.Vector3().fromArray(viewState.direction);
  if (direction.lengthSq() === 0) {
    camera.position.copy(getDefaultCameraOffset(sceneScale));
    controls.target.set(0, 0, 0);
    controls.update();
    return;
  }

  direction.normalize();
  const target = new THREE.Vector3().fromArray(viewState.targetScale).multiplyScalar(sceneScale);
  const distance = Math.max(viewState.distanceScale * sceneScale, 0.001);
  controls.target.copy(target);
  camera.position.copy(target).addScaledVector(direction, distance);
  controls.update();
}

export function mountPreviewScene(container, layers, options = {}) {
  const { initialViewState = null } = options;
  const anchorElement = container.parentElement ?? container;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.cursorStyle = "grab";
  controls.enabled = false;

  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
  keyLight.position.set(24, 32, 18);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xc9e4ff, 0.75);
  rimLight.position.set(-18, -16, 22);
  scene.add(rimLight);

  const layerEntries = normalizeLayers(layers).map((layer) => {
    const geometry = createGeometry(layer.mesh);
    const isOverlayLayer = OVERLAY_LAYER_NAMES.has(layer.name);
    const material = new THREE.MeshStandardMaterial({
      color: layer.color ?? 0x4d8fd8,
      metalness: 0.08,
      roughness: 0.55,
      polygonOffset: isOverlayLayer,
      polygonOffsetFactor: isOverlayLayer ? -1 : 0,
      polygonOffsetUnits: isOverlayLayer ? -2 : 0,
    });
    const previewMesh = new THREE.Mesh(geometry, material);
    previewMesh.renderOrder = isOverlayLayer ? 1 : 0;
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

  const sceneScale = Math.max(size.x, size.y, size.z, 1);
  restoreViewState({ camera, controls, sceneScale, viewState: initialViewState });

  const interactiveMeshes = layerEntries.map((entry) => entry.previewMesh);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const canvas = renderer.domElement;
  let isHoveringMesh = false;
  let isInteracting = false;

  const syncControlsState = (enabled) => {
    controls.enabled = enabled;
    if (!isInteracting) {
      canvas.style.cursor = enabled ? "grab" : "default";
    }
  };

  const updateHoverState = (clientX, clientY) => {
    if (!updatePointerVector(pointer, canvas, clientX, clientY)) {
      isHoveringMesh = false;
      if (!isInteracting) {
        syncControlsState(false);
      }
      return false;
    }

    raycaster.setFromCamera(pointer, camera);
    isHoveringMesh = raycaster.intersectObjects(interactiveMeshes, false).length > 0;

    if (!isInteracting) {
      syncControlsState(isHoveringMesh);
    }

    return isHoveringMesh;
  };

  const handlePointerMove = (event) => {
    if (isInteracting) {
      return;
    }

    updateHoverState(event.clientX, event.clientY);
  };

  const handlePointerLeave = () => {
    if (isInteracting) {
      return;
    }

    isHoveringMesh = false;
    syncControlsState(false);
  };

  const handlePointerDownCapture = (event) => {
    syncControlsState(updateHoverState(event.clientX, event.clientY));
  };

  const handleWheelCapture = (event) => {
    updateHoverState(event.clientX, event.clientY);
  };

  const handleControlStart = () => {
    if (!controls.enabled) {
      return;
    }

    isInteracting = true;
    canvas.style.cursor = "grabbing";
  };

  const handleControlEnd = () => {
    isInteracting = false;
    isHoveringMesh = false;
    syncControlsState(false);
  };

  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  canvas.addEventListener("pointerdown", handlePointerDownCapture, { capture: true });
  canvas.addEventListener("wheel", handleWheelCapture, { capture: true, passive: true });
  syncControlsState(false);

  controls.addEventListener("start", handleControlStart);
  controls.addEventListener("end", handleControlEnd);

  const syncViewportCanvasBounds = () => {
    if (window.innerWidth <= 760) {
      container.style.left = "0";
      container.style.top = "0";
      container.style.width = "100%";
      container.style.height = "100%";
      return;
    }

    const rect = anchorElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const halfWidth = Math.max(centerX, viewportWidth - centerX, 1);
    const halfHeight = Math.max(centerY, viewportHeight - centerY, 1);
    const left = centerX - halfWidth - rect.left;
    const top = centerY - halfHeight - rect.top;

    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
    container.style.width = `${halfWidth * 2}px`;
    container.style.height = `${halfHeight * 2}px`;
  };

  const handleResize = () => {
    syncViewportCanvasBounds();
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  handleResize();

  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(anchorElement);
  window.addEventListener("resize", handleResize);
  window.addEventListener("scroll", handleResize, { passive: true });

  let frameId = 0;
  const renderFrame = () => {
    controls.update();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(renderFrame);
  };
  renderFrame();

  const dispose = () => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("scroll", handleResize);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerleave", handlePointerLeave);
    canvas.removeEventListener("pointerdown", handlePointerDownCapture, { capture: true });
    canvas.removeEventListener("wheel", handleWheelCapture, { capture: true });
    controls.removeEventListener("start", handleControlStart);
    controls.removeEventListener("end", handleControlEnd);
    controls.dispose();
    layerEntries.forEach((entry) => {
      entry.geometry.dispose();
      entry.material.dispose();
    });
    renderer.dispose();
    container.replaceChildren();
  };

  return {
    captureViewState: () => captureViewState({ camera, controls, sceneScale }),
    dispose,
  };
}
